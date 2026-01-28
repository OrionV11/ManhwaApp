import { Ionicons } from '@expo/vector-icons';
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
import { useAuth } from '../contexts/AuthContext';
import { api, ApiError } from '../utils/api';

type Review = {
  review_id: number;
  media_id: number;
  rating: number;
  content: string;
  title?: string;
  created_at: string;
  likes_count: number;
  media: {
    id: number;
    cover_image?: string;
    title_english?: string;
    title_romaji?: string;
    type?: string;
  };
};

export default function ProfileReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  // Fetch reviews when component mounts
  useEffect(() => {
    if (user?.id) {
      getUserReviews();
    }
  }, [user?.id]);

  const getUserReviews = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const reviewsData = await api.get<Review[]>(`/api/reviews/me`);
      console.log('User reviews:', reviewsData);
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      if (error instanceof ApiError) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Error', 'Failed to load reviews');
      }
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
            setDeletingId(reviewId);
            try {
              await api.delete(`/api/reviews/${reviewId}`);
              Alert.alert('Success', 'Review deleted');
              await getUserReviews(); // Refresh list
            } catch (error) {
              console.error('Error deleting review:', error);
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

  const handleMediaClick = (mediaId: number) => {
    router.push(`/media/${mediaId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Show login prompt if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="chatbox-outline" size={64} color="#ccc" />
        <Text style={styles.notLoggedInTitle}>Login Required</Text>
        <Text style={styles.notLoggedInText}>
          Please log in to view your reviews
        </Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push('/auth')}
        >
          <Text style={styles.loginButtonText}>Log In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading && reviews.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4c00b4" />
        <Text style={styles.loadingText}>Loading your reviews...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>My Reviews</Text>
          <Text style={styles.headerSubtitle}>
            {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
          </Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbox-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>No reviews yet</Text>
          <Text style={styles.emptySubtext}>
            Start reviewing manga and anime to share your thoughts
          </Text>
        </View>
      ) : (
        reviews.map((review) => (
          <TouchableOpacity
            key={review.review_id}
            onPress={() => handleMediaClick(review.media?.id || review.media_id)}
            activeOpacity={0.7}
          >
            <View style={styles.reviewCard}>
              {/* Media Info */}
              <View style={styles.mediaSection}>
                {review.media?.cover_image ? (
                  <Image
                    source={{ uri: review.media.cover_image }}
                    style={styles.coverImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.coverPlaceholder}>
                    <Ionicons name="image-outline" size={32} color="#999" />
                  </View>
                )}
                <View style={styles.mediaInfo}>
                  <Text style={styles.mediaTitle} numberOfLines={2}>
                    {review.media?.title_english ||
                      review.media?.title_romaji ||
                      'Unknown Title'}
                  </Text>
                  {review.media?.type && (
                    <Text style={styles.mediaType}>
                      {review.media.type.toUpperCase()}
                    </Text>
                  )}
                </View>
              </View>

              {/* Review Content */}
              <View style={styles.reviewContent}>
                <View style={styles.ratingRow}>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={16} color="#fbbf24" />
                    <Text style={styles.rating}>{review.rating}/10</Text>
                  </View>
                  <Text style={styles.date}>{formatDate(review.created_at)}</Text>
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
                  <Ionicons name="heart-outline" size={14} color="#666" />
                  <Text style={styles.likes}>
                    {review.likes_count || 0}{' '}
                    {review.likes_count === 1 ? 'like' : 'likes'}
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteReview(review.review_id);
                  }}
                  disabled={deletingId === review.review_id}
                  activeOpacity={0.7}
                >
                  {deletingId === review.review_id ? (
                    <ActivityIndicator size="small" color="#dc2626" />
                  ) : (
                    <>
                      <Ionicons name="trash-outline" size={16} color="#dc2626" />
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </>
                  )}
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
    padding: 20,
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  notLoggedInTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },
  notLoggedInText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: '#4c00b4',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 5,
    width: 40,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  emptyContainer: {
    paddingVertical: 80,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#222',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
    backgroundColor: '#f5f5f5',
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
    marginBottom: 4,
  },
  mediaType: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  reviewContent: {
    gap: 10,
  },
  ratingRow: {
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
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
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
    gap: 6,
  },
  likes: {
    fontSize: 13,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#fee2e2',
  },
  deleteButtonText: {
    color: '#dc2626',
    fontWeight: '600',
    fontSize: 14,
  },
});