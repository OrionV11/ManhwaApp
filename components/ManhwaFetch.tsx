import Loading from '@/constants/Loading';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, FlatList, Image, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Media } from '../services/Manhwa';
type AnimatedCardStyles = ReturnType<typeof StyleSheet.create>;

interface AnimatedCardProps {
  index: number;
  item: Media;
  onPress: () => void;
  styles: typeof styles;
}

const API_BASE_URL = 'https://manhwaapp-1.onrender.com';  
const ManhwaFetch: React.FC = () => {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const AnimatedCard: React.FC<AnimatedCardProps> = ({ item, index, onPress, styles }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const hoverScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate on mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        delay: index * 300, // Stagger effect
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        delay: index * 300, // Stagger effect
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

 const handleHoverIn = () => {
  Animated.sequence([
    Animated.delay(150),
    Animated.spring(hoverScale, {
      toValue: 1.05,
      friction: 7,
      tension: 60,
      useNativeDriver: true,
    }),
  ]).start();
};

const handleHoverOut = () => {
  Animated.spring(hoverScale, {
    toValue: 1,
    friction: 7,
    tension: 60,
    useNativeDriver: true,
  }).start();
};

  return (
    <Animated.View
      style={[
        styles.card as ViewStyle,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
          style={(state) => {
    const { hovered, pressed } = state;
    
    const dynamicStyles: ViewStyle = {
      ...(hovered && {
        backgroundColor: Colors.background,
        shadowColor: Colors.background,
        shadowRadius: 20,
        shadowOpacity: 0.3,
        elevation: 7,
        transitionDelay: '0.3s',
        transform: [{ scale: 1.05 }],
      }),
      ...(pressed && {
        backgroundColor: Colors.background,
        shadowOpacity: 0,
        elevation: 0,
        transform: [{ scale: 0.89 }],
      }),
    };

    return [styles.button, dynamicStyles] as StyleProp<ViewStyle>;
  }}
>
       {/* Cover Image */}
<View style={styles.imageContainer}>

  {item.cover_image ? (
    <View style={styles.stackContainer}>

      {/* Back Card */}
      <Image
        source={{ uri: item.cover_image }}
        style={[styles.image, styles.imageBack]}
        resizeMode="cover"
      />

      {/* Middle Card */}
      <Image
        source={{ uri: item.cover_image }}
        style={[styles.image, styles.imageMiddle]}
        resizeMode="cover"
      />

      {/* Front Card */}
      <Animated.Image
        source={{ uri: item.cover_image }}
        resizeMode="cover"
        style={[
          styles.image,
          {
            transform: [{ scale: hoverScale }],
          },
        ]}
      />

    </View>
  ) : (
    <View style={styles.noImage}>
      <Text style={styles.noImageText}>No Image</Text>
    </View>
  )}

  <View style={styles.badge}>
    <Text style={styles.badgeText}>{item.type}</Text>
  </View>

</View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title_english || item.title_romaji}
          </Text>
          
          {/* Score */}
          {item.average_score && (
            <View style={styles.scoreContainer}>
              <Text style={styles.star}>⭐</Text>
              <Text style={styles.score}>
                {(item.average_score).toFixed(1)}
              </Text>
            </View>
          )}

          {/* Genres */}
          {item.genres && item.genres.length > 0 && (
            <View style={styles.genresContainer}>
              {item.genres.slice(0, 2).map((genre, idx) => (
                <View key={idx} style={styles.genreTag}>
                  <Text style={styles.genreText}>{genre}</Text>
                </View>
              ))}
              {item.genres.length > 2 && (
                <Text style={styles.genreMore}>+{item.genres.length - 2}</Text>
              )}
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async (query?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const url = query
        ? `${API_BASE_URL}/api/media/search?query=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/api/media/trending?limit=10`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch media');
      }
      
      const data = await response.json();
      setMedia(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      fetchMedia(searchQuery);
    }
  };

  const renderItem = ({ item, index }: { item: Media; index: number }) => (
    <AnimatedCard 
      item={item} 
      index={index} 
      onPress={() => router.push(`/media/${item.id}`)}
      styles={styles}
    />
  );

  if (loading) {
    return (
    <View style={styles.loadingContainer}>
      <Loading />
    </View>
  );
  }


  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    // Use standard View instead of Animated.View for the main container
    <View style={styles.container}>

      {/* Media Grid */}
      <View style={{ flex: 1}}>
        <View style={styles.blurGhost} />
          <View style={[styles.blurGhost, { top: 12, left: 12, opacity: 0.08 }]} />
            <View style={[styles.blurGhost, { top: 6, left: 6, opacity: 0.14 }]} />

    
<BlurView
  intensity={35}
  tint="dark"
  style={styles.blurContainer}
>
  <FlatList
    data={media}
    renderItem={renderItem}
    keyExtractor={(item) => item.id.toString()}
    numColumns={3}
    contentContainerStyle={styles.gridContent}
    columnWrapperStyle={styles.row}
    showsVerticalScrollIndicator={false}
    ListEmptyComponent={
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          No results found. Try a different search.
        </Text>
      </View>
    }
  />
</BlurView>
</View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>End of content</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.sm,
    ...Typography.body,
    color: Colors.textSecondary,
  },
  errorText: {
    ...Typography.body,
    color: Colors.error,
    padding: Spacing.md,
  },
  header: {
    padding: 5,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    ...Typography.h3,
    marginBottom: Spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.sm,
    fontSize: 10,
    color: Colors.text,
  },
  searchButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.sm + 4,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 5,
  },
  gridContainer: {
    padding: Spacing.md,
    width: '90%',
    alignSelf: 'center',
    gap: Spacing.md,
  },
  gridContent: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xs,
  },
  button: {
    width: '100%',
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  
  blurContainer: {
  flex: 1,
  marginHorizontal: 12,
  marginTop: 12,
  borderRadius: 20,
  overflow: 'hidden',

  backgroundColor: Colors.background,
  borderWidth: 1,
  borderColor: Colors.border,

  shadowColor: Colors.background,
  shadowOffset: {
    width: 0,
    height: 12,
  },
  shadowOpacity: 0.08,
  shadowRadius: 24,
  elevation: 3,
},

blurGhost: {
  position: 'absolute',

  top: 8,
  left: 8,
  right: -8,
  bottom: -8,

  borderRadius: 20,

  backgroundColor: Colors.background,

  borderWidth: 1,
  borderColor: Colors.border,
},
  
  card: {
    flex: 0.5,
    margin: 6,
    opacity: 0.9,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: '31%',
    transitionDelay: '0.3s',
  },
  imageContainer: {
    width: '100%',
    height: 250,
    backgroundColor: Colors.surfaceVariant,
    borderTopLeftRadius: BorderRadius.md,
    borderTopRightRadius: BorderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
     position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  noImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: Colors.textTertiary,
    fontSize: 12,
  },
  badge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  info: {
    padding: Spacing.sm + 2,
  },
  title: {
    fontWeight: '600',
    fontSize: 12,
    color: Colors.text,
    marginBottom: 6,
    minHeight: 32,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  star: {
    fontSize: 12,
    marginRight: 4,
  },
  score: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.warning,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  genreTag: {
    backgroundColor: Colors.surfaceVariant,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  genreText: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  genreMore: {
    fontSize: 10,
    color: Colors.textTertiary,
    paddingVertical: 3,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textSecondary,
  },
  footer: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  footerText: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  stackContainer: {
  width: '100%',
  height: '100%',
  position: 'relative',
},

imageMiddle: {
  transform: [
    { translateX: 6 },
    { translateY: 6 },
    { rotate: '-2deg' },
  ],
  opacity: 0.35,
},

imageBack: {
  transform: [
    { translateX: 12 },
    { translateY: 12 },
    { rotate: '2deg' },
  ],
  opacity: 0.18,
},

});

export default ManhwaFetch;
// force rebuild Wed Jun 17 11:24:15 AM CDT 2026
