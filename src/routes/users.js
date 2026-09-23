const express = require("express");
const User = require("../models/User");
const Course = require("../models/Course");

const router = express.Router();


router.post("/", async (req, res) => {

    try {

        const { username, courseNumber } = req.body;

        if (!username || !courseNumber) {

            return res.status(400).json({
                message: "Trūkst lietotāja vārda vai kursa."
            });

        }


        const course = await Course.findOne({
            number: courseNumber
        });


        if (!course) {

            return res.status(404).json({
                message: "Kurss nav atrasts."
            });

        }


        const user = await User.create({
            username: username.trim(),
            course: course._id
        });


        res.status(201).json(user);

    } catch (error) {

        res.status(500).json({
            message: "Neizdevās izveidot lietotāju."
        });

    }

});


module.exports = router;