const express = require("express");
const mongoose = require("mongoose");

const DirectMessage = require("../models/DirectMessage");
const User = require("../models/User");
const Course = require("../models/Course");

const router = express.Router();


// ==========================================
// AUTH
// ==========================================

router.use((req, res, next) => {
    if (
        !req.session?.userId ||
        !req.session?.courseNumber
    ) {
        return res.status(401).json({
            message: "Nepieciešama autorizācija."
        });
    }

    next();
});


// ==========================================
// HELPERS
// ==========================================

async function getSessionCourse(req) {
    return Course.findOne({
        number: Number(req.session.courseNumber)
    });
}


async function getCourseParticipant(
    courseId,
    userId
) {
    if (
        !mongoose.isValidObjectId(userId)
    ) {
        return null;
    }

    return User.findOne({
        _id: userId,
        course: courseId,
        passwordHash: {
            $exists: true
        }
    }).select("_id username");
}


// ==========================================
// GET COURSE USERS
// ==========================================

router.get(
    "/users",
    async (req, res) => {
        try {
            const course =
                await getSessionCourse(req);

            if (!course) {
                return res.status(404).json({
                    message: "Kurss nav atrasts."
                });
            }


            const users =
                await User.find({
                    course: course._id,
                    passwordHash: {
                        $exists: true
                    }
                })
                    .select("_id username")
                    .sort({
                        username: 1
                    });


            res.json(users);

        } catch (error) {
            console.error(
                "Dalībnieku iegūšanas kļūda:",
                error
            );

            res.status(500).json({
                message:
                    "Neizdevās iegūt kursa dalībniekus."
            });
        }
    }
);


// ==========================================
// GET PRIVATE CONVERSATION
// ==========================================

router.get(
    "/:userId",
    async (req, res) => {
        try {
            const currentUserId =
                String(req.session.userId);

            const otherUserId =
                String(req.params.userId);


            if (
                !mongoose.isValidObjectId(
                    otherUserId
                )
            ) {
                return res.status(400).json({
                    message:
                        "Nederīgs lietotāja ID."
                });
            }


            if (
                currentUserId ===
                otherUserId
            ) {
                return res.status(400).json({
                    message:
                        "Nevar atvērt privātu saraksti ar sevi."
                });
            }


            const course =
                await getSessionCourse(req);

            if (!course) {
                return res.status(404).json({
                    message:
                        "Kurss nav atrasts."
                });
            }


            const otherUser =
                await getCourseParticipant(
                    course._id,
                    otherUserId
                );


            if (!otherUser) {
                return res.status(404).json({
                    message:
                        "Lietotājs šajā kursā nav atrasts."
                });
            }


            const messages =
                await DirectMessage.find({
                    course: course._id,

                    $or: [
                        {
                            sender:
                                currentUserId,

                            recipient:
                                otherUserId
                        },

                        {
                            sender:
                                otherUserId,

                            recipient:
                                currentUserId
                        }
                    ]
                })
                    .populate(
                        "sender",
                        "username"
                    )
                    .populate(
                        "recipient",
                        "username"
                    )
                    .sort({
                        createdAt: 1
                    });


            res.json(messages);

        } catch (error) {
            console.error(
                "Privāto ziņu iegūšanas kļūda:",
                error
            );

            res.status(500).json({
                message:
                    "Neizdevās iegūt privātās ziņas."
            });
        }
    }
);


// ==========================================
// SEND PRIVATE MESSAGE
// ==========================================

router.post(
    "/:userId",
    async (req, res) => {
        try {
            const currentUserId =
                String(req.session.userId);

            const recipientId =
                String(req.params.userId);

            const text =
                req.body.text?.trim();


            if (
                !mongoose.isValidObjectId(
                    recipientId
                )
            ) {
                return res.status(400).json({
                    message:
                        "Nederīgs lietotāja ID."
                });
            }


            if (
                currentUserId ===
                recipientId
            ) {
                return res.status(400).json({
                    message:
                        "Nevar nosūtīt privātu ziņu sev."
                });
            }


            if (!text) {
                return res.status(400).json({
                    message:
                        "Ziņa nevar būt tukša."
                });
            }


            if (
                text.length > 2000
            ) {
                return res.status(400).json({
                    message:
                        "Ziņa ir pārāk gara."
                });
            }


            const course =
                await getSessionCourse(req);

            if (!course) {
                return res.status(404).json({
                    message:
                        "Kurss nav atrasts."
                });
            }


            const recipient =
                await getCourseParticipant(
                    course._id,
                    recipientId
                );


            if (!recipient) {
                return res.status(404).json({
                    message:
                        "Lietotājs šajā kursā nav atrasts."
                });
            }


            const createdMessage =
                await DirectMessage.create({
                    sender:
                        currentUserId,

                    recipient:
                        recipientId,

                    course:
                        course._id,

                    text:
                        text
                });


            const message =
                await DirectMessage.findById(
                    createdMessage._id
                )
                    .populate(
                        "sender",
                        "username"
                    )
                    .populate(
                        "recipient",
                        "username"
                    );


            const messageData =
                message.toObject();


            // Nosūtām abiem lietotājiem.
            // Ja saņēmējs ir offline,
            // ziņa tik un tā paliek MongoDB.
            req.io
                .to(
                    `user-${currentUserId}`
                )
                .to(
                    `user-${recipientId}`
                )
                .emit(
                    "privateMessage",
                    messageData
                );


            res.status(201).json(
                messageData
            );

        } catch (error) {
            console.error(
                "Privātās ziņas nosūtīšanas kļūda:",
                error
            );

            res.status(500).json({
                message:
                    "Neizdevās nosūtīt privāto ziņu."
            });
        }
    }
);


module.exports = router;