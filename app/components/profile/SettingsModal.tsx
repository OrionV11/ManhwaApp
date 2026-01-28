import { User } from '@/app/services/Manhwa';
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

    // Edit Profile function
    const handleEditProfile = () => {
        onClose();
        router.push('/edit-profile');
    };

    const handleChangePassword = () => {
        onClose();
        router.push('/change-password');
    };

    const handleLogout = () => {
        console.log('🔴 Logout button pressed');
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => console.log('❌ Logout cancelled'),
                },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        console.log('✅ Logout confirmed, calling logout()...');
                        await logout();
                        console.log('✅ Logout completed');
                        onClose();
                        router.replace('/(tabs)');
                    }
                }
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'This action cannot be undone. All your data will be permanently deleted. Are you sure?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await api.delete(`/api/users/me`);
                            await logout();
                            onClose();
                            router.replace('/(tabs)');
                            Alert.alert('Account Deleted', 'Your account has been deleted');
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
                            <Ionicons name="close" size={28} color="#666" />
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
                                <Ionicons name="list-outline" size={22} color="#4c00b4" />
                                <Text style={styles.optionText}>My Lists</Text>
                                <Ionicons name="chevron-forward" size={20} color="#999" />
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.option} 
                                onPress={() => {
                                    onClose();
                                    router.push('/screens/ProfileReadList');
                                }}
                            >
                                <Ionicons name="book-outline" size={22} color="#4c00b4" />
                                <Text style={styles.optionText}>Read List</Text>
                                <Ionicons name="chevron-forward" size={20} color="#999" />
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.option} 
                                onPress={() => {
                                    onClose();
                                    router.push('/screens/ProfileLikes');
                                }}
                            >
                                <Ionicons name="heart-outline" size={22} color="#4c00b4" />
                                <Text style={styles.optionText}>Likes</Text>
                                <Ionicons name="chevron-forward" size={20} color="#999" />
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.option} 
                                onPress={() => {
                                    onClose();
                                    router.push('/screens/ProfileReviews');
                                }}
                            >
                                <Ionicons name="star-outline" size={22} color="#4c00b4" />
                                <Text style={styles.optionText}>All Reviews</Text>
                                <Ionicons name="chevron-forward" size={20} color="#999" />
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.option} 
                                onPress={handleViewFollowing}
                            >
                                <Ionicons name="people-outline" size={22} color="#4c00b4" />
                                <Text style={styles.optionText}>Following</Text>
                                <Ionicons name="chevron-forward" size={20} color="#999" />
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.option} 
                                onPress={handleViewFollowers}
                            >
                                <Ionicons name="people-outline" size={22} color="#4c00b4" />
                                <Text style={styles.optionText}>Followers</Text>
                                <Ionicons name="chevron-forward" size={20} color="#999" />
                            </TouchableOpacity>
                        </View>

                        {/* Account Settings */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>ACCOUNT</Text>
                            
                            <TouchableOpacity style={styles.option} onPress={handleEditProfile}>
                                <Ionicons name="person-outline" size={22} color="#666" />
                                <Text style={styles.optionText}>Edit Profile</Text>
                                <Ionicons name="chevron-forward" size={20} color="#999" />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.option} onPress={handleChangePassword}>
                                <Ionicons name="lock-closed-outline" size={22} color="#666" />
                                <Text style={styles.optionText}>Change Password</Text>
                                <Ionicons name="chevron-forward" size={20} color="#999" />
                            </TouchableOpacity>
                        </View>

                        {/* Privacy & Notifications */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>PREFERENCES</Text>
                            
                            <TouchableOpacity style={styles.option} onPress={handleToggleNotification}>
                                <Ionicons name="notifications-outline" size={22} color="#666" />
                                <Text style={styles.optionText}>Notifications</Text>
                                <View style={styles.toggleContainer}>
                                    <Text style={styles.toggleText}>
                                        {notificationEnabled ? 'On' : 'Off'}
                                    </Text>
                                    <Ionicons 
                                        name={notificationEnabled ? "toggle" : "toggle-outline"} 
                                        size={32} 
                                        color={notificationEnabled ? "#4c00b4" : "#999"} 
                                    />
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.option} onPress={handleTogglePrivacy}>
                                <Ionicons name="eye-off-outline" size={22} color="#666" />
                                <Text style={styles.optionText}>Private Account</Text>
                                <View style={styles.toggleContainer}>
                                    <Text style={styles.toggleText}>
                                        {privateAccount ? 'Yes' : 'No'}
                                    </Text>
                                    <Ionicons 
                                        name={privateAccount ? "toggle" : "toggle-outline"} 
                                        size={32} 
                                        color={privateAccount ? "#4c00b4" : "#999"} 
                                    />
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.option} onPress={handleBlockedUsers}>
                                <Ionicons name="ban-outline" size={22} color="#666" />
                                <Text style={styles.optionText}>Blocked Users</Text>
                                <Ionicons name="chevron-forward" size={20} color="#999" />
                            </TouchableOpacity>
                        </View>

                        {/* Legal */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>LEGAL</Text>
                            
                            <TouchableOpacity style={styles.option} onPress={handlePrivacyPolicy}>
                                <Ionicons name="shield-outline" size={22} color="#666" />
                                <Text style={styles.optionText}>Privacy Policy</Text>
                                <Ionicons name="open-outline" size={18} color="#999" />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.option} onPress={handleTermsOfService}>
                                <Ionicons name="document-text-outline" size={22} color="#666" />
                                <Text style={styles.optionText}>Terms of Service</Text>
                                <Ionicons name="open-outline" size={18} color="#999" />
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
                                <Ionicons name="log-out-outline" size={22} color="#dc2626" />
                                <Text style={styles.dangerText}>Logout</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.dangerOption} 
                                onPress={handleDeleteAccount}
                                disabled={loading}
                            >
                                <Ionicons name="trash-outline" size={22} color="#dc2626" />
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
        paddingBottom: 40,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        position: 'relative',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#222',
    },
    closeIcon: {
        position: 'absolute',
        right: 20,
        padding: 4,
    },
    section: {
        paddingTop: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#999',
        letterSpacing: 1,
        marginBottom: 12,
        paddingHorizontal: 20,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        gap: 12,
    },
    optionText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    toggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    toggleText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    dangerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        gap: 12,
    },
    dangerText: {
        fontSize: 16,
        color: '#dc2626',
        fontWeight: '600',
    },
});