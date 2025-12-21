import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
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
  const [activeTab, setActiveTab] = useState<'actions' | 'review'>('actions');
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(false);

  const getAuthToken = async () => {
    return await AsyncStorage.getItem('authToken');
  };

  const handleAddToList = async (listType: 'favorites' | 'reading') => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        Alert.alert('Error', 'Please log in first');
        return;
      }

      const endpoint = listType === 'favorites' 
        ? '/api/favorites/add' 
        : '/api/reading-progress/add';

      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        Alert.alert('Error', 'Please log in first');
        return;
      }

      const response = await fetch('http://localhost:3000/api/reviews/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          media_id: mediaId,
          rating: rating,
          review_text: reviewText,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Review submitted!');
        setRating(0);
        setReviewText('');
        onClose();
      } else {
        Alert.alert('Error', data.detail || 'Failed to submit review');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
          >
            <Text style={[
              styles.star,
              rating >= star && styles.starFilled
            ]}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{mediaTitle}</Text>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'actions' && styles.tabActive
              ]}
              onPress={() => setActiveTab('actions')}
            >
              <Text style={[
                styles.tabText,
                activeTab === 'actions' && styles.tabTextActive
              ]}>
                Actions
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'review' && styles.tabActive
              ]}
              onPress={() => setActiveTab('review')}
            >
              <Text style={[
                styles.tabText,
                activeTab === 'review' && styles.tabTextActive
              ]}>
                Review
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.contentContainer}>
            {activeTab === 'actions' ? (
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

                {loading && (
                  <ActivityIndicator size="small" color="#3b82f6" style={styles.loader} />
                )}
              </View>
            ) : (
              <View style={styles.reviewContainer}>
                <Text style={styles.label}>Rating (out of 10)</Text>
                {renderStars()}
                <Text style={styles.ratingText}>
                  {rating > 0 ? `${rating}/10` : 'Select a rating'}
                </Text>

                <Text style={styles.label}>Review (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Write your review here..."
                  multiline
                  numberOfLines={6}
                  value={reviewText}
                  onChangeText={setReviewText}
                  textAlignVertical="top"
                />

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    loading && styles.submitButtonDisabled
                  ]}
                  onPress={handleSubmitReview}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit Review</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#222',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  tabTextActive: {
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  contentContainer: {
    maxHeight: 400,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    gap: 12,
  },
  actionIcon: {
    fontSize: 24,
  },
  actionText: {
    fontSize: 16,
    color: '#222',
    fontWeight: '500',
  },
  loader: {
    marginTop: 12,
  },
  reviewContainer: {
    gap: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  starsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  star: {
    fontSize: 32,
    color: '#d1d5db',
  },
  starFilled: {
    color: '#fbbf24',
  },
  ratingText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: -8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: 'bold',
  },
});