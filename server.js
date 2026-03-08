const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const postRoutes = require("./routes/posts");

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Medication Experience API is running");
});

app.use("/posts", postRoutes);

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("MongoDB connected");
        app.listen(process.env.PORT || 3000, () => {
            console.log(`Server running on http://localhost:${process.env.PORT || 3000}`);
        });
    })
    .catch((error) => {
        console.error("MongoDB connection error:", error.message);
    });
