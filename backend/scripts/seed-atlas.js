require('dotenv').config();
const mongoose = require('mongoose');
const { createCreators } = require('./createCreators');
const { createExplorers } = require('./createExplorers');
const logger = require('../utils/logger');

async function seedAtlas() {
  try {
    // Connect to MongoDB Atlas
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    logger.info('Connected to MongoDB Atlas');

    // Create creators first
    logger.info('Creating creators...');
    await createCreators();
    logger.info('Creators created successfully');

    // Create explorers
    logger.info('Creating explorers...');
    await createExplorers();
    logger.info('Explorers created successfully');

    // Create posts and guides
    logger.info('Creating posts and guides...');
    await Promise.all([
      require('./createPosts')(),
      require('./createGuidePosts')()
    ]);
    logger.info('Posts and guides created successfully');

    logger.info('Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run seeding
seedAtlas(); 