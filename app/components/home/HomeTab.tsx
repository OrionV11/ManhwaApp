//HomeTabs
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';


export default function HomeTab({activeTab, onChange}: any) {
    const tabs = ['media', 'reviews', 'folders'];


  return (
    <View style={styles.container}>
      {tabs.map(tab => (
        <TouchableOpacity key={tab} onPress={() => onChange(tab)} style={styles.tab}>
          <Text style={[styles.text, activeTab === tab && styles.active]}>
            {tab.toUpperCase()}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#eee' },
  tab: { flex: 1, padding: 14, alignItems: 'center' },
  text: { color: '#999' },
  active: { color: '#6f9dc7ff', fontWeight: 'bold' },
});