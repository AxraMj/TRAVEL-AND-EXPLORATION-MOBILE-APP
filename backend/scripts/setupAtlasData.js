require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

// Import all creation scripts
const createCreators = require('./createCreators');
const createExplorers = require('./createExplorers');
const createGuidePosts = require('./createGuidePosts');
const createPosts = require('./createPosts');
const addOotyPosts = require('./addOotyPostsSimple');

async function setupAtlasData() {
    try {
        // Get MongoDB URI from environment variable
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error('MONGODB_URI environment variable is not set');
        }

        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(uri);
        console.log('Connected successfully to MongoDB Atlas');

        // Run creation scripts in sequence
        console.log('\nCreating Creators...');
        const { createCreators } = require('./createCreators.js');
        await createCreators();

        console.log('\nCreating Explorers...');
        const { createExplorers } = require('./createExplorers.js');
        await createExplorers();

        console.log('\nCreating Guide Posts...');
        const { createGuidePosts } = require('./createGuidePosts.js');
        await createGuidePosts();

        console.log('\nCreating Posts...');
        const { createPosts } = require('./createPosts.js');
        await createPosts();

        console.log('\nAdding Ooty Posts...');
        const { addOotyPosts } = require('./addOotyPostsSimple.js');
        await addOotyPosts();

        console.log('\nAll data has been successfully added to MongoDB Atlas!');
        process.exit(0);
    } catch (error) {
        console.error('Error setting up Atlas data:', error);
        process.exit(1);
    }
}

setupAtlasData(); 