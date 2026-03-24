const mongoose = require('mongoose');

const WorkerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: false }, // Optional for dashboard onboarding
  role: { type: String, default: 'Worker' },
  zone: { type: String, default: 'Central Zone' },
  status: { type: String, default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('Worker', WorkerSchema);
