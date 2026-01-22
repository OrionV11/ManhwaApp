import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ProfileView from '../components/profile/ProfileView';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();

  console.log('🔵 ProfileScreen - loading:', loading);
  console.log('🔵 ProfileScreen - user:', user);

  // Show loading spinner while checking auth
  if (loading) {
    console.log('⏳ Showing loading spinner');
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4c00b4" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  // Show login prompt if user is not authenticated
  if (!user) {
    console.log('❌ No user found, showing login prompt');
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="person-circle-outline" size={80} color="#ccc" />
        <Text style={styles.notLoggedInTitle}>Not Logged In</Text>
        <Text style={styles.notLoggedInText}>
          Please log in to view your profile
        </Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.loginButtonText}>Log In</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.signupButton}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.signupButtonText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    );
  }

  console.log('✅ Rendering ProfileView with user:', user.username);

  return <ProfileView user={user} label={''} />;
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  notLoggedInTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },
  notLoggedInText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: '#4c00b4',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginBottom: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  signupButton: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4c00b4',
    minWidth: 200,
    alignItems: 'center',
  },
  signupButtonText: {
    color: '#4c00b4',
    fontSize: 16,
    fontWeight: '700',
  },
});