import { Ionicons } from '@expo/vector-icons';
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

const API_BASE_URL = 'http://localhost:3000';

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
  const [searchQuery, setSearchQuery] = useState('');
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
  
  const [results, setResults] = useState<Media[]>([]);
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

      // If there's a search query, use the search endpoint
      if (searchQuery.trim()) {
        url += '/search';
        params.append('query', searchQuery);
        
        // Add filters to search
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

        // Client-side filtering for the rest
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

        setResults(data);
      } else {
        // No search query - use filter endpoint
        url += '/filtering';
        params.append('limit', '50');
        
        // Add all filters as comma-separated values
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
        setResults(data);
      }
    } catch (err: any) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const renderMediaItem = ({ item }: { item: Media }) => (
    <TouchableOpacity style={styles.mediaCard}>
      {item.cover_image ? (
        <Image source={{ uri: item.cover_image }} style={styles.coverImage} />
      ) : (
        <View style={[styles.coverImage, styles.placeholderImage]}>
          <Ionicons name="image-outline" size={30} color="#ccc" />
        </View>
      )}
      <Text style={styles.mediaTitle} numberOfLines={2}>
        {item.title_english || item.title_romaji}
      </Text>
      {item.average_score && (
        <View style={styles.scoreContainer}>
          <Ionicons name="star" size={12} color="#FFD700" />
          <Text style={styles.scoreText}>{item.average_score}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (showResults) {
    return (
      <View style={styles.container}>
        <View style={styles.resultsHeader}>
          <TouchableOpacity onPress={() => setShowResults(false)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.resultsTitle}>
            {results.length} {results.length === 1 ? 'Result' : 'Results'}
          </Text>
          <TouchableOpacity onPress={clearAllFilters}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#4c00b4" />
          </View>
        ) : results.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="search-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No results found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
          </View>
        ) : (
          <FlatList
            data={results}
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
      {/* Header with Search */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search titles..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

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
              color="#666"
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
                    <Ionicons name="checkmark" size={18} color="#4c00b4" />
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
              color="#666"
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
                    <Ionicons name="checkmark" size={18} color="#4c00b4" />
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
              color="#666"
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
                      color="#666"
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
                            <Ionicons name="checkmark" size={18} color="#4c00b4" />
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
              color="#666"
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
                    <Ionicons name="checkmark" size={18} color="#4c00b4" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Search Button */}
      {hasActiveFilters() && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.searchButton} onPress={fetchResults}>
            <Ionicons name="search" size={20} color="#fff" />
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 45,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filtersContainer: {
    flex: 1,
  },
  filterSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  filterHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  filterBadge: {
    backgroundColor: '#4c00b4',
    borderRadius: 10,
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
    backgroundColor: '#fafafa',
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterOptionSelected: {
    backgroundColor: '#f0e6ff',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#333',
  },
  filterOptionTextSelected: {
    color: '#4c00b4',
    fontWeight: '600',
  },
  subOptions: {
    backgroundColor: '#f5f5f5',
    paddingLeft: 20,
  },
  subOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  bottomBar: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  searchButton: {
    flexDirection: 'row',
    backgroundColor: '#4c00b4',
    paddingVertical: 15,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
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
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  clearText: {
    fontSize: 16,
    color: '#4c00b4',
    fontWeight: '600',
  },
  resultsGrid: {
    padding: 15,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  mediaCard: {
    width: '31%',
    marginBottom: 20,
  },
  coverImage: {
    width: '100%',
    aspectRatio: 2/3,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaTitle: {
    fontSize: 12,
    color: '#333',
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
    color: '#666',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 5,
  },
});

export default SearchScreen;