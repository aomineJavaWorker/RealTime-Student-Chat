const mongoose = require("mongoose");


const messageSchema = new mongoose.Schema(
    {
        text: {
            type: String,
            required: true,
            trim: true
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
        },

        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null
        }
    },
    {
        timestamps: true
    }
);


module.exports = mongoose.model(
    "Message",
    messageSchema
);