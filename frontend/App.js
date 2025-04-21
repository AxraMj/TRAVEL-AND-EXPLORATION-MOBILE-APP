import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LogBox } from 'react-native';
import WelcomeScreen from './src/screens/auth/WelcomeScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import AccountTypeScreen from './src/screens/auth/AccountTypeScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import ProfileSetupScreen from './src/screens/auth/ProfileSetupScreen';
import ResetPasswordScreen from './src/screens/auth/ResetPasswordScreen';
import CreatorHomeScreen from './src/screens/creator/HomeScreen';
import ExplorerHomeScreen from './src/screens/explorer/HomeScreen';
import SearchScreen from './src/screens/shared/SearchScreen';
import SavedScreen from './src/screens/shared/SavedScreen';
import MapScreen from './src/screens/shared/MapScreen';
import ProfileScreen from './src/screens/creator/ProfileScreen';
import EditProfileScreen from './src/screens/creator/EditProfileScreen';
import NotificationsScreen from './src/screens/creator/NotificationsScreen';
import UserProfileScreen from './src/screens/shared/UserProfileScreen';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import SettingsScreen from './src/screens/settings/SettingsScreen';
import CreatePostScreen from './src/screens/creator/CreatePostScreen';
import ErrorBoundary from './src/components/ErrorBoundary';

// Suppress specific warning messages
LogBox.ignoreLogs([
  'The action',
  'Non-serializable values were found in the navigation state',
]);

const AuthStack = createNativeStackNavigator();
const CreatorStack = createNativeStackNavigator();
const ExplorerStack = createNativeStackNavigator();

// Custom theme to suppress navigator warnings
const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#232526',
  },
};

// Auth Navigator for unauthenticated users
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'none',
        contentStyle: { backgroundColor: '#232526' },
        cardStyle: { backgroundColor: '#232526' },
        animationEnabled: false
      }}
    >
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="AccountType" component={AccountTypeScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </AuthStack.Navigator>
  );
};

// Creator Navigator for authenticated creator users
const CreatorNavigator = () => {
  return (
    <CreatorStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'none',
        contentStyle: { backgroundColor: '#232526' },
        cardStyle: { backgroundColor: '#232526' },
        gestureEnabled: false,
        animationEnabled: false
      }}
    >
      <CreatorStack.Screen 
        name="CreatorHome" 
        component={(props) => (
          <ErrorBoundary>
            <CreatorHomeScreen {...props} />
          </ErrorBoundary>
        )}
      />
      <CreatorStack.Screen name="Search" component={SearchScreen} />
      <CreatorStack.Screen name="Saved" component={SavedScreen} />
      <CreatorStack.Screen name="Map" component={MapScreen} />
      <CreatorStack.Screen name="Profile" component={ProfileScreen} />
      <CreatorStack.Screen name="UserProfile" component={UserProfileScreen} />
      <CreatorStack.Screen name="Notifications" component={NotificationsScreen} />
      <CreatorStack.Screen name="EditProfile" component={EditProfileScreen} />
      <CreatorStack.Screen name="Settings" component={SettingsScreen} />
      <CreatorStack.Screen name="CreatePost" component={CreatePostScreen} />
    </CreatorStack.Navigator>
  );
};

// Explorer Navigator for authenticated explorer users
const ExplorerNavigator = () => {
  return (
    <ExplorerStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'none',
        contentStyle: { backgroundColor: '#232526' },
        cardStyle: { backgroundColor: '#232526' },
        gestureEnabled: false,
        animationEnabled: false
      }}
    >
      <ExplorerStack.Screen 
        name="ExplorerHome" 
        component={ExplorerHomeScreen} 
      />
      <ExplorerStack.Screen name="Search" component={SearchScreen} />
      <ExplorerStack.Screen name="Saved" component={SavedScreen} />
      <ExplorerStack.Screen name="Map" component={MapScreen} />
      <ExplorerStack.Screen name="UserProfile" component={UserProfileScreen} />
      <ExplorerStack.Screen name="Settings" component={SettingsScreen} />
    </ExplorerStack.Navigator>
  );
};

// Main App Navigator
const AppNavigator = () => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    // You could show a splash screen here while checking auth state
    return null;
  }
  
  return (
    <NavigationContainer theme={AppTheme} fallback={null}>
      {!user ? (
        <AuthNavigator />
      ) : (
        user.accountType === 'creator' ? <CreatorNavigator /> : <ExplorerNavigator />
      )}
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppNavigator />
      </NotificationProvider>
    </AuthProvider>
  );
}