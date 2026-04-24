import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileTabs({ activeTab, onChange }: any) {
  const tabs = ['Friends', 'You', 'Mentions'];

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
  container: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#eba0a0ff' },
  tab: { flex: 1, padding: 14, alignItems: 'center' },
  text: { color: '#eb6b6bff' },
  active: { color: '#0f0fcdff', fontWeight: 'bold' },
});
