import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { User } from '@/services/Manhwa';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Linking, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { api, ApiError } from '../../utils/api';

interface Props {
    visible: boolean;
    onClose: () => void;
    user: User;
}

export default function SettingsModal({ visible, onClose, user }: Props) {
    const [loading, setLoading] = useState(false);
    const [notificationEnabled, setNotificationEnabled] = useState(true);
    const [privateAccount, setPrivateAccount] = useState(false);
    const { logout } = useAuth();
    const router = useRouter();

    const handleEditProfile = () => {
        onClose();
        router.push('/edit-profile');
    };

    const handleChangePassword = () => {
        onClose();
        router.push('/change-password');
    };

    const handleLogout = async () => {
    console.log('Logout button pressed');

    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
        // Web
        const confirmed = window.confirm('Are you sure you want to logout?');
        if (confirmed) {
            await logout();
            onClose();
            router.replace('/screens/LoginSignup');
        }
    } else {
        // Mobile
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        onClose();
                        router.replace('/screens/LoginSignup');
                    }
                }
            ]
        );
    }
};
    const handleDeleteAccount = async () => {
    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
        // Web
        const confirmed = window.confirm('This action cannot be undone. All your data will be permanently deleted. Are you sure?');
        if (confirmed) {
            setLoading(true);
            try {
                await api.delete('/api/users/me');
                await logout();
                onClose();
                router.replace('/screens/LoginSignup');
            } catch (error) {
                console.error('Error deleting account:', error);
                if (error instanceof ApiError) {
                    alert(error.message);
                } else {
                    alert('Failed to delete account');
                }
            } finally {
                setLoading(false);
            }
        }
    } else {
        // Mobile
        Alert.alert(
            'Delete Account',
            'This action cannot be undone. All your data will be permanently deleted. Are you sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await api.delete('/api/users/me');
                            await logout();
                            onClose();
                            router.replace('/screens/LoginSignup');
                        } catch (error) {
                            console.error('Error deleting account:', error);
                            if (error instanceof ApiError) {
                                Alert.alert('Error', error.message);
                            } else {
                                Alert.alert('Error', 'Failed to delete account');
                            }
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    }
};
    const handleToggleNotification = async () => {
        const newValue = !notificationEnabled;
        setNotificationEnabled(newValue);

        try {
            await api.put(`/api/users/me/settings`, {
                notifications_enabled: newValue
            });
        } catch (error) {
            console.error('Error updating notification settings:', error);
            setNotificationEnabled(!newValue);
        }
    };

    const handleTogglePrivacy = async () => {
        const newValue = !privateAccount;
        setPrivateAccount(newValue);

        try {
            await api.put(`/api/users/me/settings`, {
                is_private: newValue
            });
        } catch (error) {
            console.error('Error updating privacy settings:', error);
            setPrivateAccount(!newValue);
        }
    };

    const handleBlockedUsers = () => {
        onClose();
        router.push('/blocked-users');
    };

    const handlePrivacyPolicy = () => {
        Linking.openURL('https://yourwebsite.com/privacy-policy');
    };

    const handleTermsOfService = () => {
        Linking.openURL('https://yourwebsite.com/terms-of-service');
    };

     const handleViewFollowers = () => {
      onClose()
  router.push(`/user/${user.id}/followers`);
};

const handleViewFollowing = () => {
  onClose()
  router.push(`/user/${user.id}/following`);
};

    const fetchUserSetting = async () => {
        try {
            const settings = await api.get(`/api/users/me/settings`);
            setNotificationEnabled(settings.notifications_enabled ?? true);
            setPrivateAccount(settings.is_private ?? false);
        } catch (error) {
            console.error('Error fetching settings:', error);
            setNotificationEnabled(true);
            setPrivateAccount(false);
        }
    };

    useEffect(() => {
        if (visible) {
            fetchUserSetting();
        }
    }, [visible]);

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Settings</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
                            <Ionicons name="close" size={28} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Quick Actions Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
                            
                            <TouchableOpacity 
                                style={styles.option} 
                                onPress={() => {
                                    onClose();
                                    router.push('/user-lists');
                                }}
                            >
                                <Ionicons name="list-outline" size={22} color={Colors.primary} />
                                <Text style={styles.optionText}>My Lists</Text>
                                <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.option} 
                                onPress={() => {
                                    onClose();
                                    router.push('/screens/ProfileReadList');
                                }}
                            >
                                <Ionicons name="book-outline" size={22} color={Colors.primary} />
                                <Text style={styles.optionText}>Read List</Text>
                                <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.option} 
                                onPress={() => {
                                    onClose();
                                    router.push('/screens/ProfileLikes');
                                }}
                            >
                                <Ionicons name="heart-outline" size={22} color={Colors.primary} />
                                <Text style={styles.optionText}>Likes</Text>
                                <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.option} 
                                onPress={() => {
                                    onClose();
                                    router.push('/screens/ProfileReviews');
                                }}
                            >
                                <Ionicons name="star-outline" size={22} color={Colors.primary} />
                                <Text style={styles.optionText}>All Reviews</Text>
                                <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.option} 
                                onPress={handleViewFollowing}
                            >
                                <Ionicons name="people-outline" size={22} color={Colors.primary} />
                                <Text style={styles.optionText}>Following</Text>
                                <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.option} 
                                onPress={handleViewFollowers}
                            >
                                <Ionicons name="people-outline" size={22} color={Colors.primary} />
                                <Text style={styles.optionText}>Followers</Text>
                                <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Account Settings */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>ACCOUNT</Text>
                            
                            <TouchableOpacity style={styles.option} onPress={handleEditProfile}>
                                <Ionicons name="person-outline" size={22} color={Colors.textSecondary} />
                                <Text style={styles.optionText}>Edit Profile</Text>
                                <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.option} onPress={handleChangePassword}>
                                <Ionicons name="lock-closed-outline" size={22} color={Colors.textSecondary} />
                                <Text style={styles.optionText}>Change Password</Text>
                                <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Privacy & Notifications */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>PREFERENCES</Text>
                            
                            <TouchableOpacity style={styles.option} onPress={handleToggleNotification}>
                                <Ionicons name="notifications-outline" size={22} color={Colors.textSecondary} />
                                <Text style={styles.optionText}>Notifications</Text>
                                <View style={styles.toggleContainer}>
                                    <Text style={styles.toggleText}>
                                        {notificationEnabled ? 'On' : 'Off'}
                                    </Text>
                                    <Ionicons 
                                        name={notificationEnabled ? "toggle" : "toggle-outline"} 
                                        size={32} 
                                        color={notificationEnabled ? Colors.primary : Colors.textSecondary} 
                                    />
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.option} onPress={handleTogglePrivacy}>
                                <Ionicons name="eye-off-outline" size={22} color={Colors.textSecondary} />
                                <Text style={styles.optionText}>Private Account</Text>
                                <View style={styles.toggleContainer}>
                                    <Text style={styles.toggleText}>
                                        {privateAccount ? 'Yes' : 'No'}
                                    </Text>
                                    <Ionicons 
                                        name={privateAccount ? "toggle" : "toggle-outline"} 
                                        size={32} 
                                        color={privateAccount ? Colors.primary : Colors.textSecondary} 
                                    />
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.option} onPress={handleBlockedUsers}>
                                <Ionicons name="ban-outline" size={22} color={Colors.textSecondary} />
                                <Text style={styles.optionText}>Blocked Users</Text>
                                <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Legal */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>LEGAL</Text>
                            
                            <TouchableOpacity style={styles.option} onPress={handlePrivacyPolicy}>
                                <Ionicons name="shield-outline" size={22} color={Colors.textSecondary} />
                                <Text style={styles.optionText}>Privacy Policy</Text>
                                <Ionicons name="open-outline" size={18} color={Colors.textSecondary} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.option} onPress={handleTermsOfService}>
                                <Ionicons name="document-text-outline" size={22} color={Colors.textSecondary} />
                                <Text style={styles.optionText}>Terms of Service</Text>
                                <Ionicons name="open-outline" size={18} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Danger Zone */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>DANGER ZONE</Text>
                            
                            <TouchableOpacity 
                                style={styles.dangerOption} 
                                onPress={handleLogout}
                                disabled={loading}
                            >
                                <Ionicons name="log-out-outline" size={22} color={Colors.error} />
                                <Text style={styles.dangerText}>Logout</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.dangerOption} 
                                onPress={handleDeleteAccount}
                                disabled={loading}
                            >
                                <Ionicons name="trash-outline" size={22} color={Colors.error} />
                                <Text style={styles.dangerText}>
                                    {loading ? 'Deleting...' : 'Delete Account'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: Colors.overlay,
    },
    modalContent: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        paddingTop: Spacing.lg,
        paddingBottom: 40,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        position: 'relative',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fafafaff',
    },
    closeIcon: {
        position: 'absolute',
        right: Spacing.lg,
        padding: 4,
    },
    section: {
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.sm + 4,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.textTertiary,
        letterSpacing: 1,
        marginBottom: Spacing.sm + 4,
        paddingHorizontal: Spacing.lg,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: Spacing.lg,
        gap: Spacing.sm + 4,
    },
    optionText: {
        flex: 1,
        fontSize: 16,
        color: Colors.text,
    },
    toggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    toggleText: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    dangerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: Spacing.lg,
        gap: Spacing.sm + 4,
    },
    dangerText: {
        fontSize: 16,
        color: Colors.error,
        fontWeight: '600',
    },
});
