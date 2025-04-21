import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  Text,
  RefreshControl,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  BackHandler
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import PostCard from '../../components/posts/PostCard';
import FollowModal from '../../components/modals/FollowModal';
import { useAuth } from '../../context/AuthContext';
import { postsAPI, profileAPI } from '../../services/api/';

export default function ExplorerHomeScreen({ navigation }) {
  const { user, logout, updateUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('forYou');
  const [posts, setPosts] = useState([]);
  const [followingPosts, setFollowingPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followingUsers, setFollowingUsers] = useState([]);
  const [loadingFollowing, setLoadingFollowing] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      // Navigation will be handled automatically by the app navigator
    } catch (error) {
      // Silent error handling
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        await updateUserProfile({
          ...user,
          profileImage: result.assets[0].uri
        });
      }
    } catch (error) {
      // Silent error handling
    }
    setShowDropdown(false);
  };

  const fetchPosts = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Fetch both types of posts in parallel
      const [forYouResponse, followingResponse] = await Promise.all([
        postsAPI.getAllPosts(),
        postsAPI.getFollowedPosts()
      ]);

      setPosts(forYouResponse);
      setFollowingPosts(followingResponse);
    } catch (error) {
      // Silent error handling
      setError('Failed to load posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowing = async () => {
    try {
      setLoadingFollowing(true);
      const response = await profileAPI.getFollowing(user.id);
      setFollowingUsers(response);
    } catch (error) {
      // Silent error handling
      Alert.alert('Error', 'Failed to load following list');
    } finally {
      setLoadingFollowing(false);
    }
  };

  const handleFollowingPress = () => {
    setShowFollowingModal(true);
    fetchFollowing();
  };

  const handleUserPress = (userId) => {
    navigation.navigate('UserProfile', { userId });
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Handle back button press
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        // Return true to prevent default behavior (going back)
        return true;
      }
    );

    return () => backHandler.remove();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  const handlePostDelete = (postId) => {
    // Update the UI immediately
    setPosts(currentPosts => currentPosts.filter(post => post._id !== postId));
    setFollowingPosts(currentPosts => currentPosts.filter(post => post._id !== postId));
  };

  const handlePostUpdate = (updatedPost) => {
    const updatePostsArray = (postsArray) => {
      return postsArray.map(post => 
        post._id === updatedPost._id ? updatedPost : post
      );
    };

    setPosts(updatePostsArray);
    setFollowingPosts(updatePostsArray);
  };

  const ProfileDropdown = () => (
    <Modal
      visible={showDropdown}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowDropdown(false)}
    >
      <Pressable 
        style={styles.dropdownOverlay}
        onPress={() => setShowDropdown(false)}
      >
        <View style={styles.dropdownMenu}>
          <TouchableOpacity 
            style={styles.dropdownItem}
            onPress={pickImage}
          >
            <Ionicons name="camera-outline" size={20} color="#ffffff" />
            <Text style={styles.dropdownText}>Change Profile Picture</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.dropdownItem, styles.logoutItem]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );

  const renderEmptyComponent = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator color="#ffffff" size="large" />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={48} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchPosts}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (activeTab === 'following') {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={48} color="rgba(255,255,255,0.5)" />
          <Text style={styles.emptyText}>No posts available</Text>
          <Text style={styles.emptySubText}>
            Follow some creators to see their posts here
          </Text>
          <TouchableOpacity 
            style={styles.exploreButton}
            onPress={() => navigation.navigate('Search')}
          >
            <Text style={styles.exploreButtonText}>Explore Creators</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="images-outline" size={48} color="rgba(255,255,255,0.5)" />
        <Text style={styles.emptyText}>No posts available</Text>
        <Text style={styles.emptySubText}>
          Check back later for new travel content
        </Text>
      </View>
    );
  };

  const currentPosts = activeTab === 'following' ? followingPosts : posts;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#232526', '#414345', '#232526']}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => setShowDropdown(true)}
            activeOpacity={0.7}
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

          <Image 
            source={require('../../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <TouchableOpacity 
            style={styles.iconButton}
            onPress={handleFollowingPress}
          >
            <Ionicons name="people-outline" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <ProfileDropdown />

        <FollowModal
          visible={showFollowingModal}
          onClose={() => setShowFollowingModal(false)}
          data={followingUsers}
          type="following"
          loading={loadingFollowing}
          onUserPress={handleUserPress}
        />

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'forYou' && styles.activeTab]}
            onPress={() => setActiveTab('forYou')}
          >
            <Text style={[styles.tabText, activeTab === 'forYou' && styles.activeTabText]}>
              For You
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tab, activeTab === 'following' && styles.activeTab]}
            onPress={() => setActiveTab('following')}
          >
            <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>
              Following
            </Text>
          </TouchableOpacity>
        </View>

        {/* Posts List */}
        <FlatList
          data={currentPosts}
          renderItem={({ item }) => (
            item ? (
              <PostCard 
                post={item} 
                onPostUpdate={handlePostUpdate}
                onPostDelete={handlePostDelete}
              />
            ) : null
          )}
          keyExtractor={item => item?._id || Math.random().toString()}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor="#ffffff"
            />
          }
          ListEmptyComponent={renderEmptyComponent}
          contentContainerStyle={styles.listContainer}
        />

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="home" size={24} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => navigation.navigate('Map')}
          >
            <Ionicons name="map-outline" size={24} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => navigation.navigate('Search')}
          >
            <Ionicons name="search-outline" size={24} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => navigation.navigate('Saved')}
          >
            <Ionicons name="bookmark-outline" size={24} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
  },
  logo: {
    width: 100,
    height: 70,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  iconButton: {
    padding: 8,
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 100,
    left: 20,
    backgroundColor: '#232526',
    borderRadius: 10,
    padding: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  dropdownText: {
    color: '#ffffff',
    marginLeft: 12,
    fontSize: 16,
  },
  logoutItem: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  logoutText: {
    color: '#FF6B6B',
    marginLeft: 12,
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#ffffff',
  },
  tabText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
  },
  activeTabText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#232526',
    paddingBottom: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  exploreButton: {
    backgroundColor: '#414345',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 12,
  },
  exploreButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
}); 