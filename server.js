const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const courseRoutes = require("./src/routes/courses");
const userRoutes = require("./src/routes/users");
const messageRoutes = require("./src/routes/messages");

const Course = require("./src/models/Course");


const app = express();

const PORT = process.env.PORT || 3000;


app.use(express.json());

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);


app.use("/api/courses", courseRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);


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


async function startServer() {
    try {
        console.log("Mongo URI:", process.env.MONGODB_URI);

        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB savienojums izveidots!");

        await createDefaultCourses();

        app.listen(PORT, () => {
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