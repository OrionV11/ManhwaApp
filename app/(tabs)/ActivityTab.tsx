import ActivityView from '@/components/activity/ActivityView';
import Loading from '@/constants/Loading';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import LoginSignupModal from '../screens/LoginSignup';

export default function ActivityScreen() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();


  // Show loading spinner while checking auth
  if (loading) {
    return (

        <View style={styles.loadingContainer}>
          <Loading />
        </View>
      );
  }
   useFocusEffect(
    useCallback(() => {
    }, [isAuthenticated, user])
  );

  // Show login prompt if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <LoginSignupModal visible={true}
       onClose={() => router.push('/(tabs)')}
       onDismiss={() => {}} />
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
    alignItems: 'center',
  },
  loginButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

});