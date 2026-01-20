import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Media, User } from '../../services/Manhwa';
import MediaList from './MediaList';
import ReviewsList from './ReviewList';
import SettingsModal from './SettingsModal';

const API_BASE_URL = 'http://localhost:3000';

type Props = {
  user: User;
  label: string;
  
};


export default function ProfileView({ user, label }: Props) {
  const [tab, setTab] = useState<'reading' | 'completed' | 'favorites' | 'reviews'>('reading');
  const [list, setList] = useState<Media[]>([]);
  const [stats, setStats] = useState<any>(null); // stats object from backend
  const [loading, setLoading] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const router = useRouter();
  // Fetch stats only once on mount
  useEffect(() => {
    fetchStats();
  }, [user]);

  // Fetch tab data every time tab changes
  useEffect(() => {
    fetchTab(tab);
  }, [tab]);

  const handleMediaClick = (mediaId: number) => {
    router.push(`/media/${mediaId}`)
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/stats/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        console.error('Failed to fetch stats', res.status);
      }
    } catch (err) {
      console.error('Error fetching stats', err);
    }
  };

  const fetchTab = async (tabName: string) => {
    setLoading(true);
    let url = '';

    if (tabName === 'favorites') {
      url = `/api/favorites/${user.id}`;
    } else if (tabName === 'completed') {
      url = `/api/reading-progress/completed/${user.id}`;
    } else if (tabName === 'reading') {
      url = `/api/reading-progress/${user.id}`;
    } else if (tabName === 'reviews') {
      url = `/api/reviews/user/${user.id}`;
    } else {
      console.error('Unknown tab', tabName);
      setLoading(false);
      return;
    }


    try {
      const res = await fetch(`${API_BASE_URL}${url}`);
      if (res.ok) setList(await res.json());
    } catch (err) {
      console.error(`Error fetching ${tabName}`, err);
    } finally {
      setLoading(false);
    }
  };


  return (
    <ScrollView>
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
        {['reading', 'completed', 'favorites', 'reviews'].map(t => (
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
      />
      )}

     
     {/* Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => {
            router.push(`/user-lists`)
          }}>
          <Text>Lists</Text>  
          </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => router.push('../../screens/ProfileReadList')}>
            <Text>Read List </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => router.push('../../screens/ProfileLikes')}>
            <Text>Likes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('../../screens/ProfileReviews')}>
            <Text>Reviews</Text>
        </TouchableOpacity>
  
        <Action label="Following"/>
        <Action label="Followers"/>
       
        <TouchableOpacity onPress={() => {
          console.log('setttings clicked');
          setSettingsVisible(true)}}>
          <Text>Settings</Text>
        </TouchableOpacity>

      </View>
      <SettingsModal
          visible={settingsVisible}
          onClose={() => setSettingsVisible(false)}
          user={user}
          />
    </ScrollView>

  );

}


const Stat = ({ label, value }: { label: string; value: number }) => (
  <View style={styles.statBox}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const Action = ({ label }: { label: string }) => (
  <TouchableOpacity style={styles.action}>
    <Text>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  header: { alignItems: 'center', padding: 20 },
  username: { fontSize: 22, fontWeight: '700' },
  bio: { marginTop: 6, color: '#666', textAlign: 'center' },

  stats: { flexDirection: 'row', justifyContent: 'space-around', padding: 10 },
  statBox: { alignItems: 'center' },
  statValue: { fontWeight: '700', fontSize: 18 },
  statLabel: { fontSize: 12, color: '#777' },

  actions: { margin: 10, flexDirection: 'column', justifyContent: 'space-around', gap: 12, alignItems: 'center' },
  action: { padding: 10, backgroundColor: '#eee', borderRadius: 8 },

  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#eee' },
  tab: { flex: 1, padding: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderColor: '#4c00b4' },
  tabText: { color: '#999' },
  tabTextActive: { color: '#4c00b4', fontWeight: '600' },
});
