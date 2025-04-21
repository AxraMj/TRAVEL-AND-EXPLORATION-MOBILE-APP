const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  image: {
    type: String,
    required: true
  },
  description: {
    type: String,
    maxLength: 1000
  },
  location: {
    name: {
      type: String,
      required: true
    },
    coordinates: {
      latitude: {
        type: Number,
        required: true
      },
      longitude: {
        type: Number,
        required: true
      }
    }
  },
  weather: {
    temp: {
      type: Number,
      default: 0
    },
    description: {
      type: String,
      default: 'Unknown'
    },
    icon: {
      type: String,
      default: 'unknown'
    }
  },
  travelTips: [{
    type: String,
    maxLength: 200
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      maxLength: 500
    },
    mentions: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      username: String
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  savedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field for likes count
postSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

// Virtual field for comments count
postSchema.virtual('commentsCount').get(function() {
  return this.comments.length;
});

// Virtual field for saves count
postSchema.virtual('savesCount').get(function() {
  return this.savedBy.length;
});

// Index for better query performance
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ 'location.coordinates': '2dsphere' });
postSchema.index({ likes: 1 });
postSchema.index({ savedBy: 1 });

module.exports = mongoose.model('Post', postSchema); 