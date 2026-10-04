const mongoose = require("mongoose");


const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 30
        },

        usernameKey: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },

        passwordHash: {
            type: String,
            required: true,
            select: false
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


userSchema.index(
    {
        usernameKey: 1,
        course: 1
    },
    {
        unique: true,

        partialFilterExpression: {
            usernameKey: {
                $type: "string"
            }
        }
    }
);


module.exports = mongoose.model(
    "User",
    userSchema
);