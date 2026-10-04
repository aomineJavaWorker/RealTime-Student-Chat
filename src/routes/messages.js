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

        console.error(error);

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


        const messageData = message.toObject();


        req.io
            .to(`course-${courseNumber}`)
            .emit(
                "newMessage",
                messageData
            );


        res.status(201).json(messageData);

    } catch (error) {

        console.error(
            "Ziņas nosūtīšanas kļūda:",
            error
        );

        res.status(500).json({
            message: "Neizdevās nosūtīt ziņu."
        });

    }

});


router.delete("/:id", async (req, res) => {

    try {

        const { userId } = req.body;

        if (!userId) {

            return res.status(400).json({
                message: "Nav norādīts lietotājs."
            });

        }


        const message = await Message.findById(
            req.params.id
        ).populate(
            "course",
            "number"
        );


        if (!message) {

            return res.status(404).json({
                message: "Ziņa nav atrasta."
            });

        }


        if (message.user.toString() !== userId) {

            return res.status(403).json({
                message: "Tu nevari dzēst cita lietotāja ziņu."
            });

        }


        const courseNumber =
            message.course.number;


        await Message.findByIdAndDelete(
            req.params.id
        );


        req.io
            .to(`course-${courseNumber}`)
            .emit(
                "messageDeleted",
                message._id.toString()
            );


        res.json({
            message: "Ziņa izdzēsta."
        });

    } catch (error) {

        console.error(
            "Ziņas dzēšanas kļūda:",
            error
        );

        res.status(500).json({
            message: "Neizdevās izdzēst ziņu."
        });

    }

});


module.exports = router;