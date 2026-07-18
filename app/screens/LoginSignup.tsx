import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/utils/api';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const user_icon = require('../../assets/images/person.png');
const password_icon = require('../../assets/images/hide.png');
const email_icon = require('../../assets/images/email.png');

type Screen = 'Login' | 'Sign Up' | 'OTP';

interface LoginSignupModalProps {
  visible: boolean;
  onDismiss?: () => void;
  onClose: () => void;
}

const LoginSignupModal: React.FC<LoginSignupModalProps> = ({ visible, onDismiss, onClose }) => {
  const [isOpen, setIsOpen] = useState(visible);
  const [action, setAction] = useState<Screen>('Login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [previousAction, setPreviousAction] = useState<'Login' | 'Sign Up'>('Login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { login, signup, loginWithToken } = useAuth();

  useEffect(() => {
    setIsOpen(visible);
    
    // Reset all form fields when modal opens
    if (visible) {
      setAction('Login');
      setUsername('');
      setEmail('');
      setPassword('');
      setOtp('');
      setPreviousAction('Login');
      setShowPassword(false);
      setRememberMe(false);
      setLoading(false);
    }
  }, [visible]);

  const handleDismiss = () => {
    setIsOpen(false);
    onDismiss?.();
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

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
          const response = await api.post(
            '/api/auth/verify-signup-otp',
            {
              email: email.trim(),
              otp: otp.trim(),
              username: username.trim(),
              password: password,
            },
            false
          );
          await loginWithToken(response.user, response.access_token);
          handleDismiss();
        } else {
          await api.post(
            '/api/auth/verify-otp',
            { email: email.trim(), otp: otp.trim() },
            false
          );
          handleDismiss();
        }
      }
    } catch (error) {
      console.error(`${action} failed:`, error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const switchAction = (newAction: 'Login' | 'Sign Up') => {
    setAction(newAction);
    setUsername('');
    setEmail('');
    setPassword('');
    setOtp('');
  };

  const resendOTP = async () => {
    try {
      setLoading(true);
      await api.post('/api/auth/request-otp', { email: email.trim() }, false);
      Alert.alert('Success', 'A new code has been sent to your email');
    } catch (error) {
      Alert.alert('Error', 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  // OTP Screen
  if (action === 'OTP') {
    return (
      <Modal
        visible={isOpen}
        animationType="fade"
        transparent={true}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleClose}
        >
          <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <TouchableOpacity 
                style={styles.modalCard}
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
              >
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={handleDismiss}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>

                <Text style={styles.title}>Verify Email</Text>
                <View style={styles.underline} />

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

                  <TouchableOpacity onPress={resendOTP} disabled={loading}>
                    <Text style={styles.forgotPassword}>
                      Didn't receive a code? <Text style={styles.link}>Resend</Text>
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => switchAction('Login')} disabled={loading}>
                    <Text style={styles.forgotPassword}>
                      <Text style={styles.link}>Back to Login</Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
    );
  }

  return (
    <Modal
      visible={isOpen}
      animationType="fade"
      transparent={true}
      statusBarTranslucent
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity 
              style={styles.modalCard}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={handleClose}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>

              <View style={styles.logoContainer}>
                <View style={styles.logo} />
              </View>

              <View style={styles.header}>
                <Text style={styles.mainTitle}>
                  {action === 'Login' ? 'Log in to your account' : 'Create your account'}
                </Text>
                <Text style={styles.subtitle}>
                  {action === 'Login'
                    ? 'Welcome back! Please enter your details.'
                    : 'Join us today and get started.'}
                </Text>
              </View>

              {/* Tab Buttons */}
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tab, action === 'Sign Up' && styles.tabActive]}
                  onPress={() => switchAction('Sign Up')}
                  disabled={loading}
                >
                  <Text
                    style={[styles.tabText, action === 'Sign Up' && styles.tabTextActive]}
                  >
                    Sign up
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tab, action === 'Login' && styles.tabActive]}
                  onPress={() => switchAction('Login')}
                  disabled={loading}
                >
                  <Text
                    style={[styles.tabText, action === 'Login' && styles.tabTextActive]}
                  >
                    Log in
                  </Text>
                </TouchableOpacity>
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
                    placeholder="Enter your email"
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
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    value={password}
                    onChangeText={setPassword}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    <Text style={styles.eyeIcon}>
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Remember Me & Forgot Password - Only show for Login */}
                {action === 'Login' && (
                  <View style={styles.optionsContainer}>
                    <TouchableOpacity
                      style={styles.checkboxContainer}
                      onPress={() => setRememberMe(!rememberMe)}
                      disabled={loading}
                    >
                      <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]} />
                      <Text style={styles.checkboxLabel}>Remember for 30 days</Text>
                    </TouchableOpacity>

                    <TouchableOpacity disabled={loading}>
                      <Text style={styles.link}>Forgot password</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Submit Button */}
                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {action === 'Login' ? 'Sign in' : 'Create account'}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Google Sign In */}
                {action === 'Login' && (
                  <TouchableOpacity style={styles.googleButton} disabled={loading}>
                    <Text style={styles.googleButtonText}>🔍 Sign in with Google</Text>
                  </TouchableOpacity>
                )}

                {/* Toggle to Sign Up or Login */}
                {action === 'Login' ? (
                  <View style={styles.toggleContainer}>
                    <Text style={styles.toggleText}>Don't have an account? </Text>
                    <TouchableOpacity onPress={() => switchAction('Sign Up')} disabled={loading}>
                      <Text style={styles.link}>Sign up</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.toggleContainer}>
                    <Text style={styles.toggleText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => switchAction('Login')} disabled={loading}>
                      <Text style={styles.link}>Log in</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  keyboardView: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: 24,
    paddingTop: 40,
    maxHeight: '90%',
    width: '100%',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    opacity: 0.2,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
  },
  underline: {
    width: 50,
    height: 4,
    backgroundColor: Colors.primary,
    marginTop: Spacing.sm,
    borderRadius: 2,
    alignSelf: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.text,
  },
  inputs: {
    gap: Spacing.md,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm + 2,
    paddingHorizontal: Spacing.md,
    height: 50,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  icon: {
    width: 18,
    height: 18,
    marginRight: Spacing.sm + 2,
    resizeMode: 'contain',
    tintColor: Colors.textSecondary,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 6,
  },
  eyeIcon: {
    fontSize: 16,
    marginLeft: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginRight: 6,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
  },
  checkboxLabel: {
    fontSize: 13,
    color: Colors.text,
  },
  otpDescription: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  forgotPassword: {
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  link: {
    color: Colors.primary,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: BorderRadius.sm + 2,
    alignItems: 'center',
    marginTop: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  submit: {
    paddingVertical: 12,
    borderRadius: BorderRadius.sm + 2,
    alignItems: 'center',
  },
  submitActive: {
    backgroundColor: Colors.primary,
  },
  submitText: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  googleButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    borderRadius: BorderRadius.sm + 2,
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  googleButtonText: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
});

export default LoginSignupModal;