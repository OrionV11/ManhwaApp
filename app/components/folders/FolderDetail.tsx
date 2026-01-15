import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { api } from '../../services/api';
import { Media } from '../../services/Manhwa';

interface FolderItem {
    id: number;
    media_id: number;
    notes?: string;
    added_at: string;
}

interface Folder {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  is_public: boolean;
  likes_count: number;
  item_count: number;
  created_at: string;
  updated_at?: string;
  items?: FolderItem[];
}


interface Props {
    folderId: number;
}

type MediaItem = Media & FolderItem;

export default function FolderDetail({ folderId }: Props) {
    //loading states
    const [loading, setLoading] = useState(false);
    const [folderLoading, setFolderLoading] = useState(false);
    const router = useRouter();
    

    //Data states
    const [folder, setFolder] = useState<Folder | null>(null);
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);

    //User state
    const [userId, setUserId] = useState<number>(1);



    const fetchFolder = async () => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:3000/api/folders/${folderId}?user_id=${userId}`)

            if (!response.ok) {
                throw new Error('Can not fetch');
            }

            const folderData = await response.json();
            console.log('Folder data:', JSON.stringify(folderData, null, 2));
            setFolder(folderData)

            
        } catch(error) {
            console.error('Error fetching reviews:', error);
            Alert.alert('Error', 'Failed to load reviews');
        } finally {
            setLoading(false);
    }
};

    const fetchMediaItems = async () => {
        if (!folder?.items || folder.items.length == 0) return;
        setLoading(true);
        try { /*
            const response = await fetch(
                `http://localhost:3000/api/folders/${folderId}/items?user_id=${userId}`
            ); */

            const mediaPromises = folder.items.map(item =>
                api.getMediaById(item.media_id)
            );

            const mediaDetails = await Promise.all(mediaPromises);

            const enrichedItems: MediaItem[] = folder.items.map((item, index) => ({
                ...mediaDetails[index],
                media_id: item.media_id,
                notes: item.notes,
                added_at: item.added_at,
            }));

            setMediaItems(enrichedItems);

        } catch(error) {
            console.error('Error fetching reviews:', error);
            Alert.alert('Error', 'Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };

    const handleMediaClick = (mediaId: number) => {
        router.push(`/media/${mediaId}`);
    }


    useEffect(() => {
        if (folderId && userId) {
            fetchFolder();
        }
    }, [folderId, userId]);

    useEffect(() => {
        if (folder?.items) {
            fetchMediaItems();
        }
    }, [folder]);

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    if (!folder) {
        return (
            <View style={styles.centerContainer}>
                <Text>Folder not found</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{folder.title}</Text>
            <Text style={styles.description}>{folder.description}</Text>
            {/* Media items go here */}
            <FlatList
                data={mediaItems}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => handleMediaClick(item.id)}>
                        <View style={styles.mediaCard}>
                            {item.cover_image ? (
                                <Image
                                    source={{ uri: item.cover_image}}
                                    style={styles.coverImage}
                                />
                            ) : (
                                <View style={styles.coverPlaceholder} />
                            )}
                            <View style={styles.mediaInfo}>
                                <Text style={styles.mediaTitle} numberOfLines={2}>
                                    {item.title_english || item.title_romaji || 'Untitled'}
                                </Text>
                                <Text style={styles.mediaType}>{item.type || 'Unknown'}</Text>
                                {item.description && (
                                    <Text style={styles.notes} numberOfLines={2}>
                                        {item.description}
                                    </Text>
                                )}
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
        padding: 16,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    description: {
        fontSize: 16,
        color: '#666',
        marginBottom: 8,
    },
     mediaCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 12,
        marginBottom: 8,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    coverImage: {
        width: 60,
        height: 90,
        borderRadius: 4,
        marginRight: 12,
    },
    coverPlaceholder: {
        width: 60,
        height: 90,
        backgroundColor: '#e5e7eb',
        borderRadius: 4,
        marginRight: 12,
    },
    mediaInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    mediaTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#222',
        marginBottom: 4,
    },
    mediaType: {
        fontSize: 12,
        color: '#999',
    },
    notes: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
        fontStyle: 'italic',
    },
});
