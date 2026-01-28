import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Manhwa from '../ManhwaFetch';
import HomeTab from './HomeTab';
// Import your other tab components when you create them
import { Colors, Spacing } from '@/constants/theme';
import FoldersList from './FolderList';
import ReviewsList from './ReviewsList';

export default function HomeView() {
  const [activeTab, setActiveTab] = useState('media');

  const renderContent = () => {
    switch (activeTab) {
      case 'media':
        return <Manhwa />;
      
      case 'reviews':
        return <ReviewsList />;
      
      case 'folders':
        return <FoldersList />
      
      default:
        return <Manhwa />;
    }
  };

  return (
    <View style={styles.container}>
      <HomeTab activeTab={activeTab} onChange={setActiveTab} />
      <View style={styles.content}>
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    marginTop: Spacing.md,
    flex: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
});