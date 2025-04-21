const mongoose = require('mongoose');

const guideSchema = new mongoose.Schema({
  location: {
    type: String,
    maxLength: 100,
    required: true
  },
  locationNote: {
    type: String,
    maxLength: 100
  },
  coordinates: {
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    }
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  likes: {
    type: Number,
    default: 0
  },
  dislikes: {
    type: Number,
    default: 0
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  dislikedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field for user information
guideSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Add indexes for better performance
guideSchema.index({ userId: 1, createdAt: -1 });
guideSchema.index({ location: 1 });
guideSchema.index({ likedBy: 1 });
guideSchema.index({ dislikedBy: 1 });

module.exports = mongoose.model('Guide', guideSchema); 