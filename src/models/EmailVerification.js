const mongoose = require("mongoose");

// Vienam lietotājam vienlaikus glabājas tikai pēdējā koda dati.
const schema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    nonce: String,
    digest: String,
    emailRevision: Number,
    failures: Number,
    consumed: Boolean,
    deliveryFailed: Boolean,
    resendAt: Date,
    expiresAt: { type: Date, expires: 0 }
}, { versionKey: false });

module.exports = mongoose.model("EmailVerification", schema);
