import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity,
  ScrollView,
  FlatList,
  Dimensions,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { guidesAPI, profileAPI, postsAPI } from '../../services/api/';
import { useFocusEffect } from '@react-navigation/native';
import PostCard from '../../components/posts/PostCard';
import GuideCard from '../../components/guides/GuideCard';
import FollowModal from '../../components/modals/FollowModal';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');
const POST_SIZE = width / 3;

const renderPostItem = ({ item }) => (
  <TouchableOpacity 
    style={styles.postItem}
    onPress={() => navigation.navigate('PostDetail', { post: item })}
  >
    <Image 
      source={{ uri: item.image }}
      style={styles.postImage}
    />
    <View style={styles.postOverlay}>
      <View style={styles.postStats}>
        <View style={styles.postStat}>
          <Ionicons name="heart" size={14} color="#ffffff" />
          <Text style={styles.postStatText}>{item.likes?.length || 0}</Text>
        </View>
        <View style={styles.postStat}>
          <Ionicons name="chatbubble" size={14} color="#ffffff" />
          <Text style={styles.postStatText}>{item.comments?.length || 0}</Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

export default function ProfileScreen({ navigation }) {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('posts');
  const [isCreatingGuide, setIsCreatingGuide] = useState(false);
  const [guideText, setGuideText] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [locationNoteInput, setLocationNoteInput] = useState('');
  const [guides, setGuides] = useState([]);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [followModalVisible, setFollowModalVisible] = useState(false);
  const [followModalType, setFollowModalType] = useState('followers');
  const [followModalData, setFollowModalData] = useState([]);
  const [followModalLoading, setFollowModalLoading] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isLocationSearchVisible, setIsLocationSearchVisible] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);

  const fetchData = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);
      
    try {
      const [profileResponse, guidesResponse, postsResponse] = await Promise.all([
        profileAPI.getProfile(user.id),
        guidesAPI.getUserGuides(user.id),
        postsAPI.getUserPosts(user.id)
      ]);

      // Format guides with user information
      const formattedGuides = guidesResponse.map(guide => ({
        ...guide,
        username: user.username,
        userImage: user.profileImage
      }));

      // Update profile with correct post count
      const updatedProfile = {
        ...profileResponse,
        stats: {
          ...profileResponse.stats,
          totalPosts: postsResponse.length
        }
      };

      setProfileData(updatedProfile);
      setGuides(formattedGuides);
      setPosts(postsResponse);

      // Update the profile stats in the backend
      await profileAPI.updateStats({
        stats: {
          totalPosts: postsResponse.length
        }
      });

    } catch (error) {
      console.error('Error fetching profile data:', error);
      setError(error.message || 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user?.id) {
      fetchData();
    }
  }, [authLoading, user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      console.log('Profile screen focused - fetching latest guides');
      fetchData();
      return () => {};
    }, [])
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Check if we need to refresh the posts
      const refresh = navigation.getState().routes.find(
        route => route.name === 'Profile'
      )?.params?.refresh;

      if (refresh) {
        fetchData();
        // Clear the refresh param
        navigation.setParams({ refresh: undefined });
      }
    });

    return unsubscribe;
  }, [navigation]);

  if (authLoading || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const handleSubmitGuide = async () => {
    if (!locationInput.trim()) {
      Alert.alert('Error', 'Please provide a location');
      return;
    }

    try {
      setIsLoading(true);
      
      const guideData = {
        location: locationInput.trim(),
        locationNote: locationNoteInput.trim(),
        userId: user.id,
        coordinates: currentLocation || null
      };
      
      const newGuide = await guidesAPI.createGuide(guideData);
      
      // Format the guide with user information
      const formattedGuide = {
        ...newGuide,
        username: user.username,
        userImage: user.profileImage,
        likes: newGuide.likes || 0,
        dislikes: newGuide.dislikes || 0,
        hasLiked: false,
        hasDisliked: false
      };
      
      setGuides(prevGuides => [formattedGuide, ...prevGuides]);
      setLocationInput('');
      setLocationNoteInput('');
      setIsCreatingGuide(false);
      setCurrentLocation(null);
      
    } catch (error) {
      console.error('Guide creation error:', error);
      Alert.alert(
        'Error',
        'Failed to create guide. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (guideId) => {
    try {
      // TODO: Replace with your actual API call
      // await authAPI.likeGuide(guideId);

      setGuides(prevGuides => prevGuides.map(guide => {
        if (guide.id === guideId) {
          if (guide.hasLiked) {
            return { ...guide, hasLiked: false, likes: guide.likes - 1 };
          }
          return { 
            ...guide, 
            hasLiked: true, 
            likes: guide.likes + 1,
            hasDisliked: false,
            dislikes: guide.hasDisliked ? guide.dislikes - 1 : guide.dislikes
          };
        }
        return guide;
      }));
    } catch (error) {
      console.error('Error liking guide:', error);
    }
  };

  const handleDislike = async (guideId) => {
    try {
      // TODO: Replace with your actual API call
      // await authAPI.dislikeGuide(guideId);

      setGuides(prevGuides => prevGuides.map(guide => {
        if (guide.id === guideId) {
          if (guide.hasDisliked) {
            return { ...guide, hasDisliked: false, dislikes: guide.dislikes - 1 };
          }
          return { 
            ...guide, 
            hasDisliked: true, 
            dislikes: guide.dislikes + 1,
            hasLiked: false,
            likes: guide.hasLiked ? guide.likes - 1 : guide.likes
          };
        }
        return guide;
      }));
    } catch (error) {
      console.error('Error disliking guide:', error);
    }
  };

  const handleDeleteGuide = async (guideId) => {
    Alert.alert(
      'Delete Guide',
      'Are you sure you want to delete this guide?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              
              // Call the delete API
              const response = await guidesAPI.deleteGuide(guideId);
              
              // Update local state
              setGuides(prevGuides => 
                prevGuides.filter(guide => guide._id !== guideId)
              );

              // Show success message
              Alert.alert('Success', 'Guide deleted successfully');
            } catch (error) {
              console.error('Delete guide error:', error);
              Alert.alert(
                'Error',
                typeof error === 'string' ? error : 'Failed to delete guide'
              );
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleFollowersPress = async () => {
    setFollowModalType('followers');
    setFollowModalVisible(true);
    setFollowModalLoading(true);
    try {
      const followers = await profileAPI.getFollowers(user.id);
      setFollowModalData(followers);
    } catch (error) {
      console.error('Error fetching followers:', error);
      // Handle error appropriately
    } finally {
      setFollowModalLoading(false);
    }
  };

  const handleFollowingPress = async () => {
    setFollowModalType('following');
    setFollowModalVisible(true);
    setFollowModalLoading(true);
    try {
      const following = await profileAPI.getFollowing(user.id);
      setFollowModalData(following);
    } catch (error) {
      console.error('Error fetching following:', error);
      // Handle error appropriately
    } finally {
      setFollowModalLoading(false);
    }
  };

  const handleUserPress = (selectedUserId) => {
    if (selectedUserId === user.id) {
      navigation.navigate('Profile');
    } else {
      navigation.navigate('UserProfile', { userId: selectedUserId });
    }
  };

  const renderPostsContent = () => {
    if (posts.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="images-outline" size={48} color="rgba(255,255,255,0.5)" />
          <Text style={styles.emptyText}>No posts yet</Text>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => navigation.navigate('CreatePost')}
          >
            <Text style={styles.createButtonText}>Create Your First Post</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.postsContainer}>
        <FlatList
          data={posts}
          renderItem={({ item }) => <PostCard post={item} />}
          keyExtractor={item => item._id}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          nestedScrollEnabled={true}
          contentContainerStyle={styles.postsContent}
        />
      </View>
    );
  };

  const searchLocations = async (query) => {
    if (!query || query.length < 3) {
      setLocationSuggestions([]);
      return;
    }

    try {
      setIsSearching(true);
      
      // Use Expo's geocoding API to search for locations
      const results = await Location.geocodeAsync(query);
      
      if (results.length > 0) {
        // Reverse geocode to get detailed address
        const addressPromises = results.slice(0, 5).map(result => 
          Location.reverseGeocodeAsync({
            latitude: result.latitude,
            longitude: result.longitude
          })
        );
        
        const addressResults = await Promise.all(addressPromises);
        
        // Format suggestions
        const suggestions = addressResults.map((addresses, index) => {
          const address = addresses[0];
          let locationName = '';
          
          // Build location name with available components
          if (address.district) locationName += address.district;
          
          if (address.city && (!locationName || address.city !== address.district)) {
            if (locationName) locationName += ', ';
            locationName += address.city;
          }
          
          if (address.region && (!locationName || address.region !== address.city)) {
            if (locationName) locationName += ', ';
            locationName += address.region;
          }
          
          if (address.country) {
            if (locationName) locationName += ', ';
            locationName += address.country;
          }
          
          // Fallback if we couldn't build a proper name
          if (!locationName) {
            locationName = `${address.region || ''}, ${address.country || 'Unknown Location'}`;
          }
          
          return {
            id: index.toString(),
            name: locationName,
            latitude: results[index].latitude,
            longitude: results[index].longitude
          };
        });
        
        // Filter out duplicates
        const uniqueSuggestions = suggestions.filter((suggestion, index, self) => 
          index === self.findIndex((s) => s.name === suggestion.name)
        );
        
        setLocationSuggestions(uniqueSuggestions);
      } else {
        // If no results are found, allow for manual entry
        setLocationSuggestions([]);
      }
    } catch (error) {
      console.log('Location search error:', error);
      setLocationSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectLocation = (location) => {
    setLocationInput(location.name);
    setLocationSearchQuery('');
    setLocationSuggestions([]);
    setIsLocationSearchVisible(false);
    
    // Set the coordinates for the selected location
    if (location.latitude && location.longitude) {
      setCurrentLocation({
        latitude: location.latitude,
        longitude: location.longitude
      });
    }
  };

  const addManualLocation = () => {
    if (locationSearchQuery.trim()) {
      setLocationInput(locationSearchQuery.trim());
      setLocationSearchQuery('');
      setLocationSuggestions([]);
      setIsLocationSearchVisible(false);
      // Clear coordinates for manual entry
      setCurrentLocation(null);
    }
  };

  const renderGuideContent = () => {
    if (isCreatingGuide) {
      return (
        <View style={styles.createGuideForm}>
          <View style={styles.inputGroup}>
            <View style={styles.locationRow}>
              <TouchableOpacity 
                style={styles.locationInputContainer}
                onPress={() => setIsLocationSearchVisible(true)}
              >
                <Ionicons 
                  name={currentLocation ? "location" : "location-outline"} 
                  size={20} 
                  color={currentLocation ? "#FF6B6B" : "#ffffff"} 
                  style={styles.locationIcon} 
                />
                <Text style={locationInput ? styles.locationInput : styles.locationInputPlaceholder}>
                  {locationInput || "Add location..."}
                </Text>
                {currentLocation && (
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" style={{marginLeft: 6}} />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.currentLocationButton}
                onPress={getCurrentLocation}
                disabled={isSearching}
              >
                {isSearching ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Ionicons name="locate" size={24} color="#FF6B6B" />
                )}
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.locationNoteInput}
              placeholder="Add a note about this location..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={locationNoteInput}
              onChangeText={setLocationNoteInput}
            />
          </View>

          <TouchableOpacity 
            style={[
              styles.submitButton,
              !locationInput.trim() && styles.submitButtonDisabled
            ]}
            onPress={handleSubmitGuide}
            disabled={!locationInput.trim()}
          >
            <Text style={styles.submitButtonText}>Share Guide</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.guidesContainer}>
        {guides.length === 0 ? (
          <View style={styles.noPostsContainer}>
            <Ionicons name="book-outline" size={50} color="rgba(255,255,255,0.5)" />
            <Text style={styles.noPostsText}>No guides yet</Text>
            <Text style={styles.noPostsSubText}>Share your travel tips and recommendations!</Text>
          </View>
        ) : (
          <FlatList
            data={guides}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <GuideCard
                guide={item}
                onLike={handleLike}
                onDislike={handleDislike}
                onDelete={handleDeleteGuide}
                isOwner={true}
              />
            )}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
            nestedScrollEnabled={true}
          />
        )}
        
        <TouchableOpacity 
          style={styles.floatingCreateButton}
          onPress={() => setIsCreatingGuide(true)}
        >
          <Ionicons name="pencil" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderContent = () => {
    if (activeTab === 'posts') {
      return renderPostsContent();
    } else {
      return renderGuideContent();
    }
  };

  // Get the user data either from the profile response or the auth context
  const userData = profileData?.user || user;

  // Get current location using device GPS
  const getCurrentLocation = async () => {
    try {
      setIsSearching(true);
      
      // Request permission to access location
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied');
        setIsSearching(false);
        return;
      }

      // Get current location coordinates
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Reverse geocode to get address information
      const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
      
      // Build location name from address components
      let locationName = '';
      if (address.city) locationName += address.city;
      if (address.region && (!locationName || address.region !== address.city)) {
        if (locationName) locationName += ', ';
        locationName += address.region;
      }
      if (address.country) {
        if (locationName) locationName += ', ';
        locationName += address.country;
      }
      
      // Set location info
      setLocationInput(locationName);
      setCurrentLocation({ latitude, longitude });
      setIsLocationSearchVisible(false);
      
    } catch (error) {
      console.log('Error getting current location:', error);
      Alert.alert('Location Error', 'Could not fetch your current location');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#232526', '#414345', '#232526']}
        style={styles.container}
      >
        <ScrollView 
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#ffffff"
            />
          }
          nestedScrollEnabled={true}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{userData?.fullName || 'Profile'}</Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('EditProfile', {
                currentProfile: {
                  fullName: userData?.fullName || '',
                  username: userData?.username || '',
                  bio: profileData?.bio || '',
                  location: profileData?.location || '',
                  profileImage: userData?.profileImage || null,
                  socialLinks: profileData?.socialLinks || {}
                }
              })}
              style={styles.editButton}
            >
              <Ionicons name="pencil" size={20} color="#ffffff" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Profile Info */}
          <View style={styles.profileInfo}>
            <Image 
              source={{ uri: userData?.profileImage }}
              style={styles.profileImage}
            />
            <Text style={styles.name}>{userData?.fullName}</Text>
            <Text style={styles.username}>@{userData?.username}</Text>
            
            {profileData?.bio && (
              <Text style={styles.bio}>{profileData.bio}</Text>
            )}
            
            {profileData?.location && (
              <View style={styles.locationContainer}>
                <Ionicons name="location" size={16} color="#FF6B6B" />
                <Text style={styles.location}>{profileData.location}</Text>
              </View>
            )}

            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {profileData?.stats?.totalPosts || 0}
                </Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <TouchableOpacity 
                style={styles.statItem}
                onPress={handleFollowersPress}
              >
                <Text style={styles.statNumber}>
                  {profileData?.followers?.length || 0}
                </Text>
                <Text style={styles.statLabel}>Followers</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.statItem}
                onPress={handleFollowingPress}
              >
                <Text style={styles.statNumber}>
                  {profileData?.following?.length || 0}
                </Text>
                <Text style={styles.statLabel}>Following</Text>
              </TouchableOpacity>
            </View>

            {/* Social Links */}
            {profileData?.socialLinks && Object.keys(profileData.socialLinks).length > 0 && (
              <View style={styles.socialLinks}>
                {profileData.socialLinks.instagram && (
                  <TouchableOpacity style={styles.socialButton}>
                    <Ionicons name="logo-instagram" size={24} color="#ffffff" />
                  </TouchableOpacity>
                )}
                {profileData.socialLinks.twitter && (
                  <TouchableOpacity style={styles.socialButton}>
                    <Ionicons name="logo-twitter" size={24} color="#ffffff" />
                  </TouchableOpacity>
                )}
                {profileData.socialLinks.facebook && (
                  <TouchableOpacity style={styles.socialButton}>
                    <Ionicons name="logo-facebook" size={24} color="#ffffff" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Modified Content Tabs section with just Posts and Guides */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
              onPress={() => setActiveTab('posts')}
            >
              <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
                Posts
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.tab, activeTab === 'guides' && styles.activeTab]}
              onPress={() => setActiveTab('guides')}
            >
              <Text style={[styles.tabText, activeTab === 'guides' && styles.activeTabText]}>
                Guides
              </Text>
            </TouchableOpacity>
          </View>

          {/* Posts Grid */}
          {renderContent()}
        </ScrollView>
      </LinearGradient>

      <FollowModal
        visible={followModalVisible}
        onClose={() => setFollowModalVisible(false)}
        data={followModalData}
        type={followModalType}
        loading={followModalLoading}
        onUserPress={handleUserPress}
      />

      {/* Location Search Modal */}
      <Modal
        visible={isLocationSearchVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsLocationSearchVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                onPress={() => setIsLocationSearchVisible(false)}
                style={styles.modalBackButton}
              >
                <Ionicons name="arrow-back" size={24} color="#ffffff" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Search Location</Text>
              <View style={{ width: 24 }} />
            </View>
            
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="rgba(255,255,255,0.7)" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for a location..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={locationSearchQuery}
                onChangeText={(text) => {
                  setLocationSearchQuery(text);
                  searchLocations(text);
                }}
                autoFocus
              />
              {locationSearchQuery ? (
                <TouchableOpacity onPress={() => {
                  setLocationSearchQuery('');
                  setLocationSuggestions([]);
                }}>
                  <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
              ) : null}
            </View>
            
            {isSearching ? (
              <ActivityIndicator size="small" color="#ffffff" style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={locationSuggestions}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.suggestionItem}
                    onPress={() => selectLocation(item)}
                  >
                    <Ionicons name="location" size={20} color="#FF6B6B" />
                    <Text style={styles.suggestionText}>{item.name}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  locationSearchQuery.length > 0 ? (
                    <View style={styles.noResultsContainer}>
                      <Text style={styles.noResultsText}>
                        {locationSearchQuery.length < 3 
                          ? 'Please enter at least 3 characters to search'
                          : 'No locations found. Try a different search term.'}
                      </Text>
                      {locationSearchQuery.length >= 3 && (
                        <TouchableOpacity 
                          style={styles.manualEntryButton}
                          onPress={addManualLocation}
                        >
                          <Text style={styles.manualEntryText}>
                            Use "{locationSearchQuery}" anyway
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ) : null
                }
                style={{ maxHeight: 300 }}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#232526',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#232526',
    padding: 20,
  },
  errorText: {
    color: '#ff4444',
    textAlign: 'center',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  editButtonText: {
    color: '#ffffff',
    marginLeft: 4,
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  profileInfo: {
    alignItems: 'center',
    padding: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  name: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  username: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    marginBottom: 12,
  },
  bio: {
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 32,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  location: {
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  statsText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 4,
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
  },
  socialButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  tabText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  activeTab: {
    borderTopWidth: 2,
    borderTopColor: '#ffffff',
  },
  activeTabText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  postsContainer: {
    flex: 1,
    width: '100%',
  },
  postsContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    marginTop: 12,
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#414345',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  guidesContainer: {
    padding: 16,
  },
  noPostsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  noPostsText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  noPostsSubText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  createGuideForm: {
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    margin: 16,
  },
  inputGroup: {
    gap: 12,
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locationInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
  },
  locationIcon: {
    marginRight: 8,
  },
  locationInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    padding: 12,
  },
  locationNoteInput: {
    color: '#ffffff',
    fontSize: 16,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: '#FF6B6B',
    padding: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  floatingCreateButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1DA1F2', // Twitter blue color
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  locationInputPlaceholder: {
    flex: 1,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    padding: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#232526',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalBackButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 10,
    marginRight: 10,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  suggestionText: {
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 10,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noResultsText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
  },
  manualEntryButton: {
    padding: 12,
    backgroundColor: 'rgba(255,107,107,0.2)',
    borderRadius: 10,
    alignItems: 'center',
  },
  manualEntryText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
  },
  currentLocationButton: {
    width: 46,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
}); 