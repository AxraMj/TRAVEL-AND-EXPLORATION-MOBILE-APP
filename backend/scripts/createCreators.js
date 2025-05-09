require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Profile = require('../models/Profile');
const logger = require('../config/logger');

const creators = [
  {
    fullName: 'Sarah Thompson',
    email: 'sarah.thompson@example.com',
    username: 'wanderlust_sarah',
    password: 'Creator123!',
    profileImage: 'https://picsum.photos/id/237/200'
  },
  // ... rest of the creators array ...
];

async function createFollowRelationships(creatorProfiles) {
  try {
    logger.info('Creating follow relationships between creators...');
    
    // For each creator
    for (const profile of creatorProfiles) {
      try {
        // Get the creator's user info for logging
        const creator = await User.findById(profile.userId);
        
        // Get other creators excluding self
        const otherCreators = creatorProfiles.filter(p => p.userId.toString() !== profile.userId.toString());
        
        // Each creator follows 6-10 other creators
        const numToFollow = Math.floor(Math.random() * 5) + 6; // 6-10 creators
        const shuffled = [...otherCreators].sort(() => 0.5 - Math.random());
        const selectedCreators = shuffled.slice(0, numToFollow);

        logger.info(`${creator.username} will follow ${numToFollow} creators`);

        // Create follow relationships
        for (const targetProfile of selectedCreators) {
          // Add to following list if not already following
          if (!profile.following.includes(targetProfile.userId)) {
            profile.following.push(targetProfile.userId);
          }

          // Add to followers list if not already following
          if (!targetProfile.followers.includes(profile.userId)) {
            targetProfile.followers.push(profile.userId);
            await targetProfile.save();
          }

          const targetCreator = await User.findById(targetProfile.userId);
          logger.info(`${creator.username} followed ${targetCreator.username}`);
        }

        // Save creator's profile
        await profile.save();
        logger.info(`Saved follow relationships for ${creator.username}`);

      } catch (error) {
        logger.error('Error creating follow relationship:', error);
      }
    }

    logger.info('Successfully created all follow relationships between creators');
  } catch (error) {
    logger.error('Error in createFollowRelationships:', error);
  }
}

async function createCreators() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB');

    const createdProfiles = [];

    // Create users and their profiles
    for (const creatorData of creators) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ 
          $or: [
            { email: creatorData.email },
            { username: creatorData.username }
          ]
        });

        if (existingUser) {
          logger.info(`Skipping ${creatorData.username} - User already exists`);
          continue;
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(creatorData.password, salt);

        // Create user
        const user = new User({
          ...creatorData,
          password: hashedPassword,
          accountType: 'creator'
        });
        await user.save();

        // Create profile
        const profile = new Profile({
          user: user._id,
          fullName: creatorData.fullName,
          role: 'creator',
          profileImage: creatorData.profileImage
        });
        await profile.save();
        createdProfiles.push(profile);

        logger.info(`Created creator: ${creatorData.username}`);
      } catch (error) {
        logger.error('Error creating creator:', error);
      }
    }

    // Create follow relationships
    await createFollowRelationships(createdProfiles);
    
    logger.info('Successfully created all creators and their relationships');
    return true;
  } catch (error) {
    logger.error('Error in createCreators:', error);
    throw error;
  }
}

// Export the function
module.exports = { createCreators }; 