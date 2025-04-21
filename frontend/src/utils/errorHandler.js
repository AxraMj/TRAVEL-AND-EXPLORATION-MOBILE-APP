import { Alert, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { API_URL } from '../config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_TIMEOUT = 10000; // 10 seconds

export const withTimeout = (promise, timeout = DEFAULT_TIMEOUT) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timed out')), timeout)
    )
  ]);
};

export const retryWithBackoff = async (operation, maxRetries = 3) => {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      retries++;
      if (retries === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
    }
  }
};

export const checkNetworkStatus = async () => {
  try {
    // First check if the device has internet connectivity
    const netInfo = await NetInfo.fetch();
    console.log('Network check - NetInfo:', {
      isConnected: netInfo.isConnected,
      type: netInfo.type,
      isInternetReachable: netInfo.isInternetReachable,
      details: netInfo.details
    });
    
    if (!netInfo.isConnected) {
      return { isConnected: false, error: 'No internet connection' };
    }
    
    // Then check if our API server is reachable
    try {
      console.log('Checking API server at:', `${API_URL}/api/test`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${API_URL}/api/test`, { 
        method: 'GET',  // Using GET instead of HEAD for better compatibility
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);
      
      console.log('API server response:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });
      
      if (!response.ok) {
        return { isConnected: false, error: `Server error: ${response.status}` };
      }
      
      // Try to read the response data
      try {
        const data = await response.json();
        console.log('API test endpoint data:', data);
        
        // Verify the server is responding correctly with expected data
        if (!data || !data.status) {
          console.log('Server response data format:', data);
          // If status is missing but we got a successful response with expected message, accept it
          if (data && data.message && data.message.includes('API is working correctly')) {
            console.log('Server response lacks status field but has correct message - continuing');
            return { isConnected: true };
          }
          
          return { 
            isConnected: false, 
            error: 'Server returned unexpected response format' 
          };
        }
        
        if (data.status !== 'ok') {
          console.log('Server response status not ok:', data.status);
          return {
            isConnected: false,
            error: `Server returned status: ${data.status}`
          };
        }
      } catch (jsonError) {
        console.error('Error parsing API response:', jsonError);
        // We still consider the server connected even if JSON parsing fails
      }
      
      return { isConnected: true };
    } catch (error) {
      console.error('API server check error:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      if (error.name === 'AbortError') {
        return { isConnected: false, error: 'Server connection timed out' };
      }
      
      // Try to detect if this is a DNS error
      const errorString = error.toString().toLowerCase();
      if (errorString.includes('network') || errorString.includes('failed to fetch') || errorString.includes('unable to resolve')) {
        return { isConnected: false, error: 'Cannot reach server. Check network configuration.' };
      }
      
      return { isConnected: false, error: `Server connection error: ${error.message}` };
    }
  } catch (error) {
    console.error('Network check error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return { 
      isConnected: false, 
      error: `Network check failed: ${error.message}`
    };
  }
};

export const showNetworkErrorAlert = async (retryAction) => {
  const { isConnected, error } = await checkNetworkStatus();
  
  Alert.alert(
    'Connection Error',
    error || 'Unable to connect to the server',
    [
      { 
        text: 'Retry', 
        onPress: async () => {
          const networkStatus = await checkNetworkStatus();
          if (networkStatus.isConnected) {
            retryAction();
          } else {
            showNetworkErrorAlert(retryAction);
          }
        }
      },
      { text: 'Cancel', style: 'cancel' }
    ]
  );
};

export const handleApiError = async (error, navigation) => {
  // Extract a user-friendly message from the error
  let userMessage = 'Something went wrong. Please try again later.';

  // Check if there's a response with data
  if (error.response && error.response.data) {
    // Use the message from the response if available
    if (error.response.data.message) {
      userMessage = error.response.data.message;
    }
  } else if (error.message) {
    // Network-related errors
    if (error.message.includes('Network Error') || 
        error.message.includes('timeout') || 
        error.message.includes('connection')) {
      userMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
    } 
    // Authentication errors should be handled in their respective screens
    else if (error.message.includes('No account found') || 
             error.message.includes('Incorrect password')) {
      userMessage = 'The email or password you entered is incorrect. Please try again or sign up if you don\'t have an account.';
    }
  }

  // Display the user-friendly message
  Alert.alert(
    'Error',
    userMessage,
    [{ text: 'OK' }]
  );

  // Handle special cases that require navigation
  if (error.response && error.response.status === 401) {
    try {
      // For 401 errors, just remove the token and the AppNavigator will handle the rest
      AsyncStorage.removeItem('token')
        .catch(() => {
          // Suppress console error
        });
    } catch (navError) {
      // Suppress console error
    }
  }
}; 