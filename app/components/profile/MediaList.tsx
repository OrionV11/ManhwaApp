import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Media } from '../../services/Manhwa';

type Props = {
  data: Media[];
  loading: boolean;
  tab: 'reading' | 'completed' | 'favorites' | 'reviews';
  onMediaClick: (mediaId: number) => void;
};

export default function MediaList({ data, loading, tab, onMediaClick }: Props) {
  if (loading) {
    return <ActivityIndicator style={{ marginTop: 30 }} />;
  }

  if (!data || data.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="library-outline" size={48} color="#ccc" />
        <Text style={styles.emptyText}>Nothing here yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(item, index) =>
        item?.id ? item.id.toString() : `fallback-${index}`
      }
      scrollEnabled={false}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => onMediaClick(item.id)}>
        <View style={styles.row}>
          {item.cover_image ? (
            <Image source={{ uri: item.cover_image }} style={styles.cover} />
          ) : (
            <View style={styles.coverPlaceholder} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={2}>
              {item.title_english || item.title_romaji || 'Untitled'}
            </Text>
            <Text style={styles.meta}>{item.type}</Text>
          </View>
        </View>
      </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  cover: {
    width: 55,
    height: 80,
    borderRadius: 4,
    marginRight: 12,
  },
  coverPlaceholder: {
    width: 55,
    height: 80,
    backgroundColor: '#eee',
    borderRadius: 4,
    marginRight: 12,
  },
  title: {
    fontWeight: '600',
    fontSize: 14,
  },
  meta: {
    color: '#777',
    fontSize: 12,
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: 10,
    color: '#999',
  },
});
