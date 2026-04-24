import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import MediaList from '@/components/profile/MediaList';
import { useAuth } from '@/contexts/AuthContext';
import { Media } from '@/services/Manhwa';
import { api, ApiError } from '@/utils/api';


type Props = {
  label?: string;
}

export default function ProfileReadList({ label }: Props) {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Media[]>([]);
  const [tab, setTab] = useState<'reading' | 'completed'>('reading');
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const handleMediaClick = (mediaId: number) => {
    router.push(`/media/${mediaId}`);
  };

  const getReadingList = async (status: 'reading' | 'completed') => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const endpoint = status === 'completed' 
        ? `/api/reading-progress/completed/me`
        : `/api/reading-progress/me`;
      
      const data = await api.get<Media[]>(endpoint);
      setList(data);
    } catch (error) {
      console.error('Error fetching reading list:', error);
      if (error instanceof ApiError) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Error', 'Failed to load reading list');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      getReadingList(tab);
    }
  }, [user?.id, tab]);

  // Show login prompt if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="book-outline" size={64} color="#ccc" />
        <Text style={styles.notLoggedInTitle}>Login Required</Text>
        <Text style={styles.notLoggedInText}>
          Please log in to view your reading list
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Reading List</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'reading' && styles.tabActive]}
          onPress={() => setTab('reading')}
        >
          <Text style={[styles.tabText, tab === 'reading' && styles.tabTextActive]}>
            Currently Reading
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'completed' && styles.tabActive]}
          onPress={() => setTab('completed')}
        >
          <Text style={[styles.tabText, tab === 'completed' && styles.tabTextActive]}>
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView}>
        {loading && list.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4c00b4" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : list.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons 
              name={tab === 'reading' ? 'book-outline' : 'checkmark-circle-outline'} 
              size={80} 
              color="#ccc" 
            />
            <Text style={styles.emptyText}>
              {tab === 'reading' ? 'Not reading anything yet' : 'No completed items'}
            </Text>
            <Text style={styles.emptySubtext}>
              {tab === 'reading' 
                ? 'Start reading manga and anime to track your progress'
                : 'Items you complete will appear here'
              }
            </Text>
          </View>
        ) : (
          <MediaList
            data={list}
            loading={loading}
            tab={tab}
            onMediaClick={handleMediaClick}
          />
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

  loadingContainer: {}
});