import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MediaInteractionModal from '@/components/MediaInteractionModal';
import { Media } from '@/services/Manhwa';

const API_BASE_URL = 'https://manhwaapp-jn15.onrender.com';  

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
            const response = await fetch(`${API_BASE_URL}/api/media/${id}`);
            
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
                <ActivityIndicator size="large" color={Colors.primary} />
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
                        <Text style={styles.placeholderText}>No Image</Text>
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
        padding: Spacing.md,
        backgroundColor: Colors.background,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    imageContainer: {
        width: '100%',
        height: 300,
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
        marginBottom: Spacing.md,
        backgroundColor: Colors.surfaceVariant,
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
        backgroundColor: Colors.surfaceVariant,
    },
    placeholderText: {
        color: Colors.textTertiary,
        fontSize: 14,
    },
    actionButton: {
        backgroundColor: Colors.primary,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        marginVertical: Spacing.md,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    mediaTitle: {
        ...Typography.h2,
        marginBottom: Spacing.sm,
    },
    title: {
        ...Typography.h2,
        marginBottom: Spacing.sm,
    },
    type: {
        fontSize: 16,
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
    },
    genres: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
    },
    score: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.warning,
        marginBottom: Spacing.md,
    },
    description: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
        marginTop: Spacing.md,
    },
    errorText: {
        fontSize: 16,
        color: Colors.error,
    },
});