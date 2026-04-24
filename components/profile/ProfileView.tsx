import { BorderRadius, Colors, Spacing } from '@/constants/theme';
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

// FIX 1: Added Review type
type Review = {
  id: number;
  media: {
    id: number;
    cover_image?: string;
    title_english?: string;
    title_romaji?: string;
    type?: string;
  };
  content: string;
  rating?: number;
  created_at: string;
  likes_count?: number;
};

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
  // FIX 2: Typed list to hold both Media and Review items
  const [list, setList] = useState<(Media | Review)[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);

  const router = useRouter();
  const { user: authUser, isAuthenticated } = useAuth();

  const isOwnProfile = authUser?.id === user.id;

  useEffect(() => {
    fetchStats();
  }, [user.id]); // FIX 3: Depend on user.id (primitive), not user object

  useEffect(() => {
    fetchTab(tab);
  }, [tab, user.id]); // FIX 4: Re-fetch when user changes too

  const handleMediaClick = (mediaId: number) => {
    router.push(`/media/${mediaId}`);
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      // FIX 5: Use correct endpoint based on whose profile this is
      const endpoint = isOwnProfile ? `/api/stats/me` : `/api/stats/${user.id}`;
      const data = await api.get<Stats>(endpoint);
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

    // FIX 6: Use correct endpoints based on whose profile this is
    const urlMap: Record<TabType, string> = isOwnProfile ? {
      favorites: `/api/favorites/me`,
      completed: `/api/reading-progress/completed/me`,
      reading: `/api/reading-progress/me`,
      reviews: `/api/reviews/me`,
    } : {
      favorites: `/api/favorites/${user.id}`,
      completed: `/api/reading-progress/completed/${user.id}`,
      reading: `/api/reading-progress/${user.id}`,
      reviews: `/api/reviews/user/${user.id}`,
    };

    const url = urlMap[tabName];

    try {
      const data = await api.get<(Media | Review)[]>(url);
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

  // FIX 7: Clear list when switching tabs to prevent stale data reaching ReviewList
  const handleTabChange = (newTab: TabType) => {
    setList([]);
    setTab(newTab);
  };

  const handleViewFollowers = () => {
    router.push(`/user/${user.id}/followers`);
  };

  const handleViewFollowing = () => {
    router.push(`/user/${user.id}/following`);
  };

  const tabs: TabType[] = ['reading', 'completed', 'favorites', 'reviews'];

  if (statsLoading && !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
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
              // FIX 8: Use handleTabChange instead of setTab directly
              onPress={() => handleTabChange(t)}
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

      {/* Content */}
      {!error && (
        <>
          {tab !== 'reviews' && (
            <MediaList
              data={list as Media[]}
              loading={loading}
              tab={tab}
              onMediaClick={handleMediaClick}
            />
          )}

          {tab === 'reviews' && (
            // FIX 9: Removed `as any` cast, now properly typed
            <ReviewsList
              data={list as Review[]}
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
}

const Stat = ({ label, value }: { label: string; value: number }) => (
  <View style={styles.statBox}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  headerContainer: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  header: {
    padding: Spacing.lg,
    paddingTop: 60,
    backgroundColor: Colors.surface,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  bio: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
  },
  tab: {
    flex: 1,
    padding: Spacing.sm + 4,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderColor: Colors.primary,
  },
  tabText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 4,
    borderRadius: BorderRadius.sm,
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
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});