const Post = require('../models/Post');
const User = require('../models/User');
const Profile = require('../models/Profile');
const logger = require('../config/logger');
const { AppError } = require('../middleware/errorHandler');
exports.searchAll = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const searchRegex = new RegExp(query, 'i');

    // Search users (only creators)
    const users = await User.find({
      accountType: 'creator', // Only search for creators
      $or: [
        { fullName: searchRegex },
        { username: searchRegex }
      ]
    }).select('fullName username profileImage accountType');

    // Search posts
    const posts = await Post.find({
      $or: [
        { 'location.name': searchRegex },
        { description: searchRegex }
      ]
    })
    .populate({
      path: 'userId',
      match: { accountType: 'creator' }, // Only include posts from creators
      select: 'fullName username profileImage'
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .then(posts => posts.filter(post => post.userId)); // Filter out posts where userId is null (non-creator posts)

    // Search locations
    const locations = await Post.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $match: {
          'location.name': searchRegex,
          'user.accountType': 'creator' // Only include locations from creator posts
        }
      },
      {
        $group: {
          _id: '$location.name',
          coordinates: { $first: '$location.coordinates' },
          postCount: { $sum: 1 }
        }
      },
      {
        $limit: 10
      }
    ]);

    res.json({
      users,
      posts,
      locations
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Error performing search' });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const users = await User.find({
      $or: [
        { fullName: new RegExp(query, 'i') },
        { username: new RegExp(query, 'i') }
      ]
    })
    .select('_id fullName username profileImage accountType')
    .limit(20);

    res.json(users);
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ message: 'Error searching users' });
  }
};

exports.searchLocations = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const locations = await Post.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $match: {
          'location.name': new RegExp(query, 'i'),
          'user.accountType': 'creator' // Only include locations from creator posts
        }
      },
      {
        $group: {
          _id: '$location.name',
          coordinates: { $first: '$location.coordinates' },
          postCount: { $sum: 1 }
        }
      },
      {
        $sort: { postCount: -1 }
      },
      {
        $limit: 20
      }
    ]);

    res.json(locations);
  } catch (error) {
    console.error('Location search error:', error);
    res.status(500).json({ message: 'Error searching locations' });
  }
}; 