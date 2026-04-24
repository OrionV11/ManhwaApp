import { Colors } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileTabs({ activeTab, onChange }: any) {
  const tabs = ['reading', 'completed', 'favorites', 'reviews'];

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
  container: { flexDirection: 'row', borderBottomWidth: 1, borderColor: Colors.background },
  tab: { flex: 1, padding: 14, alignItems: 'center' },
  text: { color: '#fff' },
  active: { color: '#4c00b4', fontWeight: 'bold' },
});
