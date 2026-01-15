import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const mockUser = {
  id: 1,
  username: 'TestUser',
  email: 'test@example.com',
  profile_picture: null,
  bio: 'Test bio',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};


export default function ReviewsList() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<number>(1); // Default to 1 for dev
  const router = useRouter();

  // Mock setup: seed AsyncStorage once
  useEffect(() => {
    const seedMockUser = async () => {
      const existingUser = await AsyncStorage.getItem('user');
      if (!existingUser) {
        await AsyncStorage.setItem('user', JSON.stringify(mockUser));
        await AsyncStorage.setItem('userId', String(mockUser.id));
      }
    };
    seedMockUser();
  }, []);

  // Fetch reviews when component mounts
  useEffect(() => {
    if (userId) {
      getUserReviews();
    }
  }, [userId]);

  const getUserReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/reviews/user/${userId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      const reviewsData = await response.json();
      console.log('User reviews:', reviewsData);
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      Alert.alert('Error', 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

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
            try {
              const response = await fetch(
                `http://localhost:3000/api/reviews/${reviewId}?user_id=${userId}`,
                { method: 'DELETE' }
              );

              if (response.ok) {
                Alert.alert('Success', 'Review deleted');
                getUserReviews(); // Refresh list
              } else {
                Alert.alert('Error', 'Failed to delete review');
              }
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'Network error occurred');
            }
          }
        }
      ]
    );
  };


  const handleMediaClick = (mediaId: number) => {
    router.push(`/media/${mediaId}`)
  };

  if (loading && reviews.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Reviews</Text>
        <Text style={styles.headerSubtitle}>{reviews.length} reviews</Text>
      </View>

      {reviews.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>You haven't written any reviews yet</Text>
        </View>
      ) : (
        reviews.map((review) => (
          <TouchableOpacity onPress={() => handleMediaClick(review.media?.id || review.media_id)}>
          <View key={review.review_id} style={styles.reviewCard}>
            
            {/* Media Info */}
            <View style={styles.mediaSection}>
              {review.media?.cover_image ? (
                <Image
                  source={{ uri: review.media.cover_image }}
                  style={styles.coverImage}
                />
              ) : (
                <View style={styles.coverPlaceholder}>
                  <Text>No Image</Text>
                </View>
              )}
              <View style={styles.mediaInfo}>
                <Text style={styles.mediaTitle}>
                  {review.media?.title_english || review.media.title_romaji || 'Unknown Title'}
                </Text>
                <Text style={styles.mediaType}>{review.type || 'ANIME'}</Text>
              </View>
            </View>

            {/* Review Content */}
            <View style={styles.reviewContent}>
              <View style={styles.ratingRow}>
                <Text style={styles.rating}>⭐ {review.rating}/10</Text>
                <Text style={styles.date}>
                  {new Date(review.created_at).toLocaleDateString()}
                </Text>
              </View>

              {review.title && (
                <Text style={styles.reviewTitle}>{review.title}</Text>
              )}

              {review.content && (
                <Text style={styles.reviewText} numberOfLines={4}>
                  {review.content}
                </Text>
              )}

              <View style={styles.statsRow}>
                <Text style={styles.likes}>❤️ {review.likes_count || 0} likes</Text>
              </View>
            </View>
            

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteReview(review.review_id)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  reviewCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mediaSection: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  coverImage: {
    width: 60,
    height: 90,
    borderRadius: 8,
  },
  coverPlaceholder: {
    width: 60,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
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
    color: '#222',
  },
  mediaType: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  reviewContent: {
    gap: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fbbf24',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  reviewText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  likes: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  deleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#fee2e2',
  },
  deleteButtonText: {
    color: '#dc2626',
    fontWeight: '600',
  },
});

