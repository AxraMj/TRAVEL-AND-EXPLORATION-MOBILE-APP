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
  BackHandler
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import PostCard from '../../components/posts/PostCard';
import HomeHeader from '../../components/navigation/HomeHeader';
import { useAuth } from '../../context/AuthContext';
import { postsAPI } from '../../services/api/';

export default function CreatorHomeScreen({ navigation }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [followingPosts, setFollowingPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('forYou');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

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
      Alert.alert(
        'Error',
        'Failed to load posts. Please check your internet connection and try again.',
        [
          { text: 'Retry', onPress: () => fetchPosts() },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
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
        <Text style={styles.emptyText}>No posts yet</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => navigation.navigate('CreatePost')}
        >
          <Text style={styles.createButtonText}>Create Your First Post</Text>
        </TouchableOpacity>
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
        <HomeHeader navigation={navigation} isCreator={true} />

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
            onPress={() => navigation.navigate('Saved')}
          >
            <Ionicons name="bookmark-outline" size={24} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>

        <StatusBar style="light" />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#ffffff',
  },
  tabText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#ffffff',
  },
  listContainer: {
    flexGrow: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#232526',
  },
  navItem: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#ffffff',
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#414345',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  exploreButton: {
    backgroundColor: '#414345',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  exploreButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    backgroundColor: '#414345',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 