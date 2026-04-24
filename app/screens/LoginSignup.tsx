import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

const user_icon = require('../../assets/images/person.png');
const password_icon = require('../../assets/images/hide.png');
const email_icon = require('../../assets/images/email.png');

const LoginSignup = () => {
  const [action, setAction] = useState<'Login' | 'Sign Up'>('Sign Up');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();
  const router = useRouter();

  const handleSubmit = async () => {
    // Validation
    if (action === 'Sign Up') {
      if (!username.trim() || !email.trim() || !password.trim()) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }

      if (username.trim().length < 3) {
        Alert.alert('Error', 'Username must be at least 3 characters long');
        return;
      }
    } else {
      if (!email.trim() || !password.trim()) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Password validation
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      if (action === 'Sign Up') {
        await signup(username.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
      
      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error) {
      // Error is already handled in AuthContext with Alert
      console.error(`${action} failed:`, error);
    } finally {
      setLoading(false);
    }
  };

  const switchAction = (newAction: 'Login' | 'Sign Up') => {
    setAction(newAction);
    // Clear form when switching
    setUsername('');
    setEmail('');
    setPassword('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.text}>{action}</Text>
          <View style={styles.underline} />
        </View>

        <View style={styles.inputs}>
          {/* Username Input - Only show for Sign Up */}
          {action === 'Sign Up' && (
            <View style={styles.input}>
              <Image source={user_icon} style={styles.icon} />
              <TextInput
                style={styles.textInput}
                placeholder="Username"
                placeholderTextColor={Colors.textTertiary}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                editable={!loading}
              />
            </View>
          )}

          {/* Email Input */}
          <View style={styles.input}>
            <Image source={email_icon} style={styles.icon} />
            <TextInput
              style={styles.textInput}
              placeholder="Email"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
            />
          </View>

          {/* Password Input */}
          <View style={styles.input}>
            <Image source={password_icon} style={styles.icon} />
            <TextInput
              style={styles.textInput}
              placeholder="Password"
              placeholderTextColor={Colors.textTertiary}
              secureTextEntry
              autoComplete="password"
              value={password}
              onChangeText={setPassword}
              editable={!loading}
            />
          </View>

          {/* Forgot Password - Only show for Login */}
          {action === 'Login' && (
            <Text style={styles.forgotPassword}>
              Lost Password? <Text style={styles.link}>Click Here!</Text>
            </Text>
          )}

          {/* Submit Buttons */}
          <View style={styles.submitContainer}>
            <TouchableOpacity
              style={[
                styles.submit,
                action === 'Sign Up' ? styles.submitActive : styles.submitInactive
              ]}
              onPress={() => action === 'Sign Up' ? handleSubmit() : switchAction('Sign Up')}
              disabled={loading}
            >
              {loading && action === 'Sign Up' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  style={[
                    styles.submitText,
                    action !== 'Sign Up' && styles.submitTextInactive
                  ]}
                >
                  Sign Up
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submit,
                action === 'Login' ? styles.submitActive : styles.submitInactive
              ]}
              onPress={() => action === 'Login' ? handleSubmit() : switchAction('Login')}
              disabled={loading}
            >
              {loading && action === 'Login' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  style={[
                    styles.submitText,
                    action !== 'Login' && styles.submitTextInactive
                  ]}
                >
                  Login
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: Spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  text: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.text,
  },
  underline: {
    width: 60,
    height: 4,
    backgroundColor: Colors.primary,
    marginTop: Spacing.sm,
    borderRadius: 2,
  },
  inputs: {
    gap: Spacing.lg,
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.sm + 2,
    paddingHorizontal: Spacing.md,
    height: 55,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  icon: {
    width: 22,
    height: 22,
    marginRight: Spacing.sm + 2,
    resizeMode: "contain",
    tintColor: Colors.textSecondary,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  forgotPassword: {
    marginTop: Spacing.sm + 2,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  link: {
    color: Colors.primary,
    fontWeight: "600",
  },
  submitContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.xl - 2,
    gap: Spacing.sm + 2,
  },
  submit: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius.sm + 2,
    alignItems: "center",
  },
  submitActive: {
    backgroundColor: Colors.primary,
  },
  submitInactive: {
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  submitText: {
    fontSize: 16,
    fontWeight: "600",
    color: '#fff',
  },
  submitTextInactive: {
    color: Colors.textSecondary,
  },
});

export default LoginSignup;