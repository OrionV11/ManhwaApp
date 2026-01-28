import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
    followers_count: number;
    following_count: number;
  
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
      const data = await api.get<Stats>(`/api/stats/me`);
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
            followers_count: 0,
            following_count: 0,
          }
        });
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
      reviews: `/api/reviews/me`,
    };

    const url = urlMap[tabName];

    try {
      const data = await api.get<Media[]>(url);
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

  const handleViewFollowers = () => {
  router.push(`/user/${user.id}/followers`);
};

const handleViewFollowing = () => {
  router.push(`/user/${user.id}/following`);
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
    <View style={styles.container}>
      {/* Header - Fixed at top */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <Text style={styles.username}>{user.username}</Text>
          {user.bio && <Text style={styles.bio}>{user.bio}</Text>}
        </View>

        {/* Stats */}
        <View style={styles.stats}>
  <TouchableOpacity 
    style={styles.statBox} 
    onPress={handleViewFollowers}
  >
    <Text style={styles.statValue}>{stats?.stats?.followers_count || 0}</Text>
    <Text style={styles.statLabel}>Followers</Text>
  </TouchableOpacity>

  <TouchableOpacity 
    style={styles.statBox} 
    onPress={handleViewFollowing}
  >
    <Text style={styles.statValue}>{stats?.stats?.following_count || 0}</Text>
    <Text style={styles.statLabel}>Following</Text>
  </TouchableOpacity>

  <Stat label="Reading" value={stats?.stats?.reading_progress || 0} />
  <Stat label="Completed" value={stats?.stats?.completed || 0} />
  <Stat label="Favorites" value={stats?.stats?.fav_count || 0} />
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

      {/* Content - Each list handles its own scrolling */}
      {!error && (
        <>
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
        </>
      )}

      {/* Floating Settings Button - Only show for own profile */}
      {isOwnProfile && (
        <TouchableOpacity 
          style={styles.floatingSettingsButton}
          onPress={() => setSettingsVisible(true)}
        >
          <Ionicons name="settings" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Settings Modal */}
      {isOwnProfile && (
        <SettingsModal
          visible={settingsVisible}
          onClose={() => setSettingsVisible(false)}
          user={user}
        />
      )}
    </View>
  );
}  // ✅ Added closing brace

const Stat = ({ label, value }: { label: string; value: number }) => (
  <View style={styles.statBox}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderColor: '#4c00b4',
  },
  tabText: {
    color: '#999',
    fontSize: 12,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#4c00b4',
    fontWeight: '700',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4c00b4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  floatingSettingsButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4c00b4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});