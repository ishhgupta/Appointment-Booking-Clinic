const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  first_name: { type: String, required: true },
  last_name: { type: String, default: null },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: {type: String,required: true, enum: ["doctor", "patient", "receptionist"]},
  token: { type: String },
});

module.exports = mongoose.model("user", userSchema);