import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

const user_icon = require('../../assets/images/person.png');
const password_icon = require('../../assets/images/hide.png');
const email_icon = require('../../assets/images/email.png');

const AuthScreen = () => {
  const { login, signup } = useAuth();
  const [isSignup, setIsSignup] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async () => {
    // Validation
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

    setLoading(true);
    try {
      await signup(username, email, password);
      // Navigation will happen automatically when user state changes
    } catch (error: any) {
      Alert.alert('Signup Failed', error.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    // Validation
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter an email');
      return;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      // Navigation will happen automatically when user state changes
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    // Clear fields when switching
    setUsername('');
    setEmail('');
    setPassword('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.text}>{isSignup ? 'Sign Up' : 'Login'}</Text>
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
          {loading ? (
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  text: {
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
});

export default AuthScreen;
