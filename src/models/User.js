const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            trim: true,
            maxlength: 30
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

module.exports = mongoose.model("User", userSchema);