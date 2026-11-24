const express = require("express");
const bcrypt = require("bcrypt");
const { createHmac, randomBytes, randomInt, timingSafeEqual } = require("node:crypto");
const PasswordReset = require("../models/PasswordReset");
const User = require("../models/User");
const limitRequests = require("../services/requestLimit");
const { normalizeEmail, isValidEmail } = require("../services/emailAddress");
const { sendEmail } = require("../services/email");
const { passwordResetEmail } = require("../services/emailTemplates");
const { sessionRoom } = require("../services/sessionAccess");

const router = express.Router();
const minute = 60000;
const accepted = "Ja ar šo adresi iespējams atjaunot paroli, saņemsi e-pastu ar kodu.";
const invalidCode = "Kods nav derīgs. Pārbaudi kodu vai pieprasi jaunu.";
const invalidToken = "Paroles maiņas atļauja vairs nav derīga. Pieprasi jaunu kodu.";

function digest(...parts) {
    return createHmac("sha256", process.env.SESSION_SECRET)
        .update(JSON.stringify(["password-reset", ...parts])).digest("hex");
}

router.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});

function limits(action, ipCount, emailCount) {
    return [
        limitRequests("reset-ip-" + action, ipCount),
        (req, res, next) => {
            req.resetEmail = normalizeEmail(req.body?.email);
            if (!isValidEmail(req.resetEmail)) {
                return res.status(400).json({ message: "Ievadi derīgu e-pasta adresi." });
            }
            req.resetKey = digest("address", req.resetEmail);
            next();
        },
        limitRequests("reset-email-" + action, emailCount, req => req.resetKey)
    ];
}

router.post("/request", ...limits("request", 30, 8), async (req, res) => {
    const user = await User.findOne({ email: req.resetEmail, emailVerified: true })
        .select("_id +passwordHash");
    const previous = await PasswordReset.findById(req.resetKey).lean();
    const now = Date.now();
    if (previous && previous.resendAt > now) {
        return res.status(202).json({ message: accepted, retryAfter: Math.ceil((previous.resendAt - now) / 1000) });
    }
    const nonce = randomBytes(16).toString("hex");
    let code;
    do {
        code = String(randomInt(1000000)).padStart(6, "0");
    } while (previous?.codeDigest && previous.codeDigest === digest("code", previous.nonce, code));

    // Tāda pati atbilde un gaidīšanas laiks arī nezināmām un neapstiprinātām adresēm.
    try {
        await PasswordReset.updateOne({ _id: req.resetKey, resendAt: { $lte: new Date(now) } }, {
            $set: {
                userId: user?._id || null,
                credentialDigest: user?.passwordHash ? digest("credential", user.passwordHash) : null,
                nonce, codeDigest: digest("code", nonce, code), failures: 0,
                resendAt: new Date(now + minute), expiresAt: new Date(now + 10 * minute)
            },
            $unset: { tokenDigest: 1 }
        }, { upsert: true });
    } catch (error) {
        if (error.code !== 11000) throw error;
        return res.status(202).json({ message: accepted, retryAfter: 60 });
    }
    res.status(202).json({ message: accepted, retryAfter: 60 });
    if (user?.passwordHash) {
        try {
            await sendEmail(req.resetEmail, passwordResetEmail(code));
        } catch {
            console.error("Neizdevās nosūtīt paroles atjaunošanas vēstuli.");
        }
    }
});

router.post("/verify", ...limits("verify", 60, 25), async (req, res) => {
    const code = req.body?.code;
    if (typeof code !== "string" || !/^[0-9]{6}$/.test(code)) {
        return res.status(400).json({ message: "Ievadi sešciparu kodu." });
    }
    const record = await PasswordReset.findById(req.resetKey).lean();
    if (!record?.codeDigest || record.expiresAt <= new Date() || record.failures >= 5) {
        return res.status(400).json({ message: invalidCode });
    }
    const match = timingSafeEqual(Buffer.from(record.codeDigest, "hex"),
        Buffer.from(digest("code", record.nonce, code), "hex")) && Boolean(record.userId);
    const token = match ? randomBytes(32).toString("hex") : null;
    const result = await PasswordReset.updateOne({
        _id: req.resetKey, nonce: record.nonce, codeDigest: record.codeDigest,
        expiresAt: { $gt: new Date() }, failures: { $lt: 5 }
    }, match ? {
        $set: { tokenDigest: digest("token", token), expiresAt: new Date(Date.now() + 10 * minute) },
        $unset: { codeDigest: 1 }
    } : { $inc: { failures: 1 } });
    if (!match || !result.modifiedCount) return res.status(400).json({ message: invalidCode });
    res.json({ token });
});

router.post("/complete", ...limits("complete", 40, 12), async (req, res) => {
    const { token, password, passwordConfirm } = req.body;
    if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) {
        return res.status(400).json({ message: invalidToken });
    }
    if (typeof password !== "string" || password.length < 8 || Buffer.byteLength(password) > 72) {
        return res.status(400).json({ message: "Parolei jābūt vismaz 8 rakstzīmes garai, nepārsniedzot 72 baitus." });
    }
    if (password !== passwordConfirm) return res.status(400).json({ message: "Paroles nesakrīt." });
    const tokenFilter = { _id: req.resetKey, tokenDigest: digest("token", token) };
    const record = await PasswordReset.findOne({ ...tokenFilter, expiresAt: { $gt: new Date() } }).lean();
    if (!record) return res.status(400).json({ message: invalidToken });

    const owner = { _id: record.userId, email: req.resetEmail, emailVerified: true };
    const user = await User.findOne(owner).select("+passwordHash +sessionVersion");
    if (!user?.passwordHash || digest("credential", user.passwordHash) !== record.credentialDigest) {
        return res.status(400).json({ message: invalidToken });
    }
    if (await bcrypt.compare(password, user.passwordHash)) {
        return res.status(400).json({ message: "Jaunajai parolei jāatšķiras no pašreizējās paroles." });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const claim = await PasswordReset.updateOne({ ...tokenFilter, expiresAt: { $gt: new Date() } },
        { $unset: { tokenDigest: 1 } });
    if (!claim.modifiedCount) return res.status(400).json({ message: invalidToken });

    const sessions = req.io.in(sessionRoom(user._id, user.sessionVersion));
    try {
        const change = await User.updateOne({ ...owner, passwordHash: user.passwordHash },
            { $set: { passwordHash }, $inc: { sessionVersion: 1 } });
        if (!change.modifiedCount) return res.status(400).json({ message: invalidToken });
    } catch (error) {
        // Arī tad, ja datubāze veikusi maiņu, bet savienojums zudis pirms atbildes.
        sessions.disconnectSockets(true);
        throw error;
    }
    sessions.disconnectSockets(true);
    res.json({ message: "Parole ir atjaunota. Pieslēdzies ar jauno paroli." });
});

router.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    res.status(503).json({ message: "Paroles atjaunošana pašlaik nav pieejama. Mēģini vēlāk." });
});

module.exports = router;
