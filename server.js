const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

require("dotenv").config();

const courseRoutes = require("./src/routes/courses");
const userRoutes = require("./src/routes/users");
const messageRoutes = require("./src/routes/messages");

const Course = require("./src/models/Course");

const app = express();

const server = http.createServer(app);

const io = new Server(server);

app.use((req, res, next) => {
    req.io = io;
    next();
});

const PORT = process.env.PORT || 3000;


// Socket.IO būs pieejams arī routes failos


app.use(express.json());

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);


app.use("/api/courses", courseRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);


// =========================
// SOCKET.IO
// =========================

io.on("connection", (socket) => {

    console.log(
        "Lietotājs pieslēdzās:",
        socket.id
    );


    socket.on("joinCourse", (courseNumber) => {

        const roomName =
            `course-${courseNumber}`;

        socket.join(roomName);

        console.log(
            `Lietotājs ${socket.id} pievienojās ${roomName}`
        );

    });


    socket.on("disconnect", () => {

        console.log(
            "Lietotājs atvienojās:",
            socket.id
        );

    });

});


// =========================
// NOKLUSĒJUMA KURSI
// =========================

async function createDefaultCourses() {

    const courses = [
        { number: 1, name: "1. kurss" },
        { number: 2, name: "2. kurss" },
        { number: 3, name: "3. kurss" },
        { number: 4, name: "4. kurss" }
    ];


    for (const course of courses) {

        await Course.updateOne(
            { number: course.number },
            { $set: course },
            { upsert: true }
        );

    }
}


// =========================
// SERVERA PALAIŠANA
// =========================

async function startServer() {

    try {

        await mongoose.connect(
            process.env.MONGODB_URI
        );

        console.log(
            "MongoDB savienojums izveidots!"
        );

        await createDefaultCourses();


        server.listen(PORT, () => {

            console.log(
                `Serveris darbojas: http://localhost:${PORT}`
            );

        });

    } catch (error) {

        console.error(
            "MongoDB savienojuma kļūda:",
            error
        );

    }

}


startServer();