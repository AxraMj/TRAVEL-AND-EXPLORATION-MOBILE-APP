import api from './config';
import axios from 'axios';
import { Alert } from 'react-native';
import * as Location from 'expo-location';

// Since we don't want to expose API keys directly, we'll route these through our backend
// You'd need to add corresponding routes on your backend server to proxy the requests
export const mapsAPI = {
  // Get directions from current location to destination
  getDirections: async (destinationCoords, transportMode = 'driving') => {
    try {
      // First get the user's current location
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied');
        return null;
      }
      
      // Get current position
      const location = await Location.getCurrentPositionAsync({});
      const { latitude: originLat, longitude: originLng } = location.coords;
      const { latitude: destLat, longitude: destLng } = destinationCoords;
      
      // Make request to our backend proxy
      const response = await api.get('/maps/directions', {
        params: {
          origin: `${originLat},${originLng}`,
          destination: `${destLat},${destLng}`,
          mode: transportMode // driving, walking, bicycling, transit
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting directions:', error);
      throw error;
    }
  },
  
  // Get estimated travel time and distance
  getTravelEstimate: async (destinationCoords, transportMode = 'driving') => {
    try {
      // First get the user's current location
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied');
        return null;
      }
      
      // Get current position
      const location = await Location.getCurrentPositionAsync({});
      const { latitude: originLat, longitude: originLng } = location.coords;
      const { latitude: destLat, longitude: destLng } = destinationCoords;
      
      // Make request to our backend proxy
      const response = await api.get('/maps/distance-matrix', {
        params: {
          origins: `${originLat},${originLng}`,
          destinations: `${destLat},${destLng}`,
          mode: transportMode
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting travel estimate:', error);
      throw error;
    }
  }
}; 