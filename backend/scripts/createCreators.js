require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Profile = require('../models/Profile');

const creators = [
  {
    fullName: 'Sarah Thompson',
    email: 'sarah.thompson@example.com',
    username: 'wanderlust_sarah',
    password: 'Creator123!',
    profileImage: 'https://picsum.photos/id/237/200'
  },
  {
    fullName: 'James Wilson',
    email: 'james.wilson@example.com',
    username: 'adventure_james',
    password: 'Creator123!',
    profileImage: 'https://picsum.photos/id/238/200'
  },
  {
    fullName: 'Emma Davis',
    email: 'emma.davis@example.com',
    username: 'traveler_emma',
    password: 'Creator123!',
    profileImage: 'https://picsum.photos/id/239/200'
  },
  {
    fullName: 'Michael Brown',
    email: 'michael.brown@example.com',
    username: 'explorer_mike',
    password: 'Creator123!',
    profileImage: 'https://picsum.photos/id/240/200'
  },
  {
    fullName: 'Olivia Martinez',
    email: 'olivia.martinez@example.com',
    username: 'globetrotter_olivia',
    password: 'Creator123!',
    profileImage: 'https://picsum.photos/id/241/200'
  },
  {
    fullName: 'Daniel Lee',
    email: 'daniel.lee@example.com',
    username: 'nomad_daniel',
    password: 'Creator123!',
    profileImage: 'https://picsum.photos/id/242/200'
  },
  {
    fullName: 'Sophia Anderson',
    email: 'sophia.anderson@example.com',
    username: 'wanderer_sophia',
    password: 'Creator123!',
    profileImage: 'https://picsum.photos/id/243/200'
  },
  {
    fullName: 'William Taylor',
    email: 'william.taylor@example.com',
    username: 'voyager_will',
    password: 'Creator123!',
    profileImage: 'https://picsum.photos/id/244/200'
  },
  {
    fullName: 'Isabella Garcia',
    email: 'isabella.garcia@example.com',
    username: 'travelbug_bella',
    password: 'Creator123!',
    profileImage: 'https://picsum.photos/id/245/200'
  },
  {
    fullName: 'Alexander Wright',
    email: 'alexander.wright@example.com',
    username: 'pathfinder_alex',
    password: 'Creator123!',
    profileImage: 'https://picsum.photos/id/246/200'
  },
  {
    fullName: 'Yuki Tanaka',
    email: 'yuki.tanaka@example.com',
    username: 'wanderlust_yuki',
    password: 'Creator123!',
    profileImage: 'https://picsum.photos/id/267/200'
  },
  {
    fullName: 'Liam O\'Connor',
    email: 'liam.oconnor@example.com',
    username: 'adventure_liam',
    password: 'Creator123!',
    profileImage: 'https://picsum.photos/id/268/200'
  },
  {
    fullName: 'Amara Okafor',
    email: 'amara.okafor@example.com',
    username: 'explorer_amara',
    password: 'Creator123!',
    profileImage: 'https://picsum.photos/id/269/200'
  },
  {
    fullName: 'Gabriel Santos',
    email: 'gabriel.santos@example.com',
    username: 'traveler_gabriel',
    password: 'Creator123!',
    profileImage: 'https://picsum.photos/id/270/200'
  },
  {
    fullName: 'Mia Zhang',
    email: 'mia.zhang@example.com',
    username: 'globetrotter_mia',
    password: 'Creator123!',
    profileImage: 'https://picsum.photos/id/271/200'
  },
  {
    fullName: 'Ravi Kumar',
    email: 'ravi.kumar@example.com',
    username: 'nomad_ravi',
    password: 'Creator123!',
    profileImage: 'https://picsum.photos/id/272/200'
  },
  {
    fullName: 'Sophie Laurent',
    email: 'sophie.laurent@example.com',
    username: 'wanderer_sophie',
    password: 'Creator123!',
    profileImage: 'https://picsum.photos/id/273/200'
  },
  {
    fullName: 'Hassan Ali',
    email: 'hassan.ali@example.com',
    username: 'voyager_hassan',
    password: 'Creator123!',
    profileImage: 'https://picsum.photos/id/274/200'
  },
  {
    fullName: 'Ana Silva',
    email: 'ana.silva@example.com',
    username: 'travelbug_ana',
    password: 'Creator123!',
    profileImage: 'https://picsum.photos/id/275/200'
  },
  {
    fullName: 'Viktor Petrov',
    email: 'viktor.petrov@example.com',
    username: 'pathfinder_viktor',
    password: 'Creator123!',
    profileImage: 'https://picsum.photos/id/276/200'
  }
];

async function createFollowRelationships(creatorProfiles) {
  try {
    console.log('Creating follow relationships between creators...');
    
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

        console.log(`${creator.username} will follow ${numToFollow} creators`);

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
          console.log(`${creator.username} followed ${targetCreator.username}`);
        }

        // Save creator's profile
        await profile.save();
        console.log(`Saved follow relationships for ${creator.username}`);

      } catch (error) {
        console.error('Error creating follow relationship:', error);
      }
    }

    console.log('Successfully created all follow relationships between creators');
  } catch (error) {
    console.error('Error in createFollowRelationships:', error);
  }
}

async function createCreators() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

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
          console.log(`Skipping ${creatorData.username} - User already exists`);
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
          userId: user._id,
          bio: `Travel enthusiast and content creator. Follow my journey!`,
          location: 'Worldwide',
          socialLinks: {
            instagram: `https://instagram.com/${creatorData.username}`,
            twitter: `https://twitter.com/${creatorData.username}`
          },
          interests: ['Travel', 'Photography', 'Adventure', 'Culture'],
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

        console.log(`Created creator: ${creatorData.username}`);
      } catch (error) {
        console.error(`Error creating ${creatorData.username}:`, error.message);
      }
    }

    // Create follow relationships between creators
    if (createdProfiles.length > 0) {
      await createFollowRelationships(createdProfiles);
    }

    console.log('Finished creating creators');
  } catch (error) {
    console.error('Script error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createCreators();