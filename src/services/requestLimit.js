const { createHmac } = require("node:crypto");
const VerificationRequestLimit = require("../models/VerificationRequestLimit");

function limitRequests(action, limit, identify = req => req.ip) {
    return async (req, res, next) => {
        const windowMs = 10 * 60 * 1000;
        const window = Math.floor(Date.now() / windowMs);
        const expiresAt = new Date((window + 1) * windowMs);
        const key = createHmac("sha256", process.env.SESSION_SECRET)
            .update(JSON.stringify(["verification-limit", action, identify(req), window])).digest("hex");
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

module.exports = limitRequests;
