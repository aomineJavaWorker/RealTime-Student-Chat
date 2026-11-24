const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    _id: String,
    count: Number,
    expiresAt: { type: Date, expires: 0 }
}, { versionKey: false });

module.exports = mongoose.model("VerificationRequestLimit", schema);
