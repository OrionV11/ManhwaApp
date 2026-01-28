import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { api, ApiError } from '../../utils/api';

type Media = {
  id: number;
  cover_image?: string;
  title_english?: string;
  title_romaji?: string;
  type?: string;
};

type Review = {
  id: number;
  media: Media;
  content: string;
  rating?: number;
  created_at: string;
  likes_count?: number;
};

// Fixed Props type to include userId and onRefresh
type Props = {
  data: Review[];
  loading: boolean;
  tab: 'reviews';
  userId?: number;  // Added this
  onRefresh?: () => void;  // Added this
};

export default function ReviewList({ data, loading, userId, onRefresh }: Props) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDeleteReview = async (reviewId: number) => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete this review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(reviewId);
            try {
              await api.delete(`/api/reviews/${reviewId}`);
              Alert.alert('Success', 'Review deleted');
              onRefresh?.();
            } catch (error) {
              console.error('Delete review error:', error);
              if (error instanceof ApiError) {
                Alert.alert('Error', error.message);
              } else {
                Alert.alert('Error', 'Failed to delete review');
              }
            } finally {
              setDeletingId(null);
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4c00b4" />
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbox-outline" size={64} color="#ccc" />
        <Text style={styles.emptyText}>No reviews yet</Text>
        <Text style={styles.emptySubtext}>Your reviews will appear here</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.listContainer}
      renderItem={({ item }) => (
        <View style={styles.reviewCard}>
          {/* Media Section */}
          <View style={styles.mediaSection}>
            {item.media?.cover_image ? (
              <Image 
                source={{ uri: item.media.cover_image }} 
                style={styles.coverImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.coverPlaceholder}>
                <Ionicons name="image-outline" size={24} color="#999" />
              </View>
            )}
            
            <View style={styles.mediaInfo}>
              <Text style={styles.mediaTitle} numberOfLines={2}>
                {item.media?.title_english || 
                 item.media?.title_romaji || 
                 'Untitled'}
              </Text>
              {item.media?.type && (
                <Text style={styles.mediaType}>{item.media.type}</Text>
              )}
            </View>
          </View>

          {/* Review Content */}
          <View style={styles.reviewContent}>
            {/* Rating and Date */}
            <View style={styles.metaRow}>
              {item.rating && (
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#fbbf24" />
                  <Text style={styles.rating}>{item.rating}/10</Text>
                </View>
              )}
              <Text style={styles.date}>
                {formatDate(item.created_at)}
              </Text>
            </View>

            {/* Review Text */}
            <Text style={styles.reviewText} numberOfLines={6}>
              {item.content || 'No review text'}
            </Text>

            {/* Actions Row */}
            <View style={styles.actionsRow}>
              {item.likes_count !== undefined && (
                <View style={styles.likesContainer}>
                  <Ionicons name="heart-outline" size={16} color="#666" />
                  <Text style={styles.likesText}>
                    {item.likes_count} {item.likes_count === 1 ? 'like' : 'likes'}
                  </Text>
                </View>
              )}
              
              {userId && (
                <TouchableOpacity
                  onPress={() => handleDeleteReview(item.id)}
                  disabled={deletingId === item.id}
                  style={styles.deleteButton}
                >
                  {deletingId === item.id ? (
                    <ActivityIndicator size="small" color="#dc2626" />
                  ) : (
                    <>
                      <Ionicons name="trash-outline" size={16} color="#dc2626" />
                      <Text style={styles.deleteText}>Delete</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#fff',
  },
  reviewCard: {
    backgroundColor: Colors.surfaceVariant,
    borderBottomColor: Colors.border,
    marginHorizontal: 8,
    marginVertical: 6,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mediaSection: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  coverImage: {
    width: 60,
    height: 90,
    borderRadius: 8,
  },
  coverPlaceholder: {
    width: 60,
    height: 90,
    backgroundColor: Colors.background,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  mediaTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  mediaType: {
    fontSize: 12,
    color: '#fff',
    textTransform: 'uppercase',
  },
  reviewContent: {
    gap: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  date: {
    fontSize: 12,
    color: '#fff',
  },
  reviewText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  likesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  likesText: {
    fontSize: 13,
    color: '#fff',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  deleteText: {
    fontSize: 13,
    color: '#dc2626',
    fontWeight: '500',
  },
});