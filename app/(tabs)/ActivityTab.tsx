import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ActivityView from '@/components/activity/ActivityView';
import { useAuth } from '@/contexts/AuthContext';

export default function ActivityScreen() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  console.log('🔵 ActivityScreen - loading:', loading);
  console.log('🔵 ActivityScreen - user:', user);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4c00b4" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="pulse-outline" size={64} color="#ccc" />
        <Text style={styles.notLoggedInTitle}>Login Required</Text>
        <Text style={styles.notLoggedInText}>
          Please log in to view your activity feed
        </Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push('/auth')}
        >
          <Text style={styles.loginButtonText}>Log In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <ActivityView user={user} />;
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
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});