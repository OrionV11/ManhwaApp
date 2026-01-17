import { User } from '@/app/services/Manhwa';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Linking, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


interface Props {
    visible: boolean;
    onClose: () => void;
    user: User;
}

export default function SettingsModal({ visible, onClose, user}: Props) {
    const [loading, setLoading] = useState(false);
    const [notificationEnabled, setNotificationEnabled] = useState(true);
    const [privateAccount, setPrivateAccount] = useState(false);
    const router = useRouter();



    //Edit Profile function
    const handleEditProfile = () => {
        onClose();
        router.push('/edit-profile');
    };
    
    
    const handleChangePassword = () => {
        onClose();
        router.push('/change-password')
    }
    
    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await AsyncStorage.removeItem('user');
                        await AsyncStorage.removeItem('userId');
                        //await AsyncStorage.removeItem('token');
                    onClose();
                    router.push('/login');
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
            // Call delete API
            const response = await fetch(`http://localhost:3000/api/users/`/*${userId}*/, {
              method: 'DELETE',
            });

            if (response.ok) {
              // Clear AsyncStorage
              await AsyncStorage.removeItem('user');
              await AsyncStorage.removeItem('userId');
              await AsyncStorage.removeItem('token');
              
              // Close modal and navigate to login
              onClose();
              router.push('/login');
              
              Alert.alert('Account Deleted', 'Your account has been deleted');
            } else {
              Alert.alert('Error', 'Failed to delete account');
            }
          } catch (error) {
            console.error('Error deleting account:', error);
            Alert.alert('Error', 'Network error occurred');
          } finally {
            setLoading(false);
          }
        }
      }
    ]
  );
};


    const handleToggleNotification = () => {
        setNotificationEnabled(!notificationEnabled);

    };

    
    const handleTogglePrivacy = () => {
        setPrivateAccount(!privateAccount)

    }


    const handleBlockedUsers = () => {
        onClose();
        router.push('/blocked-users')
    }

    const handlePrivacyPolicy = () => {
        Linking.openURL('https://yourwebsite.com/privacy-policy');
    }

    const handleTermsOfService = () => {
        Linking.openURL('https://yourwebsite.com/terms-of-service');
    }

    const fetchUserSetting = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/users/${user.id}/settings`);
        
            if (response.ok) {
                const settings = await response.json();
                setNotificationEnabled(settings.notifications_enabled);
                setPrivateAccount(settings.is_private);
            }
        }   catch (error) {
            console.error('Error fetching settings;', error);
        }
    };
    
    useEffect(() => {
        fetchUserSetting();
    }, []);

    
   return (
  <Modal visible={visible} animationType="slide" transparent={true}>
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <Text style={styles.title}>Settings</Text>

        {/* Account Settings */}
        <TouchableOpacity style={styles.option} onPress={handleEditProfile}>
          <Text style={styles.optionText}>Edit Profile</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.option} onPress={handleChangePassword}>
          <Text style={styles.optionText}>Change Password</Text>
        </TouchableOpacity>

        {/* Privacy & Notifications */}
        <TouchableOpacity style={styles.option} onPress={handleToggleNotification}>
          <Text style={styles.optionText}>
            Notifications: {notificationEnabled ? 'On' : 'Off'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={handleTogglePrivacy}>
          <Text style={styles.optionText}>
            Private Account: {privateAccount ? 'Yes' : 'No'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={handleBlockedUsers}>
          <Text style={styles.optionText}>Blocked Users</Text>
        </TouchableOpacity>

        {/* Legal */}
        <TouchableOpacity style={styles.option} onPress={handlePrivacyPolicy}>
          <Text style={styles.optionText}>Privacy Policy</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={handleTermsOfService}>
          <Text style={styles.optionText}>Terms of Service</Text>
        </TouchableOpacity>

        {/* Danger Zone */}
        <TouchableOpacity style={styles.logoutOption} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutOption} onPress={handleDeleteAccount}>
          <Text style={styles.logoutText}>Delete Account</Text>
        </TouchableOpacity>

        {/* Close */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',  // Semi-transparent dark background
  },

  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#222',
    textAlign: 'center',
  },

  option: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },

  optionText: {  // Add this for the text inside option
    fontSize: 16,
    color: '#333',
  },

  closeButton: {  // Add this for your close button
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
  },

  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },

  logoutOption: {  // Special style for logout (red/destructive)
    paddingVertical: 16,
    paddingHorizontal: 12,
  },

  logoutText: {
    fontSize: 16,
    color: '#dc2626',  // Red color for logout
    fontWeight: '600',
  },

});
