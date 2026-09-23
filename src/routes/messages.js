const express = require("express");
const Message = require("../models/Message");
const Course = require("../models/Course");

const router = express.Router();


router.get("/", async (req, res) => {

    try {

        const courseNumber = Number(req.query.course);

        const course = await Course.findOne({
            number: courseNumber
        });


        if (!course) {

            return res.status(404).json({
                message: "Kurss nav atrasts."
            });

        }


        const messages = await Message.find({
            course: course._id
        })
            .populate("user", "username")
            .sort({ createdAt: 1 });


        res.json(messages);

    } catch (error) {

        res.status(500).json({
            message: "Neizdevās iegūt ziņas."
        });

    }

});


router.post("/", async (req, res) => {

    try {

        const {
            text,
            userId,
            courseNumber
        } = req.body;


        if (!text || !userId || !courseNumber) {

            return res.status(400).json({
                message: "Trūkst nepieciešamo datu."
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


        let message = await Message.create({
            text: text.trim(),
            user: userId,
            course: course._id
        });


        message = await message.populate(
            "user",
            "username"
        );


        res.status(201).json(message);

    } catch (error) {

        res.status(500).json({
            message: "Neizdevās nosūtīt ziņu."
        });

    }

});


router.delete("/:id", async (req, res) => {

    try {

        const message = await Message.findByIdAndDelete(
            req.params.id
        );


        if (!message) {

            return res.status(404).json({
                message: "Ziņa nav atrasta."
            });

        }


        res.json({
            message: "Ziņa izdzēsta."
        });

    } catch (error) {

        res.status(500).json({
            message: "Neizdevās izdzēst ziņu."
        });

    }

});


module.exports = router;