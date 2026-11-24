const { createHmac, randomBytes, randomInt, timingSafeEqual } = require("node:crypto");
const EmailVerification = require("../models/EmailVerification");
const User = require("../models/User");
const { sendEmail } = require("./email");
const { verificationEmail } = require("./emailTemplates");

const minute = 60 * 1000;
const maxFailures = 5;

function codeDigest(user, nonce, code) {
    return createHmac("sha256", process.env.SESSION_SECRET)
        .update(JSON.stringify(["email-verification", String(user._id), user.pendingEmail || user.email, nonce, code]))
        .digest("hex");
}

function retryAfter(record) {
    return Math.max(0, Math.ceil((record.resendAt.getTime() - Date.now()) / 1000));
}

async function issueCode(user) {
    const now = new Date();
    const nonce = randomBytes(16).toString("hex");
    const previous = await EmailVerification.findById(user._id).lean();
    let code;
    do {
        code = String(randomInt(1000000)).padStart(6, "0");
    } while (previous && codeDigest(user, previous.nonce, code) === previous.digest);
    const record = {
        emailRevision: user.emailRevision || 0,
        nonce,
        digest: codeDigest(user, nonce, code),
        failures: 0,
        consumed: false,
        deliveryFailed: false,
        resendAt: new Date(now.getTime() + minute),
        expiresAt: new Date(now.getTime() + 10 * minute)
    };

    try {
        await EmailVerification.updateOne(
            {
                _id: user._id,
                resendAt: { $lte: now },
                $or: [{ emailRevision: null }, { emailRevision: { $lte: record.emailRevision } }]
            },
            { $set: record },
            { upsert: true }
        );
    } catch (error) {
        // Ja dokumentu nevar aizstāt, unikālais _id nepieļauj otru sūtījumu.
        if (error.code !== 11000) throw error;
        const current = await EmailVerification.findById(user._id).select("resendAt");
        return { status: 429, retryAfter: current ? retryAfter(current) : 1,
            message: "Pirms jauna koda pieprasīšanas nedaudz uzgaidi." };
    }

    try {
        await sendEmail(user.pendingEmail || user.email, verificationEmail(code));
    } catch {
        await EmailVerification.updateOne({ _id: user._id, nonce }, { $set: { deliveryFailed: true } });
        return { status: 503, retryAfter: retryAfter(record),
            message: "Neizdevās apstiprināt koda nosūtīšanu. Pārbaudi iesūtni vai pieprasi jaunu kodu." };
    }

    return { status: 200, retryAfter: retryAfter(record), message: "Kods nosūtīts. Pārbaudi savu e-pastu." };
}

async function confirmCode(user, code) {
    const record = await EmailVerification.findById(user._id).lean();
    const inactive = "Kods vairs nav derīgs. Pieprasi jaunu kodu.";
    const locked = "Sasniegts piecu mēģinājumu limits. Pieprasi jaunu kodu.";
    if (!record || record.consumed || record.expiresAt <= new Date() ||
        (record.emailRevision || 0) !== (user.emailRevision || 0)) {
        return inactive;
    }
    if (record.failures >= maxFailures) return locked;

    const actual = codeDigest(user, record.nonce, code);
    const matches = timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(record.digest, "hex"));

    // Atkārtoti pārbauda robežas pašā rakstīšanas brīdī arī paralēliem pieprasījumiem.
    const claim = await EmailVerification.findOneAndUpdate(
        {
            _id: user._id,
            nonce: record.nonce,
            expiresAt: { $gt: new Date() },
            failures: { $lt: maxFailures },
            consumed: false
        },
        matches ? { $set: { consumed: true } } : { $inc: { failures: 1 } },
        { returnDocument: "after" }
    ).select("failures");

    if (!claim) return inactive;
    if (!matches) return claim.failures >= maxFailures ? locked : "Nepareizs kods. Mēģini vēlreiz.";

    const filter = {
        _id: user._id,
        email: user.email || null,
        pendingEmail: user.pendingEmail || null,
        emailRevision: user.emailRevision ?? null
    };
    if (!user.pendingEmail) filter.emailVerified = { $ne: true };

    const update = await User.updateOne(filter, {
        $set: { email: user.pendingEmail || user.email, emailVerified: true },
        $unset: { pendingEmail: 1 }
    });
    return update.modifiedCount === 1 ? null : inactive;
}

module.exports = { issueCode, confirmCode, retryAfter };
