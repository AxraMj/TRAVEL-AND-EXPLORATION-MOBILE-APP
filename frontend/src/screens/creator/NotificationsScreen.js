import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { notificationsAPI } from '../../services/api/notifications';

export default function NotificationsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const { markAllAsRead, markAsRead } = useNotifications();
  const { logout } = useAuth();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationsAPI.getNotifications();
      
      // Flatten and sort notifications by date
      const allNotifications = Object.values(response.groups || {})
        .flat()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setNotifications(allNotifications);
      await markAllAsRead();
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInSeconds = Math.floor((now - notificationDate) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInWeeks = Math.floor(diffInDays / 7);

    if (diffInSeconds < 60) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInDays < 7) return `${diffInDays}d`;
    if (diffInWeeks < 4) return `${diffInWeeks}w`;
    return notificationDate.toLocaleDateString();
  };

  const handleNotificationPress = async (notification) => {
    try {
      if (!notification.read) {
        await markAsRead(notification._id);
      }

      switch (notification.type) {
        case 'like':
        case 'comment':
          if (notification.postId) {
            navigation.navigate('Post', { postId: notification.postId });
          }
          break;
        case 'follow':
          if (notification.triggeredBy) {
            navigation.navigate('UserProfile', { userId: notification.triggeredBy._id });
          }
          break;
      }
    } catch (error) {
      console.error('Error handling notification press:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const renderNotification = ({ item }) => {
    const getNotificationText = () => {
      switch (item.type) {
        case 'like':
          return 'liked your post';
        case 'comment':
          return item.text ? `commented: "${item.text}"` : 'commented on your post';
        case 'follow':
          return 'started following you';
        default:
          return 'interacted with your post';
      }
    };

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !item.read && styles.unreadNotification
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.notificationContent}>
          <View style={styles.userSection}>
            <Image
              source={{ 
                uri: item.triggeredBy?.profileImage || 'https://via.placeholder.com/40'
              }}
              style={styles.profileImage}
            />
            <View style={styles.textSection}>
              <Text style={styles.notificationText}>
                <Text style={styles.username}>{item.triggeredBy?.username || 'Someone'}</Text>
                {' '}{getNotificationText()}
              </Text>
              <Text style={styles.timeAgo}>{getTimeAgo(item.createdAt)}</Text>
            </View>
          </View>
          {item.postId?.image && (
            <Image
              source={{ uri: item.postId.image }}
              style={styles.postThumbnail}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-outline" size={48} color="#666" />
      <Text style={styles.emptyText}>No notifications yet</Text>
      <Text style={styles.emptySubtext}>
        When someone likes or comments on your posts, you'll see it here
      </Text>
    </View>
  );

  const SettingsModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showSettingsModal}
      onRequestClose={() => setShowSettingsModal(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalContent}>
          <TouchableOpacity 
            style={styles.modalItem}
            onPress={() => {
              setShowSettingsModal(false);
              handleLogout();
            }}
          >
            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#232526', '#414345']}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setShowSettingsModal(true)}
          >
            <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item._id}
            renderItem={renderNotification}
            ListEmptyComponent={renderEmptyComponent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#fff"
              />
            }
            contentContainerStyle={styles.listContent}
          />
        )}

        <SettingsModal />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  backButton: {
    padding: 8,
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flexGrow: 1,
  },
  notificationItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  unreadNotification: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  textSection: {
    flex: 1,
    marginRight: 12,
  },
  notificationText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 18,
  },
  username: {
    fontWeight: 'bold',
  },
  timeAgo: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 4,
  },
  postThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtext: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  settingsButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
  },
  modalContent: {
    backgroundColor: '#232526',
    marginTop: 100,
    marginRight: 20,
    marginLeft: 'auto',
    borderRadius: 12,
    width: 150,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '500',
  },
}); 