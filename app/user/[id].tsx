// app/user/[id].tsx

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { api, ApiError } from '../utils/api';

type UserProfile = {
  id: number;
  username: string;
  bio?: string;
  profile_picture?: string;
  created_at: string;
  stats: {
    followers_count: number;
    following_count: number;
    reviews_count: number;
    favorites_count: number;
    folders_count: number;
  };
  is_following?: boolean;
};

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProfile();
    }
  }, [id]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await api.get<UserProfile>(
        `/api/users/${id}/profile`,
        false  // Public endpoint, no auth required
      );
      console.log(' Profile data received: ', JSON.stringify(data, null, 2));
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (error instanceof ApiError) {
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      Alert.alert('Login Required', 'Please log in to follow users');
      router.push('/login');
      return;
    }

    setFollowLoading(true);
    try {
      if (profile?.is_following) {
        await api.delete(`/api/users/${id}/follow`);
        Alert.alert('Success', 'Unfollowed user');
      } else {
        await api.post(`/api/users/${id}/follow`, {});
        Alert.alert('Success', 'Following user');
      }
      fetchProfile(); // Refresh to update follow status
    } catch (error) {
      console.error('Follow error:', error);
      if (error instanceof ApiError) {
        Alert.alert('Error', error.message);
      }
    } finally {
      setFollowLoading(false);
    }
  };

  const handleViewFollowers = () => {
    router.push(`/user/${id}/followers`);
  };

  const handleViewFollowing = () => {
    router.push(`/user/${id}/following`);
  };

  const handleViewReviews = () => {
    router.push(`/user/${id}/reviews`);
  };

  const handleViewFavorites = () => {
    router.push(`/user/${id}/favorites`);
  };

  const handleViewFolders = () => {
  router.push(`/user/${id}/folders`);
};

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4c00b4" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>User not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
      </View>

      {/* Profile Info */}
      <View style={styles.profileSection}>
        {profile.profile_picture ? (
          <Image source={{ uri: profile.profile_picture }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={60} color="#999" />
          </View>
        )}
        
        <Text style={styles.username}>{profile.username}</Text>
        {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

        {/* Stats */}
        <View style={styles.stats}>
            <TouchableOpacity style={styles.stat} onPress={handleViewFollowers}>
                <Text style={styles.statValue}>{profile?.stats?.followers_count ?? 0}</Text>
                <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.stat} onPress={handleViewFollowing}>
                <Text style={styles.statValue}>{profile?.stats?.following_count ?? 0}</Text>
                <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.stat} onPress={handleViewReviews}>
                <Text style={styles.statValue}>{profile?.stats?.reviews_count ?? 0}</Text>
                <Text style={styles.statLabel}>Reviews</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.stat} onPress={handleViewFavorites}>
                <Text style={styles.statValue}>{profile?.stats?.favorites_count ?? 0}</Text>
                <Text style={styles.statLabel}>Favorites</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contentCard} onPress={handleViewFolders}>
                <Ionicons name="folder" size={24} color="#4c00b4" />
                <View style={styles.contentInfo}>
                    <Text style={styles.contentTitle}>Lists & Folders</Text>
                    <Text style={styles.contentCount}>{profile?.stats?.folders_count ?? 0} folders</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>

        </View>
        {/* Follow Button - Only show if NOT own profile */}
        {!isOwnProfile && currentUser && (
          <TouchableOpacity
            style={[
              styles.followButton,
              profile.is_following && styles.followingButton
            ]}
            onPress={handleFollow}
            disabled={followLoading}
          >
            {followLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons 
                  name={profile.is_following ? "checkmark-circle" : "person-add"} 
                  size={20} 
                  color="#fff" 
                />
                <Text style={styles.followButtonText}>
                  {profile.is_following ? 'Following' : 'Follow'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* View Own Profile Button - If viewing someone else's profile */}
        {isOwnProfile && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Ionicons name="settings" size={20} color="#4c00b4" />
            <Text style={styles.editButtonText}>Go to My Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Public Content Tabs */}
      <View style={styles.contentSection}>
        <Text style={styles.sectionTitle}>Public Activity</Text>
        
        <TouchableOpacity style={styles.contentCard} onPress={handleViewReviews}>
  <Ionicons name="star" size={24} color="#4c00b4" />
  <View style={styles.contentInfo}>
    <Text style={styles.contentTitle}>Reviews</Text>
    <Text style={styles.contentCount}>{profile?.stats?.reviews_count ?? 0} reviews</Text>
  </View>
  <Ionicons name="chevron-forward" size={20} color="#999" />
</TouchableOpacity>

<TouchableOpacity style={styles.contentCard} onPress={handleViewFavorites}>
  <Ionicons name="heart" size={24} color="#4c00b4" />
  <View style={styles.contentInfo}>
    <Text style={styles.contentTitle}>Favorites</Text>
    <Text style={styles.contentCount}>{profile?.stats?.favorites_count ?? 0} favorites</Text>
  </View>
  <Ionicons name="chevron-forward" size={20} color="#999" />
</TouchableOpacity>

<TouchableOpacity style={styles.contentCard} onPress={handleViewFollowers}>
  <Ionicons name="people" size={24} color="#4c00b4" />
  <View style={styles.contentInfo}>
    <Text style={styles.contentTitle}>Followers</Text>
    <Text style={styles.contentCount}>{profile?.stats?.followers_count ?? 0} followers</Text>
  </View>
  <Ionicons name="chevron-forward" size={20} color="#999" />
</TouchableOpacity>

<TouchableOpacity style={styles.contentCard} onPress={handleViewFollowing}>
  <Ionicons name="people" size={24} color="#4c00b4" />
  <View style={styles.contentInfo}>
    <Text style={styles.contentTitle}>Following</Text>
    <Text style={styles.contentCount}>{profile?.stats?.following_count ?? 0} users</Text>
  </View>
  <Ionicons name="chevron-forward" size={20} color="#999" />
</TouchableOpacity>
      </View>
    </ScrollView>
  );
}

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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#4c00b4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
  },
  backBtn: {
    padding: 8,
  },
  profileSection: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  username: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  stats: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 20,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#4c00b4',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    minWidth: 140,
    justifyContent: 'center',
  },
  followingButton: {
    backgroundColor: '#666',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#4c00b4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  editButtonText: {
    color: '#4c00b4',
    fontSize: 16,
    fontWeight: '600',
  },
  contentSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginBottom: 16,
  },
  contentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 12,
  },
  contentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
  },
  contentCount: {
    fontSize: 14,
    color: '#666',
  },
});