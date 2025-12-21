import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Media } from '../services/Manhwa';

export default function ManhwaDetail() {
    const { id } = useLocalSearchParams()
    const [media, setMedia] = useState<Media | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMediaDetail = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`http://localhost:3000/api/media/${id}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch media detail');
            }
            const data = await response.json();
            setMedia(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
        fetchMediaDetail();
        }
    }, [id]);

    if (loading) {
    return (
        <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
        </View>
    );
    }
    
    if (error || !media) {
    return (
        <View style={styles.centerContainer}>
            <Text style={styles.errorText}>Error: {error || 'Media not found'}</Text>
        </View>
    );
    }
return (
  <ScrollView style={styles.container}>
    <View style={styles.imageContainer}>
      {media.cover_image ? (
        <Image
          source={{ uri: media.cover_image }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.placeholder}>
          <Text>No Image</Text>
        </View>
      )}
    </View>

    <Text style={styles.title}>{media.title_english || media.title_romaji}</Text>
    <Text style={styles.type}>{media.type}</Text>
    {media.genres && (
      <Text style={styles.genres}>Genres: {media.genres.join(', ')}</Text>
    )}

    {media.episodes && (
        <Text style={styles.type}>Episodes: {media.episodes}</Text>
    )}
    
    {media.average_score && (
      <Text style={styles.score}>Score: {(media.average_score).toFixed(1)} ⭐</Text>
    )}
    
    <Text style={styles.description}>{media.description}</Text>
    
    {/* Add more fields as you want */}
  </ScrollView>
  
);
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    errorText: {
        color: 'red',
        fontSize: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#222',
    },
    type: {
        fontSize: 18,
        marginBottom: 8,
    },
    score: {
        fontSize: 16,
        marginBottom: 16,
        color: '#888',
    },
    genres: {
        fontSize: 16,
        marginBottom: 8,
        color: '#666',
    },
    description: {
        fontSize: 16,
        color: '#333',
    },
    imageContainer: {
        width: '100%',
        height: 100,
        marginBottom: 16,
        borderRadius: 8,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e5e7eb',
    },

});