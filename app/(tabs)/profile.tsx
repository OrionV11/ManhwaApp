import ProfileView from '@/components/profile/ProfileView';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import LoginSignupModal from '../login';

export default function ProfileScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Show loading spinner while checking auth
  if (loading) {
    console.log('⏳ Showing loading spinner');
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  // Show login prompt if user is not authenticated
  if (!user) {
    return (
      <LoginSignupModal visible={true}
       onClose={() => router.push('/(tabs)')}
       onDismiss={() => {}} />
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
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  notLoggedInTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  notLoggedInText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginBottom: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  loginButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  signupButton: {
    backgroundColor: Colors.background,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    minWidth: 200,
    alignItems: 'center',
  },
  signupButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
});