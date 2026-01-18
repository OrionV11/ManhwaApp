import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MediaList from '../components/profile/MediaList';
import { Media } from '../services/Manhwa';


const API_BASE_URL = 'http://localhost:3000';

type Props = {
    label: string;
}

export default function ProfileReadList({label}: Props) {
    const [loading, setLoading] = useState(false);
    const [list, setList] = useState<Media[]>([]);
    const [userId, setUserId] = useState<number>(1);
    const router = useRouter();


    const handleMediaClick = (mediaId: number) => {
    router.push(`/media/${mediaId}`)
  };


   const fetchReadList = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/reading-progress/${userId}`);

        if(response.ok) {
            const data = await response.json()
            setList(data);
        } else {
            console.error('Error fetching list', response.status)
        }} catch (error) {
            console.error('Error fetching list', error)

        }
    };

    const handleRemoveFromList = (mediaId: number) => {
        Alert.alert(
            'Delete Review',
            'Are you sure you want to delete this review?',
            [
                { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(
                `http://localhost:3000/api/reading-progress/${userId}/${mediaId}`,
                { method: 'DELETE' }
              );

              if (response.ok) {
                Alert.alert('Success', 'Review deleted');
                fetchReadList(); // Refresh list
              } else {
                Alert.alert('Error', 'Failed to delete review');
              }
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'Network error occurred');
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
  if (userId) {
    fetchReadList();
  }
}, [userId]);

    return (
  <View style={styles.container}>
    {/* Header */}
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Read List</Text>
      <View style={styles.placeholder} />
    </View>

    {/* Media List */}
    {loading ? (
      <ActivityIndicator size="large" color="#3b82f6" />
    ) : (
      <MediaList
        data={list}
        loading={loading}
        tab="reading"
        onMediaClick={handleMediaClick}
      />
    )}
  </View>
);

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  placeholder: {
    width: 50,
  },
});


