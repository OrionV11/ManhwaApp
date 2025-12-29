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
  const [tab, setTab] = useState<'You' | 'Friends' | 'Global'>('You');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTab(tab);
  }, [tab]);

  const fetchTab = async (tabName: string) => {
    setLoading(true);
    let url = '';

    if (tabName === 'You') {
      url = `/api/reviews/user/${user.id}`;
    } else if (tabName === 'Friends') {
      url = `/api/activity/feed?user_id=${user.id}`;
    } else if (tabName === 'Global') {
      url = `/api/activity/global`;
    } else {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}${url}`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch (err) {
      console.error(`Error fetching ${tabName} activities`, err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        {['You', 'Friends', 'Global'].map(t => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t as any)}
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