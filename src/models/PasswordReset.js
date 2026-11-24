const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    _id: String,
    userId: mongoose.Schema.Types.ObjectId,
    credentialDigest: String,
    nonce: String,
    codeDigest: String,
    failures: Number,
    tokenDigest: String,
    resendAt: Date,
    expiresAt: { type: Date, expires: 0 }
}, { versionKey: false });

module.exports = mongoose.model("PasswordReset", schema);
