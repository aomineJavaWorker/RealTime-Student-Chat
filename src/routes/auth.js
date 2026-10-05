const express = require("express");
const bcrypt = require("bcrypt");

const User = require("../models/User");
const Course = require("../models/Course");

const router = express.Router();


function saveSession(req) {
    return new Promise((resolve, reject) => {
        req.session.save((error) => error ? reject(error) : resolve());
    });
}


function regenerateSession(req) {
    return new Promise((resolve, reject) => {
        req.session.regenerate((error) => error ? reject(error) : resolve());
    });
}


function normalizeUsername(username) {
    return username.trim().toLowerCase();
}


// ==========================================
// REGISTER
// ==========================================

router.post("/register", async (req, res) => {
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
            return res.status(400).json({
                message: "Aizpildi visus laukus."
            });
        }


        if (
            cleanUsername.length < 3 ||
            cleanUsername.length > 30
        ) {
            return res.status(400).json({
                message:
                    "Lietotājvārdam jābūt no 3 līdz 30 rakstzīmēm garam."
            });
        }


        if (
            cleanPassword.length < 8 ||
            cleanPassword.length > 72
        ) {
            return res.status(400).json({
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
            return res.status(404).json({
                message:
                    "Kurss nav atrasts."
            });
        }


        const usernameKey =
            normalizeUsername(
                cleanUsername
            );


        let existingUser =
            await User.findOne({
                usernameKey,

                course:
                    course._id
            })
                .select(
                    "+passwordHash"
                );


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
            existingUser?.passwordHash
        ) {
            return res.status(409).json({
                message:
                    "Šāds lietotājvārds šajā kursā jau eksistē."
            });
        }


        const passwordHash =
            await bcrypt.hash(
                cleanPassword,
                12
            );


        let user;


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
            user =
                await User.create({
                    username:
                        cleanUsername,

                    usernameKey,

                    passwordHash,

                    course:
                        course._id
                });
        }


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


        res.status(201).json({
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
            return res.status(409).json({
                message:
                    "Šāds lietotājvārds šajā kursā jau eksistē."
            });
        }


        res.status(500).json({
            message:
                "Neizdevās reģistrēties."
        });
    }
});


// ==========================================
// LOGIN
// ==========================================

router.post("/login", async (req, res) => {
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
            return res.status(400).json({
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
            return res.status(404).json({
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
                usernameKey,

                course:
                    course._id
            })
                .select(
                    "+passwordHash"
                );


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
            !user?.passwordHash
        ) {
            return res.status(401).json({
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
            return res.status(401).json({
                message:
                    "Nepareizs lietotājvārds vai parole."
            });
        }


        if (!user.usernameKey) {
            user.usernameKey =
                normalizeUsername(
                    user.username
                );

            await user.save();
        }


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


        res.status(500).json({
            message:
                "Neizdevās pieslēgties."
        });
    }
});


// ==========================================
// CURRENT USER
// ==========================================

router.get("/me", async (req, res) => {
    try {
        if (
            !req.session?.userId
        ) {
            return res.status(401).json({
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
            !user?.course
        ) {
            req.session.destroy(
                () => {}
            );


            return res.status(401).json({
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
                    user.course.name,

                createdAt:
                    user.createdAt
            }
        });

    } catch (error) {
        console.error(
            "Sesijas pārbaudes kļūda:",
            error
        );


        res.status(500).json({
            message:
                "Neizdevās pārbaudīt sesiju."
        });
    }
});


// ==========================================
// CHANGE PASSWORD
// ==========================================

router.put("/password", async (req, res) => {
    try {
        if (
            !req.session?.userId
        ) {
            return res.status(401).json({
                message:
                    "Nepieciešama autorizācija."
            });
        }


        const {
            currentPassword,
            newPassword
        } = req.body;


        const oldPassword =
            typeof currentPassword === "string"
                ? currentPassword
                : "";

        const nextPassword =
            typeof newPassword === "string"
                ? newPassword
                : "";


        if (
            !oldPassword ||
            !nextPassword
        ) {
            return res.status(400).json({
                message:
                    "Aizpildi visus laukus."
            });
        }


        if (
            nextPassword.length < 8 ||
            nextPassword.length > 72
        ) {
            return res.status(400).json({
                message:
                    "Jaunajai parolei jābūt no 8 līdz 72 rakstzīmēm garai."
            });
        }


        const user =
            await User.findById(
                req.session.userId
            )
                .select(
                    "+passwordHash"
                );


        if (
            !user?.passwordHash
        ) {
            return res.status(404).json({
                message:
                    "Lietotājs nav atrasts."
            });
        }


        const passwordCorrect =
            await bcrypt.compare(
                oldPassword,
                user.passwordHash
            );


        if (!passwordCorrect) {
            return res.status(400).json({
                message:
                    "Pašreizējā parole nav pareiza."
            });
        }


        const samePassword =
            await bcrypt.compare(
                nextPassword,
                user.passwordHash
            );


        if (samePassword) {
            return res.status(400).json({
                message:
                    "Jaunajai parolei jāatšķiras no pašreizējās paroles."
            });
        }


        user.passwordHash =
            await bcrypt.hash(
                nextPassword,
                12
            );


        await user.save();


        res.json({
            message:
                "Parole veiksmīgi nomainīta."
        });

    } catch (error) {
        console.error(
            "Paroles maiņas kļūda:",
            error
        );


        res.status(500).json({
            message:
                "Neizdevās nomainīt paroli."
        });
    }
});


// ==========================================
// LOGOUT
// ==========================================

router.post("/logout", (req, res) => {
    if (!req.session) {
        return res.json({
            message:
                "Izrakstīšanās veiksmīga."
        });
    }


    req.session.destroy((error) => {
        if (error) {
            console.error(
                "Izrakstīšanās kļūda:",
                error
            );


            return res.status(500).json({
                message:
                    "Neizdevās izrakstīties."
            });
        }


        res.clearCookie(
            "studentChatSession",
            {
                httpOnly:
                    true,

                sameSite:
                    "lax"
            }
        );


        res.json({
            message:
                "Izrakstīšanās veiksmīga."
        });
    });
});


module.exports = router;