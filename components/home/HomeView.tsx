import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { Media } from '../../services/Manhwa';
import Manhwa from '../ManhwaFetch';
import FoldersList from './FolderList';
import HomeTab from './HomeTab';
import ReviewsList from './ReviewsList';

import { BorderRadius, Colors, Spacing } from '@/constants/theme';

const API_BASE_URL = 'https://manhwaapp-1.onrender.com';  

export default function HomeView() {
  const [activeTab, setActiveTab] = useState('media');
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<null | string>(null);

  const renderContent = () => {
    switch (activeTab) {
      case 'media':
        return <Manhwa />;

      case 'reviews':
        return <ReviewsList />;

      case 'folders':
        return <FoldersList />;

      default:
        return <Manhwa />;
    }
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
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.tabsContainer}>
          <HomeTab
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </View>

        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => {
            // TODO: Navigate to search screen
          }}
        >
          <Ionicons
            name="search"
            size={22}
            color={Colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },

  tabsContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },

  searchButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full ?? 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: {
    flex: 1,
  },
});

function setError(arg0: null) {
  throw new Error('Function not implemented.');
}
function setLoading(arg0: boolean) {
  throw new Error('Function not implemented.');
}

