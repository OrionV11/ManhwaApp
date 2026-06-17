import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const API_BASE_URL = 'https://manhwaapp-jn15.onrender.com';


export default function ChangePassword() {
    // Input fields
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    //UI states
    const [loading, setLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);


    //Error States
    const [error, setError] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const router = useRouter();

    //User Data
    const [userId, setUserId] = useState<number>(1);

    const validateForm = (): boolean => {
        //Clear errors
        setError({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });

        let isValid = true; 
        const newErrors = { currentPassword: '', newPassword: '', confirmPassword: ''};

        if (!currentPassword.trim()) {
            newErrors.currentPassword = 'Current password is required';
            isValid = false;
        }

        if (!newPassword.trim()) {
            newErrors.newPassword = 'New password is resquired';
            isValid = false;
        } else if (newPassword.length < 8) {
            newErrors.newPassword = 'Password must be at least 8 characters';
            isValid = false;
        }

        if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
            isValid = false;
        }

        if (currentPassword === newPassword) {
            newErrors.newPassword = 'New password must be a different from current password';
            isValid = false;
        }

        setError(newErrors);

        return isValid;

    };

    const handleChangePassword = async () => {
        if(!validateForm()){
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/users/${userId}/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword,
                }),
            });

            if (response.ok) {
                Alert.alert('Success', 'Password changed successfully');
                router.back();
            } else {
                const error = await response.json();
                Alert.alert('Error', error.detail || 'Failed to change password');
            }

        } catch (error) {
            console.error('Error changing password', error)
            Alert.alert('Error', 'Network error occurred');
        } finally {
            setLoading(false);
        }
    };

    const clearError = () => {
        setError({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
    };

    const clearForms = () => {
        setError({
            currentPassword: (''),
            newPassword: (''),
            confirmPassword: ('')
        });
    };

    const handleCancel = () => {
        clearForms();
        clearError();
        router.back();
    };
    
    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/*Header */}
                <Text style={styles.title}>Change Password</Text>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Current Password</Text>
                    <View style={styles.passwordInput}>
                        <TextInput
                        style={styles.input}
                        placeholder="Enter current password"
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        secureTextEntry={!showCurrentPassword}
                        autoCapitalize="none"
                        />
                        <TouchableOpacity
                            onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                            style={styles.eyeButton}
                        >
                            <Text>{showCurrentPassword ? '👁️' : '👁️‍🗨️'}</Text>
                        </TouchableOpacity>
                    </View>
                    {error.currentPassword ? (
                        <Text style={styles.errorText}>{error.currentPassword}</Text>
                    ): null}
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>New Password</Text>
                    <View style={styles.passwordInput}>
                        <TextInput
                        style={styles.input}
                        placeholder="Enter new password"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry={!showNewPassword}
                        autoCapitalize="none"
                        />
                        <TouchableOpacity
                            onPress={() => setShowNewPassword(!showNewPassword)}
                            style={styles.eyeButton}
                        >
                            <Text>{showCurrentPassword ? '👁️' : '👁️‍🗨️'}</Text>
                        </TouchableOpacity>
                    </View>
                    {error.newPassword ? (
                        <Text style={styles.errorText}>{error.newPassword}</Text>
                    ): null}
                </View>
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Confirm Password</Text>
                    <View style={styles.passwordInput}>
                        <TextInput
                        style={styles.input}
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                        />
                        <TouchableOpacity
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={styles.eyeButton}
                        >
                            <Text>{showCurrentPassword ? '👁️' : '👁️‍🗨️'}</Text>
                        </TouchableOpacity>
                    </View>
                    {error.confirmPassword ? (
                        <Text style={styles.errorText}>{error.confirmPassword}</Text>
                    ): null}
                </View>

            {/* Buttons go here */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancel}
                >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleChangePassword}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Change Password</Text>
                    )}
                </TouchableOpacity>
            </View>
            </ScrollView>
        </View>

    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },

  scrollContent: {
    padding: 20,
    paddingTop: 40,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#222',
    textAlign: 'center',
  },

  inputContainer: {
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },

  passwordInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
  },

  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },

  eyeButton: {
    padding: 12,
  },

  errorText: {
    color: '#dc2626',
    fontSize: 12,
    marginTop: 4,
  },

  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 30,
  },

  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    alignItems: 'center',
  },

  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },

  submitButton: {  // Fix typo: was "sumbitButton"
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },

  submitButtonDisabled: {  // Fix typo: was "sumbitButtonDisabled"
    backgroundColor: '#9ca3af',
  },

  submitButtonText: {  // Fix typo: was "sumbitButtonText"
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});