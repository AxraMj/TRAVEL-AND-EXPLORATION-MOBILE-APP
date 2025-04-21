require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Import all creation scripts
const createCreators = require('./createCreators');
const createExplorers = require('./createExplorers');
const createGuidePosts = require('./createGuidePosts');
const createPosts = require('./createPosts');
const addOotyPosts = require('./addOotyPostsSimple');

async function setupAtlasData() {
    try {
        // Connect to MongoDB Atlas
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        logger.info('Connected to MongoDB Atlas');

        // Import and run scripts in sequence
        logger.info('Starting data setup...');
        
        const { createCreators } = await import('./createCreators.js');
        await createCreators();
        logger.info('Creators setup complete');

        const { createExplorers } = await import('./createExplorers.js');
        await createExplorers();
        logger.info('Explorers setup complete');

        const { default: createPosts } = await import('./createPosts.js');
        await createPosts();
        logger.info('Posts setup complete');

        const { default: createGuidePosts } = await import('./createGuidePosts.js');
        await createGuidePosts();
        logger.info('Guide posts setup complete');

        logger.info('All data setup completed successfully');
        process.exit(0);
    } catch (error) {
        logger.error('Error setting up data:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        logger.info('Disconnected from MongoDB');
    }
}

// Run setup
setupAtlasData(); 