require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Profile = require('../models/Profile');
const logger = require('../utils/logger');

const explorers = [
  {
    fullName: 'David Chen',
    email: 'david.chen@example.com',
    username: 'wanderlust_david',
    password: 'Explorer123!',
    profileImage: 'https://picsum.photos/id/247/200'
  },
  {
    fullName: 'Rachel Kim',
    email: 'rachel.kim@example.com',
    username: 'travel_rachel',
    password: 'Explorer123!',
    profileImage: 'https://picsum.photos/id/248/200'
  },
  {
    fullName: 'Marcus Johnson',
    email: 'marcus.johnson@example.com',
    username: 'explorer_marcus',
    password: 'Explorer123!',
    profileImage: 'https://picsum.photos/id/249/200'
  },
  {
    fullName: 'Priya Patel',
    email: 'priya.patel@example.com',
    username: 'wanderer_priya',
    password: 'Explorer123!',
    profileImage: 'https://picsum.photos/id/250/200'
  },
  {
    fullName: 'Lucas Rodriguez',
    email: 'lucas.rodriguez@example.com',
    username: 'adventurer_lucas',
    password: 'Explorer123!',
    profileImage: 'https://picsum.photos/id/251/200'
  },
  {
    fullName: 'Nina Williams',
    email: 'nina.williams@example.com',
    username: 'globetrotter_nina',
    password: 'Explorer123!',
    profileImage: 'https://picsum.photos/id/252/200'
  },
  {
    fullName: 'Thomas Schmidt',
    email: 'thomas.schmidt@example.com',
    username: 'traveler_thomas',
    password: 'Explorer123!',
    profileImage: 'https://picsum.photos/id/253/200'
  },
  {
    fullName: 'Maya Singh',
    email: 'maya.singh@example.com',
    username: 'voyager_maya',
    password: 'Explorer123!',
    profileImage: 'https://picsum.photos/id/254/200'
  },
  {
    fullName: 'Leo Costa',
    email: 'leo.costa@example.com',
    username: 'backpacker_leo',
    password: 'Explorer123!',
    profileImage: 'https://picsum.photos/id/255/200'
  },
  {
    fullName: 'Sofia Kowalski',
    email: 'sofia.kowalski@example.com',
    username: 'nomad_sofia',
    password: 'Explorer123!',
    profileImage: 'https://picsum.photos/id/256/200'
  },
  {
    fullName: 'Aisha Khan',
    email: 'aisha.khan@example.com',
    username: 'wanderlust_aisha',
    password: 'Explorer123!',
    profileImage: 'https://picsum.photos/id/257/200'
  },
  {
    fullName: 'Carlos Morales',
    email: 'carlos.morales@example.com',
    username: 'explorer_carlos',
    password: 'Explorer123!',
    profileImage: 'https://picsum.photos/id/258/200'
  },
  {
    fullName: 'Elena Popov',
    email: 'elena.popov@example.com',
    username: 'traveler_elena',
    password: 'Explorer123!',
    profileImage: 'https://picsum.photos/id/259/200'
  },
  {
    fullName: 'Kai Nakamura',
    email: 'kai.nakamura@example.com',
    username: 'adventurer_kai',
    password: 'Explorer123!',
    profileImage: 'https://picsum.photos/id/260/200'
  },
  {
    fullName: 'Zara Ahmed',
    email: 'zara.ahmed@example.com',
    username: 'globetrotter_zara',
    password: 'Explorer123!',
    profileImage: 'https://picsum.photos/id/261/200'
  },
  {
    fullName: 'Felix Weber',
    email: 'felix.weber@example.com',
    username: 'wanderer_felix',
    password: 'Explorer123!',
    profileImage: 'https://picsum.photos/id/262/200'
  },
  {
    fullName: 'Luna Park',
    email: 'luna.park@example.com',
    username: 'explorer_luna',
    password: 'Explorer123!',
    profileImage: 'https://picsum.photos/id/263/200'
  },
  {
    fullName: 'Omar Hassan',
    email: 'omar.hassan@example.com',
    username: 'traveler_omar',
    password: 'Explorer123!',
    profileImage: 'https://picsum.photos/id/264/200'
  },
  {
    fullName: 'Ava Wilson',
    email: 'ava.wilson@example.com',
    username: 'adventurer_ava',
    password: 'Explorer123!',
    profileImage: 'https://picsum.photos/id/265/200'
  },
  {
    fullName: 'Marco Rossi',
    email: 'marco.rossi@example.com',
    username: 'voyager_marco',
    password: 'Explorer123!',
    profileImage: 'https://picsum.photos/id/266/200'
  }
];

async function createFollowRelationships(explorers, creators) {
  try {
    logger.info('Starting to create follow relationships');
    
    for (const explorer of explorers) {
      // Find the explorer's user document
      const explorerUser = await User.findOne({ email: explorer.email });
      
      if (!explorerUser) {
        logger.error(`Explorer not found: ${explorer.email}`);
        continue;
      }

      // Randomly select 1-3 creators to follow
      const numToFollow = Math.floor(Math.random() * 3) + 1;
      const shuffledCreators = creators.sort(() => 0.5 - Math.random());
      const selectedCreators = shuffledCreators.slice(0, numToFollow);

      for (const creator of selectedCreators) {
        const creatorUser = await User.findOne({ email: creator.email });
        
        if (!creatorUser) {
          logger.error(`Creator not found: ${creator.email}`);
          continue;
        }

        // Add creator to explorer's following list
        if (!explorerUser.following.includes(creatorUser._id)) {
          explorerUser.following.push(creatorUser._id);
          await explorerUser.save();
          logger.info(`Explorer ${explorer.email} now following ${creator.email}`);
        }

        // Add explorer to creator's followers list
        if (!creatorUser.followers.includes(explorerUser._id)) {
          creatorUser.followers.push(explorerUser._id);
          await creatorUser.save();
        }
      }
    }
    logger.info('Finished creating follow relationships');
  } catch (error) {
    logger.error('Error creating follow relationships:', error);
    throw error;
  }
}

async function createExplorers() {
  try {
    logger.info('Starting explorer creation process');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    logger.info('Connected to MongoDB successfully');

    // Delete existing explorers
    await User.deleteMany({ role: 'explorer' });
    await Profile.deleteMany({ role: 'explorer' });
    logger.info('Cleared existing explorer data');

    const createdExplorers = [];

    // Create explorers
    for (const explorer of explorers) {
      try {
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(explorer.password, salt);

        // Create user
        const user = new User({
          email: explorer.email,
          password: hashedPassword,
          username: explorer.username,
          role: 'explorer'
        });

        await user.save();

        // Create profile
        const profile = new Profile({
          user: user._id,
          fullName: explorer.fullName,
          role: 'explorer',
          profileImage: explorer.profileImage
        });

        await profile.save();
        
        // Update user with profile reference
        user.profile = profile._id;
        await user.save();

        createdExplorers.push(user);
        logger.info(`Created explorer: ${explorer.email}`);
      } catch (error) {
        logger.error(`Error creating explorer ${explorer.email}:`, error);
      }
    }

    logger.info(`Successfully created ${createdExplorers.length} explorers`);
    return createdExplorers;
  } catch (error) {
    logger.error('Error in createExplorers:', error);
    throw error;
  }
}

// Main execution
(async () => {
  try {
    logger.info('Starting script execution');
    const createdExplorers = await createExplorers();
    
    // Get existing creators
    const creators = await User.find({ role: 'creator' });
    
    if (creators.length === 0) {
      logger.warn('No creators found in the database');
    } else {
      await createFollowRelationships(createdExplorers, creators);
    }
    
    logger.info('Script completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Script failed:', error);
    process.exit(1);
  }
})();

// Export the function
module.exports = { createExplorers };