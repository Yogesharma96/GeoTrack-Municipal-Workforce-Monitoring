const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD for easy querying
  checkIn: {
    time: { type: Date },
    location: {
      lat: { type: Number },
      lng: { type: Number }
    },
    photoUrl: { type: String }, // Selfie verification
    status: { type: String, enum: ['Verified', 'Proxy Flagged'], default: 'Verified' }
  },
  checkOut: {
    time: { type: Date },
    location: {
      lat: { type: Number },
      lng: { type: Number }
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
