const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  type: { type: String, enum: ['image', 'video'], required: true },
  position: { type: Number, default: 0 },
  caption: { type: String, default: '' },
  uploadedAt: { type: Date, default: Date.now }
});

const eventSchema = new mongoose.Schema({
  title: { type: String,default: "Untitled Event", required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  category: { type: String, enum: ['technical', 'cultural', 'sports', 'workshop'], required: true },
  // media: [mediaSchema],
  images: [{
    path: String,
    filename: String
}],
videos: [{
    path: String,
    filename: String
}],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});

// Update the updatedAt field before saving
eventSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Event', eventSchema);