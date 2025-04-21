import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  Alert,
  Share
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const GuideCard = ({ 
  guide, 
  onLike, 
  onDislike, 
  onDelete, 
  isOwner 
}) => {
  const navigation = useNavigation();

  const handleLocationPress = () => {
    if (guide.location) {
      // Navigate to map with the location
      navigation.navigate('Map', { 
        selectedLocation: {
          name: guide.location,
          coordinates: guide.coordinates || null
        },
        initialGuide: guide
      });
    }
  };

  const handleShare = async () => {
    try {
      // Create share message
      const shareMessage = {
        title: `Travel Guide for ${guide.location}`,
        message: `${guide.locationNote ? `${guide.locationNote}\n\n` : ''}Location: ${guide.location}\n\nLikes: ${guide.likes}\nDislikes: ${guide.dislikes}\n\nShared via Travo App`,
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
      Alert.alert('Error', 'Failed to share guide');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image 
          source={{ uri: guide.userImage }} 
          style={styles.avatar}
        />
        <View style={styles.content}>
          <View style={styles.userInfo}>
            <Text style={styles.name}>{guide.username}</Text>
            {isOwner && (
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => onDelete(guide._id)}
              >
                <Ionicons name="ellipsis-horizontal" size={16} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            )}
          </View>

          {guide.location && (
            <TouchableOpacity 
              style={styles.locationContainer}
              onPress={handleLocationPress}
            >
              <Ionicons name="location" size={14} color="#1DA1F2" />
              <Text style={styles.location}>{guide.location}</Text>
            </TouchableOpacity>
          )}

          {guide.locationNote && (
            <Text style={styles.locationNote}>{guide.locationNote}</Text>
          )}

          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => onLike(guide._id)}
            >
              <Ionicons 
                name={guide.hasLiked ? "heart" : "heart-outline"} 
                size={18} 
                color={guide.hasLiked ? "#F91880" : "rgba(255,255,255,0.5)"} 
              />
              <Text style={[
                styles.actionText,
                guide.hasLiked && styles.actionTextActive
              ]}>
                {guide.likes || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => onDislike(guide._id)}
            >
              <Ionicons 
                name={guide.hasDisliked ? "thumbs-down" : "thumbs-down-outline"} 
                size={18} 
                color={guide.hasDisliked ? "#1DA1F2" : "rgba(255,255,255,0.5)"} 
              />
              <Text style={[
                styles.actionText,
                guide.hasDisliked && styles.actionTextDislike
              ]}>
                {guide.dislikes || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleShare}
            >
              <Ionicons 
                name="share-outline" 
                size={18} 
                color="rgba(255,255,255,0.5)" 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  content: {
    flex: 1,
  },
  userInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteButton: {
    padding: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  location: {
    color: '#1DA1F2',
    fontSize: 14,
    marginLeft: 4,
    textDecorationLine: 'underline',
  },
  locationNote: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 24,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  actionTextActive: {
    color: '#F91880',
  },
  actionTextDislike: {
    color: '#1DA1F2',
  },
});

export default GuideCard; 