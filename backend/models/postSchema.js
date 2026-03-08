/**
 * MongoDB Post Model/Schema Definition
 * 
 * Defines the structure for medication experience posts in MongoDB
 */

const postSchema = {
    drugName: String,
    userInfo: {
        gender: String,           // e.g., "female", "male", "other"
        menstrualPhase: Boolean   // true if affected by menstrual cycle
    },
    dosage: {
        amount: Number,          // e.g., 500
        unit: String,            // e.g., "mg", "ml"
        times: Number,           // times taken per dose
        frequency: String        // e.g., "twice daily", "once daily"
    },
    duration: String,          // e.g., "2 weeks", "1 month"
    expectedEffect: Boolean,   // whether it had expected effect
    differentFromPackage: Boolean,  // experience differs from package label
    reactionDescription: String,    // detailed reaction/experience
    additionalInfo: {
        longTermUse: Boolean,    // is this long-term use
        pregnant: Boolean,       // was user pregnant
        notes: String            // additional notes
    },
    createdAt: Date            // auto-set to now()
};

/**
 * Example MongoDB document:
 * 
 * {
 *   _id: ObjectId("..."),
 *   drugName: "Ibuprofen",
 *   userInfo: {
 *     gender: "female",
 *     menstrualPhase: true
 *   },
 *   dosage: {
 *     amount: 200,
 *     unit: "mg",
 *     times: 1,
 *     frequency: "twice daily"
 *   },
 *   duration: "1 week",
 *   expectedEffect: true,
 *   differentFromPackage: true,
 *   reactionDescription: "Caused mild stomach upset, not mentioned on package",
 *   additionalInfo: {
 *     longTermUse: false,
 *     pregnant: false,
 *     notes: "Took with food to reduce upset"
 *   },
 *   createdAt: ISODate("2026-03-07T10:30:00Z")
 * }
 */

module.exports = postSchema;
