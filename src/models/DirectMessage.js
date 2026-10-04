const mongoose = require("mongoose");


const directMessageSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: true
        },

        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000
        }
    },
    {
        timestamps: true
    }
);


directMessageSchema.index({
    course: 1,
    sender: 1,
    recipient: 1,
    createdAt: 1
});


module.exports = mongoose.model(
    "DirectMessage",
    directMessageSchema
);