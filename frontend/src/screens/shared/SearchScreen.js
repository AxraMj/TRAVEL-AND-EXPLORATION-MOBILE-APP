import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  ScrollView, 
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../context/AuthContext';
import { searchAPI } from '../../services/api/search';
import PostCard from '../../components/posts/PostCard';

const { width } = Dimensions.get('window');

const categories = [
  { id: '1', name: 'Beach', icon: 'umbrella-outline' },
  { id: '2', name: 'Mountain', icon: 'triangle-outline' },
  { id: '3', name: 'City', icon: 'business-outline' },
  { id: '4', name: 'Cultural', icon: 'museum-outline' },
  { id: '5', name: 'Adventure', icon: 'compass-outline' },
  { id: '6', name: 'Food', icon: 'restaurant-outline' },
];

const popularDestinations = [
  {
    id: '1',
    name: 'Bali',
    country: 'Indonesia',
    image: 'https://example.com/bali.jpg',
    rating: 4.8,
    posts: 1234
  },
  // Add more destinations
];

const recentSearches = [
  'Paris, France',
  'Tokyo, Japan',
  'New York, USA',
  // Add more recent searches
];

export default function SearchScreen({ navigation }) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState({
    users: [],
    posts: [],
    locations: []
  });
  const [recentSearches, setRecentSearches] = useState([]);

  const performSearch = async (query) => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const results = await searchAPI.searchAll(query);
      setSearchResults(results);
      
      // Add to recent searches
      setRecentSearches(prev => {
        const newSearches = [query, ...prev.filter(s => s !== query)].slice(0, 5);
        return newSearches;
      });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        performSearch(searchQuery);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const renderUserItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.userItem}
      onPress={() => navigation.navigate('UserProfile', { userId: item._id })}
    >
      <Image 
        source={{ uri: item.profileImage }} 
        style={styles.userImage}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.fullName}</Text>
        <Text style={styles.userHandle}>@{item.username}</Text>
      </View>
      {item.accountType === 'creator' && (
        <View style={styles.creatorBadge}>
          <Text style={styles.creatorBadgeText}>Creator</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderLocationItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.locationItem}
      onPress={() => navigation.navigate('LocationDetail', { location: item })}
    >
      <View style={styles.locationInfo}>
        <Text style={styles.locationName}>{item._id}</Text>
        <Text style={styles.postCount}>{item.postCount} posts</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.5)" />
    </TouchableOpacity>
  );

  const navigateToHome = () => {
    if (user?.accountType === 'creator') {
      navigation.navigate('CreatorHome');
    } else {
      navigation.navigate('ExplorerHome');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#232526', '#414345', '#232526']}
        style={styles.container}
      >
        {/* Search Header */}
        <View style={styles.searchHeader}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="rgba(255,255,255,0.5)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search destinations, users..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView style={styles.content}>
          {/* Recent Searches */}
          {isSearchFocused && searchQuery.length === 0 && (
            <View style={styles.recentSearches}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              {recentSearches.map((search, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.recentSearchItem}
                  onPress={() => setSearchQuery(search)}
                >
                  <Ionicons name="time-outline" size={20} color="rgba(255,255,255,0.5)" />
                  <Text style={styles.recentSearchText}>{search}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Loading State */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ffffff" />
            </View>
          )}

          {/* Search Results */}
          {!loading && searchQuery && (
            <>
              {/* Users Section */}
              {searchResults.users.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Users</Text>
                  <FlatList
                    data={searchResults.users}
                    renderItem={renderUserItem}
                    keyExtractor={item => item._id}
                    horizontal={false}
                    scrollEnabled={false}
                  />
                </View>
              )}

              {/* Locations Section */}
              {searchResults.locations.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Locations</Text>
                  <FlatList
                    data={searchResults.locations}
                    renderItem={renderLocationItem}
                    keyExtractor={item => item._id}
                    horizontal={false}
                    scrollEnabled={false}
                  />
                </View>
              )}

              {/* Posts Section */}
              {searchResults.posts.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Posts</Text>
                  {searchResults.posts.map(post => (
                    <PostCard
                      key={post._id}
                      post={post}
                      onPostUpdate={() => performSearch(searchQuery)}
                    />
                  ))}
                </View>
              )}

              {/* No Results */}
              {!searchResults.users.length && !searchResults.locations.length && !searchResults.posts.length && (
                <View style={styles.noResults}>
                  <Ionicons name="search-outline" size={48} color="rgba(255,255,255,0.5)" />
                  <Text style={styles.noResultsText}>No results found</Text>
                </View>
              )}
            </>
          )}

          {/* Categories and Suggestions when no search */}
          {!searchQuery && !isSearchFocused && (
            <>
              <Text style={styles.sectionTitle}>Explore Categories</Text>
              <FlatList
                data={categories}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[
                      styles.categoryItem,
                      activeCategory === item.id && styles.categoryItemActive
                    ]}
                    onPress={() => setActiveCategory(item.id)}
                  >
                    <View style={styles.categoryIcon}>
                      <Ionicons 
                        name={item.icon} 
                        size={24} 
                        color={activeCategory === item.id ? '#ffffff' : '#FF6B6B'} 
                      />
                    </View>
                    <Text style={[
                      styles.categoryText,
                      activeCategory === item.id && styles.categoryTextActive
                    ]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                )}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesList}
              />
            </>
          )}
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={navigateToHome}
          >
            <Ionicons name="home-outline" size={24} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => navigation.navigate('Map')}
          >
            <Ionicons name="map-outline" size={24} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="search" size={24} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => navigation.navigate('Saved')}
          >
            <Ionicons name="bookmark-outline" size={24} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchHeader: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 8,
    marginRight: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  categoriesList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryItemActive: {
    transform: [{scale: 1.1}],
  },
  categoryText: {
    color: '#ffffff',
    fontSize: 14,
  },
  categoryTextActive: {
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  userImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  userHandle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  creatorBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  creatorBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  postCount: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noResults: {
    alignItems: 'center',
    paddingTop: 40,
  },
  noResultsText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    marginTop: 12,
  },
  recentSearches: {
    paddingTop: 16,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  recentSearchText: {
    color: '#ffffff',
    marginLeft: 12,
    fontSize: 16,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#232526',
    paddingBottom: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 