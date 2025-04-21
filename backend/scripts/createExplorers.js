require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Profile = require('../models/Profile');

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

async function createFollowRelationships(explorerProfiles) {
  try {
    console.log('Creating follow relationships for explorers...');
    
    // Get all creators
    const creators = await User.find({ accountType: 'creator' });
    if (creators.length === 0) {
      console.log('No creators found. Please run createCreators.js first');
      return;
    }

    const creatorProfiles = await Profile.find({
      userId: { $in: creators.map(c => c._id) }
    });

    console.log(`Found ${creators.length} creators to follow`);

    // For each explorer
    for (const explorerProfile of explorerProfiles) {
      try {
        // Get the explorer's user info for logging
        const explorer = await User.findById(explorerProfile.userId);
        
        // Each explorer follows 5-8 creators
        const numCreatorsToFollow = Math.floor(Math.random() * 4) + 5; // 5-8 creators
        const shuffledCreators = [...creatorProfiles].sort(() => 0.5 - Math.random());
        const selectedCreators = shuffledCreators.slice(0, numCreatorsToFollow);

        console.log(`${explorer.username} will follow ${numCreatorsToFollow} creators`);

        // Create follow relationships
        for (const creatorProfile of selectedCreators) {
          // Add creator to explorer's following list
          if (!explorerProfile.following.includes(creatorProfile.userId)) {
            explorerProfile.following.push(creatorProfile.userId);
          }

          // Add explorer to creator's followers list
          if (!creatorProfile.followers.includes(explorerProfile.userId)) {
            creatorProfile.followers.push(explorerProfile.userId);
            await creatorProfile.save();
          }

          const creator = await User.findById(creatorProfile.userId);
          console.log(`${explorer.username} followed ${creator.username}`);
        }

        // Save explorer's profile
        await explorerProfile.save();
        console.log(`Saved follow relationships for ${explorer.username}`);

      } catch (error) {
        console.error('Error creating follow relationship:', error);
      }
    }

    console.log('Successfully created all follow relationships');
  } catch (error) {
    console.error('Error in createFollowRelationships:', error);
  }
}

async function createExplorers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const createdProfiles = [];

    // Create users and their profiles
    for (const explorerData of explorers) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ 
          $or: [
            { email: explorerData.email },
            { username: explorerData.username }
          ]
        });

        if (existingUser) {
          console.log(`Skipping ${explorerData.username} - User already exists`);
          continue;
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(explorerData.password, salt);

        // Create user
        const user = new User({
          ...explorerData,
          password: hashedPassword,
          accountType: 'explorer'
        });
        await user.save();

        // Create profile
        const profile = new Profile({
          userId: user._id,
          bio: `Travel enthusiast exploring the world one destination at a time!`,
          location: 'Earth',
          socialLinks: {},
          interests: ['Travel', 'Culture', 'Food', 'Photography'],
          stats: {
            totalPosts: 0,
            totalGuides: 0,
            totalLikes: 0
          },
          followers: [],
          following: []
        });
        await profile.save();
        createdProfiles.push(profile);

        console.log(`Created explorer: ${explorerData.username}`);
      } catch (error) {
        console.error(`Error creating ${explorerData.username}:`, error.message);
      }
    }

    // Create follow relationships
    if (createdProfiles.length > 0) {
      await createFollowRelationships(createdProfiles);
    }

    console.log('Finished creating explorers');
  } catch (error) {
    console.error('Script error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createExplorers();