const express = require("express");

const Message = require("../models/Message");
const Course = require("../models/Course");

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
// AUTH CHECK
// ==========================================

router.use(
    (req, res, next) => {

        if (
            !req.session?.userId ||
            !req.session?.courseNumber
        ) {

            return res
                .status(401)
                .json({
                    message:
                        "Nepieciešama autorizācija."
                });

        }


        next();

    }
);


async function getSessionCourse(req) {

    return Course.findOne({
        number:
            Number(
                req.session.courseNumber
            )
    });

}


// ==========================================
// GET MESSAGES
// ==========================================

router.get(
    "/",
    async (req, res) => {

        try {

            const course =
                await getSessionCourse(
                    req
                );


            if (!course) {

                return res
                    .status(404)
                    .json({
                        message:
                            "Kurss nav atrasts."
                    });

            }


            const messages =
                await Message.find({
                    course:
                        course._id
                })
                    .populate(
                        "user",
                        "username"
                    )
                    .populate({
                        path:
                            "replyTo",

                        populate: {
                            path:
                                "user",

                            select:
                                "username"
                        }
                    })
                    .sort({
                        createdAt:
                            1
                    });


            res.json(
                messages
            );

        } catch (error) {

            console.error(
                "Ziņu iegūšanas kļūda:",
                error
            );


            res
                .status(500)
                .json({
                    message:
                        "Neizdevās iegūt ziņas."
                });

        }

    }
);


// ==========================================
// CREATE MESSAGE
// ==========================================

router.post(
    "/",
    async (req, res) => {

        try {

            const text =
                req.body.text?.trim();


            const replyToId =
                req.body.replyToId ||
                null;


            const userId =
                req.session.userId;


            const courseNumber =
                Number(
                    req.session.courseNumber
                );


            if (!text) {

                return res
                    .status(400)
                    .json({
                        message:
                            "Ziņa nevar būt tukša."
                    });

            }


            if (
                text.length > 2000
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "Ziņa ir pārāk gara."
                    });

            }


            const course =
                await getSessionCourse(
                    req
                );


            if (!course) {

                return res
                    .status(404)
                    .json({
                        message:
                            "Kurss nav atrasts."
                    });

            }


            let replyTo =
                null;


            if (replyToId) {

                const replyMessage =
                    await Message.findById(
                        replyToId
                    );


                if (!replyMessage) {

                    return res
                        .status(404)
                        .json({
                            message:
                                "Atbildes ziņa nav atrasta."
                        });

                }


                if (
                    replyMessage.course.toString() !==
                    course._id.toString()
                ) {

                    return res
                        .status(403)
                        .json({
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
                        text,

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
                        path:
                            "replyTo",

                        populate: {
                            path:
                                "user",

                            select:
                                "username"
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


            res
                .status(201)
                .json(
                    messageData
                );

        } catch (error) {

            console.error(
                "Ziņas nosūtīšanas kļūda:",
                error
            );


            res
                .status(500)
                .json({
                    message:
                        "Neizdevās nosūtīt ziņu."
                });

        }

    }
);


// ==========================================
// EDIT MESSAGE
// ==========================================

router.put(
    "/:id",
    async (req, res) => {

        try {

            const userId =
                req.session.userId;


            const courseNumber =
                Number(
                    req.session.courseNumber
                );


            const newText =
                req.body.text?.trim();


            if (!newText) {

                return res
                    .status(400)
                    .json({
                        message:
                            "Ziņa nevar būt tukša."
                    });

            }


            if (
                newText.length > 2000
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "Ziņa ir pārāk gara."
                    });

            }


            const message =
                await Message.findById(
                    req.params.id
                );


            if (!message) {

                return res
                    .status(404)
                    .json({
                        message:
                            "Ziņa nav atrasta."
                    });

            }


            if (
                message.user.toString() !==
                userId
            ) {

                return res
                    .status(403)
                    .json({
                        message:
                            "Tu nevari rediģēt cita lietotāja ziņu."
                    });

            }


            const course =
                await getSessionCourse(
                    req
                );


            if (
                !course ||
                message.course.toString() !==
                course._id.toString()
            ) {

                return res
                    .status(403)
                    .json({
                        message:
                            "Ziņa nepieder tavam kursam."
                    });

            }


            message.text =
                newText;


            message.editedAt =
                new Date();


            await message.save();


            const updatedMessage =
                await Message.findById(
                    message._id
                )
                    .populate(
                        "user",
                        "username"
                    )
                    .populate({
                        path:
                            "replyTo",

                        populate: {
                            path:
                                "user",

                            select:
                                "username"
                        }
                    });


            const messageData =
                updatedMessage.toObject();


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


            res
                .status(500)
                .json({
                    message:
                        "Neizdevās rediģēt ziņu."
                });

        }

    }
);


// ==========================================
// REACTION
// ==========================================

router.post(
    "/:id/reaction",
    async (req, res) => {

        try {

            const userId =
                req.session.userId;


            const courseNumber =
                Number(
                    req.session.courseNumber
                );


            const reaction =
                req.body.reaction;


            if (
                !allowedReactions.includes(
                    reaction
                )
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "Nederīga reakcija."
                    });

            }


            const message =
                await Message.findById(
                    req.params.id
                );


            if (!message) {

                return res
                    .status(404)
                    .json({
                        message:
                            "Ziņa nav atrasta."
                    });

            }


            const course =
                await getSessionCourse(
                    req
                );


            if (
                !course ||
                message.course.toString() !==
                course._id.toString()
            ) {

                return res
                    .status(403)
                    .json({
                        message:
                            "Ziņa nepieder tavam kursam."
                    });

            }


            const reactionIndex =
                message.reactions.findIndex(
                    (item) =>
                        item.user.toString() ===
                        userId
                );


            if (
                reactionIndex !== -1
            ) {

                if (
                    message
                        .reactions[
                            reactionIndex
                        ]
                        .type ===
                    reaction
                ) {

                    // Same reaction -> remove
                    message.reactions.splice(
                        reactionIndex,
                        1
                    );

                } else {

                    // Another reaction -> replace
                    message.reactions[
                        reactionIndex
                    ].type =
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


            const reactionData = {
                messageId:
                    message._id.toString(),

                reactions:
                    message.reactions.map(
                        (item) => ({
                            user:
                                item.user.toString(),

                            type:
                                item.type
                        })
                    )
            };


            req.io
                .to(
                    `course-${courseNumber}`
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


            res
                .status(500)
                .json({
                    message:
                        "Neizdevās saglabāt reakciju."
                });

        }

    }
);


// ==========================================
// DELETE MESSAGE
// ==========================================

router.delete(
    "/:id",
    async (req, res) => {

        try {

            const userId =
                req.session.userId;


            const courseNumber =
                Number(
                    req.session.courseNumber
                );


            const message =
                await Message.findById(
                    req.params.id
                );


            if (!message) {

                return res
                    .status(404)
                    .json({
                        message:
                            "Ziņa nav atrasta."
                    });

            }


            if (
                message.user.toString() !==
                userId
            ) {

                return res
                    .status(403)
                    .json({
                        message:
                            "Tu nevari dzēst cita lietotāja ziņu."
                    });

            }


            const course =
                await getSessionCourse(
                    req
                );


            if (
                !course ||
                message.course.toString() !==
                course._id.toString()
            ) {

                return res
                    .status(403)
                    .json({
                        message:
                            "Ziņa nepieder tavam kursam."
                    });

            }


            await Message.findByIdAndDelete(
                message._id
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


            res
                .status(500)
                .json({
                    message:
                        "Neizdevās izdzēst ziņu."
                });

        }

    }
);


module.exports = router;