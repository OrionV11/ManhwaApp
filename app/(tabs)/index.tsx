import { BookOpen, Filter, Grid, List, Search, TrendingUp } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const API_BASE_URL = 'http://10.0.2.2:5000/api';

interface Webtoon {
  id: number;
  title: string;
  cover_url: string;
  description: string;
  genre: string;
  num_episodes: number;
  detail_url: string;
}

interface Stats {
  total_webtoons: number;
  total_episodes: number;
  genre_distribution: { genre: string; count: number }[];
}

export default function WebtoonApp() {
  const [webtoons, setWebtoons] = useState<Webtoon[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [pagination, setPagination] = useState<any>({});

  useEffect(() => {
    fetchWebtoons();
  }, [currentPage, selectedGenre]);

  useEffect(() => {
    fetchGenres();
    fetchStats();
  }, []);

  const fetchWebtoons = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '12'
      });
      
      if (selectedGenre) params.append('genre', selectedGenre);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`${API_BASE_URL}/webtoons?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setWebtoons(data.data);
        setPagination(data.pagination);
      } else {
        setError(data.error || 'Failed to fetch webtoons');
      }
    } catch (err) {
      setError('Unable to connect to the server. Make sure the Flask API is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  const fetchGenres = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/genres`);
      const data = await response.json();
      if (data.success) setGenres(data.data);
    } catch (err) {
      console.error('Failed to fetch genres:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stats`);
      const data = await response.json();
      if (data.success) setStats(data.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const openWebtoon = (url: string) => {
    Linking.openURL(url);
  };

  const renderWebtoonCard = ({ item }: { item: Webtoon }) => (
    <View style={styles.card}>
      <View style={styles.cardImage}>
        {item.cover_url ? (
          <Image 
            source={{ uri: item.cover_url }} 
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <BookOpen size={64} color="#9CA3AF" />
          </View>
        )}
        {item.genre && (
          <View style={styles.genreBadge}>
            <Text style={styles.genreBadgeText}>{item.genre}</Text>
          </View>
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.cardDescription} numberOfLines={3}>
          {item.description || 'No description available'}
        </Text>
        <View style={styles.cardFooter}>
          <View style={styles.episodeInfo}>
            <BookOpen size={16} color="#6B7280" />
            <Text style={styles.episodeText}>{item.num_episodes} episodes</Text>
          </View>
          <TouchableOpacity onPress={() => openWebtoon(item.detail_url)}>
            <Text style={styles.readLink}>Read →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderWebtoonList = ({ item }: { item: Webtoon }) => (
    <View style={styles.listItem}>
      <View style={styles.listImage}>
        {item.cover_url ? (
          <Image 
            source={{ uri: item.cover_url }} 
            style={styles.listImageImg}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.listPlaceholder}>
            <BookOpen size={32} color="#9CA3AF" />
          </View>
        )}
      </View>
      <View style={styles.listContent}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>{item.title}</Text>
          {item.genre && (
            <View style={styles.listGenreBadge}>
              <Text style={styles.genreBadgeText}>{item.genre}</Text>
            </View>
          )}
        </View>
        <Text style={styles.listDescription} numberOfLines={2}>
          {item.description || 'No description available'}
        </Text>
        <View style={styles.listFooter}>
          <View style={styles.episodeInfo}>
            <BookOpen size={16} color="#6B7280" />
            <Text style={styles.episodeText}>{item.num_episodes} episodes</Text>
          </View>
          <TouchableOpacity onPress={() => openWebtoon(item.detail_url)}>
            <Text style={styles.readLink}>Read →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTitle}>
            <BookOpen size={40} color="#9333EA" />
            <Text style={styles.headerText}>Webtoon Gallery</Text>
          </View>
          <Text style={styles.headerSubtitle}>Discover and explore amazing webtoons</Text>
        </View>
      </View>

      {stats && (
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <BookOpen size={20} color="#FFFFFF" />
            <Text style={styles.statText}>{stats.total_webtoons} Webtoons</Text>
          </View>
          <View style={styles.statItem}>
            <TrendingUp size={20} color="#FFFFFF" />
            <Text style={styles.statText}>{stats.total_episodes} Episodes</Text>
          </View>
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.filterSection}>
          <View style={styles.searchContainer}>
            <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search webtoons..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              onSubmitEditing={fetchWebtoons}
            />
          </View>

          <View style={styles.controlsRow}>
            <View style={styles.genrePickerContainer}>
              <Filter size={20} color="#9CA3AF" style={styles.filterIcon} />
              <TouchableOpacity style={styles.genrePicker}>
                <Text style={styles.genrePickerText}>
                  {selectedGenre || 'All Genres'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.viewToggle}>
              <TouchableOpacity
                onPress={() => setViewMode('grid')}
                style={[styles.viewButton, viewMode === 'grid' && styles.viewButtonActive]}
              >
                <Grid size={20} color={viewMode === 'grid' ? '#FFFFFF' : '#4B5563'} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setViewMode('list')}
                style={[styles.viewButton, viewMode === 'list' && styles.viewButtonActive]}
              >
                <List size={20} color={viewMode === 'list' ? '#FFFFFF' : '#4B5563'} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Error:</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#9333EA" />
          </View>
        )}

        {!loading && !error && (
          <>
            {webtoons.length === 0 ? (
              <View style={styles.emptyContainer}>
                <BookOpen size={64} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>No webtoons found</Text>
                <Text style={styles.emptySubtitle}>
                  Try adjusting your filters or run the scraper to add content
                </Text>
              </View>
            ) : (
              <>
                <FlatList
                  data={webtoons}
                  renderItem={viewMode === 'grid' ? renderWebtoonCard : renderWebtoonList}
                  keyExtractor={(item) => item.id.toString()}
                  numColumns={viewMode === 'grid' ? 2 : 1}
                  key={viewMode}
                  contentContainerStyle={styles.listContainer}
                  scrollEnabled={false}
                />

                {pagination.total_pages > 1 && (
                  <View style={styles.pagination}>
                    <TouchableOpacity
                      onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                    >
                      <Text style={styles.paginationButtonText}>Previous</Text>
                    </TouchableOpacity>
                    <Text style={styles.paginationText}>
                      Page {currentPage} of {pagination.total_pages}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setCurrentPage(p => Math.min(pagination.total_pages, p + 1))}
                      disabled={currentPage === pagination.total_pages}
                      style={[styles.paginationButton, currentPage === pagination.total_pages && styles.paginationButtonDisabled]}
                    >
                      <Text style={styles.paginationButtonText}>Next</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Webtoon Gallery - Browse your scraped webtoon collection</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF5FF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    padding: 20,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#9333EA',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  statsBar: {
    backgroundColor: '#9333EA',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    gap: 32,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  content: {
    padding: 16,
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 12,
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingLeft: 40,
    paddingRight: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genrePickerContainer: {
    flex: 1,
    position: 'relative',
  },
  filterIcon: {
    position: 'absolute',
    left: 12,
    top: 12,
    zIndex: 1,
  },
  genrePicker: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingLeft: 40,
    paddingRight: 16,
    paddingVertical: 12,
  },
  genrePickerText: {
    fontSize: 16,
    color: '#374151',
  },
  viewToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    backgroundColor: '#E5E7EB',
    padding: 10,
    borderRadius: 8,
  },
  viewButtonActive: {
    backgroundColor: '#9333EA',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  errorTitle: {
    fontWeight: '600',
    color: '#B91C1C',
    marginBottom: 4,
  },
  errorText: {
    color: '#B91C1C',
  },
  loadingContainer: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  listContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    marginHorizontal: 4,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    height: 200,
    backgroundColor: '#E5E7EB',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  genreBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#9333EA',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  genreBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  episodeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  episodeText: {
    fontSize: 14,
    color: '#6B7280',
  },
  readLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9333EA',
  },
  listItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listImage: {
    width: 100,
    height: 100,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },
  listImageImg: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  listPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flex: 1,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  listGenreBadge: {
    backgroundColor: '#9333EA',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginLeft: 8,
  },
  listDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  listFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  paginationButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  paginationText: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: '#374151',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 24,
    alignItems: 'center',
    marginTop: 48,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
});