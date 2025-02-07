const mongoose = require('mongoose');

const waterIntakeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  waterConsumed: { type: Number, default: 0 }, // Amount of water consumed in liters
});

const WaterIntake = mongoose.model('WaterIntake', waterIntakeSchema);
module.exports = WaterIntake;
