import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { api, ApiError } from '../../utils/api';

interface Folder {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  is_public: boolean;
  likes_count: number;
  item_count: number;
  created_at: string;
  updated_at?: string;
  user?: {
    id: number;
    username: string;
    profile_picture?: string;
  };
  preview_images?: string[];
}

type TabType = 'my_folders' | 'popular';

export default function FoldersList() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  
  const [activeTab, setActiveTab] = useState<TabType>('popular');
  const [myFolders, setMyFolders] = useState<Folder[]>([]);
  const [popularFolders, setPopularFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Create folder modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [newFolderTitle, setNewFolderTitle] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    fetchPopularFolders();
    if (user?.id) {
      fetchMyFolders();
    }
  }, [user?.id]);

  const fetchMyFolders = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const data = await api.get<Folder[]>(`/api/folders/me`);
      setMyFolders(data);
    } catch (error) {
      console.error('Error fetching my folders:', error);
      if (error instanceof ApiError) {
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPopularFolders = async () => {
    setLoading(true);
    try {
      const data = await api.get<Folder[]>(
        `/api/folders/public?sort=popular&limit=50`,
        false  // Public endpoint
      );
      setPopularFolders(data);
    } catch (error) {
      console.error('Error fetching popular folders:', error);
      if (error instanceof ApiError) {
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderTitle.trim()) {
      Alert.alert('Error', 'Please enter a folder title');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'Please log in to create folders');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/folders', {
        title: newFolderTitle.trim(),
        description: newFolderDescription.trim() || null,
        is_public: isPublic,
      });

      Alert.alert('Success', 'Folder created!');
      
      setNewFolderTitle('');
      setNewFolderDescription('');
      setIsPublic(false);
      setModalVisible(false);
      
      await fetchMyFolders();
      if (isPublic) {
        await fetchPopularFolders();
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      if (error instanceof ApiError) {
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFolder = async (folderId: number, folderTitle: string) => {
    Alert.alert(
      'Delete Folder',
      `Are you sure you want to delete "${folderTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/folders/${folderId}`);
              Alert.alert('Success', 'Folder deleted');
              await fetchMyFolders();
              await fetchPopularFolders();
            } catch (error) {
              console.error('Error deleting folder:', error);
              if (error instanceof ApiError) {
                Alert.alert('Error', error.message);
              }
            }
          }
        }
      ]
    );
  };

  const handleOpenFolder = (folderId: number, isOwn: boolean) => {
    if (isOwn) {
      router.push(`/folders/me/${folderId}`);
    } else {
      router.push(`/folders/${folderId}`);
    }
  };

  const handleUserClick = (userId: number) => {
    router.push(`/user/${userId}`);
  };

  const renderFolder = (folder: Folder, isOwn: boolean) => (
    <TouchableOpacity
      key={folder.id}
      style={styles.folderCard}
      onPress={() => handleOpenFolder(folder.id, isOwn)}
      activeOpacity={0.7}
    >
      {/* User Info (for popular folders) */}
      {!isOwn && folder.user && (
        <TouchableOpacity
          style={styles.userSection}
          onPress={() => handleUserClick(folder.user!.id)}
        >
          {folder.user.profile_picture ? (
            <Image
              source={{ uri: folder.user.profile_picture }}
              style={styles.userAvatar}
            />
          ) : (
            <View style={styles.userAvatarPlaceholder}>
              <Ionicons name="person" size={16} color="#999" />
            </View>
          )}
          <Text style={styles.username}>{folder.user.username}</Text>
        </TouchableOpacity>
      )}

      <View style={styles.folderHeader}>
        <View style={styles.folderIconContainer}>
          <Ionicons 
            name={folder.is_public ? "folder-open" : "folder"} 
            size={40} 
            color="#4c00b4" 
          />
        </View>
        <View style={styles.folderInfo}>
          <View style={styles.folderTitleRow}>
            <Text style={styles.folderTitle} numberOfLines={1}>
              {folder.title}
            </Text>
            {folder.is_public && (
              <View style={styles.publicBadge}>
                <Ionicons name="globe-outline" size={10} color="#4c00b4" />
                <Text style={styles.publicBadgeText}>Public</Text>
              </View>
            )}
          </View>
          {folder.description && (
            <Text style={styles.folderDescription} numberOfLines={2}>
              {folder.description}
            </Text>
          )}
          <View style={styles.folderStats}>
            <View style={styles.statItem}>
              <Ionicons name="albums-outline" size={14} color="#999" />
              <Text style={styles.folderStat}>
                {folder.item_count} {folder.item_count === 1 ? 'item' : 'items'}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="heart-outline" size={14} color="#999" />
              <Text style={styles.folderStat}>
                {folder.likes_count} {folder.likes_count === 1 ? 'like' : 'likes'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Preview Images */}
      {folder.preview_images && folder.preview_images.length > 0 && (
        <View style={styles.previewContainer}>
          {folder.preview_images.slice(0, 4).map((img, index) => (
            <Image
              key={index}
              source={{ uri: img }}
              style={styles.previewImage}
            />
          ))}
        </View>
      )}

      {/* Action Buttons (only for own folders) */}
      {isOwn && (
        <View style={styles.folderActions}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={(e) => {
              e.stopPropagation();
              handleDeleteFolder(folder.id, folder.title);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={16} color="#dc2626" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading && popularFolders.length === 0 && myFolders.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4c00b4" />
        <Text style={styles.loadingText}>Loading folders...</Text>
      </View>
    );
  }

  const currentFolders = activeTab === 'my_folders' ? myFolders : popularFolders;
  const isOwnTab = activeTab === 'my_folders';

  return (
    <View style={styles.container}>
      {/* Header with Tabs */}
      <View style={styles.header}>
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'popular' && styles.tabButtonActive]}
            onPress={() => setActiveTab('popular')}
          >
            <Text style={[styles.tabText, activeTab === 'popular' && styles.tabTextActive]}>
              Popular
            </Text>
          </TouchableOpacity>
          
          {isAuthenticated && (
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'my_folders' && styles.tabButtonActive]}
              onPress={() => setActiveTab('my_folders')}
            >
              <Text style={[styles.tabText, activeTab === 'my_folders' && styles.tabTextActive]}>
                My Folders
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {activeTab === 'my_folders' && (
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Folders List */}
      <ScrollView style={styles.scrollView}>
        {currentFolders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={80} color="#ccc" />
            <Text style={styles.emptyText}>
              {isOwnTab ? 'No folders yet' : 'No popular folders'}
            </Text>
            <Text style={styles.emptySubtext}>
              {isOwnTab 
                ? 'Create a folder to organize your favorites'
                : 'Be the first to create a popular folder!'
              }
            </Text>
            {isOwnTab && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setModalVisible(true)}
              >
                <Text style={styles.emptyButtonText}>Create Your First Folder</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          currentFolders.map((folder) => renderFolder(folder, isOwnTab))
        )}
      </ScrollView>

      {/* Create Folder Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Folder</Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setNewFolderTitle('');
                  setNewFolderDescription('');
                  setIsPublic(false);
                }}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., My Favorite Action Anime"
              value={newFolderTitle}
              onChangeText={setNewFolderTitle}
              maxLength={255}
              editable={!loading}
            />

            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add a description..."
              value={newFolderDescription}
              onChangeText={setNewFolderDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!loading}
            />

            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setIsPublic(!isPublic)}
              disabled={loading}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, isPublic && styles.checkboxChecked]}>
                {isPublic && <Ionicons name="checkmark" size={18} color="#fff" />}
              </View>
              <View style={styles.checkboxLabelContainer}>
                <Text style={styles.checkboxLabel}>Make this folder public</Text>
                <Text style={styles.checkboxSubtext}>
                  Others will be able to view this folder
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  setNewFolderTitle('');
                  setNewFolderDescription('');
                  setIsPublic(false);
                }}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  loading && styles.submitButtonDisabled
                ]}
                onPress={handleCreateFolder}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="add-circle" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>Create</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flex: 1,
  },
  tabButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: '#fff',
  },
  createButton: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm + 4,
    paddingBottom: Spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  userAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: Spacing.sm,
  },
  userAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
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
  previewContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm + 4,
  },
  previewImage: {
    width: 60,
    height: 90,
    borderRadius: 6,
    backgroundColor: Colors.surfaceVariant,
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
    gap: 6,
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
});