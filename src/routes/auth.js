const express = require("express");
const bcrypt = require("bcrypt");

const User = require("../models/User");
const Course = require("../models/Course");

const router = express.Router();


// ==========================================
// SESSION HELPERS
// ==========================================

function saveSession(req) {

    return new Promise(
        (resolve, reject) => {

            req.session.save(
                (error) => {

                    if (error) {
                        reject(error);
                        return;
                    }


                    resolve();

                }
            );

        }
    );

}


function regenerateSession(req) {

    return new Promise(
        (resolve, reject) => {

            req.session.regenerate(
                (error) => {

                    if (error) {
                        reject(error);
                        return;
                    }


                    resolve();

                }
            );

        }
    );

}


function normalizeUsername(username) {

    return username
        .trim()
        .toLowerCase();

}


// ==========================================
// REGISTER
// ==========================================

router.post(
    "/register",
    async (req, res) => {

        try {

            const {
                username,
                password,
                courseNumber
            } = req.body;


            const cleanUsername =
                username?.trim();


            const cleanPassword =
                typeof password === "string"
                    ? password
                    : "";


            const parsedCourseNumber =
                Number(courseNumber);


            if (
                !cleanUsername ||
                !cleanPassword ||
                !parsedCourseNumber
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "Aizpildi visus laukus."
                    });

            }


            if (
                cleanUsername.length < 3 ||
                cleanUsername.length > 30
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "Lietotājvārdam jābūt no 3 līdz 30 rakstzīmēm garam."
                    });

            }


            if (
                cleanPassword.length < 8 ||
                cleanPassword.length > 72
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "Parolei jābūt no 8 līdz 72 rakstzīmēm garai."
                    });

            }


            const course =
                await Course.findOne({
                    number:
                        parsedCourseNumber
                });


            if (!course) {

                return res
                    .status(404)
                    .json({
                        message:
                            "Kurss nav atrasts."
                    });

            }


            const usernameKey =
                normalizeUsername(
                    cleanUsername
                );


            // ==================================
            // CHECK EXISTING USER
            // ==================================

            let existingUser =
                await User.findOne({
                    usernameKey,
                    course:
                        course._id
                })
                    .select(
                        "+passwordHash"
                    );


            /*
             * Atbalsts vecajiem lietotājiem,
             * kuri tika izveidoti pirms
             * usernameKey ieviešanas.
             */

            if (!existingUser) {

                existingUser =
                    await User.findOne({
                        username:
                            cleanUsername,

                        course:
                            course._id
                    })
                        .select(
                            "+passwordHash"
                        );

            }


            if (
                existingUser &&
                existingUser.passwordHash
            ) {

                return res
                    .status(409)
                    .json({
                        message:
                            "Šāds lietotājvārds šajā kursā jau eksistē."
                    });

            }


            // ==================================
            // HASH PASSWORD
            // ==================================

            const passwordHash =
                await bcrypt.hash(
                    cleanPassword,
                    12
                );


            let user;


            // ==================================
            // CONVERT OLD USER
            // ==================================

            if (existingUser) {

                existingUser.username =
                    cleanUsername;


                existingUser.usernameKey =
                    usernameKey;


                existingUser.passwordHash =
                    passwordHash;


                user =
                    await existingUser.save();

            } else {

                // ==================================
                // CREATE USER
                // ==================================

                user =
                    await User.create({
                        username:
                            cleanUsername,

                        usernameKey:
                            usernameKey,

                        passwordHash:
                            passwordHash,

                        course:
                            course._id
                    });

            }


            // ==================================
            // CREATE SESSION
            // ==================================

            await regenerateSession(
                req
            );


            req.session.userId =
                user._id.toString();


            req.session.username =
                user.username;


            req.session.courseNumber =
                course.number;


            await saveSession(
                req
            );


            res
                .status(201)
                .json({
                    authenticated:
                        true,

                    user: {
                        _id:
                            user._id,

                        username:
                            user.username,

                        courseNumber:
                            course.number
                    }
                });

        } catch (error) {

            console.error(
                "Reģistrācijas kļūda:",
                error
            );


            if (
                error.code === 11000
            ) {

                return res
                    .status(409)
                    .json({
                        message:
                            "Šāds lietotājvārds šajā kursā jau eksistē."
                    });

            }


            res
                .status(500)
                .json({
                    message:
                        "Neizdevās reģistrēties."
                });

        }

    }
);


// ==========================================
// LOGIN
// ==========================================

router.post(
    "/login",
    async (req, res) => {

        try {

            const {
                username,
                password,
                courseNumber
            } = req.body;


            const cleanUsername =
                username?.trim();


            const cleanPassword =
                typeof password === "string"
                    ? password
                    : "";


            const parsedCourseNumber =
                Number(courseNumber);


            if (
                !cleanUsername ||
                !cleanPassword ||
                !parsedCourseNumber
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "Aizpildi visus laukus."
                    });

            }


            const course =
                await Course.findOne({
                    number:
                        parsedCourseNumber
                });


            if (!course) {

                return res
                    .status(404)
                    .json({
                        message:
                            "Kurss nav atrasts."
                    });

            }


            const usernameKey =
                normalizeUsername(
                    cleanUsername
                );


            let user =
                await User.findOne({
                    usernameKey:
                        usernameKey,

                    course:
                        course._id
                })
                    .select(
                        "+passwordHash"
                    );


            /*
             * Atbalsts lietotājiem,
             * kuri tika reģistrēti
             * vecākā projekta versijā.
             */

            if (!user) {

                user =
                    await User.findOne({
                        username:
                            cleanUsername,

                        course:
                            course._id
                    })
                        .select(
                            "+passwordHash"
                        );

            }


            if (
                !user ||
                !user.passwordHash
            ) {

                return res
                    .status(401)
                    .json({
                        message:
                            "Nepareizs lietotājvārds vai parole."
                    });

            }


            const passwordCorrect =
                await bcrypt.compare(
                    cleanPassword,
                    user.passwordHash
                );


            if (!passwordCorrect) {

                return res
                    .status(401)
                    .json({
                        message:
                            "Nepareizs lietotājvārds vai parole."
                    });

            }


            // Vecam lietotājam pievienojam usernameKey
            if (!user.usernameKey) {

                user.usernameKey =
                    normalizeUsername(
                        user.username
                    );


                await user.save();

            }


            // ==================================
            // CREATE SESSION
            // ==================================

            await regenerateSession(
                req
            );


            req.session.userId =
                user._id.toString();


            req.session.username =
                user.username;


            req.session.courseNumber =
                course.number;


            await saveSession(
                req
            );


            res.json({
                authenticated:
                    true,

                user: {
                    _id:
                        user._id,

                    username:
                        user.username,

                    courseNumber:
                        course.number
                }
            });

        } catch (error) {

            console.error(
                "Pieslēgšanās kļūda:",
                error
            );


            res
                .status(500)
                .json({
                    message:
                        "Neizdevās pieslēgties."
                });

        }

    }
);


// ==========================================
// CURRENT SESSION
// ==========================================

router.get(
    "/me",
    async (req, res) => {

        try {

            if (
                !req.session ||
                !req.session.userId
            ) {

                return res
                    .status(401)
                    .json({
                        authenticated:
                            false
                    });

            }


            const user =
                await User.findById(
                    req.session.userId
                )
                    .populate(
                        "course",
                        "number name"
                    );


            if (
                !user ||
                !user.course
            ) {

                req.session.destroy(
                    () => {}
                );


                return res
                    .status(401)
                    .json({
                        authenticated:
                            false
                    });

            }


            req.session.username =
                user.username;


            req.session.courseNumber =
                user.course.number;


            res.json({
                authenticated:
                    true,

                user: {
                    _id:
                        user._id,

                    username:
                        user.username,

                    courseNumber:
                        user.course.number,

                    courseName:
                        user.course.name
                }
            });

        } catch (error) {

            console.error(
                "Sesijas pārbaudes kļūda:",
                error
            );


            res
                .status(500)
                .json({
                    message:
                        "Neizdevās pārbaudīt sesiju."
                });

        }

    }
);


// ==========================================
// LOGOUT
// ==========================================

router.post(
    "/logout",
    (req, res) => {

        if (!req.session) {

            return res.json({
                message:
                    "Izrakstīšanās veiksmīga."
            });

        }


        req.session.destroy(
            (error) => {

                if (error) {

                    console.error(
                        "Izrakstīšanās kļūda:",
                        error
                    );


                    return res
                        .status(500)
                        .json({
                            message:
                                "Neizdevās izrakstīties."
                        });

                }


                res.clearCookie(
                    "studentChatSession",
                    {
                        httpOnly: true,
                        sameSite: "lax"
                    }
                );


                res.json({
                    message:
                        "Izrakstīšanās veiksmīga."
                });

            }
        );

    }
);


module.exports = router;