const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
    {
        drugName: {
            type: String,
            required: true,
            trim: true
        },
        experience: {
            type: String,
            required: true,
            trim: true
        },
        differentFromPackage: {
            type: Boolean,
            default: false
        },
        dosage: {
            frequency: {
                type: String,
                trim: true
            },
            amount: {
                type: String,
                trim: true
            }
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Post", postSchema);
