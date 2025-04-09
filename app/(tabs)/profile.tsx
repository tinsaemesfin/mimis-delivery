import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  SafeAreaView, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar, 
  Platform,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
  Linking
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth/AuthContext';
import { useRouter } from 'expo-router';
import { supabase } from '../../utils/supabase';

// Validate email format
const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate US phone number
const isValidUSPhoneNumber = (phone: string) => {
  const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
  return phoneRegex.test(phone);
};

// Format phone number as user types
const formatPhoneNumber = (input: string) => {
  // Strip all non-numeric characters
  const phoneNumber = input.replace(/\D/g, '');
  
  // Format according to length
  if (phoneNumber.length <= 3) {
    return phoneNumber;
  } else if (phoneNumber.length <= 6) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  } else {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  }
};

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  const { user, signOut, signUpWithEmail } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [helpCenterVisible, setHelpCenterVisible] = useState(false);
  const [aboutUsVisible, setAboutUsVisible] = useState(false);
  
  // Edit form state
  const [editFullName, setEditFullName] = useState('');
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [fullNameError, setFullNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Initialize edit form with user data when modal opens
  useEffect(() => {
    if (isEditModalVisible && user) {
      setEditFullName(user.user_metadata?.full_name || '');
      setEditPhoneNumber(user.user_metadata?.phone || '');
    }
  }, [isEditModalVisible, user]);

  const validateEditForm = () => {
    let isValid = true;
    
    // Validate full name
    if (!editFullName) {
      setFullNameError('Full name is required');
      isValid = false;
    } else {
      setFullNameError('');
    }
    
    // Validate phone number
    if (!editPhoneNumber) {
      setPhoneError('Phone number is required');
      isValid = false;
    } else if (!isValidUSPhoneNumber(editPhoneNumber)) {
      setPhoneError('Please enter a valid US phone number');
      isValid = false;
    } else {
      setPhoneError('');
    }
    
    return isValid;
  };

  const handleUpdateProfile = async () => {
    if (!validateEditForm()) return;
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: editFullName,
          phone: editPhoneNumber,
        }
      });

      if (error) throw error;

      Alert.alert(
        'Success',
        'Your profile has been updated successfully.',
        [{ text: 'OK', onPress: () => setIsEditModalVisible(false) }]
      );
    } catch (error: any) {
      Alert.alert('Update Failed', error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await signOut();
      router.replace('/sign-in');
    } catch (error: any) {
      Alert.alert('Sign Out Failed', error.message || 'An error occurred while signing out.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneNumberChange = (text: string) => {
    setEditPhoneNumber(formatPhoneNumber(text));
  };

  const handleHelpCenterPress = () => {
    setHelpCenterVisible(true);
  };

  const handleAboutUsPress = () => {
    setAboutUsVisible(true);
  };

  const handleAradaTechPress = () => {
    Linking.openURL('https://aradatech.com/');
  };

  const renderMenuItem = (
    icon: string,
    title: string,
    subtitle: string,
    onPress: () => void
  ) => (
    <TouchableOpacity
      style={[styles.menuItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
        <Ionicons name={icon as any} size={22} color="#FFF" />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.menuSubtitle, { color: colors.lightText }]}>
          {subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.lightText} />
    </TouchableOpacity>
  );

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
        <View style={styles.guestContainer}>
          <View style={[styles.guestIconContainer, { backgroundColor: colors.primary }]}>
            <Ionicons name="person-outline" size={40} color="#FFF" />
          </View>
          <Text style={[styles.guestTitle, { color: colors.text }]}>Guest User</Text>
          <Text style={[styles.guestMessage, { color: colors.lightText }]}>
            Sign in to access your profile and manage your orders
          </Text>
          <TouchableOpacity
            style={[styles.signInButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/sign-in')}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.developerCredit}>
          <Text style={[styles.developerText, { color: colors.lightText }]}>
            Developed by Tinsae Mesfin -{' '}
            <Text 
              style={[styles.developerLink, { color: colors.primary }]}
              onPress={handleAradaTechPress}
            >
              Arada Tech
            </Text>
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.profileIconContainer, { backgroundColor: colors.primary }]}>
            <Text style={styles.profileIconText}>
              {user.user_metadata?.full_name ? user.user_metadata.full_name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {user.user_metadata?.full_name || 'User'}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.lightText }]}>
              {user.email}
            </Text>
            {user.user_metadata?.phone && (
              <Text style={[styles.profilePhone, { color: colors.lightText }]}>
                {user.user_metadata.phone}
              </Text>
            )}
          </View>
        </View>

        <View style={[styles.menuSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
          
          {renderMenuItem(
            'person-outline',
            'Personal Information',
            'Update your personal details',
            () => setIsEditModalVisible(true)
          )}
          
          
        </View>

        <View style={[styles.menuSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Support</Text>
          
          {renderMenuItem(
            'help-circle-outline',
            'Help Center',
            'Get help with your orders',
            handleHelpCenterPress
          )}
          
          {renderMenuItem(
            'information-circle-outline',
            'About Us',
            'Learn more about Mimi\'s Delivery',
            handleAboutUsPress
          )}
        </View>

        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.error }]}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={20} color="white" style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.developerCredit}>
          <Text style={[styles.developerText, { color: colors.lightText }]}>
            Developed by Tinsae Mesfin -{' '}
            <Text 
              style={[styles.developerLink, { color: colors.primary }]}
              onPress={handleAradaTechPress}
            >
              Arada Tech
            </Text>
          </Text>
        </View>
      </ScrollView>

      {/* Help Center Modal */}
      <Modal
        visible={helpCenterVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setHelpCenterVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setHelpCenterVisible(false)}
        >
          <Pressable 
            style={[styles.modalContent, { backgroundColor: colors.background }]}
            onPress={e => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Help Center
              </Text>
              <TouchableOpacity onPress={() => setHelpCenterVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.contactSection}>
                <Text style={[styles.contactTitle, { color: colors.text }]}>Contact Us</Text>
                <View style={styles.contactItem}>
                  <Ionicons name="call-outline" size={20} color={colors.primary} />
                  <Text style={[styles.contactText, { color: colors.text }]}>
                    +1 (555) 123-4567
                  </Text>
                </View>
                <View style={styles.contactItem}>
                  <Ionicons name="call-outline" size={20} color={colors.primary} />
                  <Text style={[styles.contactText, { color: colors.text }]}>
                    +1 (555) 987-6543
                  </Text>
                </View>
                <View style={styles.contactItem}>
                  <Ionicons name="location-outline" size={20} color={colors.primary} />
                  <Text style={[styles.contactText, { color: colors.text }]}>
                    123 Delivery Street{'\n'}New York, NY 10001
                  </Text>
                </View>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* About Us Dialog */}
      <Modal
        visible={aboutUsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAboutUsVisible(false)}
      >
        <Pressable 
          style={styles.dialogOverlay} 
          onPress={() => setAboutUsVisible(false)}
        >
          <Pressable 
            style={[styles.dialogContent, { backgroundColor: colors.background }]}
            onPress={e => e.stopPropagation()}
          >
            <View style={styles.dialogHeader}>
              <Text style={[styles.dialogTitle, { color: colors.text }]}>
                About Mimi's Delivery
              </Text>
              <TouchableOpacity onPress={() => setAboutUsVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.dialogBody}>
              <Text style={[styles.aboutText, { color: colors.text }]}>
                Mimi's Delivery is your trusted partner for premium meat delivery services. 
                We specialize in providing high-quality, fresh meat products with convenient 
                delivery options right to your doorstep.
              </Text>
              <Text style={[styles.aboutText, { color: colors.text }]}>
                Our commitment to quality, customer service, and timely delivery has made 
                us a preferred choice for meat delivery services in the area.
              </Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setIsEditModalVisible(false)}
        >
          <Pressable 
            style={[styles.modalContent, { backgroundColor: colors.background }]}
            onPress={e => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Edit Profile
              </Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Full Name</Text>
                <TextInput
                  style={[
                    styles.input, 
                    { 
                      borderColor: fullNameError ? colors.error : colors.border,
                      color: colors.text,
                      backgroundColor: colors.card
                    }
                  ]}
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.lightText}
                  value={editFullName}
                  onChangeText={setEditFullName}
                />
                {fullNameError ? (
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {fullNameError}
                  </Text>
                ) : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Phone Number</Text>
                <TextInput
                  style={[
                    styles.input, 
                    { 
                      borderColor: phoneError ? colors.error : colors.border,
                      color: colors.text,
                      backgroundColor: colors.card
                    }
                  ]}
                  placeholder="(123) 456-7890"
                  placeholderTextColor={colors.lightText}
                  keyboardType="phone-pad"
                  value={editPhoneNumber}
                  onChangeText={(text) => setEditPhoneNumber(formatPhoneNumber(text))}
                  maxLength={14}
                />
                {phoneError ? (
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {phoneError}
                  </Text>
                ) : null}
              </View>

              <TouchableOpacity
                style={[styles.updateButton, { backgroundColor: colors.primary }]}
                onPress={handleUpdateProfile}
              >
                <Text style={styles.updateButtonText}>
                  Update Profile
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  header: {
    paddingVertical: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  profileIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileIconText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 4,
  },
  profilePhone: {
    fontSize: 14,
  },
  menuSection: {
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    padding: 16,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Registration form styles
  registrationContainer: {
    marginBottom: 20,
  },
  registrationTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  registrationSubtitle: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  registerButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  signInLink: {
    alignItems: 'center',
    padding: 8,
  },
  signInLinkText: {
    fontSize: 14,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalBody: {
    padding: 20,
  },
  updateButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  updateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  guestIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  guestMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  signInButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  signInButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  developerCredit: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  developerText: {
    fontSize: 14,
  },
  developerLink: {
    textDecorationLine: 'underline',
  },
  contactSection: {
    marginTop: 16,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactText: {
    fontSize: 16,
    marginLeft: 12,
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 20,
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  dialogBody: {
    marginTop: 8,
  },
  aboutText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
}); 