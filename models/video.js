const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  time: {
    type: String,
    required: true, // e.g., "10:00 AM - 11:00 AM"
  },
  isBooked: {
    type: Boolean,
    default: false, // Whether the slot is booked
  },
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId, // Reference to the user who booked
    ref: 'User',
    default: null, // Null if the slot is not booked
  },
});

const Slot = mongoose.model('Slot', slotSchema);

module.exports = Slot;
