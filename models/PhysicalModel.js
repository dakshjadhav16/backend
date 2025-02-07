const mongoose = require('mongoose');

const PhysicalSchema = mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'users',
        required:true
    },
    height:{
        type:Number,
        required:true
    },
    weight:{
        type:Number,
        required:true
    },
    bmi:{
        type:Number,
        required:true
    }
},{timestamps:true})


const PhysicalModel = mongoose.model("physical",PhysicalSchema);

module.exports = PhysicalModel;