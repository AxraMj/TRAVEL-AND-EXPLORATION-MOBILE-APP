require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Post = require('../models/Post');
const Guide = require('../models/Guide');
const Notification = require('../models/Notification');

const MONGODB_URI = process.env.MONGODB_URI;

// Sample data
const sampleData = {
    users: [
        {
            fullName: 'John Doe',
            email: 'john@example.com',
            password: 'password123',
            accountType: 'explorer',
            username: 'john_doe',
            profileImage: 'https://ui-avatars.com/api/?name=John+Doe&background=random'
        },
        {
            fullName: 'Jane Smith',
            email: 'jane@example.com',
            password: 'password123',
            accountType: 'creator',
            username: 'jane_smith',
            profileImage: 'https://ui-avatars.com/api/?name=Jane+Smith&background=random'
        }
    ],
    profiles: [
        {
            bio: 'Travel enthusiast and photographer',
            location: 'New York, USA',
            interests: ['Photography', 'Hiking', 'Culture']
        },
        {
            bio: 'Professional tour guide with 5 years experience',
            location: 'Paris, France',
            interests: ['History', 'Architecture', 'Food Tours']
        }
    ],
    posts: [
        {
            title: 'Amazing Trip to Paris',
            content: 'Visited the Eiffel Tower and it was breathtaking!',
            location: 'Paris, France',
            tags: ['Paris', 'Travel', 'Europe'],
            images: ['https://picsum.photos/800/600']
        },
        {
            title: 'Hiking in the Alps',
            content: 'Spectacular views and great weather!',
            location: 'Swiss Alps',
            tags: ['Hiking', 'Mountains', 'Switzerland'],
            images: ['https://picsum.photos/800/600']
        }
    ],
    guides: [
        {
            title: 'Paris City Tour',
            description: 'Explore the best of Paris in 3 days',
            location: 'Paris, France',
            duration: '3 days',
            price: 299.99,
            included: ['Hotel', 'Transportation', 'Guide'],
            maxGroupSize: 10,
            images: ['https://picsum.photos/800/600']
        },
        {
            title: 'Swiss Alps Adventure',
            description: 'Hiking and camping in the Swiss Alps',
            location: 'Swiss Alps',
            duration: '5 days',
            price: 599.99,
            included: ['Camping Gear', 'Food', 'Guide'],
            maxGroupSize: 8,
            images: ['https://picsum.photos/800/600']
        }
    ]
};

async function seedDatabase() {
    try {
        // Connect to MongoDB Atlas
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB Atlas');

        // Clear existing data
        await Promise.all([
            User.deleteMany({}),
            Profile.deleteMany({}),
            Post.deleteMany({}),
            Guide.deleteMany({}),
            Notification.deleteMany({})
        ]);
        console.log('Cleared existing data');

        // Create users with hashed passwords
        const users = await Promise.all(
            sampleData.users.map(async (userData) => {
                const hashedPassword = await bcrypt.hash(userData.password, 10);
                const user = new User({
                    ...userData,
                    password: hashedPassword
                });
                return user.save();
            })
        );
        console.log('Created users:', users.length);

        // Create profiles linked to users
        const profiles = await Promise.all(
            sampleData.profiles.map((profileData, index) => {
                const profile = new Profile({
                    ...profileData,
                    user: users[index]._id
                });
                return profile.save();
            })
        );
        console.log('Created profiles:', profiles.length);

        // Create posts linked to users
        const posts = await Promise.all(
            sampleData.posts.map((postData, index) => {
                const post = new Post({
                    ...postData,
                    author: users[index]._id
                });
                return post.save();
            })
        );
        console.log('Created posts:', posts.length);

        // Create guides linked to creator users
        const guides = await Promise.all(
            sampleData.guides.map((guideData) => {
                const guide = new Guide({
                    ...guideData,
                    guide: users.find(u => u.accountType === 'creator')._id
                });
                return guide.save();
            })
        );
        console.log('Created guides:', guides.length);

        // Create some sample notifications
        const notifications = await Promise.all(
            users.map(user => {
                return new Notification({
                    recipient: user._id,
                    type: 'welcome',
                    content: `Welcome to Travo, ${user.fullName}!`,
                    read: false
                }).save();
            })
        );
        console.log('Created notifications:', notifications.length);

        console.log('Database seeded successfully!');
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        await mongoose.connection.close();
    }
}

seedDatabase(); 