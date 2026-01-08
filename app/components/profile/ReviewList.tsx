import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
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

type Review = {
  media: any;
  id?: number;
  cover_image?: string;
  title_english?: string;
  title_romaji?: string;
  title?: string;
  type?: string;
};

type Props = {
  data: Review[];
  loading: boolean;
  tab: 'reviews';
};

export default function ReviewList({ data, loading, tab }: Props) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [userId, setUserId] = useState<number>(1); // Default to 1 for dev
  const [isLoading, setIsLoading] = useState(false);

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
    setIsLoading(true);
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
      setIsLoading(false);
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

  if (isLoading) {
    return <ActivityIndicator style={{ marginTop: 30 }} />;
  }

if (!data || data.length === 0) {
  return (
    <View style={styles.empty}>
      <Ionicons name="library-outline" size={48} color="#ccc" />
      <Text style={styles.emptyText}>Nothing here yet</Text>
    </View>
  );
}

return (
  <FlatList
    data={reviews}
    keyExtractor={(item) => String(item.id)}
    renderItem={({ item }) => {
      console.log('Item structure:', JSON.stringify(item, null, 2));
      
      return (
        <View style={styles.row}>
          {item?.media?.cover_image ? (
            <Image source={{ uri: item.media.cover_image }} style={styles.cover} />
          ) : (
            <View style={styles.coverPlaceholder} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={2}>
              {item?.media?.title_english || item?.media?.title_romaji || 'Untitled'}
            </Text>
            <Text style={styles.meta}>{item?.media?.type || item?.type || 'Unknown'}</Text>
          </View>
        </View>
      );
    }}
  />
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  cover: {
    width: 55,
    height: 80,
    borderRadius: 4,
    marginRight: 12,
  },
  coverPlaceholder: {
    width: 55,
    height: 80,
    backgroundColor: '#eee',
    borderRadius: 4,
    marginRight: 12,
  },
  title: {
    fontWeight: '600',
    fontSize: 14,
  },
  meta: {
    color: '#777',
    fontSize: 12,
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: 10,
    color: '#999',
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
});
