const mongoose = require("mongoose");

const userInfoSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    age: {
        type: Number,
        required: true,
    },
    height: {
        type: Number,
        required: true,
    },
    weight: {
        type: Number,
        required: true,
    },
    bloodGroup: {
        type: String,
        required: true,
        enum: ['O+', 'O', 'A+', 'A', 'B+', 'B', 'AB+', 'AB'], // You can specify the valid blood groups
    },
    email: {
        type: String,
        required: true,
       // unique: true, // To ensure no two users can have the same email
        match: /.+\@.+\..+/ // Simple regex to validate email format
    },
    contactNumber: {
        type: String,
        required: true,
        match: /^\d{10}$/, // Regex to ensure it's a 10-digit number
    },
    activityLevel: {
        type: String,
        required: true,
        enum: ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active'],
    },
    allergies: {
        type: String,
        default: '', // Optional field
    },
    healthConditions: {
        type: String,
        default: '', // Optional field
    },
    fitnessGoal: {
        type: String,
        required: true,
        enum: ['Weight Loss', 'Muscle Gain', 'Maintain Current Weight'],
    },
    dietaryPreferences: {
        type: String,
        enum: ['Vegetarian', 'Vegan', 'Non-Vegetarian'], // Optional field
        default: 'Non-Vegetarian', // Default value if not specified
    },
    foodPreferences: {
        type: String,
        default: '', // Optional field
    },
    hobbies: {
        type: String,
        default: '', // Optional field
    },
    bmi: {
        type: Number,
        default: null, // Optional field
    },
    dailyCalorieRequirement: {
        type: Number,
        default: null, // Optional field
    },
}, { timestamps: true }); // Automatically add createdAt and updatedAt timestamps

const UserinfoModel = mongoose.model("UserInfo", userInfoSchema);

module.exports = UserinfoModel;
