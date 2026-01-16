import { User } from '@/app/services/Manhwa';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


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
    
    
    //const handleChangePassword()
    //Close modal
    //navigate to /change-password
    
    
    /*const handleLogout()
     -Show confirmation
     -Clear asyncstorage (user, userId, token)
     -Navigate to /login
    */
    /*handleDeleteAccount()
     -Show confirmation alert with warning
     -Call DELETE /api/user/{userId}
     -Clear storage
     -Naviagate to /login

    */

    /*handleToggleNotification()
    -Toggle state
    -Save to asyncstorage or backend

    handleTogglePrivacy()
    -Toggle private/public account
    -update backend

    handleBlockedUsers()
    -Navigate to blocked users list page

    handlePrivacyPolicy()
    -Open privacy policy (webview or external link)

    hadnleTermsOfService
    -open terms (webview or external link)

    fetchUserSetting()
    -load notification preferences
    -load privacy settings
    -run on mount


    */
        
    
    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.title}>Settings</Text>

                    {/* Settings options here */}
                    <TouchableOpacity 
                        style={styles.option}
                        onPress={handleEditProfile}>
                        <Text>Edit Profile</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.option}>
                        <Text>Change Password</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.option}>
                        <Text>Close</Text>
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
