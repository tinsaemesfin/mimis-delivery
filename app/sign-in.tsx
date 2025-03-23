import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  Image,
  Platform,
  Dimensions,
  ActivityIndicator,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import Button from '../components/Button';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { createShadow } from '../utils/styling';
import { useAuth } from '../lib/auth/AuthContext';
import { checkIsAdmin } from '@/lib/auth/adminHelpers';

const { width, height } = Dimensions.get('window');

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

export default function SignInScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  const { signInWithEmail, signUpWithEmail, signOut, loading: authLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration form state
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Form validation
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [fullNameError, setFullNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const { user } = useAuth();

  const validateLoginForm = () => {
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
    
    return isValid;
  };
  
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

  const handleSignIn = async () => {
    if (!validateLoginForm()) return;
    
    try {
      setIsLoading(true);
      const { user: signedInUser } = await signInWithEmail(email, password);
      
      if (!signedInUser?.id) {
        throw new Error('Failed to get user information');
      }
      
      const isAdmin = await checkIsAdmin(signedInUser.id);
      if (isAdmin) {
        router.replace('/(admin-tabs)');
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      Alert.alert('Sign In Failed', error.message || 'Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
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
          [{ text: 'OK', onPress: () => setIsRegistering(false) }]
        );
      } else {
        // If no email confirmation required or already confirmed
        Alert.alert(
          'Registration Successful', 
          'Your account has been created successfully. You can now sign in.',
          [{ text: 'OK', onPress: () => setIsRegistering(false) }]
        );
      }
    } catch (error: any) {
      // Handle specific error cases
      if (error.message?.includes('User already registered')) {
        Alert.alert(
          'Registration Failed', 
          'An account with this email already exists. Please sign in instead.',
          [{ text: 'Go to Sign In', onPress: () => setIsRegistering(false) }]
        );
      } else {
        Alert.alert('Registration Failed', error.message || 'Please try again with different credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueAsGuest = async () => {
    try {
      setIsLoading(true);
      // Sign out any existing session first
      await signOut();
      // Then redirect to tabs
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error continuing as guest:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneNumberChange = (text: string) => {
    setPhoneNumber(formatPhoneNumber(text));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <View style={[styles.logoCircle, createShadow('rgba(200, 25, 25, 0.5)', { width: 0, height: 4 }, 0.25, 10)]}>
                <Image
                  source={require('../assets/images/logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <Text style={[styles.appName, { color: colors.text }]}>Mimi's Delivery</Text>
              <Text style={[styles.tagline, { color: colors.lightText }]}>
                Fresh, whole lamb delivered to your door
              </Text>
            </View>
            
            <View style={styles.authContainer}>
              {isRegistering ? (
                // Registration Form
                <View style={styles.formContainer}>
                  <Text style={[styles.formTitle, { color: colors.text }]}>Create Account</Text>
                  
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Full Name</Text>
                    <TextInput
                      style={[
                        styles.input, 
                        { 
                          borderColor: fullNameError ? 'red' : colors.border,
                          color: colors.text,
                          backgroundColor: colors.card
                        }
                      ]}
                      placeholder="Enter your full name"
                      placeholderTextColor={colors.lightText}
                      value={fullName}
                      onChangeText={setFullName}
                    />
                    {fullNameError ? <Text style={styles.errorText}>{fullNameError}</Text> : null}
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Email</Text>
                    <TextInput
                      style={[
                        styles.input, 
                        { 
                          borderColor: emailError ? 'red' : colors.border,
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
                    {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Phone Number</Text>
                    <TextInput
                      style={[
                        styles.input, 
                        { 
                          borderColor: phoneError ? 'red' : colors.border,
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
                    {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Password</Text>
                    <TextInput
                      style={[
                        styles.input, 
                        { 
                          borderColor: passwordError ? 'red' : colors.border,
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
                    {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Confirm Password</Text>
                    <TextInput
                      style={[
                        styles.input, 
                        { 
                          borderColor: confirmPasswordError ? 'red' : colors.border,
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
                    {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
                  </View>
                  
                  <Button
                    title="Create Account"
                    onPress={handleSignUp}
                    style={styles.actionButton}
                  />
                  
                  <TouchableOpacity onPress={() => setIsRegistering(false)}>
                    <Text style={[styles.switchModeText, { color: colors.primary }]}>
                      Already have an account? Sign In
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // Login Form
                <View style={styles.formContainer}>
                  <Text style={[styles.formTitle, { color: colors.text }]}>Sign In</Text>
                  
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Email</Text>
                    <TextInput
                      style={[
                        styles.input, 
                        { 
                          borderColor: emailError ? 'red' : colors.border,
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
                    {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Password</Text>
                    <TextInput
                      style={[
                        styles.input, 
                        { 
                          borderColor: passwordError ? 'red' : colors.border,
                          color: colors.text,
                          backgroundColor: colors.card
                        }
                      ]}
                      placeholder="Enter your password"
                      placeholderTextColor={colors.lightText}
                      secureTextEntry
                      value={password}
                      onChangeText={setPassword}
                    />
                    {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
                  </View>
                  
                  <TouchableOpacity style={styles.forgotPasswordContainer}>
                    <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>
                  
                  <Button
                    title="Sign In"
                    onPress={handleSignIn}
                    style={styles.actionButton}
                  />
                  
                  <TouchableOpacity onPress={() => setIsRegistering(true)}>
                    <Text style={[styles.switchModeText, { color: colors.primary }]}>
                      Don't have an account? Sign Up
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              
              <View style={styles.dividerContainer}>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.lightText }]}>OR</Text>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
              </View>
              
              <Button
                title="Continue as Guest"
                onPress={handleContinueAsGuest}
                style={styles.guestButton}
                variant="outline"
              />
              
              <Text style={[styles.note, { color: colors.lightText }]}>
                <Ionicons name="information-circle-outline" size={16} color={colors.lightText} />
                {' '}
                Note: You'll need to sign in to track your order status
              </Text>
            </View>
          </View>
          
          <Image
            source={require('../assets/images/meat-banner.png')}
            style={[styles.backgroundPattern, { opacity: colorScheme === 'dark' ? 0.05 : 0.1 }]}
            resizeMode="cover"
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {(isLoading || authLoading) && (
        <View style={[styles.loadingOverlay, { backgroundColor: colors.background + 'CC' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
    zIndex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: height * 0.05,
    marginBottom: 20,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 70,
    height: 70,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
  },
  authContainer: {
    width: '100%',
    marginBottom: Platform.OS === 'ios' ? 30 : 10,
  },
  formContainer: {
    width: '100%',
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
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
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  actionButton: {
    marginBottom: 16,
  },
  switchModeText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
  },
  guestButton: {
    marginBottom: 20,
  },
  note: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  backgroundPattern: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
}); 
