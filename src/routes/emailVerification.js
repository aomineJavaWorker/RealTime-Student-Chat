const express = require("express");
const bcrypt = require("bcrypt");
const { normalizeEmail, isValidEmail } = require("../services/emailAddress");
const { createHmac } = require("node:crypto");
const User = require("../models/User");
const EmailVerification = require("../models/EmailVerification");
const VerificationRequestLimit = require("../models/VerificationRequestLimit");
const { issueCode, confirmCode, retryAfter } = require("../services/emailVerification");

const router = express.Router();
const emailFields = "+email +emailVerified +pendingEmail +emailRevision";
const occupied = "Šī e-pasta adrese jau ir reģistrēta. Profilā norādi citu adresi.";

function limitRequests(action, limit) {
    return async (req, res, next) => {
        const windowMs = 10 * 60 * 1000;
        const window = Math.floor(Date.now() / windowMs);
        const expiresAt = new Date((window + 1) * windowMs);
        const key = createHmac("sha256", process.env.SESSION_SECRET)
            .update(JSON.stringify(["verification-limit", action, req.ip, window])).digest("hex");
        try {
            await VerificationRequestLimit.updateOne(
                { _id: key, count: { $lt: limit } },
                { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
                { upsert: true }
            );
        } catch (error) {
            if (error.code !== 11000) return next(error);
            const seconds = Math.max(1, Math.ceil((expiresAt - Date.now()) / 1000));
            return res.set("Retry-After", String(seconds)).status(429).json({
                message: "Pārāk daudz pieprasījumu. Mēģini vēlāk.",
                retryAfter: seconds
            });
        }
        next();
    };
}

const limitSends = limitRequests("send", 20);

router.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    if (!req.session?.userId) {
        return res.status(401).json({ message: "Nepieciešama autorizācija." });
    }
    next();
});

async function loadUser(req, res, next) {
    const user = await User.findById(req.session.userId).select(emailFields);
    if (!user?.pendingEmail && (!user?.email || user.emailVerified)) {
        return res.status(409).json({ verificationUnnecessary: true, message: "E-pasta adreses apstiprināšana nav nepieciešama." });
    }
    res.locals.user = user;
    next();
}

router.get("/", loadUser, async (req, res) => {
    const record = await EmailVerification.findById(res.locals.user._id)
        .select("resendAt expiresAt failures consumed deliveryFailed emailRevision");
    const current = record && (record.emailRevision || 0) === (res.locals.user.emailRevision || 0);
    res.json({
        address: res.locals.user.pendingEmail || res.locals.user.email,
        retryAfter: record ? retryAfter(record) : 0,
        deliveryFailed: Boolean(current && record.deliveryFailed),
        hasCode: Boolean(current && !record.consumed && record.expiresAt > new Date() && record.failures < 5)
    });
});

router.post("/address", limitSends, async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.currentPassword;
    if (!isValidEmail(email)) {
        return res.status(400).json({ message: "Ievadi derīgu e-pasta adresi." });
    }

    const user = await User.findById(req.session.userId).select(emailFields + " +passwordHash");
    if (!user?.passwordHash || typeof password !== "string" || !password ||
        !await bcrypt.compare(password, user.passwordHash)) {
        return res.status(400).json({ message: "Pašreizējā parole nav pareiza." });
    }
    if (email === user.email || email === user.pendingEmail) {
        return res.status(400).json({ message: "Šī adrese jau ir norādīta tavā profilā." });
    }
    if (await User.exists({ email })) {
        return res.status(409).json({ message: occupied });
    }

    // Parolei un adresēm joprojām jāatbilst tikko pārbaudītajam konta stāvoklim.
    const updated = await User.findOneAndUpdate({
        _id: user._id,
        passwordHash: user.passwordHash,
        email: user.email || null,
        pendingEmail: user.pendingEmail || null,
        emailRevision: user.emailRevision ?? null
    }, {
        $set: { pendingEmail: email },
        $inc: { emailRevision: 1 }
    }, { returnDocument: "after" }).select(emailFields);

    if (!updated) {
        return res.status(409).json({ message: "Profils ir mainījies. Atver to vēlreiz." });
    }
    const { status, ...body } = await issueCode(updated);
    if (status === 429) res.set("Retry-After", String(body.retryAfter));
    res.status(status).json({ ...body, addressSaved: true });
});

router.post("/resend", limitSends, loadUser, async (req, res) => {
    if (res.locals.user.pendingEmail && await User.exists({ email: res.locals.user.pendingEmail })) {
        return res.status(409).json({ message: occupied });
    }
    const { status, ...body } = await issueCode(res.locals.user);
    if (status === 429) res.set("Retry-After", String(body.retryAfter));
    res.status(status).json(body);
});

router.post("/confirm", limitRequests("confirm", 60), loadUser, async (req, res) => {
    const code = req.body?.code;
    if (typeof code !== "string" || !/^[0-9]{6}$/.test(code)) {
        return res.status(400).json({ message: "Ievadi sešciparu kodu." });
    }
    const errorMessage = await confirmCode(res.locals.user, code);
    if (errorMessage) {
        return res.status(400).json({ message: errorMessage });
    }
    res.json({ message: "E-pasta adrese ir apstiprināta." });
});

function verificationError(error, req, res, next) {
    if (res.headersSent) return next(error);
    if (error.code === 11000 && error.keyPattern?.email) {
        return res.status(409).json({ message: occupied });
    }
    res.status(503).json({ message: "E-pasta apstiprināšana pašlaik nav pieejama. Mēģini vēlāk." });
}

router.use(verificationError);

module.exports = { router, limitSends, verificationError };
