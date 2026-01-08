import { StyleSheet, Text, View } from 'react-native';

export default function StatsBar({ stats }: any) {
  return (
    <View style={styles.row}>
      <Stat label="Reading" value={stats.reading} />
      <Stat label="Completed" value={stats.completed} />
      <Stat label="Favorites" value={stats.favorites} />
      <Stat label="Followers" value={stats.followers} />
      <Stat label="Reviews" value={stats.reviews} />
    </View>
  );
}

function Stat({ label, value }: any) {
  return (
    <View style={styles.stat}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 20 },
  stat: { alignItems: 'center' },
  value: { fontSize: 18, fontWeight: '700' },
  label: { fontSize: 12, color: '#777' },
});
