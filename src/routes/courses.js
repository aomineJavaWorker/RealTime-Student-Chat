const express = require("express");
const Course = require("../models/Course");

const router = express.Router();


router.get("/", async (req, res) => {

    try {

        const courses = await Course.find().sort({ number: 1 });

        res.json(courses);

    } catch (error) {

        res.status(500).json({
            message: "Neizdevās iegūt kursus."
        });

    }

});


module.exports = router;