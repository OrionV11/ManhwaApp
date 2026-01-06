import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Manhwa from '../ManhwaFetch';
import HomeTab from './HomeTab';
// Import your other tab components when you create them
import FoldersList from './FolderList';
import ReviewsList from './ReviewsList';
// import FoldersList from './FoldersList';

export default function HomeView() {
  const [activeTab, setActiveTab] = useState('media');

  const renderContent = () => {
    switch (activeTab) {
      case 'media':
        return <Manhwa />;
      
      case 'reviews':
        // TODO: Create ReviewsList component
        return <ReviewsList />;
      
      case 'folders':
        // TODO: Create FoldersList component
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
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});