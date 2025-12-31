import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { User } from '../../services/Manhwa';
import ActivityList from './ActivityList';

const API_BASE_URL = 'http://localhost:3000';

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
  const [reviews, setReviews] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [tab, setTab] = useState<'You' | 'Friends' | 'Global'>('You');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);

  // Single useEffect that handles all tabs
  useEffect(() => {
    const fetchTabData = async () => {
      setLoading(true);

      try {
        if (tab === 'You') {
          // Fetch both reviews and favorites for "You" tab
          const [reviewRes, favoritesRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/reviews/user/${user.id}`),
            fetch(`${API_BASE_URL}/api/favorites/${user.id}`)
          ]);

          const reviewsData = await reviewRes.json();
          const favoritesData = await favoritesRes.json();

          setReviews(reviewsData);
          setFavorites(favoritesData);

          const formattedActivities: Activity[] = [
          ...reviewsData.map((review: any) => ({
            activity_id: review.id,
            activity_type: 'review',
            details: review.review_text,
            created_at: review.created_at,
            media: {
              id: review.media_id,
              title_romaji: review.title_romaji,
              title_english: review.title_english,
              cover_image: review.cover_image,
              type: review.type || 'ANIME'
            },
            user: {
              id: user.id,
              username: user.username,
              profile_picture: user.profile_picture
            }
          })),
          ...favoritesData.map((fav: any) => ({
            activity_id: fav.id,
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
              profile_picture: user.profile_picture
            }
          }))
        ];

        setActivities(formattedActivities);
          
          // Combine into activities format if needed
          // Or set activities separately based on your ActivityList component
          
        } else if (tab === 'Friends') {
          const res = await fetch(`${API_BASE_URL}/api/activity/feed?user_id=${user.id}`);
          if (res.ok) {
            const data = await res.json();
            setActivities(data);
          }
          
        }

      } catch (error) {
        console.error(`Error fetching ${tab} data:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchTabData();
  }, [tab, user.id]); // Refetch when tab or user.id changes

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        {['You', 'Friends'].map(t => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t as 'You' | 'Friends' | 'Global')}
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
        <ActivityList activities={activities} loading={loading} currentUserId={user.id} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabs: { 
    flexDirection: 'row', 
    borderBottomWidth: 1, 
    borderColor: '#eee',
    backgroundColor: '#fff'
  },
  tab: { 
    flex: 1, 
    padding: 12, 
    alignItems: 'center' 
  },
  tabActive: { 
    borderBottomWidth: 2, 
    borderColor: '#4c00b4' 
  },
  tabText: { 
    color: '#999' 
  },
  tabTextActive: { 
    color: '#4c00b4', 
    fontWeight: '600' 
  },
  scrollView: {
    flex: 1,
  },
});