const mongoose = require('mongoose');

const caloriesSchema = new mongoose.Schema({
  activity: { type: String, required: true },
  caloriesBurned: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('CaloriesData', caloriesSchema);
