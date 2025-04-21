import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

export default function BottomTabBar({ state, navigation }) {
  const { unreadCount, fetchUnreadCount, wsConnected } = useNotifications();
  const { user } = useAuth();

  // Fetch notifications when the notifications tab is focused
  useEffect(() => {
    if (state.index === 3) {
      fetchUnreadCount();
    }
  }, [state.index]);

  const handleHomePress = () => {
    // Navigate based on user type
    navigation.navigate(user?.accountType === 'creator' ? 'CreatorHome' : 'ExplorerHome');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.tabItem} 
        onPress={handleHomePress}
      >
        <Ionicons 
          name={state.index === 0 ? "home" : "home-outline"} 
          size={24} 
          color={state.index === 0 ? "#ffffff" : "rgba(255,255,255,0.7)"} 
        />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.tabItem} 
        onPress={() => navigation.navigate('Map')}
      >
        <Ionicons 
          name={state.index === 1 ? "map" : "map-outline"} 
          size={24} 
          color={state.index === 1 ? "#ffffff" : "rgba(255,255,255,0.7)"} 
        />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.tabItem} 
        onPress={() => navigation.navigate('Search')}
      >
        <Ionicons 
          name={state.index === 2 ? "search" : "search-outline"} 
          size={24} 
          color={state.index === 2 ? "#ffffff" : "rgba(255,255,255,0.7)"} 
        />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.tabItem} 
        onPress={() => {
          navigation.navigate('Notifications');
        }}
      >
        <View>
          <Ionicons 
            name={state.index === 3 ? "notifications" : "notifications-outline"} 
            size={24} 
            color={state.index === 3 ? "#ffffff" : "rgba(255,255,255,0.7)"} 
          />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.tabItem} 
        onPress={() => navigation.navigate('Saved')}
      >
        <Ionicons 
          name={state.index === 4 ? "bookmark" : "bookmark-outline"} 
          size={24} 
          color={state.index === 4 ? "#ffffff" : "rgba(255,255,255,0.7)"} 
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#232526',
    height: 60,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    right: -6,
    top: -6,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#232526',
    zIndex: 1,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
}); 