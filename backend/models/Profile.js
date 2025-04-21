const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  bio: {
    type: String,
    maxLength: 500,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  socialLinks: {
    instagram: String,
    twitter: String,
    facebook: String
  },
  interests: [{
    type: String
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  stats: {
    totalPosts: {
      type: Number,
      default: 0
    },
    totalGuides: {
      type: Number,
      default: 0
    },
    totalLikes: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Profile', profileSchema); 