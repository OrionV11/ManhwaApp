// components/search/UserSearch.tsx

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

import { api, ApiError } from '../../utils/api';

type UserSearchResult = {
  id: number;
  username: string;
  bio?: string;
  profile_picture?: string;
  followers_count?: number;
  following_count?: number;
};

export default function UserSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();
  
  const router = useRouter();

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const results = await api.get<UserSearchResult[]>(
        `/api/users/search?q=${encodeURIComponent(query.trim())}`
      );
      setUsers(results);
    } catch (error) {
      console.error('Search error:', error);
      if (error instanceof ApiError) {
        // Handle error silently for search
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUserPress = (userId: number) => {
    router.push(`/user/${userId}`);
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4c00b4" />
        </View>
      ) : users.length > 0 ? (
        <FlatList
          data={users}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.userCard}
              onPress={() => handleUserPress(item.id)}
            >
              <View style={styles.userInfo}>
                {item.profile_picture ? (
                  <Image
                    source={{ uri: item.profile_picture }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={24} color="#999" />
                  </View>
                )}
                <View style={styles.userDetails}>
                  <Text style={styles.username}>{item.username}</Text>
                  {item.bio && (
                    <Text style={styles.bio} numberOfLines={2}>
                      {item.bio}
                    </Text>
                  )}
                  <View style={styles.stats}>
                    <Text style={styles.statText}>
                      {item.followers_count || 0} followers
                    </Text>
                    <Text style={styles.statDivider}>•</Text>
                    <Text style={styles.statText}>
                      {item.following_count || 0} following
                    </Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          )}
        />
      ) : searchQuery.length > 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No users found</Text>
          <Text style={styles.emptySubtext}>
            Try searching for a different username
          </Text>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Search for users</Text>
          <Text style={styles.emptySubtext}>
            Find friends and see what they're watching
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#999',
  },
  statDivider: {
    marginHorizontal: 8,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});