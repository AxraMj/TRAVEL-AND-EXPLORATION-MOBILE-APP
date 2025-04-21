require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const Profile = require('../models/Profile');

// Ooty-specific data
const ootyLocations = [
  {
    name: 'Ooty Botanical Gardens, Tamil Nadu, India',
    coordinates: { latitude: 11.4220, longitude: 76.7115 },
    description: 'A beautifully maintained 55-acre garden established in 1848, featuring exotic and indigenous plants, fossilized tree trunks, and an Italian-style garden.',
    tips: [
      'Visit early morning to avoid crowds and enjoy the peaceful atmosphere.',
      'Don\'t miss the 20-million-year-old fossilized tree trunk.',
      'The flower show in May is a spectacular event not to be missed.'
    ],
    weather: { temp: 20, description: 'Pleasant', icon: 'sun' }
  },
  {
    name: 'Doddabetta Peak, Ooty, India',
    coordinates: { latitude: 11.4086, longitude: 76.7359 },
    description: 'The highest peak in the Nilgiri Mountains at 2,637 meters offering panoramic views of the surrounding hills and valleys. It\'s a perfect spot for nature lovers and photographers.',
    tips: [
      'Carry a light jacket as it can be quite windy at the top.',
      'Use the telescope at the observatory for better views of distant landscapes.',
      'Visit during early morning to avoid mist blocking the views.'
    ],
    weather: { temp: 15, description: 'Windy', icon: 'cloud-sun' }
  },
  {
    name: 'Ooty Lake, Tamil Nadu, India',
    coordinates: { latitude: 11.4146, longitude: 76.6753 },
    description: 'An artificial lake created in 1824 stretching over 65 acres. The lake offers boating facilities and is surrounded by Eucalyptus trees and gardens.',
    tips: [
      'Try the pedal boats for a relaxing experience on the lake.',
      'Avoid weekends if you prefer fewer crowds.',
      'The miniature train ride near the lake is fun for families.'
    ],
    weather: { temp: 19, description: 'Sunny', icon: 'sun' }
  },
  {
    name: 'Pykara Lake and Falls, Ooty, India',
    coordinates: { latitude: 11.4693, longitude: 76.5847 },
    description: 'A serene lake formed by the Pykara River with boat rides available. The nearby Pykara Falls cascade down in steps creating a picturesque scene.',
    tips: [
      'Combine your visit with Pykara Falls which is just a short distance away.',
      'Take a motorboat ride on the lake for the best experience.',
      'Perfect spot for nature photography, especially during golden hours.'
    ],
    weather: { temp: 18, description: 'Partly Cloudy', icon: 'cloud-sun' }
  },
  {
    name: 'Nilgiri Mountain Railway, Ooty, India',
    coordinates: { latitude: 11.4155, longitude: 76.7025 },
    description: 'A UNESCO World Heritage Site, this historic toy train offers a scenic journey through tunnels, bridges, and curves with breathtaking views of the Nilgiri Hills.',
    tips: [
      'Book tickets in advance during peak tourist season.',
      'Sit on the right side of the train when going uphill for better views.',
      'The journey from Mettupalayam to Ooty is the most scenic part.'
    ],
    weather: { temp: 17, description: 'Foggy Morning', icon: 'cloud' }
  },
  {
    name: 'Rose Garden, Ooty, India',
    coordinates: { latitude: 11.4037, longitude: 76.6818 },
    description: 'One of the largest rose gardens in India with over 20,000 varieties of roses in different hues and fragrances, spread across 4 hectares of land.',
    tips: [
      'Visit between April and June when most roses are in full bloom.',
      'Early morning visit offers the best fragrance experience.',
      'Look for the unique black and green rose varieties.'
    ],
    weather: { temp: 21, description: 'Sunny', icon: 'sun' }
  },
  {
    name: 'Tea Factory and Museum, Ooty, India',
    coordinates: { latitude: 11.3561, longitude: 76.7406 },
    description: 'An educational tour of how tea is processed from leaf to cup. The museum showcases the history of tea cultivation in the Nilgiris.',
    tips: [
      'Take a guided tour to learn about the tea processing steps.',
      'Buy fresh tea directly from the factory shop.',
      'Visit the adjacent tea gardens for beautiful photos among tea bushes.'
    ],
    weather: { temp: 18, description: 'Misty', icon: 'cloud' }
  },
  {
    name: 'Emerald Lake, Ooty, India',
    coordinates: { latitude: 11.3647, longitude: 76.6070 },
    description: 'A pristine, less crowded lake surrounded by lush tea plantations and Eucalyptus trees. Perfect for those seeking tranquility away from tourist crowds.',
    tips: [
      'Visit early morning to spot various birds around the lake.',
      'Carry your own food and water as there are limited facilities.',
      'A great spot for a peaceful picnic amidst nature.'
    ],
    weather: { temp: 16, description: 'Clear', icon: 'sun' }
  },
  {
    name: 'Avalanche Lake, Ooty, India',
    coordinates: { latitude: 11.2969, longitude: 76.5577 },
    description: 'A serene lake surrounded by colorful flowers and verdant valleys. The area is rich in biodiversity and offers activities like fishing and rafting.',
    tips: [
      'Obtain necessary permits before visiting as it\'s a protected area.',
      'The trek around the lake offers spectacular views.',
      'Visit between March and May for the best weather conditions.'
    ],
    weather: { temp: 14, description: 'Cool Breeze', icon: 'wind' }
  },
  {
    name: 'Deer Park, Ooty, India',
    coordinates: { latitude: 11.4012, longitude: 76.6873 },
    description: 'A small but well-maintained sanctuary where visitors can observe deer in their natural habitat. The park also has a children\'s playground and small museum.',
    tips: [
      'Visit during early morning or late evening to see more active deer.',
      'Stay quiet and patient for the best wildlife viewing experience.',
      'Combine with a visit to the nearby Rose Garden.'
    ],
    weather: { temp: 19, description: 'Pleasant', icon: 'sun' }
  }
];

const ootyImages = [
  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Government_Botanical_Garden%2COOTY_%2CTAMIL_NADU_%2CINDIA.jpg/1280px-Government_Botanical_Garden%2COOTY_%2CTAMIL_NADU_%2CINDIA.jpg', // Botanical Gardens
  'https://www.travel2ooty.com/sightseeingimages/Doddabetta/Doddabetta-Peak-View-Point.jpg', // Doddabetta Peak
  'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/09/3d/de/fd/upper-bhavani-lake.jpg?w=900&h=500&s=1', // Ooty Lake
  'https://images.cnbctv18.com/wp-content/uploads/2023/07/Pykara-Falls.jpg', // Pykara Falls
  'https://www.oyorooms.com/travel-guide/wp-content/uploads/2020/01/Train-on-Nilgiri-Railway-Track.jpg', // Nilgiri Railway
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRYT_nS2R3MlKZOSl_IEViktofHTK_jPeM6aQ&s', // Rose Garden
  'https://www.tamilnadutourism.tn.gov.in/img/pages/large-desktop/tea-museum-tea-factory-ooty-1680160455_13931b804d83f6d83472.webp', // Tea Factory
  'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/14/70/23/3c/img-20180129-151624-01.jpg?w=900&h=-1&s=1', // Emerald Lake
  'https://static2.tripoto.com/media/filter/tst/img/226024/TripDocument/1499533805_32022457723_a8202b0011_o.jpg.webp', // Avalanche Lake
  'https://www.tamilnadutourism.tn.gov.in/img/pages/medium-desktop/deer-park-ooty-1657277539_0d7eb167fc536c61ea1f.webp'  // Deer Park
];

async function addOotyPosts() {
  try {
    // Connect to MongoDB using direct connection string
    const MONGODB_URI = 'mongodb://localhost:27017/travo';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the specific user
    const username = 'axra';
    const user = await User.findOne({ username });
    
    if (!user) {
      console.error(`User with username "${username}" not found`);
      return;
    }
    
    console.log(`Found user: ${user.username} (${user._id})`);
    
    // Create 10 Ooty posts for the user
    for (let i = 0; i < ootyLocations.length; i++) {
      const location = ootyLocations[i];
      
      const post = new Post({
        userId: user._id,
        image: ootyImages[i], // Use matching image for each location
        description: `${location.description}\n\nExploring the beauty of ${location.name}. ${location.tips[0]}`,
        location: {
          name: location.name,
          coordinates: location.coordinates
        },
        weather: location.weather,
        travelTips: location.tips
      });

      await post.save();
      console.log(`Created post #${i+1}: ${location.name}`);
      
      // Update user's post count
      await Profile.findOneAndUpdate(
        { userId: user._id },
        { $inc: { 'stats.totalPosts': 1 } }
      );
    }

    console.log(`Successfully added 10 Ooty posts to ${user.username}'s account`);
  } catch (error) {
    console.error('Script error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
addOotyPosts(); 