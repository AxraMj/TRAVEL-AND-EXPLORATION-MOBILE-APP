require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Post = require('../models/Post');
const Guide = require('../models/Guide');
const Notification = require('../models/Notification');

// Source database (your current MongoDB URI)
const SOURCE_URI = process.env.SOURCE_MONGODB_URI;
// Target database (your new Atlas URI)
const TARGET_URI = process.env.MONGODB_URI;

async function connectToDb(uri, dbName) {
    try {
        const conn = await mongoose.createConnection(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            dbName: dbName
        });
        logger.info(`Connected to ${dbName} database`);
        return conn;
    } catch (error) {
        logger.error(`Connection error for ${dbName}:`, error);
        throw error;
    }
}

async function migrateCollection(sourceDb, targetDb, modelName, Model) {
    logger.info(`\nMigrating ${modelName}...`);
    const SourceModel = sourceDb.model(modelName, Model.schema);
    const TargetModel = targetDb.model(modelName, Model.schema);

    try {
        // Count documents first
        const count = await SourceModel.countDocuments();
        logger.info(`Found ${count} ${modelName} documents to migrate`);

        if (count > 0) {
            // Use batch processing for large collections
            const batchSize = 100;
            let processed = 0;

            while (processed < count) {
                const documents = await SourceModel.find({})
                    .skip(processed)
                    .limit(batchSize)
                    .lean();

                await TargetModel.insertMany(documents, { ordered: false });
                processed += documents.length;
                logger.info(`Migrated ${processed}/${count} ${modelName} documents`);
            }
            logger.info(`Successfully completed migration of ${modelName}`);
        } else {
            logger.info(`No ${modelName} documents to migrate`);
        }
    } catch (error) {
        logger.error(`Error migrating ${modelName}:`, error);
        throw error;
    }
}

async function migrate() {
    let sourceDb, targetDb;
    try {
        // Connect to both databases
        sourceDb = await connectToDb(SOURCE_URI, 'travo_app');
        targetDb = await connectToDb(TARGET_URI, 'travo_app');

        // Migrate all collections
        const collections = [
            { name: 'User', model: User },
            { name: 'Profile', model: Profile },
            { name: 'Post', model: Post },
            { name: 'Guide', model: Guide },
            { name: 'Notification', model: Notification }
        ];

        for (const collection of collections) {
            try {
                await migrateCollection(sourceDb, targetDb, collection.name, collection.model);
            } catch (error) {
                logger.error(`Failed to migrate ${collection.name}:`, error);
            }
        }

        logger.info('\nMigration completed!');
    } catch (error) {
        logger.error('Migration failed:', error);
        process.exit(1);
    } finally {
        // Close connections
        if (sourceDb) {
            await sourceDb.close();
            logger.info('Closed source database connection');
        }
        if (targetDb) {
            await targetDb.close();
            logger.info('Closed target database connection');
        }
        process.exit(0);
    }
}

// Run migration
migrate(); 