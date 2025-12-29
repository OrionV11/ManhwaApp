import { ActivityIndicator } from 'react-native';
import ActivityView from '../components/activity/ActivityView';
import { useAuth } from '../contexts/AuthContext';

export default function ActivityScreen() {
  const { user, loading } = useAuth();
  const mockUser = {
    id: 1,
    username: 'TestUser',
    email: 'test@example.com',
    profile_picture: null,
    bio: 'Test bio',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  console.log('🔵 ActivityScreen - loading:', loading);
  console.log('🔵 ActivityScreen - user:', user);

  const displayuser = user || mockUser; 

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} />;

  if (!user) return null; // auth screen already handled elsewhere

  return <ActivityView user={displayuser} />;
}
