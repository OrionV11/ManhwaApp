import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Media, User } from '../../services/Manhwa';
import { api, ApiError } from '../../utils/api';
import MediaList from './MediaList';
import ReviewsList from './ReviewList';
import SettingsModal from './SettingsModal';

type TabType = 'reading' | 'completed' | 'favorites' | 'reviews';

type Stats = {
  stats: {
    reading_progress: number;
    completed: number;
    fav_count: number;
    followers: number;
    reviews: number;
  };
};

type Props = {
  user: User;
  label: string;
};

export default function ProfileView({ user, label }: Props) {
  const [tab, setTab] = useState<TabType>('reading');
  const [list, setList] = useState<Media[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  
  const router = useRouter();
  const { user: authUser, isAuthenticated } = useAuth();

  useEffect(() => {
    fetchStats();
  }, [user.id]);

  useEffect(() => {
    fetchTab(tab);
  }, [tab]);

  const handleMediaClick = (mediaId: number) => {
    router.push(`/media/${mediaId}`);
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const data = await api.get<Stats>(`/api/stats/me`, true, true);
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      if (err instanceof ApiError && err.status !== 401) {
        setStats({
          stats: {
          reading_progress: 0,
          completed: 0,
          fav_count: 0,
          followers: 0,
          reviews: 0,
          }
        })
        // Don't show error for auth issues as they're handled globally
        setError('Failed to load stats');
      }
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchTab = async (tabName: TabType) => {
    setLoading(true);
    setError(null);
    
    const urlMap: Record<TabType, string> = {
      favorites: `/api/favorites/me`,
      completed: `/api/reading-progress/completed/me`,
      reading: `/api/reading-progress/me`,
      reviews: `/api/reviews/user/me`,
    };

    const url = urlMap[tabName];

    try {
      const data = await api.get<Media[]>(url, isAuthenticated);
      setList(data);
    } catch (err) {
      console.error(`Error fetching ${tabName}:`, err);
      if (err instanceof ApiError && err.status !== 401) {
        setError(`Failed to load ${tabName}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const tabs: TabType[] = ['reading', 'completed', 'favorites', 'reviews'];
  const isOwnProfile = authUser?.id === user.id;

  if (statsLoading && !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4c00b4" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.username}>{user.username}</Text>
        {user.bio && <Text style={styles.bio}>{user.bio}</Text>}
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <Stat label="Reading" value={stats?.stats?.reading_progress || 0} />
        <Stat label="Completed" value={stats?.stats?.completed || 0} />
        <Stat label="Favorites" value={stats?.stats?.fav_count || 0} />
        <Stat label="Followers" value={stats?.stats?.followers || 0} />
        <Stat label="Reviews" value={stats?.stats?.reviews || 0} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {tabs.map(t => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && styles.tabActive]}
          >
            <Text style={tab === t ? styles.tabTextActive : styles.tabText}>
              {t.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchTab(tab)} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      {tab !== 'reviews' && (
        <MediaList
          data={list}
          loading={loading}
          tab={tab}
          onMediaClick={handleMediaClick}
        />
      )}
              
      {tab === 'reviews' && (
        <ReviewsList 
          data={list as any} 
          loading={loading} 
          tab="reviews"
          userId={isOwnProfile ? user.id : undefined}
          onRefresh={() => fetchTab('reviews')}
        />
      )}

      {/* Action Buttons - Only show for own profile */}
      {isOwnProfile && (
        <View style={styles.actions}>
          <ActionButton 
            label="Lists" 
            onPress={() => router.push('/user-lists')} 
          />
          <ActionButton 
            label="Read List" 
            onPress={() => router.push('/screens/ProfileReadList')} 
          />
          <ActionButton 
            label="Likes" 
            onPress={() => router.push('/screens/ProfileLikes')} 
          />
          <ActionButton 
            label="Reviews" 
            onPress={() => router.push('/screens/ProfileReviews')} 
          />
          <ActionButton label="Following" onPress={() => {}} />
          <ActionButton label="Followers" onPress={() => {}} />
          <ActionButton 
            label="Settings" 
            onPress={() => setSettingsVisible(true)} 
          />
        </View>
      )}

      {isOwnProfile && (
        <SettingsModal
          visible={settingsVisible}
          onClose={() => setSettingsVisible(false)}
          user={user}
        />
      )}
    </ScrollView>
  );
}

const Stat = ({ label, value }: { label: string; value: number }) => (
  <View style={styles.statBox}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const ActionButton = ({ label, onPress }: { label: string; onPress: () => void }) => (
  <TouchableOpacity style={styles.action} onPress={onPress}>
    <Text style={styles.actionText}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingTop: 100,
  },
  header: { alignItems: 'center', padding: 20 },
  username: { fontSize: 22, fontWeight: '700' },
  bio: { marginTop: 6, color: '#666', textAlign: 'center' },

  stats: { flexDirection: 'row', justifyContent: 'space-around', padding: 10 },
  statBox: { alignItems: 'center' },
  statValue: { fontWeight: '700', fontSize: 18 },
  statLabel: { fontSize: 12, color: '#777' },

  actions: { margin: 20, gap: 12 },
  action: { padding: 14, backgroundColor: '#eee', borderRadius: 8, alignItems: 'center' },
  actionText: { fontSize: 16, fontWeight: '500' },

  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#eee' },
  tab: { flex: 1, padding: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderColor: '#4c00b4' },
  tabText: { color: '#999' },
  tabTextActive: { color: '#4c00b4', fontWeight: '600' },

  errorContainer: { 
    padding: 16, 
    backgroundColor: '#ffe6e6', 
    margin: 10, 
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: { color: '#cc0000', textAlign: 'center', marginBottom: 8 },
  retryButton: { 
    paddingVertical: 8, 
    paddingHorizontal: 16,
    backgroundColor: '#4c00b4',
    borderRadius: 6,
  },
  retryText: { color: '#fff', fontWeight: '600' },
});