import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
  Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useAuth } from '../../context/AuthContext';
import { postsAPI } from '../../services/api/';
import { showErrorAlert } from '../../utils/errorHandler';

export default function CreatePostScreen({ navigation, route }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [description, setDescription] = useState('');
  const [travelTips, setTravelTips] = useState(['']);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  
  // Track if we're editing an existing post
  const [isEditMode, setIsEditMode] = useState(false);
  const [postId, setPostId] = useState(null);

  // Check if we're in edit mode and load post data
  useEffect(() => {
    if (route.params?.post) {
      const post = route.params.post;
      setIsEditMode(true);
      setPostId(post._id);
      
      // Load existing post data
      if (post.image) setImage(post.image);
      if (post.description) setDescription(post.description);
      if (post.location) {
        setLocationName(post.location.name);
        setCurrentLocation(post.location.coordinates);
      }
      if (post.weather) setWeatherData(post.weather);
      
      // Load travel tips or initialize with one empty tip
      if (post.travelTips && post.travelTips.length > 0) {
        setTravelTips(post.travelTips);
      }
    }
  }, [route.params]);

  // Pick image from library
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        // Create the data URL from base64
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setImage(base64Image);
      }
    } catch (error) {
      console.error('Image picking error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Get current location
  const getCurrentLocation = async () => {
    setIsLocationLoading(true);
    try {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied');
        setIsLocationLoading(false);
        return;
      }

      // Get location
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Reverse geocode to get address
      const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
      
      const locationString = `${address.city || address.region}, ${address.country}`;
      
      // Update state
      setCurrentLocation({ latitude, longitude });
      setLocationName(locationString);
      
      // Get weather data for current location
      await fetchWeatherForLocation(latitude, longitude, locationString);
    } catch (error) {
      console.log('Location error:', error);
      Alert.alert('Location Error', 'Could not fetch location data');
    } finally {
      setIsLocationLoading(false);
    }
  };

  // Search locations
  const searchLocations = async (query) => {
    if (!query || query.length < 3) {
      setLocationSuggestions([]);
      return;
    }

    try {
      setIsLocationLoading(true);
      // Use forward geocoding to search for locations
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
        
        // Format suggestions with more detailed location information
        const suggestions = addressResults.map((addresses, index) => {
          const address = addresses[0];
          // Build a more complete location name
          let locationName = '';
          
          // Add district/neighborhood if available (for specific locations like Oia)
          if (address.district || address.subregion) {
            locationName += address.district || address.subregion;
          }
          
          // Add city if available and different from district
          if (address.city && address.city !== address.district && address.city !== address.subregion) {
            if (locationName) locationName += ', ';
            locationName += address.city;
          } else if (address.region && (!locationName || (address.region !== address.district && address.region !== address.subregion))) {
            // If no city, use region (e.g., state/province)
            if (locationName) locationName += ', ';
            locationName += address.region;
          }
          
          // Add country
          if (address.country) {
            if (locationName) locationName += ', ';
            locationName += address.country;
          }
          
          // Fallback if we couldn't build a detailed name
          if (!locationName) {
            locationName = `${address.region || address.subregion || ''}, ${address.country || 'Unknown Location'}`;
          }
          
          return {
            id: index.toString(),
            name: locationName,
            originalQuery: query, // Store the original query in case we need it
            latitude: results[index].latitude,
            longitude: results[index].longitude
          };
        });
        
        // Improve the filter to detect and prioritize exact matches
        const uniqueSuggestions = suggestions.filter((suggestion, index, self) => {
          // First remove exact duplicates
          const isDuplicate = index !== self.findIndex((s) => s.name === suggestion.name);
          if (isDuplicate) return false;
          
          // Check if this suggestion is already well-represented
          const lowercaseName = suggestion.name.toLowerCase();
          const queryParts = query.toLowerCase().split(',').map(part => part.trim());
          
          // If the query exactly matches a part of the suggestion, prioritize it
          if (queryParts.some(part => lowercaseName.includes(part))) {
            return true;
          }
          
          // Otherwise include it anyway if we don't have many results
          return self.length < 5;
        });
        
        setLocationSuggestions(uniqueSuggestions);
      } else {
        // If Expo's geocoding fails, try with our manual entry
        if (query.includes(',')) {
          const parts = query.split(',').map(part => part.trim());
          if (parts.length >= 2) {
            // Create a manual entry
            setLocationSuggestions([{
              id: 'manual',
              name: query,
              originalQuery: query,
              latitude: 0, // We don't have real coordinates
              longitude: 0,
              isManualEntry: true
            }]);
          } else {
            setLocationSuggestions([]);
          }
        } else {
          setLocationSuggestions([]);
        }
      }
    } catch (error) {
      console.log('Location search error:', error);
      // Add fallback for manual entry
      if (query.includes(',')) {
        setLocationSuggestions([{
          id: 'manual',
          name: query,
          originalQuery: query,
          latitude: 0,
          longitude: 0,
          isManualEntry: true
        }]);
      } else {
        setLocationSuggestions([]);
      }
    } finally {
      setIsLocationLoading(false);
    }
  };

  // Fetch weather data
  const fetchWeatherForLocation = async (latitude, longitude, locationNameStr) => {
    setIsWeatherLoading(true);
    try {
      // In a real app, you'd use a weather API like OpenWeatherMap
      // For now, we'll use a mock response
      const weatherResponse = {
        temp: Math.floor(Math.random() * 15) + 15, // Random temp between 15-30°C
        description: ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'][Math.floor(Math.random() * 4)],
        icon: ['sunny', 'cloudy', 'rainy', 'partly-sunny'][Math.floor(Math.random() * 4)]
      };
      
      setWeatherData(weatherResponse);
      
      // Update state with location and weather
      setCurrentLocation({ latitude, longitude });
      setLocationName(locationNameStr);
    } catch (error) {
      console.log('Weather fetch error:', error);
    } finally {
      setIsWeatherLoading(false);
    }
  };

  // Select location from suggestions
  const selectLocation = async (location) => {
    try {
      if (location.isManualEntry) {
        // For manual entries, we don't have real coordinates, but we can still use the name
        const mockWeather = {
          temp: Math.floor(Math.random() * 15) + 15,
          description: ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'][Math.floor(Math.random() * 4)],
          icon: ['sunny', 'cloudy', 'rainy', 'partly-sunny'][Math.floor(Math.random() * 4)]
        };
        
        setWeatherData(mockWeather);
        setLocationName(location.name);
        setCurrentLocation({ latitude: 0, longitude: 0 });
      } else {
        // For geocoded locations, use the coordinates to get weather
        await fetchWeatherForLocation(location.latitude, location.longitude, location.name);
      }
      setShowLocationModal(false);
      setLocationQuery('');
      setLocationSuggestions([]);
    } catch (error) {
      console.log('Error selecting location:', error);
      Alert.alert('Error', 'Failed to select location. Please try again.');
    }
  };

  // Open location modal
  const openLocationModal = () => {
    setLocationQuery('');
    setLocationSuggestions([]);
    setShowLocationModal(true);
  };

  // Add travel tip
  const addTravelTip = () => {
    setTravelTips(prev => [...prev, '']);
  };

  // Update travel tip
  const updateTravelTip = (index, value) => {
    const updatedTips = [...travelTips];
    updatedTips[index] = value;
    setTravelTips(updatedTips);
  };

  // Remove travel tip
  const removeTravelTip = (index) => {
    if (travelTips.length === 1) {
      // Keep at least one tip field
      setTravelTips(['']);
    } else {
      const updatedTips = travelTips.filter((_, i) => i !== index);
      setTravelTips(updatedTips);
    }
  };

  // Submit post - handle both create and update
  const handleSubmit = async () => {
    if (!image) {
      Alert.alert('Error', 'Please select an image');
      return;
    }

    try {
      setIsLoading(true);
      console.log(`Starting post ${isEditMode ? 'update' : 'creation'}...`);

      const postData = {
        image: image,
        description: description.trim(),
        location: currentLocation ? {
          name: locationName || 'Unknown Location',
          coordinates: {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude
          }
        } : {
          name: 'Unknown Location',
          coordinates: {
            latitude: 0,
            longitude: 0
          }
        },
        weather: weatherData || {
          temp: 0,
          description: 'Unknown',
          icon: 'unknown'
        },
        travelTips: travelTips.filter(tip => tip.trim() !== '')
      };

      let response;
      if (isEditMode) {
        console.log('Updating existing post:', postId);
        response = await postsAPI.updatePost(postId, postData);
        console.log('Post updated successfully:', response);
      } else {
        console.log('Creating new post');
        response = await postsAPI.createPost(postData);
        console.log('Post created successfully:', response);
      }

      // No need for an alert, just reset navigation directly
      navigation.reset({
        index: 1,
        routes: [
          { name: 'CreatorHome' }, // Reset to creator home screen first
          { 
            name: 'Profile', 
            params: { refresh: true } // Add refresh param to ensure profile data is updated
          }
        ],
      });
    } catch (error) {
      console.error(`Post ${isEditMode ? 'update' : 'creation'} error details:`, {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      Alert.alert(
        'Error',
        `Failed to ${isEditMode ? 'update' : 'create'} post. Please try again.`,
        [
          {
            text: 'OK',
            // Don't navigate on error, just stay on the current screen
          }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#232526', '#414345']}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.headerButton}
          >
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditMode ? 'Edit Post' : 'Create Post'}
          </Text>
          <TouchableOpacity 
            style={[styles.headerButton, isLoading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.shareText}>
                {isEditMode ? 'Save' : 'Share'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Image Picker */}
          <TouchableOpacity 
            style={styles.imageContainer} 
            onPress={pickImage}
          >
            {image ? (
              <Image 
                source={{ uri: image }} 
                style={styles.selectedImage} 
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={40} color="#ffffff" />
                <Text style={styles.imagePlaceholderText}>Tap to add photo</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Location Picker */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.locationContainer}>
              <TouchableOpacity 
                style={styles.locationInput}
                onPress={openLocationModal}
                disabled={isLocationLoading}
              >
                {locationName ? (
                  <Text style={styles.locationText}>{locationName}</Text>
                ) : (
                  <Text style={styles.locationPlaceholder}>Add or search for a location</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.locationButton}
                onPress={getCurrentLocation}
                disabled={isLocationLoading}
              >
                {isLocationLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Ionicons name="location-outline" size={24} color="#FF6B6B" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Weather Info (shown if available) */}
          {weatherData && (
            <View style={styles.weatherContainer}>
              {isWeatherLoading ? (
                <ActivityIndicator color="#ffffff" size="small" style={{marginRight: 10}} />
              ) : (
                <Ionicons name={weatherData.icon || "partly-sunny"} size={24} color="#FFD93D" />
              )}
              <Text style={styles.weatherText}>
                {weatherData.temp}°C, {weatherData.description}
              </Text>
            </View>
          )}

          {/* Description */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Description</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Write a caption..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              multiline
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* Travel Tips */}
          <View style={styles.sectionContainer}>
            <View style={styles.tipsHeader}>
              <Text style={styles.sectionTitle}>Travel Tips</Text>
              <TouchableOpacity onPress={addTravelTip}>
                <Ionicons name="add-circle-outline" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            
            {travelTips.map((tip, index) => (
              <View key={index} style={styles.tipInputContainer}>
                <TextInput
                  style={styles.tipInput}
                  placeholder="Add a travel tip..."
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={tip}
                  onChangeText={(text) => updateTravelTip(index, text)}
                />
                <TouchableOpacity onPress={() => removeTravelTip(index)}>
                  <Ionicons name="close-circle-outline" size={24} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Location Search Modal */}
        <Modal
          visible={showLocationModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowLocationModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity 
                  onPress={() => setShowLocationModal(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="arrow-back" size={24} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Search Location</Text>
                <View style={styles.placeholder} />
              </View>

              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="rgba(255,255,255,0.7)" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search for a location (e.g., Oia, Santorini, Greece)"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={locationQuery}
                  onChangeText={(text) => {
                    setLocationQuery(text);
                    searchLocations(text);
                  }}
                  autoFocus
                />
                {locationQuery ? (
                  <TouchableOpacity 
                    onPress={() => {
                      setLocationQuery('');
                      setLocationSuggestions([]);
                    }}
                  >
                    <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.7)" />
                  </TouchableOpacity>
                ) : null}
              </View>

              {isLocationLoading ? (
                <ActivityIndicator color="#ffffff" style={styles.loadingIndicator} />
              ) : (
                <FlatList
                  data={locationSuggestions}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={styles.suggestionItem}
                      onPress={() => selectLocation(item)}
                    >
                      <Ionicons 
                        name={item.isManualEntry ? "create-outline" : "location"} 
                        size={20} 
                        color="#FF6B6B" 
                      />
                      <Text style={styles.suggestionText}>{item.name}</Text>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    locationQuery.length > 0 ? (
                      <View style={styles.noResultsContainer}>
                        <Text style={styles.noResultsText}>
                          {locationQuery.length < 3 
                            ? 'Please enter at least 3 characters to search'
                            : 'No locations found. Try a different search term.'}
                        </Text>
                        {locationQuery.length >= 3 && (
                          <TouchableOpacity 
                            style={styles.manualEntryButton}
                            onPress={() => {
                              const manualEntry = {
                                id: 'manual',
                                name: locationQuery,
                                originalQuery: locationQuery,
                                latitude: 0,
                                longitude: 0,
                                isManualEntry: true
                              };
                              selectLocation(manualEntry);
                            }}
                          >
                            <Text style={styles.manualEntryText}>Use "{locationQuery}" anyway</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ) : null
                  }
                />
              )}
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#232526',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerButton: {
    padding: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  shareText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: '#ffffff',
    marginTop: 10,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 10,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 15,
    marginRight: 10,
  },
  locationText: {
    color: '#ffffff',
    fontSize: 16,
  },
  locationPlaceholder: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
  },
  locationButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weatherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  weatherText: {
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 10,
  },
  descriptionInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 15,
    color: '#ffffff',
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  tipsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tipInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tipInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 15,
    color: '#ffffff',
    fontSize: 16,
    marginRight: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#232526',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 10,
    marginRight: 10,
  },
  loadingIndicator: {
    marginTop: 20,
    alignSelf: 'center',
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
    marginTop: 30,
    padding: 20,
  },
  noResultsText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  manualEntryButton: {
    padding: 12,
    backgroundColor: 'rgba(255,107,107,0.2)',
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  manualEntryText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
  },
}); 