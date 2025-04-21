require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { createCreators } = require('./createCreators');
const { createExplorers } = require('./createExplorers');
const createPosts = require('./createPosts');
const createGuidePosts = require('./createGuidePosts');

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
    await createPosts();
    await createGuidePosts();
    logger.info('Posts and guides created successfully');

    logger.info('Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
}

// Run seeding
seedAtlas(); 