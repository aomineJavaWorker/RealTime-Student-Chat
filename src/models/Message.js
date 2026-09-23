const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Message", messageSchema);