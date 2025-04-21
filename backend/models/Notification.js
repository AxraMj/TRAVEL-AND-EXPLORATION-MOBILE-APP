const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  triggeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['like', 'comment', 'follow', 'mention'],
    required: true
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: function() {
      return ['like', 'comment', 'mention'].includes(this.type);
    }
  },
  commentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post.comments',
    required: function() {
      return this.type === 'mention';
    }
  },
  read: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    required: function() {
      return this.type === 'mention';
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ read: 1 });
notificationSchema.index({ type: 1 });

// Virtual field for notification text
notificationSchema.virtual('text').get(function() {
  switch (this.type) {
    case 'like':
      return 'liked your post';
    case 'comment':
      return 'commented on your post';
    case 'follow':
      return 'started following you';
    case 'mention':
      return `mentioned you in a comment: ${this.message}`;
    default:
      return 'interacted with your content';
  }
});

module.exports = mongoose.model('Notification', notificationSchema); 