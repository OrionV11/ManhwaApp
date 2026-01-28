import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';

const API_BASE_URL = 'http://192.168.1.135:3000';  

interface User {
  id: number;
  username: string;
  email: string;
  bio?: string | null;
  profile_picture?: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { username?: string; bio?: string; profile_picture?: string | null }) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const [storedUser, storedToken] = await Promise.all([
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('authToken'),
      ]);

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Login failed');
      }

      // Store user data and token
      await Promise.all([
        AsyncStorage.setItem('user', JSON.stringify(data.user)),
        AsyncStorage.setItem('authToken', data.access_token),
      ]);

      setUser(data.user);
      setToken(data.access_token);
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', error.message || 'Please try again');
      throw error;
    }
  };

  const signup = async (username: string, email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Signup failed');
      }

      // Auto-login after signup
      await login(email, password);
    } catch (error: any) {
      console.error('Signup error:', error);
      Alert.alert('Signup Failed', error.message || 'Please try again');
      throw error;
    }
  };

  // contexts/AuthContext.tsx

const logout = async () => {
    console.log('🔵 AuthContext logout() called');
    try {
        // Optional: Call backend logout endpoint if you have one
        if (token) {
            console.log('🔵 Calling backend logout...');
            await fetch(`${API_BASE_URL}/api/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }).catch(err => console.log('⚠️ Logout API call failed:', err));
        }
    } catch (error) {
        console.error('❌ Logout API error:', error);
    } finally {
        console.log('🔵 Clearing AsyncStorage...');
        // Clear local storage regardless of API result
        await Promise.all([
            AsyncStorage.removeItem('user'),
            AsyncStorage.removeItem('authToken'),
        ]);
        console.log('🔵 Setting user and token to null...');
        setUser(null);
        setToken(null);
        console.log('✅ Logout complete!');
    }
};

  const updateProfile = async (data: { 
    username?: string; 
    bio?: string; 
    profile_picture?: string | null 
  }) => {
    if (!user) throw new Error('No user logged in');
    if (!token) throw new Error('No authentication token');

    try {
      const response = await fetch(`${API_BASE_URL}/api/profile/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || result.message || 'Update failed');
      }

      // Update local user data
      const updatedUser = { ...user, ...data, updated_at: new Date().toISOString() };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      console.error('Update profile error:', error);
      Alert.alert('Update Failed', error.message || 'Please try again');
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        logout,
        updateProfile,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};