const Profile = require('../models/Profile');
const User = require('../models/User');
const logger = require('../config/logger');
const { AppError } = require('../middleware/errorHandler');
exports.getProfile = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Find user first
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find or create profile
    let profile = await Profile.findOne({ userId });
    if (!profile) {
      // Create a new profile if it doesn't exist
      profile = await Profile.create({
        userId,
        bio: '',
        location: '',
        socialLinks: {},
        interests: [],
        followers: [],
        following: [],
        stats: {
          totalPosts: 0,
          totalGuides: 0,
          totalLikes: 0
        }
      });
    }

    // Combine user and profile data
    const response = {
      ...profile.toObject(),
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        profileImage: user.profileImage,
        accountType: user.accountType
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Find or create profile
    let profile = await Profile.findOne({ userId: req.user.userId });
    if (!profile) {
      profile = new Profile({
        userId: req.user.userId,
        bio: '',
        location: '',
        socialLinks: {},
        interests: [],
        stats: {
          totalPosts: 0,
          totalGuides: 0,
          totalLikes: 0
        }
      });
    }

    // Find user
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user data
    if (req.body.fullName) user.fullName = req.body.fullName;
    if (req.body.username) {
      const existingUser = await User.findOne({
        username: req.body.username,
        _id: { $ne: req.user.userId }
      });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      user.username = req.body.username;
    }
    if (req.body.profileImage) user.profileImage = req.body.profileImage;

    // Update profile data
    if (req.body.bio !== undefined) profile.bio = req.body.bio;
    if (req.body.location !== undefined) profile.location = req.body.location;
    if (req.body.socialLinks) profile.socialLinks = req.body.socialLinks;
    if (req.body.interests) profile.interests = req.body.interests;

    // Save both documents
    await Promise.all([user.save(), profile.save()]);

    // Return combined response
    res.json({
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        profileImage: user.profileImage,
        accountType: user.accountType
      },
      profile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

exports.updateStats = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    let profile = await Profile.findOne({ userId: req.user.userId });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Update stats
    profile.stats = {
      ...profile.stats,
      ...req.body.stats
    };

    await profile.save();
    res.json(profile);
  } catch (error) {
    console.error('Update stats error:', error);
    res.status(500).json({ message: 'Failed to update stats' });
  }
};

exports.followUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user.userId;

    // Check if trying to follow self
    if (userId === followerId) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    // Check if already following
    const userProfile = await Profile.findOne({ userId });
    if (!userProfile) {
      return res.status(404).json({ message: 'User not found' });
    }

    const followerProfile = await Profile.findOne({ userId: followerId });
    if (!followerProfile) {
      return res.status(404).json({ message: 'Follower profile not found' });
    }

    const isFollowing = userProfile.followers.includes(followerId);
    if (isFollowing) {
      return res.status(400).json({ message: 'Already following this user' });
    }

    // Add follower/following relationship
    userProfile.followers.push(followerId);
    followerProfile.following.push(userId);

    await Promise.all([
      userProfile.save(),
      followerProfile.save()
    ]);

    res.json({
      message: 'Successfully followed user',
      followers: userProfile.followers.length,
      isFollowing: true
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ message: 'Failed to follow user' });
  }
};

exports.unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user.userId;

    // Check if trying to unfollow self
    if (userId === followerId) {
      return res.status(400).json({ message: 'Cannot unfollow yourself' });
    }

    // Check if following
    const userProfile = await Profile.findOne({ userId });
    if (!userProfile) {
      return res.status(404).json({ message: 'User not found' });
    }

    const followerProfile = await Profile.findOne({ userId: followerId });
    if (!followerProfile) {
      return res.status(404).json({ message: 'Follower profile not found' });
    }

    const isFollowing = userProfile.followers.includes(followerId);
    if (!isFollowing) {
      return res.status(400).json({ message: 'Not following this user' });
    }

    // Remove follower/following relationship
    userProfile.followers = userProfile.followers.filter(id => id.toString() !== followerId);
    followerProfile.following = followerProfile.following.filter(id => id.toString() !== userId);

    await Promise.all([
      userProfile.save(),
      followerProfile.save()
    ]);

    res.json({
      message: 'Successfully unfollowed user',
      followers: userProfile.followers.length,
      isFollowing: false
    });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ message: 'Failed to unfollow user' });
  }
};

exports.getFollowers = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.params.userId })
      .populate({
        path: 'followers',
        select: '_id username fullName profileImage'
      });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(profile.followers);
  } catch (error) {
    console.error('Error fetching followers:', error);
    res.status(500).json({ message: 'Error fetching followers' });
  }
};

exports.getFollowing = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.params.userId })
      .populate({
        path: 'following',
        select: '_id username fullName profileImage'
      });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(profile.following);
  } catch (error) {
    console.error('Error fetching following:', error);
    res.status(500).json({ message: 'Error fetching following list' });
  }
}; 