import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

export default function ProfileHeader({ user }: any) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {user.profile_picture ? (
        <Image source={{ uri: user.profile_picture }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{user.username[0].toUpperCase()}</Text>
        </View>
      )}

      <Text style={styles.name}>{user.username}</Text>
      <Text style={styles.email}>{user.email}</Text>

      <Text style={styles.edit} onPress={() => router.push('../edit-profile')}>
        Edit Profile
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: 24 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4c00b4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
  name: { fontSize: 22, fontWeight: 'bold', marginTop: 10 },
  email: { color: '#777' },
  edit: { marginTop: 10, color: '#4c00b4', fontWeight: '600' },
});
