import { BorderRadius, Colors, Spacing } from '@/constants/theme';
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
    backgroundColor: Colors.background,
  },

  reviewCard: {
  backgroundColor: Colors.surface,
  marginHorizontal: Spacing.md,
  marginVertical: Spacing.sm,
  borderRadius: BorderRadius.md,
  padding: Spacing.md,
  shadowColor: Colors.shadow,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 3,
  borderWidth: 1,
  borderColor: Colors.border,
},

mediaSection: {
  flexDirection: 'row',
  marginBottom: Spacing.md,
  paddingBottom: Spacing.md,
  borderBottomWidth: 1,
  borderBottomColor: Colors.border,
},

coverImage: {
  width: 60,
  height: 90,
  borderRadius: BorderRadius.sm,
  marginRight: Spacing.sm + 4,
  backgroundColor: Colors.surfaceVariant,
},

coverPlaceholder: {
  width: 60,
  height: 90,
  borderRadius: BorderRadius.sm,
  marginRight: Spacing.sm + 4,
  backgroundColor: Colors.surfaceVariant,
  justifyContent: 'center',
  alignItems: 'center',
},

mediaInfo: {
  flex: 1,
  justifyContent: 'center',
},

mediaTitle: {
  fontSize: 16,
  fontWeight: '600',
  color: Colors.text,
  marginBottom: Spacing.xs,
},

mediaType: {
  fontSize: 12,
  color: Colors.textSecondary,
  textTransform: 'uppercase',
  fontWeight: '500',
},

reviewContent: {
  marginBottom: Spacing.sm,
},

date: {
  fontSize: 12,
  color: Colors.textTertiary,
  marginBottom: Spacing.sm,
},

reviewTitle: {
  fontSize: 18,
  fontWeight: '700',
  color: Colors.text,
  marginBottom: Spacing.sm,
},

actions: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingTop: Spacing.sm,
  borderTopWidth: 1,
  borderTopColor: Colors.border,
},

statsRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: Spacing.md,
},

ratingRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: Spacing.xs,
},

reviewText: {
  fontSize: 14,
  color: Colors.textSecondary,
  lineHeight: 20,
  marginBottom: Spacing.sm,
},

likes: {
  fontSize: 12,
  color: Colors.textSecondary,
  fontWeight: '500',
},

ratingContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: Colors.highlight,
  paddingHorizontal: Spacing.sm,
  paddingVertical: Spacing.xs,
  borderRadius: BorderRadius.sm,
  borderWidth: 1,
  borderColor: Colors.primary,
},

rating: {
  fontSize: 14,
  fontWeight: '700',
  color: Colors.primary,
  marginLeft: Spacing.xs,
},

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  notLoggedInTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  notLoggedInText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl - 2,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: BorderRadius.md,
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
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.sm,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 4,
    borderRadius: BorderRadius.sm,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  folderCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  folderHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.sm + 4,
  },
  folderIconContainer: {
    marginRight: Spacing.sm + 4,
    justifyContent: 'center',
  },
  folderInfo: {
    flex: 1,
  },
  folderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  folderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  publicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.highlight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm + 4,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  publicBadgeText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '600',
  },
  folderDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  folderStats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  folderStat: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  folderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: Spacing.sm + 4,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: `${Colors.error}20`,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  deleteButtonText: {
    color: Colors.error,
    fontWeight: '600',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: Colors.overlay,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm + 4,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm + 4,
    fontSize: 16,
    backgroundColor: Colors.surfaceVariant,
    color: Colors.text,
  },
  textArea: {
    minHeight: 80,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 6,
    marginRight: Spacing.sm + 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxLabelContainer: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  checkboxSubtext: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.sm + 4,
    marginTop: Spacing.lg,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.surfaceVariant,
  },
  cancelButtonText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.sm,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.textTertiary,
  },
  submitButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  backButton: {
    padding: 5,
    width: 40,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm + 4,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
});