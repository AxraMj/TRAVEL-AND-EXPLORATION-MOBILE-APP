import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  FlatList,
  Alert,
  Share
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { profileAPI } from '../../services/api';
import { postsAPI } from '../../services/api';
import { guidesAPI } from '../../services/api';
import PostCard from '../../components/posts/PostCard';
import GuideCard from '../../components/guides/GuideCard';
import { useAuth } from '../../context/AuthContext';
import FollowModal from '../../components/modals/FollowModal';

const { width } = Dimensions.get('window');

export default function UserProfileScreen({ navigation, route }) {
  const { userId } = route.params;
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followModalVisible, setFollowModalVisible] = useState(false);
  const [followModalType, setFollowModalType] = useState('followers');
  const [followModalData, setFollowModalData] = useState([]);
  const [followModalLoading, setFollowModalLoading] = useState(false);

  const fetchUserData = async () => {
    try {
      const [profileData, postsData, guidesData] = await Promise.all([
        profileAPI.getProfile(userId),
        postsAPI.getUserPosts(userId),
        guidesAPI.getUserGuides(userId)
      ]);
      setProfile(profileData);
      setPosts(postsData);
      setGuides(guidesData);
      setIsFollowing(profileData.followers?.includes(user.id));
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts(currentPosts => 
      currentPosts.map(post => 
        post._id === updatedPost._id ? updatedPost : post
      )
    );
  };

  const handlePostDelete = (postId) => {
    setPosts(currentPosts => currentPosts.filter(post => post._id !== postId));
  };

  const handleFollowPress = async () => {
    if (followLoading) return;
    
    try {
      setFollowLoading(true);
      if (isFollowing) {
        const response = await profileAPI.unfollowUser(userId);
        setProfile(prev => ({
          ...prev,
          followers: prev.followers.filter(id => id !== user.id)
        }));
        setIsFollowing(false);
      } else {
        const response = await profileAPI.followUser(userId);
        setProfile(prev => ({
          ...prev,
          followers: [...prev.followers, user.id]
        }));
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Follow/unfollow error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to update follow status'
      );
    } finally {
      setFollowLoading(false);
    }
  };

  const handleLikeGuide = async (guideId) => {
    try {
      const updatedGuide = await guidesAPI.likeGuide(guideId);
      setGuides(currentGuides => 
        currentGuides.map(guide => 
          guide._id === guideId ? updatedGuide : guide
        )
      );
    } catch (error) {
      console.error('Error liking guide:', error);
      Alert.alert('Error', 'Failed to like guide');
    }
  };

  const handleDislikeGuide = async (guideId) => {
    try {
      const updatedGuide = await guidesAPI.dislikeGuide(guideId);
      setGuides(currentGuides => 
        currentGuides.map(guide => 
          guide._id === guideId ? updatedGuide : guide
        )
      );
    } catch (error) {
      console.error('Error disliking guide:', error);
      Alert.alert('Error', 'Failed to dislike guide');
    }
  };

  const handleDeleteGuide = async (guideId) => {
    try {
      await guidesAPI.deleteGuide(guideId);
      setGuides(currentGuides => 
        currentGuides.filter(guide => guide._id !== guideId)
      );
    } catch (error) {
      console.error('Error deleting guide:', error);
      Alert.alert('Error', 'Failed to delete guide');
    }
  };

  const handleFollowersPress = async () => {
    setFollowModalType('followers');
    setFollowModalVisible(true);
    setFollowModalLoading(true);
    try {
      const followers = await profileAPI.getFollowers(userId);
      setFollowModalData(followers);
    } catch (error) {
      console.error('Error fetching followers:', error);
      // Handle error appropriately
    } finally {
      setFollowModalLoading(false);
    }
  };

  const handleFollowingPress = async () => {
    setFollowModalType('following');
    setFollowModalVisible(true);
    setFollowModalLoading(true);
    try {
      const following = await profileAPI.getFollowing(userId);
      setFollowModalData(following);
    } catch (error) {
      console.error('Error fetching following:', error);
      // Handle error appropriately
    } finally {
      setFollowModalLoading(false);
    }
  };

  const handleUserPress = (selectedUserId) => {
    if (selectedUserId === userId) {
      navigation.navigate('Profile');
    } else {
      navigation.push('UserProfile', { userId: selectedUserId });
    }
  };

  const handleShare = async () => {
    try {
      // Create share message
      const shareMessage = {
        title: `${profile.user.fullName}'s Profile`,
        message: `${profile.user.fullName} (@${profile.user.username})\n\n${profile.user.bio || 'No bio yet'}\n\nLocation: ${profile.user.location || 'Not specified'}\n\nFollowers: ${profile.user.followers?.length || 0}\nFollowing: ${profile.user.following?.length || 0}\n\nShared via Travo App`,
      };

      const result = await Share.share(shareMessage);
      
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('Shared with activity type:', result.activityType);
        } else {
          console.log('Shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share profile');
    }
  };

  const renderPostsContent = () => {
    if (posts.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="images-outline" size={48} color="rgba(255,255,255,0.5)" />
          <Text style={styles.emptyText}>No posts yet</Text>
        </View>
      );
    }

    return (
      <View style={styles.postsContainer}>
        {posts.map(post => (
          <PostCard
            key={post._id}
            post={post}
            onPostUpdate={handlePostUpdate}
            onPostDelete={handlePostDelete}
          />
        ))}
      </View>
    );
  };

  const renderGuideContent = () => {
    if (!guides || guides.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="book-outline" size={48} color="rgba(255,255,255,0.5)" />
          <Text style={styles.emptyText}>No guides yet</Text>
        </View>
      );
    }

    return (
      <View style={styles.guidesContainer}>
        {guides.map(guide => (
          <GuideCard
            key={guide._id}
            guide={guide}
            onLike={handleLikeGuide}
            onDislike={handleDislikeGuide}
            onDelete={handleDeleteGuide}
            isOwner={user.id === userId}
          />
        ))}
      </View>
    );
  };

  const renderContent = () => {
    if (activeTab === 'posts') {
      return renderPostsContent();
    } else {
      return renderGuideContent();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>User not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#232526', '#414345', '#232526']}
        style={styles.container}
      >
        <ScrollView 
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#ffffff"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            
            <View style={styles.headerRight}>
              <TouchableOpacity 
                style={styles.shareButton}
                onPress={handleShare}
              >
                <Ionicons name="share-outline" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Profile Info */}
          <View style={styles.profileInfo}>
            <Image 
              source={{ uri: profile.user.profileImage }}
              style={styles.profileImage}
            />
            <Text style={styles.name}>{profile.user.fullName}</Text>
            <Text style={styles.username}>@{profile.user.username}</Text>
            
            {/* Follow Button */}
            {user.id !== userId && (
              <TouchableOpacity
                style={[
                  styles.followButton,
                  isFollowing && styles.followingButton,
                  followLoading && styles.followButtonDisabled
                ]}
                onPress={handleFollowPress}
                disabled={followLoading}
              >
                {followLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.followButtonText}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                )}
              </TouchableOpacity>
            )}
            
            {profile.bio && (
              <Text style={styles.bio}>{profile.bio}</Text>
            )}
            
            {profile.location && (
              <View style={styles.locationContainer}>
                <Ionicons name="location" size={16} color="#FF6B6B" />
                <Text style={styles.location}>{profile.location}</Text>
              </View>
            )}

            {/* Stats */}
            <View style={styles.stats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {profile.stats?.totalPosts || 0}
                </Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <TouchableOpacity 
                style={styles.statItem}
                onPress={handleFollowersPress}
              >
                <Text style={styles.statNumber}>
                  {profile.followers?.length || 0}
                </Text>
                <Text style={styles.statLabel}>Followers</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.statItem}
                onPress={handleFollowingPress}
              >
                <Text style={styles.statNumber}>
                  {profile.following?.length || 0}
                </Text>
                <Text style={styles.statLabel}>Following</Text>
              </TouchableOpacity>
            </View>

            {/* Social Links */}
            {profile.socialLinks && Object.values(profile.socialLinks).some(link => link) && (
              <View style={styles.socialLinks}>
                {profile.socialLinks.instagram && (
                  <TouchableOpacity style={styles.socialButton}>
                    <Ionicons name="logo-instagram" size={24} color="#ffffff" />
                  </TouchableOpacity>
                )}
                {profile.socialLinks.twitter && (
                  <TouchableOpacity style={styles.socialButton}>
                    <Ionicons name="logo-twitter" size={24} color="#ffffff" />
                  </TouchableOpacity>
                )}
                {profile.socialLinks.facebook && (
                  <TouchableOpacity style={styles.socialButton}>
                    <Ionicons name="logo-facebook" size={24} color="#ffffff" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
              onPress={() => setActiveTab('posts')}
            >
              <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
                Posts
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.tab, activeTab === 'guides' && styles.activeTab]}
              onPress={() => setActiveTab('guides')}
            >
              <Text style={[styles.tabText, activeTab === 'guides' && styles.activeTabText]}>
                Guides
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          {renderContent()}
        </ScrollView>
      </LinearGradient>

      <FollowModal
        visible={followModalVisible}
        onClose={() => setFollowModalVisible(false)}
        data={followModalData}
        type={followModalType}
        loading={followModalLoading}
        onUserPress={handleUserPress}
      />
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#232526',
  },
  errorText: {
    color: '#ff4444',
    textAlign: 'center',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  profileInfo: {
    alignItems: 'center',
    padding: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  name: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  username: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    marginBottom: 12,
  },
  bio: {
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 32,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  location: {
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 4,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 16,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 4,
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
  },
  socialButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  tabText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#ffffff',
  },
  activeTabText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  postsContainer: {
    flex: 1,
    width: '100%',
  },
  guidesContainer: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    marginTop: 12,
  },
  followButton: {
    backgroundColor: '#1DA1F2',
    paddingHorizontal: 32,
    paddingVertical: 8,
    borderRadius: 20,
    marginVertical: 16,
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1DA1F2',
  },
  followButtonDisabled: {
    opacity: 0.7,
  },
  followButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  shareButton: {
    padding: 8,
  },
}); 