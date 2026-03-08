const express = require("express");
const router = express.Router();
const Post = require("../models/Post");

router.post("/", async (req, res) => {
    try {
        const { drugName, experience, differentFromPackage, dosage } = req.body;

        if (!drugName || !experience) {
            return res.status(400).json({
                message: "drugName and experience are required"
            });
        }

        const newPost = new Post({
            drugName,
            experience,
            differentFromPackage,
            dosage
        });

        const savedPost = await newPost.save();

        res.status(201).json({
            message: "Post created successfully",
            post: savedPost
        });
    } catch (error) {
        res.status(500).json({
            message: "Error creating post",
            error: error.message
        });
    }
});

router.get("/", async (req, res) => {
    try {
        const {
            drugName,
            differentFromPackage,
            "dosage.frequency": dosageFrequency,
            page = 1,
            limit = 10
        } = req.query;

        const filter = {};

        if (drugName) {
            filter.drugName = { $regex: drugName, $options: "i" };
        }

        if (differentFromPackage !== undefined) {
            filter.differentFromPackage = differentFromPackage === "true";
        }

        if (dosageFrequency) {
            filter["dosage.frequency"] = dosageFrequency;
        }

        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const skip = (pageNumber - 1) * limitNumber;

        const posts = await Post.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNumber);

        const totalPosts = await Post.countDocuments(filter);
        const totalPages = Math.ceil(totalPosts / limitNumber);

        res.status(200).json({
            posts,
            currentPage: pageNumber,
            totalPages,
            totalPosts
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching posts",
            error: error.message
        });
    }
});

module.exports = router;