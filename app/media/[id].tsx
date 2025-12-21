import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MediaInteractionModal from '../components/MediaInteractionModal';
import { Media } from '../services/Manhwa';

export default function ManhwaDetail() {
    const { id } = useLocalSearchParams()
    const [media, setMedia] = useState<Media | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

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
            
            <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => setModalVisible(true)}
            >
                <Text style={styles.actionButtonText}>⭐ Rate & Review</Text>
            </TouchableOpacity>

            <MediaInteractionModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                mediaId={typeof id === 'string' ? parseInt(id) : id as unknown as number}
                mediaTitle={media.title_english || media.title_romaji || 'Unknown'}
            />

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
    imageContainer: {
        width: '100%',
        height: 300,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
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
    actionButton: {
        backgroundColor: '#3b82f6',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginVertical: 16,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#1f2937',
    },
    type: {
        fontSize: 16,
        color: '#6b7280',
        marginBottom: 8,
    },
    genres: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 8,
    },
    score: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#f59e0b',
        marginBottom: 16,
    },
    description: {
        fontSize: 14,
        color: '#4b5563',
        lineHeight: 20,
        marginTop: 16,
    },
    errorText: {
        fontSize: 16,
        color: '#ef4444',
    },
});