import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../context/AuthContext';
import { postsAPI } from '../../services/api';
import PostCard from '../../components/posts/PostCard';

export default function SavedScreen({ navigation }) {
  const { user } = useAuth();
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSavedPosts = async () => {
    try {
      const posts = await postsAPI.getSavedPosts();
      setSavedPosts(posts);
    } catch (error) {
      console.error('Error fetching saved posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedPosts();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSavedPosts();
    setRefreshing(false);
  };

  const handlePostUpdate = (updatedPost) => {
    setSavedPosts(currentPosts => 
      currentPosts.map(post => 
        post._id === updatedPost._id ? updatedPost : post
      )
    );
  };

  const handlePostDelete = (postId) => {
    setSavedPosts(currentPosts => 
      currentPosts.filter(post => post._id !== postId)
    );
  };

  const navigateToHome = () => {
    if (user?.accountType === 'creator') {
      navigation.navigate('CreatorHome');
    } else {
      navigation.navigate('ExplorerHome');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#232526', '#414345', '#232526']}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Saved Posts</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        ) : (
          <FlatList
            data={savedPosts}
            renderItem={({ item }) => (
              <PostCard
                post={item}
                onPostUpdate={handlePostUpdate}
                onPostDelete={handlePostDelete}
              />
            )}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#ffffff"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="bookmark-outline" size={48} color="rgba(255,255,255,0.5)" />
                <Text style={styles.emptyText}>No saved posts yet</Text>
              </View>
            }
          />
        )}

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={navigateToHome}
          >
            <Ionicons name="home-outline" size={24} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => navigation.navigate('Search')}
          >
            <Ionicons name="search-outline" size={24} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="bookmark" size={24} color="#ffffff" />
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
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  contentContainer: {
    paddingTop: 16,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    marginTop: 12,
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
}); 