import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { validateForm } from '../../utils/validation';

const { width, height } = Dimensions.get('window');

export default function ProfileSetupScreen({ navigation, route }) {
  const { login } = useAuth();
  const { userData, accountType } = route.params;
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    username: '',
    profileImage: null,
    errors: {}
  });

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        setProfileData(prev => ({
          ...prev,
          profileImage: result.assets[0].uri,
          errors: {
            ...prev.errors,
            profileImage: null
          }
        }));
      }
    } catch (error) {
      console.log('Image picker error:', error);
    }
  };

  const validateUsername = (username) => {
    if (!username.trim()) {
      return 'Username is required';
    }
    if (username.length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (username.length > 30) {
      return 'Username must be less than 30 characters';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return 'Username can only contain letters, numbers and underscores';
    }
    return null;
  };

  const handleComplete = async () => {
    try {
      if (!profileData.profileImage) {
        setProfileData(prev => ({
          ...prev,
          errors: {
            ...prev.errors,
            profileImage: 'Please select a profile image'
          }
        }));
        return;
      }

      // Validate username for both account types
      const usernameError = validateUsername(profileData.username);
      if (usernameError) {
        setProfileData(prev => ({
          ...prev,
          errors: {
            ...prev.errors,
            username: usernameError
          }
        }));
        return;
      }

      setIsLoading(true);
      setProfileData(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          username: null
        }
      }));

      const registrationData = {
        ...userData,
        username: profileData.username, // Use username for both account types
        profileImage: profileData.profileImage,
        accountType
      };

      try {
        const response = await authAPI.register(registrationData);
        
        await login({
          email: userData.email,
          password: userData.password
        });

        navigation.reset({
          index: 0,
          routes: [{ 
            name: accountType === 'creator' ? 'CreatorHome' : 'ExplorerHome' 
          }],
        });
      } catch (error) {
        console.error('Registration error:', error);
        
        // Handle username conflicts specifically
        if (error.message && error.message.includes('username')) {
          setProfileData(prev => ({
            ...prev,
            errors: {
              ...prev.errors,
              username: error.message
            }
          }));
        } else {
          Alert.alert(
            'Registration Failed',
            error.message || error.response?.data?.message || 'Failed to create account. Please try again.'
          );
        }
      }
    } catch (error) {
      console.error('Profile setup error:', error);
      Alert.alert(
        'Setup Failed',
        'An unexpected error occurred. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#232526', '#414345', '#232526']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.background}
      >
        <TouchableOpacity 
          style={styles.backIcon}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={28} color="#ffffff" />
        </TouchableOpacity>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>Add a photo to help others recognize you</Text>
            
            <TouchableOpacity 
              style={styles.imageContainer}
              onPress={pickImage}
            >
              {profileData.profileImage ? (
                <>
                  <Image 
                    source={{ uri: profileData.profileImage }} 
                    style={styles.profileImage} 
                  />
                  <View style={styles.editOverlay}>
                    <Ionicons name="camera" size={24} color="#ffffff" />
                  </View>
                </>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="person-add" size={40} color="#ffffff" />
                  <Text style={styles.uploadText}>Add Photo</Text>
                </View>
              )}
            </TouchableOpacity>
            {profileData.errors && profileData.errors.profileImage && (
              <Text style={styles.errorText}>{profileData.errors.profileImage}</Text>
            )}

            {accountType === 'creator' && (
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Username</Text>
                <View style={styles.inputWrapper}>
                  <View style={[styles.usernameContainer, profileData.errors && profileData.errors.username && styles.inputError]}>
                    <Text style={styles.atSymbol}>@</Text>
                    <TextInput
                      style={styles.usernameInput}
                      placeholder="username"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      value={profileData.username}
                      onChangeText={(text) => {
                        // Remove any @ symbols from input
                        const cleanText = text.replace('@', '');
                        setProfileData(prev => ({ ...prev, username: cleanText }));
                        if (profileData.errors && profileData.errors.username) {
                          setProfileData(prev => ({
                            ...prev,
                            errors: {
                              ...prev.errors,
                              username: null
                            }
                          }));
                        }
                      }}
                      autoCapitalize="none"
                      autoCorrect={false}
                      maxLength={30}
                    />
                  </View>
                  {profileData.errors && profileData.errors.username && (
                    <Text style={styles.errorText}>{profileData.errors.username}</Text>
                  )}
                </View>
                <Text style={styles.inputHint}>
                  This will be your unique identifier on Travo
                </Text>
              </View>
            )}

            {accountType === 'explorer' && (
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Choose a Username</Text>
                <View style={styles.inputWrapper}>
                  <View style={[
                    styles.usernameContainer,
                    profileData.errors?.username && styles.inputError
                  ]}>
                    <Text style={styles.atSymbol}>@</Text>
                    <TextInput
                      style={styles.usernameInput}
                      placeholder="username"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      value={profileData.username}
                      onChangeText={(text) => {
                        // Remove any @ symbols from input
                        const cleanText = text.replace('@', '');
                        setProfileData(prev => ({
                          ...prev,
                          username: cleanText,
                          errors: {
                            ...prev.errors,
                            username: null
                          }
                        }));
                      }}
                      autoCapitalize="none"
                      autoCorrect={false}
                      maxLength={30}
                    />
                  </View>
                  {profileData.errors?.username && (
                    <Text style={styles.errorText}>{profileData.errors.username}</Text>
                  )}
                </View>
                <Text style={styles.inputHint}>
                  This will be your unique identifier on Travo
                </Text>
              </View>
            )}

            <TouchableOpacity 
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleComplete}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Complete Setup</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.skipText}>
              You can always edit your profile later
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  backIcon: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 100,
    alignItems: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
  },
  imageContainer: {
    width: width * 0.45,
    height: width * 0.45,
    borderRadius: width * 0.225,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: width * 0.225,
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: width * 0.225,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed',
  },
  uploadText: {
    color: '#ffffff',
    marginTop: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  inputSection: {
    width: '100%',
    marginBottom: 30,
  },
  inputLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    width: '100%',
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  atSymbol: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    paddingLeft: 15,
    fontWeight: '500',
  },
  usernameInput: {
    flex: 1,
    padding: 15,
    paddingLeft: 5,
    color: '#ffffff',
    fontSize: 16,
    height: '100%',
  },
  inputHint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 8,
    marginLeft: 4,
  },
  inputError: {
    borderColor: '#ff4444',
    borderWidth: 1,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  button: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#232526',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
});