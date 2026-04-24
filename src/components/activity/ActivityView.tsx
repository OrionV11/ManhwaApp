import { Colors, Spacing } from '@/constants/theme';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { User } from '../../services/Manhwa';
import { api, ApiError } from '../../utils/api';
import ActivityList from './ActivityList';

type Activity = {
  activity_id: number;
  user?: {
    id: number;
    username: string;
    profile_picture?: string;
  };
  media?: {
    id: number;
    title_romaji: string;
    title_english?: string;
    cover_image?: string;
    type: string;
  };
  activity_type: string;
  details?: string;
  created_at: string;
};

type Props = {
  user: User;
};

export default function ActivityView({ user }: Props) {
  const [tab, setTab] = useState<'You' | 'Friends'>('You');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch activities when tab changes
  useEffect(() => {
    fetchTabData();
  }, [tab]);

  const fetchTabData = async () => {
    setLoading(true);

    try {
      if (tab === 'You') {
        // Fetch user's own activities (reviews and favorites)
        const [reviewsData, favoritesData] = await Promise.all([
          api.get(`/api/reviews/me`),  
          api.get(`/api/favorites/me`)  
        ]);

        // Format activities from reviews and favorites
        const formattedActivities: Activity[] = [
          ...reviewsData.map((review: any) => ({
            activity_id: `review-${review.review_id || review.id}`,
            activity_type: 'review',
            details: review.content,
            created_at: review.created_at,
            media: review.media ? {
              id: review.media.id,
              title_romaji: review.media.title_romaji,
              title_english: review.media.title_english,
              cover_image: review.media.cover_image,
              type: review.media.type || 'ANIME'
            } : null,
            user: {
              id: user.id,
              username: user.username,
              profile_picture: user.profile_picture || undefined
            }
          })),
          ...favoritesData.map((fav: any) => ({
            activity_id: `favorite-${fav.id}`,
            activity_type: 'favorite',
            created_at: fav.created_at || new Date().toISOString(),
            media: {
              id: fav.id,
              title_romaji: fav.title_romaji,
              title_english: fav.title_english,
              cover_image: fav.cover_image,
              type: fav.type || 'ANIME'
            },
            user: {
              id: user.id,
              username: user.username,
              profile_picture: user.profile_picture || undefined
            }
          }))
        ];

        // Sort by created_at (newest first)
        formattedActivities.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setActivities(formattedActivities);
          
      } else if (tab === 'Friends') {
        // Fetch friends' activities from feed endpoint
        const data = await api.get<Activity[]>(`/api/activity/feed`);
        setActivities(data);
      }

    } catch (error) {
      console.error(`Error fetching ${tab} data:`, error);
      if (error instanceof ApiError) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Error', `Failed to load ${tab} activities`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        {['You', 'Friends'].map(t => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t as 'You' | 'Friends')}
            style={[styles.tab, tab === t && styles.tabActive]}
          >
            <Text style={tab === t ? styles.tabTextActive : styles.tabText}>
              {t.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView}>
        <ActivityList 
          activities={activities} 
          loading={loading} 
          currentUserId={user.id} 
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabs: { 
    flexDirection: 'row', 
    borderBottomWidth: 1, 
    borderColor: Colors.border,
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
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextActive: { 
    color: Colors.primary, 
    fontWeight: '700',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
});