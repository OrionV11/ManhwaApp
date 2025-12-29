import { ActivityIndicator } from 'react-native';
import ProfileView from '../components/profile/ProfileView';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileScreen() {
  const { user, loading } = useAuth();
  //Mock User
  const mockUser = {
    id: 1,
    username: 'TestUser',
    email: 'test@example.com',
    profile_picture: null,
    bio: 'Test bio',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  console.log('🔵 ProfileScreen - loading:', loading);
  console.log('🔵 ProfileScreen - user:', user);

  if (loading) {
    console.log('⏳ Showing loading spinner');
    return <ActivityIndicator style={{ marginTop: 50 }} />;
  }

  const displayUser = user || mockUser;


  console.log('✅ Rendering ProfileView with user:', displayUser.username);

  return <ProfileView user={displayUser} />;
}
