import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

type Activity = {
  activity_id: number;
  user?: {
    id: number;
    username: string;
    profile_picture?: string;
  };
  media?: {
    id: number;
    title_romaji: string;
    title_english?: string;
    cover_image?: string;
    type: string;
  };
  activity_type: string;
  details?: string;
  created_at: string;
};

type Props = {
  activities: Activity[];
  loading: boolean;
  currentUserId: number;
};

export default function ActivityList({ activities, loading, currentUserId }: Props) {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4c00b4" />
      </View>
    );
  }

  if (activities.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No activities yet</Text>
      </View>
    );
  }

  const getActivityText = (activity: Activity) => {
    const username = activity.user?.username || 'User';
    const mediaTitle = activity.media?.title_english || activity.media?.title_romaji || 'Unknown';
    
    switch (activity.activity_type) {
      case 'STARTED':
        return `${username} started ${mediaTitle}`;
      case 'COMPLETED':
        return `${username} completed ${mediaTitle}`;
      case 'UPDATED_PROGRESS':
        return `${username} updated progress on ${mediaTitle}`;
      case 'REVIEWED':
        return `${username} reviewed ${mediaTitle}`;
      case 'LIKED':
        return `${username} liked ${mediaTitle}`;
      case 'ADDED':
        return `${username} added ${mediaTitle} to their list`;
      default:
        return `${username} interacted with ${mediaTitle}`;
    }
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'STARTED':
        return '▶️';
      case 'COMPLETED':
        return '✅';
      case 'UPDATED_PROGRESS':
        return '📈';
      case 'REVIEWED':
        return '📝';
      case 'LIKED':
        return '❤️';
      case 'ADDED':
        return '➕';
      default:
        return '📌';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      {activities.map((activity) => (
        <View key={activity.activity_id} style={styles.activityCard}>
          <View style={styles.activityHeader}>
            {/* User Profile Picture */}
            {activity.user?.profile_picture ? (
              <Image 
                source={{ uri: activity.user.profile_picture }} 
                style={styles.profilePic}
              />
            ) : (
              <View style={styles.profilePicPlaceholder}>
                <Text style={styles.profilePicText}>
                  {activity.user?.username?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}

            <View style={styles.activityContent}>
              <View style={styles.activityTextRow}>
                <Text style={styles.activityIcon}>
                  {getActivityIcon(activity.activity_type)}
                </Text>
                <Text style={styles.activityText}>
                  {getActivityText(activity)}
                </Text>
              </View>
              
              {activity.details && (
                <Text style={styles.activityDetails}>{activity.details}</Text>
              )}
              
              <Text style={styles.timestamp}>
                {formatTimeAgo(activity.created_at)}
              </Text>
            </View>
          </View>

          {/* Media Cover Image */}
          {activity.media?.cover_image && (
            <Image 
              source={{ uri: activity.media.cover_image }} 
              style={styles.mediaCover}
            />
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },

  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  activityHeader: {
    flexDirection: 'row',
  },

  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },

  profilePicPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4c00b4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  profilePicText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  activityContent: {
    flex: 1,
  },

  activityTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  activityIcon: {
    fontSize: 16,
    marginRight: 6,
  },

  activityText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },

  activityDetails: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    marginBottom: 4,
  },

  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },

  mediaCover: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 10,
    resizeMode: 'cover',
  },
});