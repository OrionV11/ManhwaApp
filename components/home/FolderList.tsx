import Loading from '@/constants/Loading';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
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

export default function FoldersList() {
  const router = useRouter();
  const [popularFolders, setPopularFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPopularFolders();
  }, []);

  const fetchPopularFolders = async () => {
    setLoading(true);
    try {
      const data = await api.get<Folder[]>(
        `/api/folders/public?sort=popular&limit=50`,
        false
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

  const handleOpenFolder = (folderId: number) => {
    router.push(`/folders/${folderId}`);
  };

  const handleUserClick = (userId: number) => {
    router.push(`/user/${userId}`);
  };

  const renderFolder = (folder: Folder) => (
    <TouchableOpacity
      key={folder.id}
      style={styles.folderCard}
      onPress={() => handleOpenFolder(folder.id)}
      activeOpacity={0.7}
    >
      {/* User Info */}
      {folder.user && (
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
            name="folder-open"
            size={40}
            color="#4c00b4"
          />
        </View>
        <View style={styles.folderInfo}>
          <View style={styles.folderTitleRow}>
            <Text style={styles.folderTitle} numberOfLines={1}>
              {folder.title}
            </Text>
            <View style={styles.publicBadge}>
              <Ionicons name="globe-outline" size={10} color="#4c00b4" />
              <Text style={styles.publicBadgeText}>Public</Text>
            </View>
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
    </TouchableOpacity>
  );

  if (loading) {
    return (
    <View style={styles.loadingContainer}>
      <Loading />
    </View>
  );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {popularFolders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={80} color="#ccc" />
            <Text style={styles.emptyText}>No popular folders</Text>
            <Text style={styles.emptySubtext}>
              Be the first to create a popular folder!
            </Text>
          </View>
        ) : (
          popularFolders.map((folder) => renderFolder(folder))
        )}
      </ScrollView>
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
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

});