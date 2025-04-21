require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const logger = require('../utils/logger');

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
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    logger.info('Connected to MongoDB');

    // Get all creators
    const creators = await User.find({ role: 'creator' });
    if (creators.length === 0) {
      logger.warn('No creators found. Please run createCreators.js first');
      process.exit(1);
    }
    logger.info(`Found ${creators.length} creators`);

    // Delete existing guide posts
    await Post.deleteMany({ type: 'guide' });
    logger.info('Cleared existing guide posts');

    for (const creator of creators) {
      try {
        // Create 2-4 guide posts for each creator
        const numPosts = Math.floor(Math.random() * 3) + 2;
        logger.info(`Creating ${numPosts} guide posts for creator ${creator.username}`);

        for (let i = 0; i < numPosts; i++) {
          // Get random location guide
          const guide = locationGuides[Math.floor(Math.random() * locationGuides.length)];
          
          const post = new Post({
            userId: creator._id,
            type: 'guide',
            title: `Travel Guide: ${guide.location}`,
            content: guide.locationNote,
            location: {
              name: guide.location,
              coordinates: { latitude: 0, longitude: 0 } // You might want to add actual coordinates to locationGuides
            },
            createdAt: new Date(Date.now() - Math.floor(Math.random() * 7776000000)) // Random date within last 90 days
          });
          
          await post.save();
          logger.info(`Created guide post: ${post.title}`);
        }
      } catch (error) {
        logger.error(`Error creating guide posts for creator ${creator.username}:`, error);
      }
    }

    logger.info('Successfully created all guide posts');
    process.exit(0);
  } catch (error) {
    logger.error('Error in createGuidePosts:', error);
    process.exit(1);
  }
}

// Run the function
createGuidePosts(); 