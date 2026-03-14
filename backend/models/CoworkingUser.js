// backend/models/CoworkingUser.js
const mongoose = require('mongoose');
const CoworkingUserSchema = new mongoose.Schema({
  name: String,
  username: { type: String, unique: true },
  email: { type: String, unique: true },
  password: String, // hash
  pin: String,      // hash
  pattern: String,  // hash
  // ...otros campos
});
module.exports = mongoose.model('CoworkingUser', CoworkingUserSchema);
