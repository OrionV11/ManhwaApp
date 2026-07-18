// app/user/[id]/reviews.tsx

import { Colors } from '@/constants/theme';
import { api } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Review = {
  id: number;
  rating: number;
  title: string;
  content: string;
  created_at: string;
  media: {
    id: number;
    title_english: string;
    title_romaji: string;
    cover_image: string;
  };
};

export default function UserReviewsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [id]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await api.get<Review[]>(`/api/users/${id}/reviews`, false);
      setReviews(data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderReview = ({ item }: { item: Review }) => (
    <TouchableOpacity
      style={styles.reviewCard}
      onPress={() => router.push(`/media/${item.media.id}`)}
    >
      {item.media.cover_image && (
        <Image source={{ uri: item.media.cover_image }} style={styles.coverImage} />
      )}
      <View style={styles.reviewContent}>
        <View style={styles.reviewHeader}>
          <Text style={styles.mediaTitle} numberOfLines={1}>
            {item.media.title_english || item.media.title_romaji}
          </Text>
          <View style={styles.rating}>
            <Ionicons name="star" size={16} color="#fbbf24" />
            <Text style={styles.ratingText}>{item.rating}/10</Text>
          </View>
        </View>
        {item.title && <Text style={styles.reviewTitle}>{item.title}</Text>}
        <Text style={styles.reviewText} numberOfLines={3}>
          {item.content}
        </Text>
        <Text style={styles.reviewDate}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reviews</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4c00b4" />
        </View>
      ) : reviews.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="star-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No reviews yet</Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          renderItem={renderReview}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
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
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  listContainer: {
    padding: 16,
  },
  reviewCard: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  coverImage: {
    width: 60,
    height: 90,
    borderRadius: 8,
    marginRight: 12,
  },
  reviewContent: {
    flex: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mediaTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 8,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  reviewText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  reviewDate: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 8,
  },
});