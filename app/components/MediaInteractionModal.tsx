import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

/* 🔧 MOCK SETUP: existing DB user */
const mockUser = {
  id: 1,
  username: 'TestUser',
  email: 'test@example.com',
  profile_picture: null,
  bio: 'Test bio',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

interface MediaInteractionModalProps {
  visible: boolean;
  onClose: () => void;
  mediaId: number;
  mediaTitle: string;
}

export default function MediaInteractionModal({ 
  visible, 
  onClose, 
  mediaId, 
  mediaTitle 
}: MediaInteractionModalProps) {

  const [activeTab, setActiveTab] = useState<'actions' | 'review'| 'reviews'>('actions');
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [likedReview, setLikedReview] = useState(0);

  /* user already exists in DB */
  const [userId, setUserId] = useState<number | null>(1);

  /* MOCK SETUP: seed AsyncStorage once */
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

  // Load userId from AsyncStorage when modal opens
  /*
  useEffect(() => {
    const fetchUserId = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      const storeUser = await AsyncStorage.getItem('user');
      console.log('Fetched userId from AsyncStorage:', storedUserId);
      console.log('Fetched user from AsyncStorage:', storeUser);

      if (storedUserId) {
        console.log('Found userId:', storedUserId);
        setUserId(Number(storedUserId));
      } else if (storeUser) {
        const user = JSON.parse(storeUser);
        console.log('Parsed user object:', user);
        setUserId(user.id);
      } else {
        console.log('No userId or user found in AsyncStorage');
        setUserId(null);
      }
    };
    if (visible) fetchUserId();
  }, [visible]);
  */

  const getMediaReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/reviews/media/${mediaId}`)

      if(!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      const reviewsData = await response.json();
      setReviews(reviewsData)
    } catch (error) {
      console.error('Error fetching reviews:', error);
      Alert.alert('Error', 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToList = async (listType: 'favorites' | 'reading') => {
    setLoading(true);
    try {
      const userJson = await AsyncStorage.getItem('user');
      if (!userJson) {
        Alert.alert('Error', 'Please log in first');
        setLoading(false);
        return;
      }

      const user = JSON.parse(userJson);
      setUserId(user.id);

      const endpoint =
        listType === 'favorites'
          ? `/api/favorites/${user.id}/add/${mediaId}`
          : `/api/reading-progress/${user.id}/add/${mediaId}`;

      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ media_id: mediaId }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success',
          listType === 'favorites'
            ? 'Added to favorites!'
            : 'Added to reading list!'
        );
      } else {
        Alert.alert('Error', data.detail || 'Failed to add');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLikeReview = async (reviewId: number) => {
  if (!userId) {
    Alert.alert('Error', 'Please log in first');
    return;
  }

  setLoading(true);
  try {

  

    const response = await fetch(
      `http://localhost:3000/api/reviews/${reviewId}/like?user_id=${userId}`,
      {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
      }
    );

    const reviewsData = await response.json();

    console.log('Fetched reviews JSON:', reviewsData);

    setReviews(Array.isArray(reviewsData.reviews) ? reviewsData.reviews : []);

    if (response.ok) {
      Alert.alert('Success', 'Review liked!');


      await getMediaReviews();

    } else {
      Alert.alert('Error', reviewsData.detail || 'Failed to like review');
    }
  } catch (error) {
    console.error(error);
    Alert.alert('Error', 'Network error occurred');
  } finally {
    setLoading(false);
  }
};



  const handleSubmitReview = async () => {
    console.log('=== SUBMIT REVIEW STARTED ===');

    if (!userId) {
      Alert.alert('Error', 'Please log in first');
      return;
    }

    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    if (!reviewText.trim()) {
      Alert.alert('Error', 'Please write a review');
      return;
    }

    setLoading(true);
    try {
      const cleanRating = Number(rating);

    // Prepare request body exactly how FastAPI expects
      const requestBody = {
        user_id: Number(userId),
        media_id: Number(mediaId),
        content: reviewText.trim(),
        rating: cleanRating,
        title: "", // optional
    };

    console.log('POST body:', requestBody);
      /*
      const token = await getAuthToken();
      if (!token) {
        Alert.alert('Error', 'Please log in first');
        setLoading(false);
        return;
      }
      */

      const response = await fetch(
        `http://localhost:3000/api/reviews`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Review submitted!');
        setRating(0);
        setReviewText('');
        onClose();
      } else {
        Alert.alert('Error', data.detail || JSON.stringify(data));
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => (
    <View style={styles.starsContainer}>
      {[...Array(10)].map((_, i) => {
        const star = i + 1;
        return (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
          >
            <Text style={[styles.star, rating >= star && styles.starFilled]}>
              ★
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  useEffect(() => {
  if (visible && activeTab === 'reviews') {
    getMediaReviews();
  }
}, [visible, activeTab]);

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{mediaTitle}</Text>

          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'actions' && styles.tabActive]}
              onPress={() => setActiveTab('actions')}
            >
              <Text style={[styles.tabText, activeTab === 'actions' && styles.tabTextActive]}>
                Actions
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'review' && styles.tabActive]}
              onPress={() => setActiveTab('review')}
            >
              <Text style={[styles.tabText, activeTab === 'review' && styles.tabTextActive]}>
                Review
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'reviews' && styles.tabActive]}
              onPress={() => setActiveTab('reviews')}
            >
              <Text style={[styles.tabText, activeTab === 'reviews' && styles.tabTextActive]}>
                Reviews ({reviews.length})
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.contentContainer}>
            {activeTab === 'actions' && (
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleAddToList('favorites')}
                  disabled={loading}
                >
                  <Text style={styles.actionIcon}>❤️</Text>
                  <Text style={styles.actionText}>Add to Favorites</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleAddToList('reading')}
                  disabled={loading}
                >
                  <Text style={styles.actionIcon}>📚</Text>
                  <Text style={styles.actionText}>Add to Reading List</Text>
                </TouchableOpacity>

                {loading && <ActivityIndicator size="small" color="#3b82f6" />}
              </View>
            )} 
            
            {activeTab === 'review' && (
              <View style={styles.reviewContainer}>
                <Text style={styles.label}>Rating (out of 10)</Text>
                {renderStars()}
                <Text style={styles.ratingText}>
                  {rating > 0 ? `${rating}/10` : 'Select a rating'}
                </Text>

                <Text style={styles.label}>Review</Text>
                <TextInput
                  style={styles.textInput}
                  multiline
                  value={reviewText}
                  onChangeText={setReviewText}
                />

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmitReview}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit Review</Text>
                  )}
                </TouchableOpacity>
              </View>
            )} 
            
            {activeTab === 'reviews' && (
              <View style={styles.reviewsListContainer}>
                {loading ? (
                  <ActivityIndicator size="small" color="#3b82f6" />
                ) : reviews.length === 0 ? (
                  <Text style={styles.noReviewsText}>No reviews yet</Text>
                ) : (
                  reviews.map((review) => (
                    <View key={review.review_id} style={styles.reviewItem}>
                      <View style={styles.reviewHeader}>
                        <Text style={styles.reviewUserName}>{review.username}</Text>
                        <Text style={styles.reviewRating}>⭐ {review.rating}/10</Text>
                        <Text style={styles.reviewContent}>{review.content}</Text>
                        <TouchableOpacity onPress={() => {
                          console.log('Full review object:', review);
                          console.log('Review ID:', review.review_id);
                          handleLikeReview(review.review_id);
                        }}>
                          <Text> ❤️ Like </Text>
                        </TouchableOpacity>
                      </View>
                      {review.review_text && (
                        <Text style={styles.reviewText}>{review.review_text}</Text>
                      )}
                      <Text style={styles.reviewDate}>
                        {new Date(review.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  contentContainer: { maxHeight: 400 },
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  tabsContainer: { flexDirection: 'row', marginBottom: 16 },
  tab: { flex: 1, padding: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#3b82f6' },
  tabText: { color: '#666' },
  tabTextActive: { color: '#3b82f6', fontWeight: 'bold' },
  actionsContainer: { gap: 12 },
  actionButton: { flexDirection: 'row', padding: 16, backgroundColor: '#f3f4f6', borderRadius: 12 },
  actionIcon: { fontSize: 24 },
  actionText: { fontSize: 16, marginLeft: 12 },
  reviewContainer: { gap: 16 },
  label: { fontWeight: '600' },
  starsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  starButton: { padding: 4 },
  star: { fontSize: 32, color: '#d1d5db' },
  starFilled: { color: '#fbbf24' },
  ratingText: { textAlign: 'center' },
  textInput: { borderWidth: 1, borderRadius: 8, padding: 12, minHeight: 120 },
  submitButton: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 8, alignItems: 'center' },
  submitButtonText: { color: '#fff', fontWeight: 'bold' },
  closeButton: { padding: 12, alignItems: 'center' },
  closeButtonText: { color: '#3b82f6', fontWeight: 'bold' },
  reviewsListContainer: {
    gap: 16,
  },
  reviewItem: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  reviewRating: {
    fontSize: 14,
    color: '#fbbf24',
    fontWeight: '600',
  },
  reviewText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  reviewDate: {
    fontSize: 10,
    color: '#999',
  },
  noReviewsText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    paddingVertical: 20,
  },
  reviewContent: {
    width: '100%',
    textAlign: 'center',
    color: '#999',
    fontSize: 15,
    paddingVertical: 20,

  }
});
