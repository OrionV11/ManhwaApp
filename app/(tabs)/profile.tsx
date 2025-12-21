import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const user_icon = require('../../assets/images/person.png');
const password_icon = require('../../assets/images/hide.png');
const email_icon = require('../../assets/images/email.png');

const ProfileScreen = () => {
  const { user, loading, logout, login, signup, isAuthenticated } = useAuth();
  const router = useRouter();
  
  // Auth form state
  const [isSignup, setIsSignup] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter an email');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setAuthLoading(true);
    try {
      await signup(username, email, password);
      Alert.alert('Success', 'Account created successfully!');
    } catch (error: any) {
      Alert.alert('Signup Failed', error.message || 'Please try again');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter an email');
      return;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }

    setAuthLoading(true);
    try {
      await login(email, password);
      Alert.alert('Success', 'Logged in successfully!');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    // Reset form
    setUsername('');
    setEmail('');
    setPassword('');
    setIsSignup(true);
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    setUsername('');
    setEmail('');
    setPassword('');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4c00b4" />
      </View>
    );
  }

  // Show auth form if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.authContainer}>
        <View style={styles.header}>
          <Text style={styles.headerText}>{isSignup ? 'Sign Up' : 'Login'}</Text>
          <View style={styles.underline} />
        </View>

        <View style={styles.inputs}>
          {isSignup && (
            <View style={styles.input}>
              <Image source={user_icon} style={styles.icon} />
              <TextInput
                style={styles.textInput}
                placeholder="Username"
                placeholderTextColor="#999"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>
          )}

          <View style={styles.input}>
            <Image source={email_icon} style={styles.icon} />
            <TextInput
              style={styles.textInput}
              placeholder="Email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.input}>
            <Image source={password_icon} style={styles.icon} />
            <TextInput
              style={styles.textInput}
              placeholder="Password"
              placeholderTextColor="#999"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {!isSignup && (
            <Text style={styles.forgotPassword}>
              Lost Password? <Text style={styles.link}>Click Here!</Text>
            </Text>
          )}

          <View style={styles.submitContainer}>
            {authLoading ? (
              <ActivityIndicator size="large" color="#4c00b4" />
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.submit, isSignup && styles.submitActive]}
                  onPress={isSignup ? handleSignup : toggleMode}
                >
                  <Text style={styles.submitText}>Sign Up</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submit, !isSignup && styles.submitActive]}
                  onPress={!isSignup ? handleLogin : toggleMode}
                >
                  <Text style={styles.submitText}>Login</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    );
  }

  // Show profile if authenticated
  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileSection}>
        {user.profile_picture ? (
          <Image source={{ uri: user.profile_picture }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user.username.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        
        <Text style={styles.name}>{user.username}</Text>
        <Text style={styles.email}>{user.email}</Text>
        {user.bio && <Text style={styles.bio}>{user.bio}</Text>}
        
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => router.push('../edit-profile')}
        >
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Reading</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>📚 My Lists</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>⭐ Favorites</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>✏️ Reviews</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>⚙️ Settings</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  authContainer: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    justifyContent: 'center',
    minHeight: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  headerText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  underline: {
    width: 60,
    height: 4,
    backgroundColor: '#4c00b4',
    marginTop: 8,
    borderRadius: 2,
  },
  inputs: {
    gap: 20,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 55,
  },
  icon: {
    width: 22,
    height: 22,
    marginRight: 10,
    resizeMode: 'contain',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  forgotPassword: {
    marginTop: 10,
    color: '#555',
    fontSize: 14,
  },
  link: {
    color: '#4c00b4',
    fontWeight: '600',
  },
  submitContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    gap: 10,
  },
  submit: {
    flex: 1,
    backgroundColor: '#d3d3d3',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitActive: {
    backgroundColor: '#4c00b4',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4c00b4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  email: {
    fontSize: 14,
    color: '#777',
    marginBottom: 10,
  },
  bio: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginTop: 10,
    marginHorizontal: 20,
    lineHeight: 20,
  },
  editButton: {
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#4c00b4',
    borderRadius: 20,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4c00b4',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#777',
  },
  menuContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  menuItem: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 40,
    backgroundColor: '#ff3b30',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;