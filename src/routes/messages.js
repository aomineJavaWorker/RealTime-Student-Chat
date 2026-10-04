const express = require("express");

const Message = require("../models/Message");
const Course = require("../models/Course");
const User = require("../models/User");

const router = express.Router();


const allowedReactions = [
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
];


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


        const user =
            await User.findById(
                userId
            );


        if (!user) {

            return res.status(404).json({
                message:
                    "Lietotājs nav atrasts."
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


        const createdMessage =
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


        const message =
            await Message.findById(
                createdMessage._id
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


        const courseNumber =
            message.course.number;


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
                `course-${courseNumber}`
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
// REAKCIJAS
// ==========================================

router.post(
    "/:id/reaction",
    async (req, res) => {

        try {

            const {
                userId,
                reaction
            } = req.body;


            if (
                !userId ||
                !reaction
            ) {

                return res.status(400).json({
                    message:
                        "Trūkst reakcijas datu."
                });

            }


            if (
                !allowedReactions.includes(
                    reaction
                )
            ) {

                return res.status(400).json({
                    message:
                        "Nederīga reakcija."
                });

            }


            const user =
                await User.findById(
                    userId
                );


            if (!user) {

                return res.status(404).json({
                    message:
                        "Lietotājs nav atrasts."
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


            const reactionIndex =
                message.reactions.findIndex(
                    (item) =>
                        item.user.toString() ===
                        userId
                );


            if (reactionIndex !== -1) {

                const currentReaction =
                    message.reactions[
                        reactionIndex
                    ];


                if (
                    currentReaction.type ===
                    reaction
                ) {

                    message.reactions.splice(
                        reactionIndex,
                        1
                    );

                } else {

                    currentReaction.type =
                        reaction;

                }

            } else {

                message.reactions.push({
                    user:
                        userId,

                    type:
                        reaction
                });

            }


            await message.save();


            const reactions =
                message.reactions.map(
                    (item) => ({
                        user:
                            item.user.toString(),

                        type:
                            item.type
                    })
                );


            const reactionData = {
                messageId:
                    message._id.toString(),

                reactions:
                    reactions
            };


            req.io
                .to(
                    `course-${message.course.number}`
                )
                .emit(
                    "messageReactionUpdated",
                    reactionData
                );


            res.json(
                reactionData
            );

        } catch (error) {

            console.error(
                "Reakcijas kļūda:",
                error
            );


            res.status(500).json({
                message:
                    "Neizdevās saglabāt reakciju."
            });

        }

    }
);


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