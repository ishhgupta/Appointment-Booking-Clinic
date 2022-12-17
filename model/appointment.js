const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
    fieldname: {type:String},
    originalname: {type: String},
    encoding: {type: String},
    mimetype: {type: String},
    destination: {type: String},
    filename: {type: String},
    path: {type: String},
    size: {type: Number}
})

const appointmentSchema = new mongoose.Schema({
    startTime: {type: Date, required: true},
    endTime: {type: Date, required: true},
    patientId: {type: mongoose.Schema.Types.ObjectId, required: true},
    patientEmail: {type: String, required: true},
    doctorId: {type: mongoose.Schema.Types.ObjectId, required:true},
    doctorEmail: {type: String,required: true},
    author: {type: mongoose.Schema.Types.ObjectId, ref:'user', required: true},
    medicalRecord: {type: fileSchema}
})

module.exports = mongoose.model("appointment", appointmentSchema);