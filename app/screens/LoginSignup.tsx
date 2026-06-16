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
import { api } from '@/utils/api';

const user_icon = require('../../assets/images/person.png');
const password_icon = require('../../assets/images/hide.png');
const email_icon = require('../../assets/images/email.png');

type Screen = 'Login' | 'Sign Up' | 'OTP';

const LoginSignup = () => {
  const [action, setAction] = useState<Screen>('Sign Up');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [previousAction, setPreviousAction] = useState<'Login' | 'Sign Up'>('Sign Up');
  const [loading, setLoading] = useState(false);

  const { login, signup, loginWithToken } = useAuth();
  const router = useRouter();

  const handleSubmit = async () => {
    if (action === 'Sign Up') {
      if (!username.trim() || !email.trim() || !password.trim()) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }
      if (username.trim().length < 3) {
        Alert.alert('Error', 'Username must be at least 3 characters long');
        return;
      }
    } else if (action === 'Login') {
      if (!email.trim() || !password.trim()) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }
    }

    if (action !== 'OTP') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        Alert.alert('Error', 'Please enter a valid email address');
        return;
      }
      if (password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters long');
        return;
      }
    }

    setLoading(true);
    try {
      if (action === 'Sign Up') {
        // Step 1 - send OTP to verify email before creating account
        await api.post('/api/auth/send-signup-otp', { email: email.trim() }, false);
        setPreviousAction('Sign Up');
        setAction('OTP');

      } else if (action === 'Login') {
        await login(email.trim(), password);
        await api.post('/api/auth/request-otp', { email: email.trim() }, false);
        setPreviousAction('Login');
        setAction('OTP');

      } else if (action === 'OTP') {
        if (!otp.trim() || otp.length !== 6) {
          Alert.alert('Error', 'Please enter the 6 digit code');
          setLoading(false);
          return;
        }

        if (previousAction === 'Sign Up') {
          // Verify OTP then create account
          const response = await api.post('/api/auth/verify-signup-otp', {
            email: email.trim(),
            otp: otp.trim(),
            username: username.trim(),
            password: password
          }, false);
          await loginWithToken(response.user, response.access_token);
          router.replace('/(tabs)');
        } else {
          // Login OTP verification
          const response = await api.post('/api/auth/verify-otp', { email: email.trim(), otp: otp.trim() }, false);
          router.replace('/(tabs)');
        }
      }
    } catch (error) {
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
    setOtp('');
  };
  
  const resendOTP = async () => {
    try {
      await api.post('/auth/request-otp', { email: email.trim() }, false);
      Alert.alert('Success', 'A new code has been sent to your email');
    } catch (error) {
      Alert.alert('Error', 'Failed to resend code');
    }
  };

  // OTP Screen
  if (action === 'OTP') {
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
            <Text style={styles.text}>Verify Email</Text>
            <View style={styles.underline} />
          </View>

          <Text style={styles.otpDescription}>
            Enter the 6 digit code sent to{'\n'}
            <Text style={styles.link}>{email}</Text>
          </Text>

          <View style={styles.inputs}>
            <View style={styles.input}>
              <TextInput
                style={[styles.textInput, styles.otpInput]}
                placeholder="000000"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.submit, styles.submitActive]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Verify Code</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={resendOTP}>
              <Text style={styles.forgotPassword}>
                Didn't receive a code? <Text style={styles.link}>Resend</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => switchAction('Login')}>
              <Text style={styles.forgotPassword}>
                <Text style={styles.link}>Back to Login</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }
    
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
  otpInput: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 8,
  },
  otpDescription: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 16,
    marginBottom: Spacing.lg,
    lineHeight: 24,
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
