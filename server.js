const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const http = require("http");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const { Server } = require("socket.io");

require("dotenv").config();

const courseRoutes = require("./src/routes/courses");
const authRoutes = require("./src/routes/auth");
const messageRoutes = require("./src/routes/messages");

const Course = require("./src/models/Course");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
    app.set("trust proxy", 1);
}

if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI nav konfigurēts.");
}

if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET nav konfigurēts.");
}


// ==========================================
// SESSION
// ==========================================

const sessionMiddleware = session({
    name: "studentChatSession",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: "sessions"
    }),

    cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: isProduction,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
});

app.use(sessionMiddleware);

// Socket.IO использует ту же session
io.engine.use(sessionMiddleware);


// ==========================================
// EXPRESS
// ==========================================

app.use(express.json());

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);


// ==========================================
// SOCKET.IO PIEEJAMS ROUTES
// ==========================================

app.use((req, res, next) => {
    req.io = io;
    next();
});


// ==========================================
// ROUTES
// ==========================================

app.use("/api/courses", courseRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);


// ==========================================
// ONLINE USERS
// ==========================================

const onlineUsers = new Map();

// socket.id пользователей, которые сейчас печатают
const typingSockets = new Set();


function getOnlineUsersForCourse(courseNumber) {
    const uniqueUsers = new Map();

    for (const user of onlineUsers.values()) {
        if (user.courseNumber === courseNumber) {
            uniqueUsers.set(
                user.userId,
                {
                    userId: user.userId,
                    username: user.username
                }
            );
        }
    }

    return Array.from(uniqueUsers.values());
}


function sendOnlineUsers(courseNumber) {
    io
        .to(`course-${courseNumber}`)
        .emit(
            "onlineUsers",
            getOnlineUsersForCourse(courseNumber)
        );
}


// ==========================================
// TYPING USERS
// ==========================================

function getTypingUsersForCourse(courseNumber) {
    const uniqueUsers = new Map();

    for (const socketId of typingSockets) {
        const user = onlineUsers.get(socketId);

        if (
            user &&
            user.courseNumber === courseNumber
        ) {
            uniqueUsers.set(
                user.userId,
                {
                    userId: user.userId,
                    username: user.username
                }
            );
        }
    }

    return Array.from(uniqueUsers.values());
}


function sendTypingUsers(courseNumber) {
    io
        .to(`course-${courseNumber}`)
        .emit(
            "typingUsers",
            getTypingUsersForCourse(courseNumber)
        );
}


// ==========================================
// SOCKET.IO
// ==========================================

io.on("connection", (socket) => {
    console.log(
        "Lietotājs pieslēdzās:",
        socket.id
    );


    // ======================================
    // JOIN COURSE
    // ======================================

    socket.on("joinCourse", () => {
        const sessionData = socket.request.session;

        if (
            !sessionData ||
            !sessionData.userId ||
            !sessionData.username ||
            !sessionData.courseNumber
        ) {
            return;
        }

        const userId = String(
            sessionData.userId
        );

        const username = String(
            sessionData.username
        );

        const courseNumber = Number(
            sessionData.courseNumber
        );


        const previousUser = onlineUsers.get(
            socket.id
        );


        if (previousUser) {
            typingSockets.delete(
                socket.id
            );

            socket.leave(
                `course-${previousUser.courseNumber}`
            );

            onlineUsers.delete(
                socket.id
            );

            sendOnlineUsers(
                previousUser.courseNumber
            );

            sendTypingUsers(
                previousUser.courseNumber
            );
        }


        socket.join(
            `course-${courseNumber}`
        );


        onlineUsers.set(
            socket.id,
            {
                userId,
                username,
                courseNumber
            }
        );


        console.log(
            `${username} pievienojās course-${courseNumber}`
        );


        sendOnlineUsers(
            courseNumber
        );

        sendTypingUsers(
            courseNumber
        );
    });


    // ======================================
    // TYPING START
    // ======================================

    socket.on("typingStart", () => {
        const user = onlineUsers.get(
            socket.id
        );

        if (!user) {
            return;
        }

        typingSockets.add(
            socket.id
        );

        sendTypingUsers(
            user.courseNumber
        );
    });


    // ======================================
    // TYPING STOP
    // ======================================

    socket.on("typingStop", () => {
        const user = onlineUsers.get(
            socket.id
        );

        typingSockets.delete(
            socket.id
        );

        if (user) {
            sendTypingUsers(
                user.courseNumber
            );
        }
    });


    // ======================================
    // DISCONNECT
    // ======================================

    socket.on("disconnect", () => {
        const user = onlineUsers.get(
            socket.id
        );


        typingSockets.delete(
            socket.id
        );


        if (user) {
            onlineUsers.delete(
                socket.id
            );

            sendOnlineUsers(
                user.courseNumber
            );

            sendTypingUsers(
                user.courseNumber
            );
        }


        console.log(
            "Lietotājs atvienojās:",
            socket.id
        );
    });
});


// ==========================================
// DEFAULT COURSES
// ==========================================

async function createDefaultCourses() {
    const courses = [
        {
            number: 1,
            name: "1. kurss"
        },
        {
            number: 2,
            name: "2. kurss"
        },
        {
            number: 3,
            name: "3. kurss"
        },
        {
            number: 4,
            name: "4. kurss"
        }
    ];


    for (const course of courses) {
        await Course.updateOne(
            {
                number: course.number
            },
            {
                $set: course
            },
            {
                upsert: true
            }
        );
    }
}


// ==========================================
// START SERVER
// ==========================================

async function startServer() {
    try {
        await mongoose.connect(
            process.env.MONGODB_URI
        );

        console.log(
            "MongoDB savienojums izveidots!"
        );

        await createDefaultCourses();

        server.listen(
            PORT,
            () => {
                console.log(
                    `Serveris darbojas: http://localhost:${PORT}`
                );
            }
        );

    } catch (error) {
        console.error(
            "Servera palaišanas kļūda:",
            error
        );

        process.exitCode = 1;
    }
}


startServer();