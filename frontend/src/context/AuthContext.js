import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, profileAPI } from '../services/api/';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem('token'),
        AsyncStorage.getItem('user')
      ]);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      // Silent error handling
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      
      // Extract data safely with fallbacks
      const newToken = response.token;
      const userData = response.user;
      
      if (!newToken || !userData) {
        throw new Error('Invalid response format');
      }
      
      // Store auth data
      await Promise.all([
        AsyncStorage.setItem('token', newToken),
        AsyncStorage.setItem('user', JSON.stringify(userData))
      ]);

      setToken(newToken);
      setUser(userData);
      
      return userData; // Return user data for navigation
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem('token'),
        AsyncStorage.removeItem('user')
      ]);
      setToken(null);
      setUser(null);
    } catch (error) {
      // Handle error silently
    }
  };

  const updateUserProfile = async (profileData) => {
    try {
      const response = await profileAPI.updateProfile(profileData);
      if (response.user) {
        const updatedUser = response.user;
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
      return response;
    } catch (error) {
      // Silent error handling
      throw error;
    }
  };

  const resetPassword = async (email, newPassword) => {
    try {
      const response = await authAPI.resetPassword(email, newPassword);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const verifyEmail = async (email) => {
    try {
      const response = await authAPI.verifyEmail(email);
      return response;
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token,
      isLoading,
      login, 
      logout,
      updateUserProfile,
      resetPassword,
      verifyEmail
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 