const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  assignedTo: { type: String }, // Storing worker name directly for hackathon simplicity
  status: { type: String, enum: ['Draft', 'Pending', 'In Progress', 'Completed', 'Verified'], default: 'Draft' },
  location: {
    lat: { type: Number },
    lng: { type: Number },
    address: { type: String }
  },
  photoProof: { type: String },
  completedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
