const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, // Reference to the User model
    required: true,
    ref: 'User',  // Refers to the User model
  },
  image: {
    type: String, // Store image as base64
    required: true,
  }, // Store the base64 string here
  
});

const ProfileModel=mongoose.model('profilephotos', userProfileSchema);

module.exports = ProfileModel;
