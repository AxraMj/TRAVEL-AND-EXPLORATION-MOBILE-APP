require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Guide = require('../models/Guide');
const Profile = require('../models/Profile');

const locationGuides = [
  {
    location: 'Kyoto, Japan',
    locationNote: 'Best during cherry blossom season (late March to early April). Visit early morning to avoid crowds.'
  },
  {
    location: 'Santorini, Greece',
    locationNote: 'Perfect for sunset views. Best time to visit is May to September for ideal weather.'
  },
  {
    location: 'Machu Picchu, Peru',
    locationNote: 'High altitude location. Spend 2-3 days in Cusco to acclimatize before visiting.'
  },
  {
    location: 'Venice, Italy',
    locationNote: 'Most magical before 8 AM. Stay in Dorsoduro for authentic local experience.'
  },
  {
    location: 'Bali, Indonesia',
    locationNote: 'Cultural heart of Indonesia. Visit temples early morning for best experience.'
  },
  {
    location: 'Marrakech, Morocco',
    locationNote: 'A maze of wonders in the medina. Best explored with a local guide.'
  },
  {
    location: 'Banff National Park, Canada',
    locationNote: 'Wildlife paradise. Best photos at sunrise, especially at Lake Louise.'
  },
  {
    location: 'Petra, Jordan',
    locationNote: 'Ancient wonder. Visit early morning to avoid heat and crowds.'
  },
  {
    location: 'Dubrovnik, Croatia',
    locationNote: 'Famous Kings Landing from GOT. Walk the walls during sunset.'
  },
  {
    location: 'Cape Town, South Africa',
    locationNote: 'Where mountains meet ocean. Perfect for hiking and wine tours.'
  },
  {
    location: 'Angkor Wat, Cambodia',
    locationNote: 'Temple paradise. Start with sunrise at the main temple.'
  },
  {
    location: 'Queenstown, New Zealand',
    locationNote: 'Adventure capital. Amazing views from Skyline Gondola.'
  },
  {
    location: 'Reykjavik, Iceland',
    locationNote: 'Land of fire and ice. Perfect base for Ring Road adventures.'
  },
  {
    location: 'Havana, Cuba',
    locationNote: 'Vintage charm frozen in time. Best explored in classic cars.'
  }
];

async function createGuidePosts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all creators with their profiles
    const creators = await User.find({ accountType: 'creator' });
    console.log(`Found ${creators.length} creators`);

    for (const creator of creators) {
      try {
        console.log(`Creating guides for ${creator.username}`);
        
        // Each creator gets 3-5 random guides
        const numGuides = Math.floor(Math.random() * 3) + 3; // 3-5 guides
        
        // Get creator's profile
        const profile = await Profile.findOne({ userId: creator._id });
        
        for (let i = 0; i < numGuides; i++) {
          // Get random location guide
          const guide = locationGuides[Math.floor(Math.random() * locationGuides.length)];

          // Generate random likes and dislikes
          const numLikes = Math.floor(Math.random() * 50); // Random likes 0-49
          const numDislikes = Math.floor(Math.random() * 20); // Random dislikes 0-19

          // Create array of random user IDs for likes and dislikes
          const allUsers = await User.find({ _id: { $ne: creator._id } });
          const likedBy = [];
          const dislikedBy = [];

          // Randomly select users for likes
          for (let j = 0; j < numLikes; j++) {
            const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
            if (!likedBy.includes(randomUser._id)) {
              likedBy.push(randomUser._id);
            }
          }

          // Randomly select users for dislikes
          for (let j = 0; j < numDislikes; j++) {
            const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
            if (!dislikedBy.includes(randomUser._id) && !likedBy.includes(randomUser._id)) {
              dislikedBy.push(randomUser._id);
            }
          }

          const newGuide = new Guide({
            userId: creator._id,
            location: guide.location,
            locationNote: guide.locationNote,
            likes: likedBy.length,
            dislikes: dislikedBy.length,
            likedBy: likedBy,
            dislikedBy: dislikedBy,
            createdAt: new Date(Date.now() - Math.floor(Math.random() * 7776000000)) // Random date within last 90 days
          });

          await newGuide.save();

          // Update creator's profile stats
          if (profile) {
            profile.stats.totalGuides += 1;
            await profile.save();
          }

          console.log(`Created guide for ${creator.username} about ${guide.location} with ${likedBy.length} likes and ${dislikedBy.length} dislikes`);
        }
      } catch (error) {
        console.error(`Error creating guides for ${creator.username}:`, error.message);
      }
    }

    console.log('Finished creating guides');
  } catch (error) {
    console.error('Script error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createGuidePosts(); 