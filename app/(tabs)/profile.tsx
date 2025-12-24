import { ActivityIndicator } from 'react-native';
import ProfileView from '../components/profile/ProfileView';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileScreen() {
  const { user, loading } = useAuth();

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} />;

  if (!user) return null; // auth screen already handled elsewhere

  return <ProfileView user={user} />;
}
