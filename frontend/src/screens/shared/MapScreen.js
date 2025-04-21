import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Text,
  Keyboard,
  Alert,
  Image,
  Animated,
  PanResponder
} from 'react-native';
import MapView, { Marker, Polyline, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../context/AuthContext';
import { postsAPI, guidesAPI } from '../../services/api';
import * as Location from 'expo-location';
import Slider from '@react-native-community/slider';

const { width, height } = Dimensions.get('window');
const BOTTOM_SHEET_MAX_HEIGHT = height * 0.6;
const BOTTOM_SHEET_MIN_HEIGHT = 120;
const BOTTOM_SHEET_INITIAL_HEIGHT = height * 0.25;

// Dark map style to match app theme
const darkMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#212121"
      }
    ]
  },
  {
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#212121"
      }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "administrative.country",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  },
  {
    "featureType": "administrative.land_parcel",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#bdbdbd"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#181818"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#1b1b1b"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#2c2c2c"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#8a8a8a"
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#373737"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#3c3c3c"
      }
    ]
  },
  {
    "featureType": "road.highway.controlled_access",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#4e4e4e"
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#000000"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#3d3d3d"
      }
    ]
  }
];

export default function MapScreen({ navigation, route }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [posts, setPosts] = useState([]);
  const [guides, setGuides] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [filteredGuides, setFilteredGuides] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationPosts, setLocationPosts] = useState([]);
  const [locationGuides, setLocationGuides] = useState([]);
  const [selectedItemType, setSelectedItemType] = useState(null); // 'post' or 'guide'
  const [routeCoordinates, setRouteCoordinates] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isRoutingEnabled, setIsRoutingEnabled] = useState(false);
  const [routeDistance, setRouteDistance] = useState(null);
  const [routeDuration, setRouteDuration] = useState(null);
  const [routeDirections, setRouteDirections] = useState([]);
  const [showRouteInfo, setShowRouteInfo] = useState(false);
  const [transportMode, setTransportMode] = useState('driving'); // Options: driving, walking, cycling
  const [showTransportOptions, setShowTransportOptions] = useState(false);
  const [showNearby, setShowNearby] = useState(false);
  const [nearbyPosts, setNearbyPosts] = useState([]);
  const [nearbyRadius, setNearbyRadius] = useState(10); // 10 km default radius
  const [isNearbyVisible, setIsNearbyVisible] = useState(false);
  const mapRef = useRef(null);
  const [region, setRegion] = useState({
    latitude: 20,
    longitude: 0,
    latitudeDelta: 100,
    longitudeDelta: 100,
  });
  
  const bottomSheetAnimation = useRef(new Animated.Value(0.5)).current;
  const [bottomSheetExpanded, setBottomSheetExpanded] = useState(false);
  const lastGestureDy = useRef(0);
  
  const pulseAnim = useRef(new Animated.Value(0)).current;
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        lastGestureDy.current = bottomSheetAnimation.__getValue();
        bottomSheetAnimation.setOffset(lastGestureDy.current);
        bottomSheetAnimation.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        const newValue = -gestureState.dy / (BOTTOM_SHEET_MAX_HEIGHT - BOTTOM_SHEET_MIN_HEIGHT);
        const clampedValue = Math.min(Math.max(0, newValue + lastGestureDy.current), 1);
        bottomSheetAnimation.setValue(clampedValue - lastGestureDy.current);
      },
      onPanResponderRelease: (_, gestureState) => {
        bottomSheetAnimation.flattenOffset();
        
        const currentValue = bottomSheetAnimation.__getValue();
        
        if (gestureState.vy > 0.5) {
          snapToPosition(0.5);
          setBottomSheetExpanded(false);
        } else if (gestureState.vy < -0.5) {
          snapToPosition(1);
          setBottomSheetExpanded(true);
        } else if (currentValue > 0.75) {
          snapToPosition(1);
          setBottomSheetExpanded(true);
        } else if (currentValue < 0.25) {
          snapToPosition(0);
          setBottomSheetExpanded(false);
        } else {
          snapToPosition(0.5);
          setBottomSheetExpanded(false);
        }
      }
    })
  ).current;

  useEffect(() => {
    Promise.all([fetchPosts(), fetchGuides()])
      .then(() => setLoading(false))
      .catch((error) => {
        console.error('Error loading data:', error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (route.params?.selectedLocation) {
      const { selectedLocation, initialPost, initialGuide } = route.params;
      
      setSelectedLocation(selectedLocation);
      
      if (selectedLocation.coordinates?.latitude && selectedLocation.coordinates?.longitude) {
        const newRegion = {
          latitude: selectedLocation.coordinates.latitude,
          longitude: selectedLocation.coordinates.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        
        setRegion(newRegion);
        
        setTimeout(() => {
          mapRef.current?.animateToRegion(newRegion, 1000);
        }, 500);
      }
      
      if (initialPost) {
        setLocationPosts([initialPost]);
        snapToPosition(1);
        setBottomSheetExpanded(true);
      } 
      else if (initialGuide) {
        fetchGuides().then(() => {
          const postsWithSameLocation = posts.filter(post => 
            post.location?.name?.toLowerCase() === selectedLocation.name.toLowerCase()
          );
          
          if (postsWithSameLocation.length > 0) {
            setLocationPosts(postsWithSameLocation);
          } else {
            setLocationPosts([]);
          }
          
          snapToPosition(1);
          setBottomSheetExpanded(true);
        });
      }
    }
  }, [route.params, posts]);

  useEffect(() => {
    if (posts.length > 0 && !selectedLocation) {
      setLocationPosts(posts.slice(0, 10));
    }
  }, [posts]);

  useEffect(() => {
    const getUserLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission to access location was denied');
          return;
        }
        
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {
        console.error('Error getting location:', error);
      }
    };
    
    getUserLocation();
  }, []);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    );
    
    pulse.start();
    
    return () => {
      pulse.stop();
    };
  }, [pulseAnim]);

  const snapToPosition = (position) => {
    Animated.spring(bottomSheetAnimation, {
      toValue: position,
      useNativeDriver: false,
      bounciness: 4,
      speed: 12
    }).start();
  };

  const fetchPosts = async () => {
    try {
      const response = await postsAPI.getAllPosts();
      const postsWithLocation = response.filter(post =>
        post.location?.coordinates?.latitude &&
        post.location?.coordinates?.longitude
      );
      setPosts(postsWithLocation);
      setFilteredPosts(postsWithLocation);
      return postsWithLocation;
    } catch (error) {
      console.error('Error fetching posts for map:', error);
      Alert.alert(
        'Error',
        'Failed to load posts. Please try again.',
        [{ text: 'OK' }]
      );
      return [];
    }
  };

  const fetchGuides = async () => {
    try {
      const response = await guidesAPI.getAllGuides();
      const guidesWithLocation = response.filter(guide =>
        guide.location && guide.coordinates?.latitude && guide.coordinates?.longitude
      );
      setGuides(guidesWithLocation);
      setFilteredGuides(guidesWithLocation);
      return guidesWithLocation;
    } catch (error) {
      console.error('Error fetching guides for map:', error);
      Alert.alert(
        'Error',
        'Failed to load guides. Please try again.'
      );
      return [];
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleSearch = () => {
    if (searchQuery.trim() === '') {
      setFilteredPosts(posts);
      setFilteredGuides(guides);
      return;
    }
    
    setIsSearching(true);
    try {
      const searchResults = posts.filter(post => 
        post.location?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      const guideResults = guides.filter(guide => 
        guide.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      setFilteredPosts(searchResults);
      setFilteredGuides(guideResults);
      
      if (searchResults.length > 0) {
        const firstResult = searchResults[0];
        mapRef.current?.animateToRegion({
          latitude: firstResult.location.coordinates.latitude,
          longitude: firstResult.location.coordinates.longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }, 1000);
      } else if (guideResults.length > 0) {
        const firstGuide = guideResults[0];
        mapRef.current?.animateToRegion({
          latitude: firstGuide.coordinates.latitude,
          longitude: firstGuide.coordinates.longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }, 1000);
      }
      
      if (searchResults.length > 0 || guideResults.length > 0) {
        setIsSearchVisible(false);
      } else {
        Alert.alert(
          'No Results',
          `No locations found matching "${searchQuery}"`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error searching locations:', error);
      Alert.alert(
        'Search Error',
        'Failed to search locations. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSearching(false);
      Keyboard.dismiss();
    }
  };

  const handleLocationSelect = (post) => {
    setFilteredPosts([post]);
    
    mapRef.current?.animateToRegion({
      latitude: post.location.coordinates.latitude,
      longitude: post.location.coordinates.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    }, 1000);
    
    setIsSearchVisible(false);
    Keyboard.dismiss();
  };

  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible);
    if (!isSearchVisible) {
      setSearchQuery('');
    } else {
      setFilteredPosts(posts);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setFilteredPosts(posts);
  };

  const handleMarkerPress = (item, type) => {
    setSelectedLocation({
      ...item,
      type: type
    });
    
    if (type === 'post') {
      setLocationPosts([item]);
      setLocationGuides([]);
    } else {
      setLocationPosts([]);
      setLocationGuides([item]);
    }
    
    setSelectedItemType(type);
    
    const coordinates = type === 'post' 
      ? item.location.coordinates 
      : item.coordinates;
      
    mapRef.current?.animateToRegion({
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    }, 1000);
    
    setBottomSheetExpanded(true);
    
    if (!isRoutingEnabled) {
      setRouteCoordinates(null);
      setRouteDistance(null);
      setRouteDuration(null);
      setRouteDirections([]);
    } else if (userLocation) {
      getRoute(userLocation, coordinates);
    }
  };

  const expandBottomSheet = useCallback(() => {
    setBottomSheetExpanded(true);
    snapToPosition(1);
  }, []);

  const collapseBottomSheet = useCallback(() => {
    setBottomSheetExpanded(false);
    snapToPosition(0.5);
    
    if (selectedLocation) {
      setSelectedLocation(null);
      setLocationPosts(posts.slice(0, 10));
    }
  }, [posts, selectedLocation]);

  const toggleBottomSheet = useCallback(() => {
    if (bottomSheetExpanded) {
      collapseBottomSheet();
    } else {
      expandBottomSheet();
    }
  }, [bottomSheetExpanded, collapseBottomSheet, expandBottomSheet]);

  const bottomSheetHeight = bottomSheetAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, BOTTOM_SHEET_INITIAL_HEIGHT, BOTTOM_SHEET_MAX_HEIGHT],
  });

  const indicatorRotation = bottomSheetAnimation.interpolate({
    inputRange: [0.5, 1],
    outputRange: ['0deg', '180deg'],
    extrapolate: 'clamp',
  });

  const pulseSize = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [24, 32],
  });
  
  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 0],
  });

  const renderSearchItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.searchResultItem}
      onPress={() => handleLocationSelect(item)}
    >
      <View style={styles.searchResultContent}>
        <Ionicons name="location" size={20} color="#4a90e2" />
        <View style={styles.searchResultTextContainer}>
          <Text style={styles.searchResultText}>{item.location.name}</Text>
          <Text style={styles.searchResultSubtext}>
            Posted by {item.userId.username || 'Unknown'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderLocationPost = ({ item }) => (
    <TouchableOpacity 
      style={styles.locationPostItem}
      onPress={() => navigation.navigate('UserProfile', { userId: item.userId._id })}
    >
      {item.images && item.images.length > 0 && (
        <Image 
          source={{ uri: item.images[0] }} 
          style={styles.postImage}
          resizeMode="cover"
        />
      )}
      <View style={styles.postContent}>
        <Text style={styles.postTitle} numberOfLines={1}>
          {item.title || 'Travel Post'}
        </Text>
        <Text style={styles.postDescription} numberOfLines={2}>
          {item.description || 'No description available'}
        </Text>
        <View style={styles.postFooter}>
          <View style={styles.userInfo}>
            {item.userId.profileImage ? (
              <Image 
                source={{ uri: item.userId.profileImage }} 
                style={styles.userAvatar}
              />
            ) : (
              <View style={[styles.userAvatar, styles.defaultAvatar]}>
                <Text style={styles.avatarText}>
                  {item.userId.username ? item.userId.username.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            )}
            <Text style={styles.username}>{item.userId.username || 'Unknown'}</Text>
          </View>
          <View style={styles.postStats}>
            <Ionicons name="heart" size={16} color="#ff4757" />
            <Text style={styles.statsText}>{item.likes?.length || 0}</Text>
            <Ionicons name="chatbubble" size={16} color="#4a90e2" style={styles.commentIcon} />
            <Text style={styles.statsText}>{item.comments?.length || 0}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderGuideItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.guideItem}
      onPress={() => navigation.navigate('UserProfile', { userId: item.userId })}
    >
      <View style={styles.guideContent}>
        <View style={styles.guideHeader}>
          <View style={styles.guideUserInfo}>
            {item.user?.profileImage ? (
              <Image 
                source={{ uri: item.user.profileImage }} 
                style={styles.guideUserAvatar}
              />
            ) : (
              <View style={[styles.guideUserAvatar, styles.defaultAvatar]}>
                <Text style={styles.avatarText}>
                  {item.user?.username ? item.user.username.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            )}
            <Text style={styles.guideUsername}>{item.user?.username || 'Unknown'}</Text>
          </View>
          <View style={styles.guideStats}>
            <Ionicons name="thumbs-up" size={16} color="#4a90e2" />
            <Text style={styles.guideStatsText}>{item.likes || 0}</Text>
          </View>
        </View>
        
        <View style={styles.guideDetails}>
          <Text style={styles.guideLocationNote}>{item.locationNote || 'No additional notes'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const getRoute = async (origin, destination) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/${transportMode}/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson&steps=true`
      );
      
      const data = await response.json();
      
      if (data.code !== 'Ok') {
        throw new Error('Route not found');
      }
      
      const routeCoords = data.routes[0].geometry.coordinates.map(([lng, lat]) => ({
        latitude: lat,
        longitude: lng,
      }));
      
      setRouteCoordinates(routeCoords);
      setRouteDistance((data.routes[0].distance / 1000).toFixed(1));
      setRouteDuration((data.routes[0].duration / 60).toFixed(0));
      
      const steps = data.routes[0].legs[0].steps.map(step => {
        const type = step.maneuver?.type || 'continue';
        const modifier = step.maneuver?.modifier || '';
        const name = step.name || 'unnamed road';
        
        let instruction;
        if (type === 'arrive') {
          instruction = 'Arrive at destination';
        } else {
          const action = getInstructionText(type, modifier);
          instruction = name !== 'unnamed road' ? `${action} on ${name}` : action;
        }
        
        return {
          instruction: instruction,
          distance: (step.distance / 1000).toFixed(1),
        };
      });
      
      setRouteDirections(steps);
      setShowRouteInfo(true);
      
      if (mapRef.current) {
        mapRef.current.fitToCoordinates([origin, destination], {
          edgePadding: { top: 50, right: 50, bottom: 300, left: 50 },
          animated: true,
        });
      }
    } catch (error) {
      console.error('Error getting route:', error);
      Alert.alert('Error', 'Could not find a route to this destination. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getInstructionText = (type, modifier) => {
    switch (type) {
      case 'turn':
        return `Turn ${modifier}`;
      case 'new name':
        return 'Continue';
      case 'depart':
        return 'Depart';
      case 'arrive':
        return 'Arrive';
      case 'merge':
        return 'Merge';
      case 'on ramp':
        return 'Take on-ramp';
      case 'off ramp':
        return 'Take exit';
      case 'fork':
        return `Take ${modifier} fork`;
      case 'end of road':
        return `Turn ${modifier}`;
      case 'continue':
        return 'Continue';
      case 'roundabout':
        return 'Enter roundabout';
      case 'rotary':
        return 'Enter traffic circle';
      case 'roundabout turn':
        return `Take the ${modifier} at the roundabout`;
      case 'exit roundabout':
        return 'Exit roundabout';
      case 'exit rotary':
        return 'Exit traffic circle';
      case 'use lane':
        return `Use ${modifier} lane`;
      case 'uturn':
        return 'Make a U-turn';
      default:
        return 'Continue';
    }
  };

  const toggleRouting = () => {
    const newState = !isRoutingEnabled;
    setIsRoutingEnabled(newState);
    
    if (newState) {
      if (selectedLocation && userLocation) {
        const destCoords = selectedLocation.type === 'post' 
          ? selectedLocation.location.coordinates 
          : selectedLocation.coordinates;
        
        setRouteCoordinates([userLocation, destCoords]);
        
        // Fit map to show both points with better padding
        mapRef.current?.fitToCoordinates([userLocation, destCoords], {
          edgePadding: { top: 100, right: 100, bottom: 300, left: 100 },
          animated: true,
        });
      }
    } else {
      setRouteCoordinates(null);
    }
  };

  // Calculate distance between two coordinates in kilometers (haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Find nearby posts within the specified radius
  const findNearbyContent = useCallback(() => {
    if (!userLocation || posts.length === 0) return;
    
    const nearby = posts.filter(post => {
      if (!post.location?.coordinates?.latitude || !post.location?.coordinates?.longitude) {
        return false;
      }
      
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        post.location.coordinates.latitude,
        post.location.coordinates.longitude
      );
      
      // Store the distance in the post object for display
      post.distance = distance.toFixed(1);
      
      // Return posts within the radius
      return distance <= nearbyRadius;
    });
    
    // Sort by distance
    nearby.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    
    setNearbyPosts(nearby);
    
    // If there are nearby posts, show them in the bottom sheet
    if (nearby.length > 0 && isNearbyVisible) {
      setLocationPosts(nearby);
      if (!bottomSheetExpanded) {
        expandBottomSheet();
      }
    }
  }, [userLocation, posts, nearbyRadius, isNearbyVisible, bottomSheetExpanded]);

  // Toggle nearby content feature
  const toggleNearby = () => {
    const newState = !showNearby;
    setShowNearby(newState);
    setIsNearbyVisible(newState);
    
    if (newState) {
      // When enabling, find nearby content
      findNearbyContent();
      // Update bottom sheet content to show nearby items
      setSelectedLocation({ name: `Nearby Places (${nearbyRadius}km)` });
      expandBottomSheet();
    } else {
      // When disabling, if no location is selected, show default content
      if (!selectedLocation || selectedLocation.name.includes('Nearby Places')) {
        setLocationPosts(posts.slice(0, 10));
        setSelectedLocation(null);
      }
    }
  };

  // Adjust the radius for nearby content
  const adjustNearbyRadius = (newRadius) => {
    setNearbyRadius(newRadius);
    setSelectedLocation({ name: `Nearby Places (${newRadius}km)` });
    findNearbyContent();
  };

  // Add this useEffect to load content on app start
  useEffect(() => {
    const setupMap = async () => {
      try {
        setLoading(true);
        const mapPosts = await fetchPosts();
        const mapGuides = await fetchGuides();
        
        if (mapPosts.length > 0) {
          setLocationPosts(mapPosts.slice(0, 10));
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error setting up map:', error);
        setLoading(false);
      }
    };
    
    setupMap();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  const searchResults = searchQuery.trim() === '' 
    ? posts 
    : posts.filter(post => 
        post.location?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#232526', '#414345']}
        style={styles.container}
      >
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={region}
          onRegionChangeComplete={setRegion}
          customMapStyle={darkMapStyle}
        >
          {/* Show radius circle around user location when nearby is active */}
          {userLocation && showNearby && (
            <Circle
              center={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude
              }}
              radius={nearbyRadius * 1000} // convert km to meters
              strokeWidth={2}
              strokeColor="rgba(66, 133, 244, 0.8)"
              fillColor="rgba(66, 133, 244, 0.2)"
              zIndex={1}
            />
          )}

          {userLocation && (
            <Marker
              coordinate={userLocation}
              title="Your Location"
              pinColor="#4285F4"
              zIndex={1000}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.userLocationMarkerContainer}>
                <Animated.View
                  style={[
                    styles.userLocationPulse,
                    {
                      width: pulseSize,
                      height: pulseSize,
                      borderRadius: Animated.divide(pulseSize, 2),
                      opacity: pulseOpacity,
                    },
                  ]}
                />
                <View style={styles.userLocationMarker}>
                  <View style={styles.userLocationDot} />
                </View>
              </View>
            </Marker>
          )}

          {filteredPosts.map((post) => (
            <Marker
              key={`post-${post._id}`}
              coordinate={{
                latitude: post.location.coordinates.latitude,
                longitude: post.location.coordinates.longitude
              }}
              title={post.location.name}
              description={`Posted by ${post.userId.username || 'Unknown'}`}
              pinColor="#4a90e2"
              onPress={() => handleMarkerPress(post, 'post')}
            />
          ))}

          {filteredGuides.map((guide) => (
            <Marker
              key={`guide-${guide._id}`}
              coordinate={{
                latitude: guide.coordinates.latitude,
                longitude: guide.coordinates.longitude
              }}
              title={guide.location}
              description={`Guide by ${guide.username || 'Unknown'}`}
              pinColor="#FF6B6B"
              onPress={() => handleMarkerPress(guide, 'guide')}
            />
          ))}

          {routeCoordinates && (
            <Polyline
              coordinates={routeCoordinates}
              strokeWidth={6}
              strokeColor="#4285F4"
              lineCap="round"
              lineJoin="round"
            />
          )}
        </MapView>

        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <View style={styles.backButtonCircle}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </View>
        </TouchableOpacity>

        {selectedLocation && userLocation && (
          <TouchableOpacity 
            style={styles.routeButton}
            onPress={toggleRouting}
          >
            <View style={[styles.backButtonCircle, isRoutingEnabled && styles.routeButtonActive]}>
              <Ionicons name="navigate" size={24} color="#ffffff" />
            </View>
          </TouchableOpacity>
        )}

        {/* Nearby button */}
        {userLocation && (
          <TouchableOpacity 
            style={styles.nearbyButton}
            onPress={toggleNearby}
          >
            <View style={[styles.backButtonCircle, showNearby && styles.nearbyButtonActive]}>
              <Ionicons name="locate" size={24} color="#ffffff" />
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={styles.searchButton}
          onPress={toggleSearch}
        >
          <View style={styles.backButtonCircle}>
            <Ionicons name="search" size={24} color="#ffffff" />
          </View>
        </TouchableOpacity>

        {routeCoordinates && (
          <View style={styles.routeIndicator}>
            <Ionicons name="navigate" size={18} color="#ffffff" style={styles.routeIndicatorIcon} />
            <Text style={styles.routeIndicatorText}>Route to destination</Text>
          </View>
        )}

        <Animated.View 
          style={[styles.bottomSheet, { height: bottomSheetHeight }]}
        >
          <LinearGradient
            colors={['#232526', '#414345']}
            style={styles.bottomSheetContent}
          >
            <View 
              {...panResponder.panHandlers}
              style={styles.dragHandle}
            >
              <View style={styles.bottomSheetHeader}>
                <View style={styles.bottomSheetHandle} />
                <Animated.View style={{ transform: [{ rotate: indicatorRotation }] }}>
                  <Ionicons name="chevron-up" size={24} color="#ffffff" />
                </Animated.View>
              </View>
            </View>
            
            <View style={styles.locationHeader}>
              <Ionicons 
                name={showNearby ? "locate" : (selectedItemType === 'guide' ? "compass" : "location")} 
                size={24} 
                color={showNearby ? "#4285F4" : (selectedItemType === 'guide' ? "#FF6B6B" : "#4a90e2")} 
              />
              <Text style={styles.locationName}>
                {showNearby 
                  ? `Nearby Places (${nearbyRadius}km)` 
                  : (selectedLocation ? selectedLocation.name : 'Explore Travel Posts')}
              </Text>
            </View>
            
            {/* Nearby radius slider - visible only when in nearby mode */}
            {showNearby && (
              <View style={styles.radiusContainer}>
                <Text style={styles.radiusText}>Radius: {nearbyRadius} km</Text>
                <View style={styles.sliderContainer}>
                  <Text style={styles.sliderLabel}>1</Text>
                  <Slider
                    style={styles.radiusSlider}
                    minimumValue={1}
                    maximumValue={50}
                    step={1}
                    value={nearbyRadius}
                    onValueChange={adjustNearbyRadius}
                    minimumTrackTintColor="#4285F4"
                    maximumTrackTintColor="#555"
                    thumbTintColor="#4285F4"
                  />
                  <Text style={styles.sliderLabel}>50</Text>
                </View>
              </View>
            )}
            
            {/* Show nearby posts with distance info when in nearby mode */}
            {showNearby && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Nearby Places</Text>
                  <Text style={styles.sectionCount}>{nearbyPosts.length}</Text>
                </View>
                
                <FlatList
                  data={nearbyPosts}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={styles.nearbyItem}
                      onPress={() => handleMarkerPress(item, 'post')}
                    >
                      {item.image && (
                        <Image 
                          source={{ uri: item.image }} 
                          style={styles.nearbyImage}
                          resizeMode="cover"
                        />
                      )}
                      <View style={styles.nearbyContent}>
                        <Text style={styles.nearbyTitle} numberOfLines={1}>
                          {item.location.name}
                        </Text>
                        <Text style={styles.nearbyDescription} numberOfLines={2}>
                          {item.description?.substring(0, 80) || 'No description'}...
                        </Text>
                        <View style={styles.nearbyFooter}>
                          <View style={styles.nearbyDistance}>
                            <Ionicons name="navigate" size={14} color="#4285F4" />
                            <Text style={styles.distanceText}>{item.distance} km</Text>
                          </View>
                          <View style={styles.nearbyUserInfo}>
                            {item.userId?.profileImage ? (
                              <Image 
                                source={{ uri: item.userId.profileImage }} 
                                style={styles.nearbyUserAvatar}
                              />
                            ) : (
                              <View style={styles.nearbyUserAvatarDefault}>
                                <Text style={styles.avatarText}>
                                  {item.userId?.username ? item.userId.username.charAt(0).toUpperCase() : '?'}
                                </Text>
                              </View>
                            )}
                            <Text style={styles.nearbyUsername}>{item.userId?.username || 'Unknown'}</Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                  keyExtractor={(item) => `nearby-${item._id}`}
                  contentContainerStyle={styles.nearbyList}
                  showsVerticalScrollIndicator={false}
                  style={showNearby ? styles.nearbyListVisible : styles.nearbyListHidden}
                  ListEmptyComponent={
                    showNearby ? (
                      <View style={styles.emptyNearby}>
                        <Ionicons name="location-outline" size={50} color="#666" />
                        <Text style={styles.emptyNearbyText}>No places found nearby</Text>
                        <Text style={styles.emptyNearbySubtext}>Try increasing the radius</Text>
                      </View>
                    ) : null
                  }
                />
              </>
            )}
            
            {!showNearby && locationGuides.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Travel Guides</Text>
                  <Text style={styles.sectionCount}>{locationGuides.length}</Text>
                </View>
                <FlatList
                  data={locationGuides}
                  renderItem={renderGuideItem}
                  keyExtractor={(item) => `guide-${item._id}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.guidesContainer}
                />
              </>
            )}

            {!showNearby && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Posts</Text>
                  <Text style={styles.sectionCount}>{locationPosts.length}</Text>
                </View>
                
                <FlatList
                  data={locationPosts}
                  renderItem={renderLocationPost}
                  keyExtractor={(item) => `post-${item._id}`}
                  contentContainerStyle={styles.locationPostsList}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <View style={styles.emptyLocationPosts}>
                      <Ionicons name="images-outline" size={50} color="#666" />
                      <Text style={styles.emptyLocationText}>No posts at this location</Text>
                    </View>
                  }
                />
              </>
            )}
          </LinearGradient>
        </Animated.View>

        <Modal
          visible={isSearchVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsSearchVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.searchContainer}>
              <View style={styles.searchHeader}>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setIsSearchVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.searchTitle}>Find Locations</Text>
                <View style={{ width: 24 }} />
              </View>
              
              <View style={styles.searchInputContainer}>
                <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search for a location..."
                  placeholderTextColor="#999"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearch}
                  autoFocus={true}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={clearSearch}>
                    <Ionicons name="close-circle" size={20} color="#999" />
                  </TouchableOpacity>
                )}
              </View>
              
              <TouchableOpacity 
                style={styles.searchButton2}
                onPress={handleSearch}
                disabled={searchQuery.trim() === ''}
              >
                <Text style={styles.searchButtonText}>Search</Text>
              </TouchableOpacity>
              
              {isSearching ? (
                <ActivityIndicator size="large" color="#ffffff" style={styles.searchLoading} />
              ) : (
                <FlatList
                  data={searchResults}
                  renderItem={renderSearchItem}
                  keyExtractor={(item) => item._id}
                  style={styles.searchResults}
                  ListEmptyComponent={
                    searchQuery.length > 0 ? (
                      <View style={styles.emptyResultContainer}>
                        <Ionicons name="search-outline" size={50} color="#666" />
                        <Text style={styles.emptyResultText}>No locations found</Text>
                        <Text style={styles.emptyResultSubtext}>Try a different search term</Text>
                      </View>
                    ) : (
                      <View style={styles.initialSearchState}>
                        <Ionicons name="location-outline" size={50} color="#666" />
                        <Text style={styles.initialSearchText}>Search for a location</Text>
                        <Text style={styles.initialSearchSubtext}>Find posts by location name</Text>
                      </View>
                    )
                  }
                />
              )}
            </View>
          </View>
        </Modal>

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingText}>Calculating route...</Text>
          </View>
        )}
      </LinearGradient>
      <StatusBar style="light" />
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
  map: {
    width: width,
    height: height,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  searchButton: {
    position: 'absolute',
    top: 50,
    right: 10,
    zIndex: 10,
  },
  resetButton: {
    position: 'absolute',
    bottom: BOTTOM_SHEET_INITIAL_HEIGHT + 10,
    alignSelf: 'center',
    zIndex: 10,
  },
  resetButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  resetButtonText: {
    color: '#ffffff',
    marginLeft: 5,
    fontWeight: '600',
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
    zIndex: 100,
  },
  bottomSheetContent: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
  },
  dragHandle: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 10,
  },
  bottomSheetHeader: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    width: '100%',
  },
  bottomSheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    marginBottom: 10,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 5,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 10,
  },
  locationName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
    flex: 1,
  },
  postsTitle: {
    color: '#999',
    fontSize: 14,
    marginBottom: 15,
  },
  locationPostsList: {
    paddingBottom: 20,
  },
  locationPostItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#333',
  },
  postContent: {
    padding: 15,
  },
  postTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  postDescription: {
    color: '#cccccc',
    fontSize: 14,
    marginBottom: 10,
    lineHeight: 20,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  defaultAvatar: {
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  username: {
    color: '#ffffff',
    fontSize: 13,
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    color: '#cccccc',
    fontSize: 12,
    marginLeft: 3,
    marginRight: 8,
  },
  commentIcon: {
    marginLeft: 8,
  },
  emptyLocationPosts: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 30,
    paddingBottom: 30,
  },
  emptyLocationText: {
    color: '#999',
    textAlign: 'center',
    marginTop: 15,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  searchContainer: {
    backgroundColor: '#232526',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    height: height * 0.7,
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    padding: 5,
  },
  searchTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    color: '#ffffff',
    fontSize: 16,
  },
  searchButton2: {
    backgroundColor: '#4a90e2',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  searchButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  searchResults: {
    flex: 1,
  },
  searchResultItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchResultContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchResultTextContainer: {
    marginLeft: 10,
  },
  searchResultText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  searchResultSubtext: {
    color: '#999',
    fontSize: 14,
    marginTop: 2,
  },
  searchLoading: {
    marginTop: 20,
  },
  emptyResultContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
  },
  emptyResultText: {
    color: '#999',
    textAlign: 'center',
    marginTop: 15,
    fontSize: 18,
    fontWeight: '500',
  },
  emptyResultSubtext: {
    color: '#777',
    textAlign: 'center',
    marginTop: 5,
    fontSize: 14,
  },
  initialSearchState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
  },
  initialSearchText: {
    color: '#999',
    textAlign: 'center',
    marginTop: 15,
    fontSize: 18,
    fontWeight: '500',
  },
  initialSearchSubtext: {
    color: '#777',
    textAlign: 'center',
    marginTop: 5,
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 15,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  sectionCount: {
    color: '#999',
    fontSize: 16,
    fontWeight: '500',
  },
  guidesContainer: {
    paddingBottom: 15,
  },
  guideItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 15,
    marginRight: 12,
    width: 280,
  },
  guideContent: {
    gap: 10,
  },
  guideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  guideUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  guideUserAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  guideUsername: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  guideStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  guideStatsText: {
    color: '#cccccc',
    fontSize: 14,
  },
  guideDetails: {
    marginTop: 5,
  },
  guideLocationNote: {
    color: '#cccccc',
    fontSize: 14,
    lineHeight: 20,
  },
  userLocationMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userLocationPulse: {
    position: 'absolute',
    backgroundColor: 'rgba(66, 133, 244, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(66, 133, 244, 0.5)',
  },
  userLocationMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(66, 133, 244, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  userLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4285F4',
  },
  routeButton: {
    position: 'absolute',
    top: 50,
    right: 170,
    zIndex: 10,
  },
  routeButtonActive: {
    backgroundColor: '#4285F4',
  },
  showRouteButton: {
    position: 'absolute',
    bottom: BOTTOM_SHEET_INITIAL_HEIGHT + 10,
    alignSelf: 'center',
    zIndex: 10,
  },
  showRouteButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  showRouteButtonText: {
    color: '#ffffff',
    marginLeft: 5,
    fontWeight: '600',
    fontSize: 13,
  },
  routeInfoPanel: {
    position: 'absolute',
    bottom: BOTTOM_SHEET_MAX_HEIGHT,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(33, 33, 33, 0.9)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
    maxHeight: height * 0.7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
    zIndex: 100,
  },
  routeInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: 10,
  },
  routeInfoTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  routeInfoSummary: {
    color: '#4285F4',
    fontSize: 14,
    fontWeight: '600',
  },
  closeRouteInfo: {
    padding: 5,
  },
  routeDirectionsList: {
    maxHeight: height * 0.5,
  },
  routeStep: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  routeInstruction: {
    color: '#ffffff',
    fontSize: 14,
    flex: 1,
  },
  routeDistance: {
    color: '#aaaaaa',
    fontSize: 12,
    marginLeft: 10,
  },
  transportModeContainer: {
    position: 'absolute',
    top: 50,
    right: 170,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    padding: 4,
    zIndex: 10,
  },
  transportModeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  transportModeActive: {
    backgroundColor: 'rgba(66, 133, 244, 0.3)',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 10,
    fontWeight: '500',
  },
  routeIndicator: {
    position: 'absolute',
    bottom: BOTTOM_SHEET_INITIAL_HEIGHT + 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(66, 133, 244, 0.8)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  routeIndicatorIcon: {
    marginRight: 8,
  },
  routeIndicatorText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  nearbyButton: {
    position: 'absolute',
    top: 50,
    right: 60,
    zIndex: 10,
  },
  nearbyButtonActive: {
    backgroundColor: 'rgba(66, 133, 244, 0.8)',
  },
  radiusContainer: {
    marginVertical: 10,
    padding: 12,
    backgroundColor: 'rgba(66, 133, 244, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(66, 133, 244, 0.3)',
  },
  radiusText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radiusSlider: {
    flex: 1,
    height: 40,
  },
  sliderLabel: {
    color: '#999',
    fontSize: 12,
    width: 20,
    textAlign: 'center',
  },
  nearbyList: {
    paddingBottom: 20,
  },
  nearbyListVisible: {
    display: 'flex',
    maxHeight: BOTTOM_SHEET_MAX_HEIGHT - 150, // Limit height to ensure it fits
  },
  nearbyListHidden: {
    display: 'none',
  },
  nearbyItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 2,
  },
  nearbyImage: {
    width: 80,
    height: 80,
  },
  nearbyContent: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  nearbyTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  nearbyDescription: {
    color: '#cccccc',
    fontSize: 12,
    flex: 1,
  },
  nearbyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  nearbyDistance: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(66, 133, 244, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  distanceText: {
    color: '#4285F4',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  nearbyUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nearbyUserAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 5,
  },
  nearbyUserAvatarDefault: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  nearbyUsername: {
    color: '#ffffff',
    fontSize: 12,
    opacity: 0.8,
  },
  emptyNearby: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 20,
  },
  emptyNearbyText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 10,
  },
  emptyNearbySubtext: {
    color: '#999',
    fontSize: 14,
    marginTop: 5,
  },
});