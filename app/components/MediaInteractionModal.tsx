//MediaInteractionModal.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { api, ApiError } from '../utils/api';

type Folder = {
  id: number;
  name: string;
  description?: string;
  created_at: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  mediaId: number;
  mediaTitle: string;
  onReviewSubmitted?: () => void;
  onStatusChanged?: () => void;  // ✅ Add callback for status changes
};

export default function MediaActionsModal({ visible, onClose, mediaId, mediaTitle, onReviewSubmitted, onStatusChanged }: Props) {
  const { user } = useAuth();
  
  // Review state
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  // Folder state
  const [folders, setFolders] = useState<Folder[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [addingToFolder, setAddingToFolder] = useState<number | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<'review' | 'folders'>('review');

  // ✅ NEW: Quick actions state
  const [isLiked, setIsLiked] = useState(false);
  const [readingStatus, setReadingStatus] = useState<'reading' | 'completed' | null>(null);
  const [quickActionLoading, setQuickActionLoading] = useState(false);

  useEffect(() => {
    if (visible && user && activeTab === 'folders') {
      fetchFolders();
    }
  }, [visible, user, activeTab]);

  // ✅ NEW: Check status when modal opens
  useEffect(() => {
    if (visible && user) {
      checkMediaStatus();
    }
  }, [visible, user, mediaId]);

  // ✅ NEW: Check if media is liked and reading status
  const checkMediaStatus = async () => {
    try {
      // Check if liked
      const likes = await api.get(`/api/favorites/me`);
      setIsLiked(likes.some((item: any) => item.id === mediaId));

      // Check reading status
      const progress = await api.get(`/api/reading-progress/me`);
      const mediaProgress = progress.find((item: any) => item.id === mediaId);
      if (mediaProgress) {
        setReadingStatus(mediaProgress.status === 'completed' ? 'completed' : 'reading');
      } else {
        setReadingStatus(null);
      }
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  const handleLikeToggle = async () => {
    if (!user) return;

    setQuickActionLoading(true);
    try {
      if (isLiked) {
        await api.delete(`/api/favorites/${mediaId}`);
        setIsLiked(false);
        Alert.alert('Success', 'Removed from favorites');
      } else {
        await api.put(`/api/favorites/add/${mediaId}`, {});
        setIsLiked(true);
        Alert.alert('Success', 'Added to favorites');
      }
      onStatusChanged?.();
    } catch (error) {
      console.error('Like error:', error);
      if (error instanceof ApiError) {
        Alert.alert('Error', error.message);
      }
    } finally {
      setQuickActionLoading(false);
    }
  };

  const handleReadingToggle = async () => {
    if (!user) return;

    setQuickActionLoading(true);
    try {
      if (readingStatus === 'reading') {
        await api.delete(`/api/reading-progress/${mediaId}`);
        setReadingStatus(null);
        Alert.alert('Success', 'Removed from reading list');
      } else {
        await api.put(`/api/reading-progress/add/${mediaId}`, {});
          setReadingStatus('reading');
          Alert.alert('Success', 'Added to reading list');

        }
      onStatusChanged?.();
    } catch (error) {
      console.error('Reading error:', error);
      if (error instanceof ApiError) {
        Alert.alert('Error', error.message);
      }
    } finally {
      setQuickActionLoading(false);
    }
  };

  const handleCompletedToggle = async () => {
  if (!user) return;

  setQuickActionLoading(true);
  try {
    if (readingStatus === 'completed') {
      // Remove from completed
      await api.delete(`/api/reading-progress/remove/${mediaId}`);
      setReadingStatus(null);
      Alert.alert('Success', 'Removed from completed list');
    } else {
      // Use PUT with correct endpoint
      await api.put(`/api/reading-progress/complete/${mediaId}`, {});
      setReadingStatus('completed');
      Alert.alert('Success', 'Marked as completed');
    }
    onStatusChanged?.();
  } catch (error) {
    console.error('Completed error:', error);
    if (error instanceof ApiError) {
      Alert.alert('Error', error.message);
    }
  } finally {
    setQuickActionLoading(false);
  }
};

  const fetchFolders = async () => {
    if (!user) return;

    setFoldersLoading(true);
    try {
      const data = await api.get<Folder[]>(`/api/folders/me`);
      setFolders(data);
    } catch (error) {
      console.error('Fetch folders error:', error);
      if (error instanceof ApiError) {
        Alert.alert('Error');
      } else {
        Alert.alert('Error', 'Failed to load folders');
      }
    } finally {
      setFoldersLoading(false);
    }
  };

  const handleAddToFolder = async (folderId: number) => {
    setAddingToFolder(folderId);
    try {
      await api.post(`/api/folders/${folderId}/items`, {
        media_id: mediaId
      });

      Alert.alert('Success', 'Media added to folder!');
      await fetchFolders();
    } catch (error) {
      console.error('Add to folder error:', error);
      if (error instanceof ApiError) {
        Alert.alert('Error');
      } else {
        Alert.alert('Error', 'Failed to add media to folder');
      }
    } finally {
      setAddingToFolder(null);
    }
  };

  const handleSubmitReview = async () => {
    console.log('=== SUBMIT REVIEW STARTED ===');

    if (!user?.id) {
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

    setReviewLoading(true);
    try {
      const requestBody = {
        media_id: Number(mediaId),
        content: reviewText.trim(),
        rating: Number(rating),
        title: "",
      };

      console.log('POST body:', requestBody);

      const data = await api.post('/api/reviews', requestBody);

      console.log('Review submitted successfully:', data);
      Alert.alert('Success', 'Review submitted!');
      
      setRating(0);
      setReviewText('');
      onClose();
      
      onReviewSubmitted?.();
    } catch (error) {
      console.error('Submit review error:', error);
      if (error instanceof ApiError) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Error', 'Failed to submit review');
      }
    } finally {
      setReviewLoading(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setReviewText('');
    setActiveTab('review');
    onClose();
  };

  if (!user) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Please log in first</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeIcon} onPress={handleClose}>
            <Ionicons name="close" size={28} color="#666" />
          </TouchableOpacity>

          {/* ✅ NEW: Quick Actions Row */}
          <View style={styles.quickActionsContainer}>
            <Text style={styles.quickActionsTitle}>Quick Actions</Text>
            <View style={styles.quickActionsRow}>
              {/* Like Button */}
              <TouchableOpacity
                style={[styles.quickActionButton, isLiked && styles.quickActionActive]}
                onPress={handleLikeToggle}
                disabled={quickActionLoading}
              >
                {quickActionLoading ? (
                  <ActivityIndicator size="small" color={isLiked ? '#fff' : '#4c00b4'} />
                ) : (
                  <Ionicons
                    name={isLiked ? 'heart' : 'heart-outline'}
                    size={24}
                    color={isLiked ? '#fff' : '#4c00b4'}
                  />
                )}
              </TouchableOpacity>

              {/* Reading Button */}
              <TouchableOpacity
                style={[
                  styles.quickActionButton,
                  readingStatus === 'reading' && styles.quickActionActive,
                ]}
                onPress={handleReadingToggle}
                disabled={quickActionLoading}
              >
                {quickActionLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={readingStatus === 'reading' ? '#fff' : '#4c00b4'}
                  />
                ) : (
                  <Ionicons
                    name={readingStatus === 'reading' ? 'book' : 'book-outline'}
                    size={24}
                    color={readingStatus === 'reading' ? '#fff' : '#4c00b4'}
                  />
                )}
              </TouchableOpacity>

              {/* Completed Button */}
              <TouchableOpacity
                style={[
                  styles.quickActionButton,
                  readingStatus === 'completed' && styles.quickActionActive,
                ]}
                onPress={handleCompletedToggle}
                disabled={quickActionLoading}
              >
                {quickActionLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={readingStatus === 'completed' ? '#fff' : '#4c00b4'}
                  />
                ) : (
                  <Ionicons
                    name={
                      readingStatus === 'completed'
                        ? 'checkmark-circle'
                        : 'checkmark-circle-outline'
                    }
                    size={24}
                    color={readingStatus === 'completed' ? '#fff' : '#4c00b4'}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'review' && styles.activeTab]}
              onPress={() => setActiveTab('review')}
            >
              <Text style={[styles.tabText, activeTab === 'review' && styles.activeTabText]}>
                Write Review
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'folders' && styles.activeTab]}
              onPress={() => setActiveTab('folders')}
            >
              <Text style={[styles.tabText, activeTab === 'folders' && styles.activeTabText]}>
                Add to Folder
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
            {activeTab === 'review' ? (
              <View style={styles.reviewContainer}>
                {/* Rating Selector */}
                <View style={styles.section}>
                  <Text style={styles.label}>Rating *</Text>
                  <View style={styles.ratingButtons}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <TouchableOpacity
                        key={num}
                        style={[
                          styles.ratingButton,
                          rating === num && styles.ratingButtonActive,
                        ]}
                        onPress={() => setRating(num)}
                      >
                        <Text
                          style={[
                            styles.ratingText,
                            rating === num && styles.ratingTextActive,
                          ]}
                        >
                          {num}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Review Text Input */}
                <View style={styles.section}>
                  <Text style={styles.label}>Your Review *</Text>
                  <TextInput
                    style={styles.textInput}
                    multiline
                    numberOfLines={8}
                    placeholder="Share your thoughts about this manga/manhwa..."
                    value={reviewText}
                    onChangeText={setReviewText}
                    textAlignVertical="top"
                  />
                  <Text style={styles.charCount}>
                    {reviewText.length} characters
                  </Text>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[styles.submitButton, reviewLoading && styles.submitButtonDisabled]}
                  onPress={handleSubmitReview}
                  disabled={reviewLoading}
                >
                  {reviewLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text style={styles.submitButtonText}>Submit Review</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.foldersContainer}>
                {foldersLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4c00b4" />
                  </View>
                ) : folders.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="folder-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyText}>No folders yet</Text>
                    <Text style={styles.emptySubtext}>
                      Create a folder to organize your media
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={folders}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.folderItem}
                        onPress={() => handleAddToFolder(item.id)}
                        disabled={addingToFolder === item.id}
                      >
                        <View style={styles.folderIcon}>
                          <Ionicons name="folder" size={24} color="#4c00b4" />
                        </View>
                        <View style={styles.folderInfo}>
                          <Text style={styles.folderName}>{item.name}</Text>
                          {item.description && (
                            <Text style={styles.folderDescription} numberOfLines={1}>
                              {item.description}
                            </Text>
                          )}
                        </View>
                        {addingToFolder === item.id ? (
                          <ActivityIndicator size="small" color="#4c00b4" />
                        ) : (
                          <Ionicons name="add-circle-outline" size={24} color="#4c00b4" />
                        )}
                      </TouchableOpacity>
                    )}
                    scrollEnabled={false}
                  />
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    height: '85%',
  },
  closeIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
  },
  // ✅ NEW: Quick Actions Styles
  quickActionsContainer: {
    marginTop: 40,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4c00b4',
  },
  quickActionActive: {
    backgroundColor: '#4c00b4',
    borderColor: '#4c00b4',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#4c00b4',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#4c00b4',
    fontWeight: '700',
  },
  contentContainer: {
    flex: 1,
  },
  reviewContainer: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  ratingButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ratingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  ratingButtonActive: {
    backgroundColor: '#4c00b4',
    borderColor: '#4c00b4',
  },
  ratingText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  ratingTextActive: {
    color: '#fff',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 120,
    maxHeight: 200,
    backgroundColor: '#fafafa',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
    textAlign: 'right',
  },
  submitButton: {
    backgroundColor: '#4c00b4',
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  foldersContainer: {
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
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
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#fafafa',
    borderRadius: 12,
    marginBottom: 10,
  },
  folderIcon: {
    marginRight: 12,
  },
  folderInfo: {
    flex: 1,
  },
  folderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
  },
  folderDescription: {
    fontSize: 14,
    color: '#666',
  },
  closeButton: {
    backgroundColor: '#4c00b4',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#222',
    marginBottom: 8,
  }
});