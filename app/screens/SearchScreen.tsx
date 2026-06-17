// screens/SearchScreen.tsx

import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/utils/api';

const API_BASE_URL = 'https://manhwaapp-jn15.onrender.com';

interface Media {
  id: number;
  title_romaji: string;
  title_english: string | null;
  cover_image: string | null;
  type: string;
  genres: string[];
  average_score: number | null;
  status: string;
  start_date: string | null;
}

interface User {
  id: number;
  username: string;
  bio?: string;
  profile_picture?: string;
  followers_count?: number;
  following_count?: number;
}

type SearchMode = 'media' | 'users';

const DECADES = [
  { label: '2020s', value: '2020s', years: ['2020', '2021', '2022', '2023', '2024', '2025'] },
  { label: '2010s', value: '2010s', years: ['2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019'] },
  { label: '2000s', value: '2000s', years: ['2000', '2001', '2002', '2003', '2004', '2005', '2006', '2007', '2008', '2009'] },
  { label: '1990s', value: '1990s', years: ['1990', '1991', '1992', '1993', '1994', '1995', '1996', '1997', '1998', '1999'] },
  { label: '1980s', value: '1980s', years: ['1980', '1981', '1982', '1983', '1984', '1985', '1986', '1987', '1988', '1989'] },
];

const MEDIA_TYPES = [
  { label: 'Anime', value: 'ANIME' },
  { label: 'Manga', value: 'MANGA' },
  { label: 'Manhwa', value: 'MANHWA' },
  { label: 'Manhua', value: 'MANHUA' },
];

const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi',
  'Fantasy', 'Horror', 'Mahou Shoujo', 'Mecha', 'Music',
  'Mystery', 'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life',
  'Sports', 'Supernatural', 'Thriller'
];

const STATUSES = [
  { label: 'Releasing', value: 'RELEASING' },
  { label: 'Finished', value: 'FINISHED' },
  { label: 'Not Yet Released', value: 'NOT_YET_RELEASED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const SearchScreen = () => {
  const [searchMode, setSearchMode] = useState<SearchMode>('media');
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isAuthenticated } = useAuth();

  const [selectedFilters, setSelectedFilters] = useState({
    types: [] as string[],
    genres: [] as string[],
    statuses: [] as string[],
    years: [] as string[],
  });
  
  const [expandedSections, setExpandedSections] = useState({
    type: false,
    genre: false,
    status: false,
    decade: false,
  });

  const [expandedDecade, setExpandedDecade] = useState<string | null>(null);
  
  const [mediaResults, setMediaResults] = useState<Media[]>([]);
  const [userResults, setUserResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleFilter = (category: keyof typeof selectedFilters, value: string) => {
    setSelectedFilters(prev => {
      const current = prev[category];
      const newValues = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      
      return { ...prev, [category]: newValues };
    });
  };

  const clearAllFilters = () => {
    setSelectedFilters({
      types: [],
      genres: [],
      statuses: [],
      years: [],
    });
    setSearchQuery('');
    setShowResults(false);
  };

  const hasActiveFilters = () => {
    return searchQuery.length > 0 ||
           selectedFilters.types.length > 0 ||
           selectedFilters.genres.length > 0 ||
           selectedFilters.statuses.length > 0 ||
           selectedFilters.years.length > 0;
  };

  const switchMode = (mode: SearchMode) => {
    setSearchMode(mode);
    setSearchQuery('');
    setShowResults(false);
    setMediaResults([]);
    setUserResults([]);
    clearAllFilters();
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setUserResults([]);
      return;
    }

    setLoading(true);
    try {
      const results = await api.get<User[]>(
        `/api/users/search?q=${encodeURIComponent(query.trim())}`,
        false
      );
      setUserResults(results);
    } catch (error) {
      console.error('User search error:', error);
      setUserResults([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async () => {
    if (!hasActiveFilters()) {
      setShowResults(false);
      return;
    }

    setLoading(true);
    setShowResults(true);

    try {
      let url = `${API_BASE_URL}/api/media`;
      const params = new URLSearchParams();

      if (searchQuery.trim()) {
        url += '/search';
        params.append('query', searchQuery);
        
        if (selectedFilters.types.length > 0) {
          params.append('type', selectedFilters.types[0]);
        }
        
        if (selectedFilters.genres.length > 0) {
          params.append('genre', selectedFilters.genres[0]);
        }

        const response = await fetch(`${url}?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch results');
        }

        let data = await response.json();

        if (selectedFilters.statuses.length > 0) {
          data = data.filter((item: Media) => 
            selectedFilters.statuses.includes(item.status)
          );
        }

        if (selectedFilters.years.length > 0) {
          data = data.filter((item: Media) => {
            if (!item.start_date) return false;
            const year = new Date(item.start_date).getFullYear().toString();
            return selectedFilters.years.includes(year);
          });
        }

        if (selectedFilters.genres.length > 1) {
          data = data.filter((item: Media) =>
            selectedFilters.genres.some(genre => item.genres?.includes(genre))
          );
        }

        if (selectedFilters.types.length > 1) {
          data = data.filter((item: Media) =>
            selectedFilters.types.includes(item.type)
          );
        }

        setMediaResults(data);
      } else {
        url += '/filtering';
        params.append('limit', '50');
        
        if (selectedFilters.types.length > 0) {
          params.append('types', selectedFilters.types.join(','));
        }
        
        if (selectedFilters.genres.length > 0) {
          params.append('genres', selectedFilters.genres.join(','));
        }
        
        if (selectedFilters.statuses.length > 0) {
          params.append('statuses', selectedFilters.statuses.join(','));
        }
        
        if (selectedFilters.years.length > 0) {
          params.append('years', selectedFilters.years.join(','));
        }

        const response = await fetch(`${url}?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch results');
        }

        const data = await response.json();
        setMediaResults(data);
      }
    } catch (err: any) {
      console.error(err);
      setMediaResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMediaClick = (mediaId: number) => {
    router.push(`/media/${mediaId}`);
  };

  const handleUserClick = (userId: number) => {
    router.push(`/user/${userId}`);
  };

  const renderMediaItem = ({ item }: { item: Media }) => (
    <TouchableOpacity 
      style={styles.mediaCard}
      onPress={() => handleMediaClick(item.id)}
    >
      {item.cover_image ? (
        <Image source={{ uri: item.cover_image }} style={styles.coverImage} />
      ) : (
        <View style={[styles.coverImage, styles.placeholderImage]}>
          <Ionicons name="image-outline" size={30} color={Colors.textTertiary} />
        </View>
      )}
      <Text style={styles.mediaTitle} numberOfLines={2}>
        {item.title_english || item.title_romaji}
      </Text>
      {item.average_score && (
        <View style={styles.scoreContainer}>
          <Ionicons name="star" size={12} color={Colors.warning} />
          <Text style={styles.scoreText}>{item.average_score}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => handleUserClick(item.id)}
    >
      <View style={styles.userInfo}>
        {item.profile_picture ? (
          <Image
            source={{ uri: item.profile_picture }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={24} color={Colors.textSecondary} />
          </View>
        )}
        <View style={styles.userDetails}>
          <Text style={styles.username}>{item.username}</Text>
          {item.bio && (
            <Text style={styles.userBio} numberOfLines={2}>
              {item.bio}
            </Text>
          )}
          <View style={styles.userStats}>
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
      <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
    </TouchableOpacity>
  );

  if (showResults && searchMode === 'media') {
    return (
      <View style={styles.container}>
        <View style={styles.resultsHeader}>
          <TouchableOpacity onPress={() => setShowResults(false)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.resultsTitle}>
            {mediaResults.length} {mediaResults.length === 1 ? 'Result' : 'Results'}
          </Text>
          <TouchableOpacity onPress={clearAllFilters}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : mediaResults.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="search-outline" size={64} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No results found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
          </View>
        ) : (
          <FlatList
            data={mediaResults}
            renderItem={renderMediaItem}
            keyExtractor={(item) => item.id.toString()}
            numColumns={3}
            contentContainerStyle={styles.resultsGrid}
            columnWrapperStyle={styles.columnWrapper}
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>

        <View style={styles.modeTabs}>
          <TouchableOpacity
            style={[styles.modeTab, searchMode === 'media' && styles.modeTabActive]}
            onPress={() => switchMode('media')}
          >
            <Ionicons
              name="film"
              size={18}
              color={searchMode === 'media' ? Colors.primary : Colors.textSecondary}
            />
            <Text style={[styles.modeTabText, searchMode === 'media' && styles.modeTabTextActive]}>
              Media
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeTab, searchMode === 'users' && styles.modeTabActive]}
            onPress={() => switchMode('users')}
          >
            <Ionicons
              name="people"
              size={18}
              color={searchMode === 'users' ? Colors.primary : Colors.textSecondary}
            />
            <Text style={[styles.modeTabText, searchMode === 'users' && styles.modeTabTextActive]}>
              Users
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder={searchMode === 'media' ? 'Search titles...' : 'Search users...'}
            placeholderTextColor={Colors.textTertiary}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (searchMode === 'users') {
                searchUsers(text);
              }
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => {
              setSearchQuery('');
              setUserResults([]);
            }}>
              <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {searchMode === 'media' ? (
        <>
          <ScrollView style={styles.filtersContainer}>
            {/* Type Filter */}
            <View style={styles.filterSection}>
              <TouchableOpacity
                style={styles.filterHeader}
                onPress={() => toggleSection('type')}
              >
                <View style={styles.filterHeaderLeft}>
                  <Text style={styles.filterTitle}>Type</Text>
                  {selectedFilters.types.length > 0 && (
                    <View style={styles.filterBadge}>
                      <Text style={styles.filterBadgeText}>{selectedFilters.types.length}</Text>
                    </View>
                  )}
                </View>
                <Ionicons
                  name={expandedSections.type ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>

              {expandedSections.type && (
                <View style={styles.filterOptions}>
                  {MEDIA_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.filterOption,
                        selectedFilters.types.includes(type.value) && styles.filterOptionSelected
                      ]}
                      onPress={() => toggleFilter('types', type.value)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        selectedFilters.types.includes(type.value) && styles.filterOptionTextSelected
                      ]}>
                        {type.label}
                      </Text>
                      {selectedFilters.types.includes(type.value) && (
                        <Ionicons name="checkmark" size={18} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Genre Filter */}
            <View style={styles.filterSection}>
              <TouchableOpacity
                style={styles.filterHeader}
                onPress={() => toggleSection('genre')}
              >
                <View style={styles.filterHeaderLeft}>
                  <Text style={styles.filterTitle}>Genre</Text>
                  {selectedFilters.genres.length > 0 && (
                    <View style={styles.filterBadge}>
                      <Text style={styles.filterBadgeText}>{selectedFilters.genres.length}</Text>
                    </View>
                  )}
                </View>
                <Ionicons
                  name={expandedSections.genre ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>

              {expandedSections.genre && (
                <View style={styles.filterOptions}>
                  {GENRES.map((genre) => (
                    <TouchableOpacity
                      key={genre}
                      style={[
                        styles.filterOption,
                        selectedFilters.genres.includes(genre) && styles.filterOptionSelected
                      ]}
                      onPress={() => toggleFilter('genres', genre)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        selectedFilters.genres.includes(genre) && styles.filterOptionTextSelected
                      ]}>
                        {genre}
                      </Text>
                      {selectedFilters.genres.includes(genre) && (
                        <Ionicons name="checkmark" size={18} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Decade/Year Filter */}
            <View style={styles.filterSection}>
              <TouchableOpacity
                style={styles.filterHeader}
                onPress={() => toggleSection('decade')}
              >
                <View style={styles.filterHeaderLeft}>
                  <Text style={styles.filterTitle}>Year</Text>
                  {selectedFilters.years.length > 0 && (
                    <View style={styles.filterBadge}>
                      <Text style={styles.filterBadgeText}>{selectedFilters.years.length}</Text>
                    </View>
                  )}
                </View>
                <Ionicons
                  name={expandedSections.decade ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>

              {expandedSections.decade && (
                <View style={styles.filterOptions}>
                  {DECADES.map((decade) => (
                    <View key={decade.value}>
                      <TouchableOpacity
                        style={styles.filterOption}
                        onPress={() => {
                          if (expandedDecade === decade.value) {
                            setExpandedDecade(null);
                          } else {
                            setExpandedDecade(decade.value);
                          }
                        }}
                      >
                        <Text style={styles.filterOptionText}>{decade.label}</Text>
                        <Ionicons
                          name={expandedDecade === decade.value ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          color={Colors.textSecondary}
                        />
                      </TouchableOpacity>

                      {expandedDecade === decade.value && (
                        <View style={styles.subOptions}>
                          {decade.years.map((year) => (
                            <TouchableOpacity
                              key={year}
                              style={[
                                styles.subOption,
                                selectedFilters.years.includes(year) && styles.filterOptionSelected
                              ]}
                              onPress={() => toggleFilter('years', year)}
                            >
                              <Text style={[
                                styles.filterOptionText,
                                selectedFilters.years.includes(year) && styles.filterOptionTextSelected
                              ]}>
                                {year}
                              </Text>
                              {selectedFilters.years.includes(year) && (
                                <Ionicons name="checkmark" size={18} color={Colors.primary} />
                              )}
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Status Filter */}
            <View style={styles.filterSection}>
              <TouchableOpacity
                style={styles.filterHeader}
                onPress={() => toggleSection('status')}
              >
                <View style={styles.filterHeaderLeft}>
                  <Text style={styles.filterTitle}>Status</Text>
                  {selectedFilters.statuses.length > 0 && (
                    <View style={styles.filterBadge}>
                      <Text style={styles.filterBadgeText}>{selectedFilters.statuses.length}</Text>
                    </View>
                  )}
                </View>
                <Ionicons
                  name={expandedSections.status ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>

              {expandedSections.status && (
                <View style={styles.filterOptions}>
                  {STATUSES.map((status) => (
                    <TouchableOpacity
                      key={status.value}
                      style={[
                        styles.filterOption,
                        selectedFilters.statuses.includes(status.value) && styles.filterOptionSelected
                      ]}
                      onPress={() => toggleFilter('statuses', status.value)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        selectedFilters.statuses.includes(status.value) && styles.filterOptionTextSelected
                      ]}>
                        {status.label}
                      </Text>
                      {selectedFilters.statuses.includes(status.value) && (
                        <Ionicons name="checkmark" size={18} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          {hasActiveFilters() && (
            <View style={styles.bottomBar}>
              <TouchableOpacity style={styles.searchButton} onPress={fetchResults}>
                <Ionicons name="search" size={20} color="#fff" />
                <Text style={styles.searchButtonText}>Search</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      ) : (
        <View style={styles.userResultsContainer}>
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : userResults.length > 0 ? (
            <FlatList
              data={userResults}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.id.toString()}
            />
          ) : searchQuery.length > 0 ? (
            <View style={styles.centerContainer}>
              <Ionicons name="search-outline" size={64} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>No users found</Text>
              <Text style={styles.emptySubtext}>Try a different username</Text>
            </View>
          ) : (
            <View style={styles.centerContainer}>
              <Ionicons name="people-outline" size={64} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>Search for users</Text>
              <Text style={styles.emptySubtext}>
                Find friends and see what they're watching
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  headerTitle: {
    ...Typography.h1,
    marginBottom: Spacing.md,
  },
  modeTabs: {
    flexDirection: 'row',
    gap: Spacing.sm + 2,
    marginBottom: Spacing.md,
  },
  modeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 20,
    backgroundColor: Colors.surfaceVariant,
  },
  modeTabActive: {
    backgroundColor: Colors.highlight,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  modeTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  modeTabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.sm + 2,
    paddingHorizontal: Spacing.md,
    height: 45,
    gap: Spacing.sm + 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  filtersContainer: {
    flex: 1,
  },
  filterSection: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  filterHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 2,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  filterBadge: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm + 2,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  filterOptions: {
    backgroundColor: Colors.surfaceVariant,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterOptionSelected: {
    backgroundColor: Colors.highlight,
  },
  filterOptionText: {
    fontSize: 16,
    color: Colors.text,
  },
  filterOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  subOptions: {
    backgroundColor: Colors.background,
    paddingLeft: Spacing.lg,
  },
  subOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  bottomBar: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  searchButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm + 2,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm + 2,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backButton: {
    padding: 5,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  clearText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  resultsGrid: {
    padding: Spacing.md,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  mediaCard: {
    width: '31%',
    marginBottom: Spacing.lg,
  },
  coverImage: {
    width: '100%',
    aspectRatio: 2/3,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceVariant,
    marginBottom: Spacing.sm,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaTitle: {
    fontSize: 12,
    color: Colors.text,
    lineHeight: 16,
    marginBottom: 4,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  userResultsContainer: {
    flex: 1,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
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
    marginRight: Spacing.sm + 4,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm + 4,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  userBio: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  userStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  statDivider: {
    marginHorizontal: Spacing.sm,
    color: Colors.textTertiary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textTertiary,
    marginTop: 5,
  },
});

export default SearchScreen;