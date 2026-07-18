import MediaInteractionModal from '@/components/MediaInteractionModal';
import Loading from '@/constants/Loading';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { Media } from '@/services/Manhwa';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const API_BASE_URL = 'https://manhwaapp-1.onrender.com';

export default function ManhwaDetail() {
    const { id } = useLocalSearchParams();
    const [media, setMedia] = useState<Media | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const fetchMediaDetail = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/media/${id}`);
            if (!response.ok) throw new Error('Failed to fetch media detail');
            const data = await response.json();
            setMedia(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchMediaDetail();
    }, [id]);

    if (loading) return <View style={styles.LoadingContainer}><Loading /></View>;
    if (error || !media) return <View style={styles.centerContainer}><Text style={styles.errorText}>Error: {error || 'Media not found'}</Text></View>;

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Cover + Info Side by Side */}
            <View style={styles.headerRow}>
                {/* Cover Image - Left Side */}
                <View style={styles.coverContainer}>
                    {media.cover_image ? (
                        <Image source={{ uri: media.cover_image }} style={styles.coverImage} resizeMode="cover" />
                    ) : (
                        <View style={styles.placeholder}><Text style={styles.placeholderText}>No Image</Text></View>
                    )}
                </View>

                {/* Info - Right Side */}
                <View style={styles.infoColumn}>
                    {/* Title */}
                    <Text style={styles.title} numberOfLines={3}>{media.title_english || media.title_romaji}</Text>

                    {/* Genre Tags */}
                    {media.genres && (
                        <View style={styles.tagsContainer}>
                            {media.genres.slice(0, 2).map((genre, index) => (
                                <View key={index} style={styles.tagBadge}>
                                    <Text style={styles.tagText}>{genre}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Stats - Vertical */}
                    <View style={styles.statsColumn}>
                        {media.average_score && (
                            <View style={styles.statRow}>
                                <Text style={styles.statLabel}>Score</Text>
                                <Text style={styles.statValue}>⭐ {(media.average_score).toFixed(1)}</Text>
                            </View>
                        )}

                        {media.episodes && (
                            <View style={styles.statRow}>
                                <Text style={styles.statLabel}>Episodes</Text>
                                <Text style={styles.statValue}>{media.episodes}</Text>
                            </View>
                        )}

                        {media.status && (
                            <View style={styles.statRow}>
                                <Text style={styles.statLabel}>Status</Text>
                                <Text style={styles.statValue}>{media.status}</Text>
                            </View>
                        )}

                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>Type</Text>
                            <Text style={styles.statValue}>{media.type}</Text>
                        </View>
                    </View>

                    {/* Action Button */}
                    <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => setModalVisible(true)}
                    >
                        <Text style={styles.actionButtonText}>★ Rate & Review</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Synopsis Section - Full Width Below */}
            {media.description && (
                <View style={styles.synopsisSection}>
                    <Text style={styles.synopsisTitle}>Synopsis</Text>
                    <Text style={styles.synopsisText}>{media.description}</Text>
                </View>
            )}

            <MediaInteractionModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                mediaId={typeof id === 'string' ? parseInt(id) : (id as unknown as number)}
                mediaTitle={media.title_english || media.title_romaji || 'Unknown'}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    LoadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },

    /* Header Row - Image Left, Info Right */
    headerRow: {
        flexDirection: 'row',
        padding: Spacing.md,
        gap: Spacing.md,
        backgroundColor: Colors.surface,
    },

    /* Cover Image - Left */
    coverContainer: {
        width: 140,
        height: 200,
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
        backgroundColor: Colors.surfaceVariant,
        flexShrink: 0,
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: Colors.textTertiary,
        fontSize: 12,
    },

    /* Info Column - Right */
    infoColumn: {
        flex: 1,
        justifyContent: 'flex-start',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: Spacing.sm,
        lineHeight: 22,
    },

    /* Genre Tags */
    tagsContainer: {
        flexDirection: 'row',
        gap: Spacing.xs,
        marginBottom: Spacing.md,
        flexWrap: 'wrap',
    },
    tagBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.sm,
    },
    tagText: {
        fontSize: 11,
        color: '#fff',
        fontWeight: '600',
    },

    /* Stats Column */
    statsColumn: {
        gap: Spacing.xs,
        marginBottom: Spacing.md,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    statValue: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.text,
    },

    /* Action Button */
    actionButton: {
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    actionButtonText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#fff',
    },

    /* Synopsis Section - Full Width */
    synopsisSection: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.surfaceVariant,
    },
    synopsisTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: Spacing.sm,
    },
    synopsisText: {
        fontSize: 13,
        color: Colors.textSecondary,
        lineHeight: 20,
    },

    errorText: {
        fontSize: 16,
        color: Colors.error,
    },
});