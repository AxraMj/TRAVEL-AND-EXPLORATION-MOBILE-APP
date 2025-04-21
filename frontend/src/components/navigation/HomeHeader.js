import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

export default function HomeHeader({ navigation, isCreator = false }) {
  const { user } = useAuth();
  const { unreadCount, fetchUnreadCount } = useNotifications();

  // Fetch unread count on mount
  useEffect(() => {
    if (isCreator) {
      fetchUnreadCount();
    }
  }, [isCreator]);

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.profileButton}
        onPress={() => navigation.navigate('Profile')}
      >
        {user?.profileImage ? (
          <Image 
            source={{ uri: user.profileImage }} 
            style={styles.profileImage} 
          />
        ) : (
          <Ionicons name="person-circle" size={32} color="#ffffff" />
        )}
      </TouchableOpacity>

      <View style={styles.rightButtons}>
        {isCreator && (
          <>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <View>
                <Ionicons name="notifications-outline" size={28} color="#ffffff" />
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
              style={styles.iconButton}
              onPress={() => navigation.navigate('CreatePost')}
            >
              <Ionicons name="add-circle-outline" size={28} color="#ffffff" />
            </TouchableOpacity>
          </>
        )}
        {!isCreator && (
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => navigation.navigate('Following')}
          >
            <Ionicons name="people-outline" size={28} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: '#232526',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#232526',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
}); 