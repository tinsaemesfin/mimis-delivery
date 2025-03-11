import React, { useState } from 'react';
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
  ActivityIndicator
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth/AuthContext';
import { useRouter } from 'expo-router';

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
  
  // Registration form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Form validation
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [fullNameError, setFullNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const validateRegistrationForm = () => {
    let isValid = true;
    
    // Validate email
    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    } else {
      setEmailError('');
    }
    
    // Validate full name
    if (!fullName) {
      setFullNameError('Full name is required');
      isValid = false;
    } else {
      setFullNameError('');
    }
    
    // Validate phone number
    if (!phoneNumber) {
      setPhoneError('Phone number is required');
      isValid = false;
    } else if (!isValidUSPhoneNumber(phoneNumber)) {
      setPhoneError('Please enter a valid US phone number');
      isValid = false;
    } else {
      setPhoneError('');
    }
    
    // Validate password
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    } else {
      setPasswordError('');
    }
    
    // Validate confirm password
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    } else if (confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    } else {
      setConfirmPasswordError('');
    }
    
    return isValid;
  };

  const handleSignUp = async () => {
    if (!validateRegistrationForm()) return;
    
    try {
      setIsLoading(true);
      const result = await signUpWithEmail(email, password, fullName, phoneNumber);
      
      // Check if email confirmation is required
      if (result?.user && !result.user.confirmed_at) {
        Alert.alert(
          'Registration Successful', 
          'Please check your email to confirm your account before signing in.',
          [{ text: 'OK' }]
        );
      } else {
        // If no email confirmation required or already confirmed
        Alert.alert(
          'Registration Successful', 
          'Your account has been created successfully. You can now use all features.',
          [{ text: 'OK' }]
        );
      }
      
      // Clear form
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setFullName('');
      setPhoneNumber('');
    } catch (error: any) {
      // Handle specific error cases
      if (error.message?.includes('User already registered')) {
        Alert.alert(
          'Registration Failed', 
          'An account with this email already exists. Please sign in instead.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Registration Failed', error.message || 'Please try again with different credentials.');
      }
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
    setPhoneNumber(formatPhoneNumber(text));
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

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
          <Text style={[styles.subtitle, { color: colors.lightText }]}>
            {user ? 'Manage your account' : 'Create an account'}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {user ? (
          // Logged-in User View
          <>
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
                () => {}
              )}
              
              {renderMenuItem(
                'location-outline',
                'Saved Addresses',
                'Manage your delivery addresses',
                () => {}
              )}
            </View>

            <View style={[styles.menuSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Support</Text>
              
              {renderMenuItem(
                'help-circle-outline',
                'Help Center',
                'Get help with your orders',
                () => {}
              )}
              
              {renderMenuItem(
                'information-circle-outline',
                'About Us',
                'Learn more about Mimi\'s Delivery',
                () => {}
              )}
            </View>

            <TouchableOpacity
              style={[styles.logoutButton, { backgroundColor: colors.error }]}
              onPress={handleSignOut}
            >
              <Ionicons name="log-out-outline" size={20} color="white" style={styles.logoutIcon} />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </>
        ) : (
          // Guest User View - Registration Form
          <View style={styles.registrationContainer}>
            <Text style={[styles.registrationTitle, { color: colors.text }]}>
              Create an Account
            </Text>
            <Text style={[styles.registrationSubtitle, { color: colors.lightText }]}>
              Sign up to track orders and save your preferences
            </Text>

            <View style={styles.formContainer}>
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
                  value={fullName}
                  onChangeText={setFullName}
                />
                {fullNameError ? <Text style={[styles.errorText, { color: colors.error }]}>{fullNameError}</Text> : null}
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Email</Text>
                <TextInput
                  style={[
                    styles.input, 
                    { 
                      borderColor: emailError ? colors.error : colors.border,
                      color: colors.text,
                      backgroundColor: colors.card
                    }
                  ]}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.lightText}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
                {emailError ? <Text style={[styles.errorText, { color: colors.error }]}>{emailError}</Text> : null}
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
                  value={phoneNumber}
                  onChangeText={handlePhoneNumberChange}
                  maxLength={14} // (XXX) XXX-XXXX
                />
                {phoneError ? <Text style={[styles.errorText, { color: colors.error }]}>{phoneError}</Text> : null}
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Password</Text>
                <TextInput
                  style={[
                    styles.input, 
                    { 
                      borderColor: passwordError ? colors.error : colors.border,
                      color: colors.text,
                      backgroundColor: colors.card
                    }
                  ]}
                  placeholder="Create a password"
                  placeholderTextColor={colors.lightText}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
                {passwordError ? <Text style={[styles.errorText, { color: colors.error }]}>{passwordError}</Text> : null}
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Confirm Password</Text>
                <TextInput
                  style={[
                    styles.input, 
                    { 
                      borderColor: confirmPasswordError ? colors.error : colors.border,
                      color: colors.text,
                      backgroundColor: colors.card
                    }
                  ]}
                  placeholder="Confirm your password"
                  placeholderTextColor={colors.lightText}
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                {confirmPasswordError ? <Text style={[styles.errorText, { color: colors.error }]}>{confirmPasswordError}</Text> : null}
              </View>
              
              <TouchableOpacity
                style={[styles.registerButton, { backgroundColor: colors.primary }]}
                onPress={handleSignUp}
              >
                <Text style={styles.registerButtonText}>Create Account</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.signInLink}
                onPress={() => router.push('/sign-in')}
              >
                <Text style={[styles.signInLinkText, { color: colors.primary }]}>
                  Already have an account? Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
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
}); 