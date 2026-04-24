import { StyleSheet, Text, View } from 'react-native';

export default function ProfileStats() {
  return (
    <View style={styles.container}>
      <Stat label="Reading" value={0} />
      <Stat label="Completed" value={0} />
      <Stat label="Favorites" value={0} />
      <Stat label="Followers" value={0} />
      <Stat label="Reviews" value={0} />
    </View>
  );
}

const Stat = ({ label, value }: { label: string; value: number }) => (
  <View style={styles.stat}>
    <Text style={styles.value}>{value}</Text>
    <Text style={styles.label}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
  },
  stat: { alignItems: 'center' },
  value: { fontSize: 20, fontWeight: 'bold', color: '#4c00b4' },
  label: { fontSize: 12, color: '#777' },
});
