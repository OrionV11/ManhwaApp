// app/user/[id]/folders.tsx
import { Colors } from '@/constants/theme';
import { api, ApiError } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { useGlobalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Folder = {
  id: number;
  title: string;
  description?: string;
  is_public: boolean;
  likes_count: number;
  item_count: number;
  created_at: string;
  preview_images?: string[];
};

export default function UserFoldersScreen() {
  const { id } = useGlobalSearchParams<{ id: string }>();
  const router = useRouter();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  console.log('User ID param:', id);
  // Only fetch when id is a real value
  if (id && id !== '[id]') {
    fetchFolders();
  }
}, [id]);

  const fetchFolders = async () => {
    setLoading(true);
    try {
      const data = await api.get<Folder[]>(`/api/users/${id}/folders`, false);
      setFolders(data);
    } catch (error) {
      console.error('Error fetching folders:', error);
      if (error instanceof ApiError) {
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFolderPress = (folderId: number) => {
  router.push(`/folders/${folderId}`);
};

  const renderFolder = ({ item }: { item: Folder }) => (
    <TouchableOpacity
      style={styles.folderCard}
      onPress={() => handleFolderPress(item.id)}
    >
      <View style={styles.folderHeader}>
        <View style={styles.folderIcon}>
          <Ionicons name="folder" size={32} color="#4c00b4" />
        </View>
        <View style={styles.folderInfo}>
          <Text style={styles.folderTitle}>{item.title}</Text>
          {item.description && (
            <Text style={styles.folderDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>
        {!item.is_public && (
          <View style={styles.privateBadge}>
            <Ionicons name="lock-closed" size={14} color="#666" />
          </View>
        )}
      </View>

      {/* Preview Images */}
      {item.preview_images && item.preview_images.length > 0 && (
        <View style={styles.previewContainer}>
          {item.preview_images.slice(0, 4).map((img, index) => (
            <Image
              key={index}
              source={{ uri: img }}
              style={styles.previewImage}
            />
          ))}
          {item.item_count > 4 && (
            <View style={styles.moreOverlay}>
              <Text style={styles.moreText}>+{item.item_count - 4}</Text>
            </View>
          )}
        </View>
      )}

      {/* Folder Stats */}
      <View style={styles.folderStats}>
        <View style={styles.stat}>
          <Ionicons name="film-outline" size={16} color="#666" />
          <Text style={styles.statText}>{item.item_count} items</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="heart-outline" size={16} color="#666" />
          <Text style={styles.statText}>{item.likes_count} likes</Text>
        </View>
        <Text style={styles.folderDate}>
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
        <Text style={styles.headerTitle}>Lists & Folders</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4c00b4" />
        </View>
      ) : folders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="folder-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No public folders yet</Text>
          <Text style={styles.emptySubtext}>
            This user hasn't created any public folders
          </Text>
        </View>
      ) : (
        <FlatList
          data={folders}
          renderItem={renderFolder}
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
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  folderCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  folderHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  folderIcon: {
    marginRight: 12,
  },
  folderInfo: {
    flex: 1,
  },
  folderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  folderDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  privateBadge: {
    backgroundColor: Colors.background,
    padding: 6,
    borderRadius: 6,
  },
  previewContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    position: 'relative',
  },
  previewImage: {
    width: 60,
    height: 90,
    borderRadius: 6,
  },
  moreOverlay: {
    width: 60,
    height: 90,
    borderRadius: 6,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 0,
  },
  moreText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  folderStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  folderDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 'auto',
  },
});