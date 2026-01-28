import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { api, ApiError } from '../../utils/api';

type Review = {
  id: number;
  rating: number;
  title?: string;
  content: string;
  likes_count: number;
  created_at: string;
  user: {
    id: number;
    username: string;
    profile_picture?: string;
  };
  media: {
    id: number;
    title_english?: string;
    title_romaji: string;
    cover_image?: string;
    type: string;
  };
};

export default function ReviewsList() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchPublicReviews();
  }, []);

  const fetchPublicReviews = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // Fetch public reviews sorted by popularity
      const data = await api.get<Review[]>(
        '/api/reviews/public?sort=popular&limit=50',
        false  // Public endpoint, no auth required
      );
      setReviews(data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      if (error instanceof ApiError) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Error', 'Failed to load reviews');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLikeReview = async (reviewId: number) => {
    try {
      await api.post(`/api/reviews/${reviewId}/like`, {});
      // Refresh to show updated like count
      fetchPublicReviews();
    } catch (error) {
      console.error('Like error:', error);
      if (error instanceof ApiError) {
        Alert.alert('Error', error.message);
      }
    }
  };

  const handleMediaClick = (mediaId: number) => {
    router.push(`/media/${mediaId}`);
  };

  const handleUserClick = (userId: number) => {
    router.push(`/user/${userId}`);
  };

  const renderReview = ({ item }: { item: Review }) => (
    <View style={styles.reviewCard}>
      {/* User Info */}
      <TouchableOpacity
        style={styles.userSection}
        onPress={() => handleUserClick(item.user.id)}
      >
        {item.user.profile_picture ? (
          <Image
            source={{ uri: item.user.profile_picture }}
            style={styles.userAvatar}
          />
        ) : (
          <View style={styles.userAvatarPlaceholder}>
            <Ionicons name="person" size={20} color="#999" />
          </View>
        )}
        <Text style={styles.username}>{item.user.username}</Text>
        <Text style={styles.date}>
          • {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </TouchableOpacity>

      {/* Media Info */}
      <TouchableOpacity
        style={styles.mediaSection}
        onPress={() => handleMediaClick(item.media.id)}
      >
        {item.media.cover_image ? (
          <Image
            source={{ uri: item.media.cover_image }}
            style={styles.coverImage}
          />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Ionicons name="image-outline" size={24} color="#999" />
          </View>
        )}
        <View style={styles.mediaInfo}>
          <Text style={styles.mediaTitle} numberOfLines={2}>
            {item.media.title_english || item.media.title_romaji}
          </Text>
          <Text style={styles.mediaType}>{item.media.type}</Text>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={16} color="#fbbf24" />
            <Text style={styles.rating}>{item.rating}/10</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Review Content */}
      <View style={styles.reviewContent}>
        {item.title && (
          <Text style={styles.reviewTitle}>{item.title}</Text>
        )}
        <Text style={styles.reviewText} numberOfLines={4}>
          {item.content}
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.likeButton}
          onPress={() => handleLikeReview(item.id)}
        >
          <Ionicons name="heart-outline" size={20} color="#dc2626" />
          <Text style={styles.likesText}>{item.likes_count}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && reviews.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4c00b4" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Popular Reviews</Text>
        <Text style={styles.headerSubtitle}>
          {reviews.length} reviews from the community
        </Text>
      </View>

      {reviews.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="star-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No reviews yet</Text>
          <Text style={styles.emptySubtext}>
            Be the first to write a review!
          </Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          renderItem={renderReview}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContainer}
          onRefresh={() => fetchPublicReviews(true)}
          refreshing={refreshing}
        />
      )}
    </View>
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
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  userAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
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
    backgroundColor: '#f0f0f0',
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
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },
  reviewContent: {
    marginBottom: 12,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  likesText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
});