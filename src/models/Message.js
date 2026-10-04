const mongoose = require("mongoose");


const reactionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        type: {
            type: String,
            enum: [
                "👍",
                "❤️",
                "😂",
                "😍",
                "😮",
                "😢",
                "😡",
                "🔥",
                "🎉",
                "👏",
                "🤔",
                "😎"
            ],
            required: true
        }
    },
    {
        _id: false
    }
);


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
        },

        reactions: {
            type: [reactionSchema],
            default: []
        },

        editedAt: {
            type: Date,
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