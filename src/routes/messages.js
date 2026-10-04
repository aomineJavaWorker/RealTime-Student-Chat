const express = require("express");

const Message = require("../models/Message");
const Course = require("../models/Course");

const router = express.Router();


// ==========================================
// SAŅEMT ZIŅAS
// ==========================================

router.get("/", async (req, res) => {

    try {

        const courseNumber =
            Number(req.query.course);


        const course =
            await Course.findOne({
                number: courseNumber
            });


        if (!course) {

            return res.status(404).json({
                message: "Kurss nav atrasts."
            });

        }


        const messages =
            await Message.find({
                course: course._id
            })
                .populate(
                    "user",
                    "username"
                )
                .populate({
                    path: "replyTo",
                    populate: {
                        path: "user",
                        select: "username"
                    }
                })
                .sort({
                    createdAt: 1
                });


        res.json(messages);

    } catch (error) {

        console.error(
            "Ziņu iegūšanas kļūda:",
            error
        );


        res.status(500).json({
            message:
                "Neizdevās iegūt ziņas."
        });

    }

});


// ==========================================
// IZVEIDOT ZIŅU
// ==========================================

router.post("/", async (req, res) => {

    try {

        const {
            text,
            userId,
            courseNumber,
            replyToId
        } = req.body;


        if (
            !text ||
            !userId ||
            !courseNumber
        ) {

            return res.status(400).json({
                message:
                    "Trūkst nepieciešamo datu."
            });

        }


        const trimmedText =
            text.trim();


        if (trimmedText === "") {

            return res.status(400).json({
                message:
                    "Ziņa nevar būt tukša."
            });

        }


        const course =
            await Course.findOne({
                number: courseNumber
            });


        if (!course) {

            return res.status(404).json({
                message:
                    "Kurss nav atrasts."
            });

        }


        let replyTo = null;


        if (replyToId) {

            const replyMessage =
                await Message.findById(
                    replyToId
                );


            if (!replyMessage) {

                return res.status(404).json({
                    message:
                        "Atbildes ziņa nav atrasta."
                });

            }


            if (
                replyMessage.course.toString() !==
                course._id.toString()
            ) {

                return res.status(400).json({
                    message:
                        "Nevar atbildēt uz cita kursa ziņu."
                });

            }


            replyTo =
                replyMessage._id;

        }


        let message =
            await Message.create({
                text:
                    trimmedText,

                user:
                    userId,

                course:
                    course._id,

                replyTo:
                    replyTo
            });


        message =
            await Message.findById(
                message._id
            )
                .populate(
                    "user",
                    "username"
                )
                .populate({
                    path: "replyTo",
                    populate: {
                        path: "user",
                        select: "username"
                    }
                });


        const messageData =
            message.toObject();


        req.io
            .to(
                `course-${courseNumber}`
            )
            .emit(
                "newMessage",
                messageData
            );


        res.status(201).json(
            messageData
        );

    } catch (error) {

        console.error(
            "Ziņas nosūtīšanas kļūda:",
            error
        );


        res.status(500).json({
            message:
                "Neizdevās nosūtīt ziņu."
        });

    }

});


// ==========================================
// REDIĢĒT ZIŅU
// ==========================================

router.put("/:id", async (req, res) => {

    try {

        const {
            text,
            userId
        } = req.body;


        if (
            !text ||
            !userId
        ) {

            return res.status(400).json({
                message:
                    "Trūkst nepieciešamo datu."
            });

        }


        let message =
            await Message.findById(
                req.params.id
            )
                .populate(
                    "user",
                    "username"
                )
                .populate(
                    "course",
                    "number"
                );


        if (!message) {

            return res.status(404).json({
                message:
                    "Ziņa nav atrasta."
            });

        }


        if (
            message.user._id.toString() !==
            userId
        ) {

            return res.status(403).json({
                message:
                    "Tu nevari rediģēt cita lietotāja ziņu."
            });

        }


        const newText =
            text.trim();


        if (newText === "") {

            return res.status(400).json({
                message:
                    "Ziņa nevar būt tukša."
            });

        }


        message.text =
            newText;


        await message.save();


        message =
            await Message.findById(
                message._id
            )
                .populate(
                    "user",
                    "username"
                )
                .populate({
                    path: "replyTo",
                    populate: {
                        path: "user",
                        select: "username"
                    }
                });


        const messageData =
            message.toObject();


        req.io
            .to(
                `course-${message.course.number}`
            )
            .emit(
                "messageUpdated",
                messageData
            );


        res.json(
            messageData
        );

    } catch (error) {

        console.error(
            "Ziņas rediģēšanas kļūda:",
            error
        );


        res.status(500).json({
            message:
                "Neizdevās rediģēt ziņu."
        });

    }

});


// ==========================================
// DZĒST ZIŅU
// ==========================================

router.delete("/:id", async (req, res) => {

    try {

        const {
            userId
        } = req.body;


        if (!userId) {

            return res.status(400).json({
                message:
                    "Nav norādīts lietotājs."
            });

        }


        const message =
            await Message.findById(
                req.params.id
            )
                .populate(
                    "course",
                    "number"
                );


        if (!message) {

            return res.status(404).json({
                message:
                    "Ziņa nav atrasta."
            });

        }


        if (
            message.user.toString() !==
            userId
        ) {

            return res.status(403).json({
                message:
                    "Tu nevari dzēst cita lietotāja ziņu."
            });

        }


        const courseNumber =
            message.course.number;


        await Message.findByIdAndDelete(
            req.params.id
        );


        req.io
            .to(
                `course-${courseNumber}`
            )
            .emit(
                "messageDeleted",
                message._id.toString()
            );


        res.json({
            message:
                "Ziņa izdzēsta."
        });

    } catch (error) {

        console.error(
            "Ziņas dzēšanas kļūda:",
            error
        );


        res.status(500).json({
            message:
                "Neizdevās izdzēst ziņu."
        });

    }

});


module.exports = router;