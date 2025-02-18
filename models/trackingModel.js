const mongoose = require('mongoose');

const trackingSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    foodName: {
        type: String,
        required: true
    },
    foodId: {
        type: String,
        // ref: 'foods',
        required: true
    },
    details: {
        calories: Number,
        protein: Number,
        carbohydrates: Number,
        fat: Number,
        fiber: Number,
    },
    eatenDate: {
        type: String,
        default: () => {
            const now = new Date();
            return `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()}`;
        }
    },
    quantity: {
        type: Number,
        min: 1,
        required: true
    }
}, { timestamps: true });

const trackingModel = mongoose.model("trackings", trackingSchema);

module.exports = trackingModel;
