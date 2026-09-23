const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
    number: {
        type: Number,
        required: true,
        unique: true
    },

    name: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model("Course", courseSchema);