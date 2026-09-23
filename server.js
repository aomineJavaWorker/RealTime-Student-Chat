const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// Ļauj serverim saņemt JSON datus
app.use(express.json());

// Public mapē atrodas frontend faili
app.use(express.static(path.join(__dirname, "public")));

// Pirmais API maršruts
app.get("/api/test", (req, res) => {
    res.json({
        message: "Node.js un Express darbojas!"
    });
});

// Servera palaišana
app.listen(PORT, () => {
    console.log(`Serveris darbojas: http://localhost:${PORT}`);
});