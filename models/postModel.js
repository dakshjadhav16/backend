const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  image: { type: String }, // Store image as base64
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

const postModel = mongoose.model('Post', postSchema);
module.exports = postModel;
