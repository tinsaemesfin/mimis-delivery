import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  SafeAreaView,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import Button from '../../components/Button';
import { 
  supabase, 
  extractTokenFromResetLink, 
  parseSupabaseUrl, 
  loginWithToken,
  verifyPkceToken,
  adminUpdatePassword
} from '../../utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import * as Linking from 'expo-linking';

interface ResetPasswordScreenProps {
  initialCode?: string;
}

export default function ResetPasswordScreen({ initialCode }: ResetPasswordScreenProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  const router = useRouter();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Checking recovery status...');
  const [hasRecoveryMethod, setHasRecoveryMethod] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [resetLink, setResetLink] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [manualResetLink, setManualResetLink] = useState('');
  const [isProcessingLink, setIsProcessingLink] = useState(false);
  const [tokenSource, setTokenSource] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [error, setError] = useState('');
  
  // Process initial code directly if provided
  useEffect(() => {
    if (initialCode) {
      console.log('INITIALCODE FOUND - Processing code directly:', initialCode.substring(0, 5) + '...');
      processResetCode(initialCode);
    }
  }, [initialCode]);
  
  useEffect(() => {
    // Set up link handler
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    // Check recovery status
    checkRecoveryStatus();
    
    // Clean up on unmount
    return () => {
      subscription.remove();
    };
  }, []);

  // Check if we have a valid recovery session
  const checkRecoveryStatus = async () => {
    console.log('Checking recovery status...');
    setLoading(true);
    
    try {
      // First, check URL parameters for code or token
      const url = await Linking.getInitialURL();
      console.log('Initial URL:', url);
      
      if (url) {
        await handleDeepLink({ url });
      } else {
        console.log('No initial URL with recovery parameters');
        
        // Check for stored token as fallback
        const storedToken = await SecureStore.getItemAsync('reset_token');
        if (storedToken) {
          console.log('Found stored reset token');
          setResetToken(storedToken);
          setTokenSource('storage');
          setHasRecoveryMethod(true);
          setStatusMessage('Found stored recovery token.');
        } else {
          console.log('No stored token found');
          setHasRecoveryMethod(false);
          setStatusMessage('No recovery session found. Please request a new reset link.');
        }
      }
    } catch (error) {
      console.error('Error checking recovery status:', error);
      setStatusMessage('Error checking recovery status.');
      setHasRecoveryMethod(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle deep links
  const handleDeepLink = async ({ url }: { url: string }) => {
    console.log('Handling deep link (FULL URL):', url);
    
    if (!url) return;
    
    try {
      // IMPORTANT: Direct debugging of URL format
      if (url.includes('?code=')) {
        console.log('FOUND CODE PARAMETER IN URL!');
        const codeMatch = url.match(/[?&]code=([^&]+)/);
        
        if (codeMatch && codeMatch[1]) {
          const code = codeMatch[1];
          console.log('EXTRACTED CODE:', code);
          await processResetCode(code);
          return;
        }
      }
      
      // Continue with standard parsing if direct extraction fails
      try {
        // Parse URL
        const parsedUrl = new URL(url);
        console.log('Parsed URL:', parsedUrl);
        
        // Supabase's .ConfirmationURL format sends a hash fragment with the token
        // Format: mimisdelivery://reset-password#access_token=xyz&refresh_token=abc&type=recovery
        if (parsedUrl.hash) {
          console.log('Found hash in URL:', parsedUrl.hash);
          
          // Parse the hash fragment
          const hashParams = new URLSearchParams(parsedUrl.hash.substring(1));
          
          // Get the access token from the hash
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const type = hashParams.get('type');
          
          console.log('Hash parameters:', { 
            accessToken: accessToken ? `${accessToken.substring(0, 5)}...` : null,
            refreshToken: refreshToken ? 'exists' : null,
            type
          });
          
          if (accessToken) {
            // We have a token from the hash - use it to create a session
            console.log('Found access token in hash, creating session');
            
            try {
              // Set session with the token
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || '',
              });
              
              if (error) {
                console.error('Error setting session from hash token:', error);
                setStatusMessage(`Error: ${error.message}`);
                setHasRecoveryMethod(false);
              } else {
                console.log('Successfully set session from hash token');
                setHasRecoveryMethod(true);
                setStatusMessage('Recovery session created successfully. You can now reset your password.');
                return;
              }
            } catch (sessionError) {
              console.error('Exception setting session from hash token:', sessionError);
            }
          }
        }
        
        // If hash handling didn't work, continue with standard URL parameters
        
        // Extract the code parameter (for exchangeCodeForSession approach)
        const code = parsedUrl.searchParams.get('code');
        
        // Also check for token for backward compatibility
        const token = parsedUrl.searchParams.get('token') || 
                     parsedUrl.searchParams.get('access_token');
        
        console.log('URL parameters:', { code, token });
        
        if (code) {
          console.log('Found code parameter, proceeding with code exchange flow');
          await processResetCode(code);
        } else if (token) {
          console.log('Found token parameter, proceeding with classic token flow');
          await processResetToken(token);
        } else {
          console.log('No code or token found in URL');
          setHasRecoveryMethod(false);
          setStatusMessage('Invalid reset link. No recovery code found.');
        }
      } catch (urlParseError) {
        console.error('Error parsing URL:', urlParseError);
        // Even if URL parsing fails, still try direct regex extraction
        const codeMatch = url.match(/[?&]code=([^&]+)/);
        
        if (codeMatch && codeMatch[1]) {
          const code = codeMatch[1];
          console.log('EXTRACTED CODE VIA REGEX:', code);
          await processResetCode(code);
          return;
        } else {
          throw urlParseError;
        }
      }
    } catch (error) {
      console.error('Error handling deep link:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setStatusMessage(`Error: ${errorMessage}`);
      setHasRecoveryMethod(false);
    }
  };
  
  // Process the reset code (new recommended approach)
  const processResetCode = async (code: string) => {
    console.log('========================');
    console.log('PROCESSING RESET CODE:');
    console.log('Code length:', code?.length);
    console.log('Code preview:', code?.substring(0, 10) + '...');
    console.log('Full code for debugging:', code);
    console.log('========================');
    
    setLoading(true);
    setStatusMessage('Processing reset code...');
    
    try {
      if (!code || code.trim() === '') {
        console.error('EMPTY CODE PROVIDED');
        setStatusMessage('Error: Empty reset code provided');
        setHasRecoveryMethod(false);
        return;
      }
      
      // Try to clean the code if it's a URL
      let cleanCode = code;
      if (code.includes('?code=')) {
        console.log('Code appears to be a URL, extracting code parameter');
        const codeMatch = code.match(/[?&]code=([^&]+)/);
        if (codeMatch && codeMatch[1]) {
          cleanCode = decodeURIComponent(codeMatch[1]);
          console.log('Extracted clean code from URL:', cleanCode);
        }
      }
      
      // Try to exchange the code for a session
      console.log('Calling exchangeCodeForSession with code:', cleanCode);
      const { data, error } = await supabase.auth.exchangeCodeForSession(cleanCode);
      
      if (error) {
        console.error('Error exchanging code for session:', error);
        // Check for specific error types
        if (error.message.includes('invalid code')) {
          setStatusMessage('Invalid or expired reset code. Please request a new reset link.');
        } else {
          setStatusMessage(`Error: ${error.message}`);
        }
        setHasRecoveryMethod(false);
        return;
      }
      
      console.log('Session exchange response:', {
        hasSession: !!data?.session,
        user: data?.session?.user?.id
      });
      
      if (data?.session) {
        console.log('Session established successfully');
        setHasRecoveryMethod(true);
        setStatusMessage('Recovery session created successfully. You can now reset your password.');
        
        // Store the session tokens for backup
        if (data.session.access_token) {
          await SecureStore.setItemAsync('reset_token', data.session.access_token);
        }
      } else {
        console.error('No session data returned from exchangeCodeForSession');
        setStatusMessage('Failed to establish session from code.');
        setHasRecoveryMethod(false);
      }
    } catch (error) {
      console.error('Exception in processResetCode:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setStatusMessage(`Error: ${errorMessage}`);
      setHasRecoveryMethod(false);
    } finally {
      setLoading(false);
    }
  };
  
  // Process reset token (backward compatibility)
  const processResetToken = async (token: string) => {
    console.log('Processing reset token...');
    setLoading(true);
    
    try {
      // Store the token for later use
      await SecureStore.setItemAsync('reset_token', token);
      setResetToken(token);
      setTokenSource('url');
      setHasRecoveryMethod(true);
      setStatusMessage('Recovery token stored. You can now reset your password.');
    } catch (error) {
      console.error('Error processing reset token:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setStatusMessage(`Error: ${errorMessage}`);
      setHasRecoveryMethod(false);
    } finally {
      setLoading(false);
    }
  };

  // Process a manual reset link
  const processManualResetLink = async (link: string) => {
    console.log('Processing manual reset link...');
    setIsProcessingLink(true);
    
    try {
      if (!link) {
        Alert.alert('Error', 'Please enter a reset link');
        return;
      }
      
      // Check if it's the default Supabase format with hash fragment
      if (link.includes('#access_token=')) {
        console.log('Detected default Supabase hash format');
        
        // Extract the hash fragment
        const hashPart = link.substring(link.indexOf('#'));
        
        // Parse the hash
        const hashParams = new URLSearchParams(hashPart.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken) {
          console.log('Extracted access token from hash fragment');
          
          // Store the token
          await SecureStore.setItemAsync('reset_token', accessToken);
          if (refreshToken) {
            await SecureStore.setItemAsync('refresh_token', refreshToken);
          }
          
          // Try to set the session
          try {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || ''
            });
            
            if (error) {
              console.error('Error setting session from manual link:', error);
            } else {
              console.log('Successfully set session from manual link');
            }
          } catch (sessionError) {
            console.error('Exception setting session:', sessionError);
          }
          
          // Update UI state
          setResetToken(accessToken);
          setTokenSource('manual-hash');
          setHasRecoveryMethod(true);
          setStatusMessage('Recovery token extracted successfully.');
          
          setModalVisible(false);
          Alert.alert('Success', 'Reset link processed successfully. You can now reset your password.');
          return;
        }
      }
      
      // If not the hash format, try parsing the URL for code or token
      try {
        const url = new URL(link);
        const code = url.searchParams.get('code');
        const token = url.searchParams.get('token') || 
                     url.searchParams.get('access_token');
        
        console.log('Manual link parameters:', { code, token });
        
        if (code) {
          // Process with the code exchange flow
          await processResetCode(code);
          setModalVisible(false);
          return;
        } else if (token) {
          // Process with classic token flow
          await processResetToken(token);
          setModalVisible(false);
          return;
        }
      } catch (urlError) {
        console.error('Error parsing URL:', urlError);
      }
      
      // If we couldn't extract code/token directly, try the old extraction method
      const result = await extractTokenFromResetLink(link);
      
      if (!result.success || !result.token) {
        Alert.alert('Error', 'Could not extract a valid token from the link.');
        return;
      }
      
      console.log('Extracted token from link, type:', result.type);
      
      // Store the token
      await SecureStore.setItemAsync('reset_token', result.token);
      setResetToken(result.token);
      setTokenSource('manual');
      setHasRecoveryMethod(true);
      setStatusMessage('Recovery token extracted successfully.');
      
      setModalVisible(false);
      Alert.alert('Success', 'Reset link processed successfully. You can now reset your password.');
    } catch (error) {
      console.error('Error processing manual reset link:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert('Error', `Failed to process reset link: ${errorMessage}`);
    } finally {
      setIsProcessingLink(false);
    }
  };
  
  // Reset password directly using the admin method as a last resort
  const resetPasswordDirectly = async () => {
    console.log('Attempting direct password reset with token');
    
    if (!newPassword || newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Retrieve stored token
      const storedToken = await SecureStore.getItemAsync('reset_token');
      if (!storedToken) {
        console.error('No stored token found for direct reset');
        setError('No recovery token found. Please request a new password reset link.');
        setLoading(false);
        return;
      }
      
      console.log('Retrieved token for direct reset');
      const result = await adminUpdatePassword(storedToken, newPassword);
      
      if (result.success) {
        console.log('Direct password reset successful using', result.method);
        Alert.alert(
          'Success', 
          `Password has been reset successfully using ${result.method === 'direct_admin' ? 'admin API' : 'recovery endpoint'}.`,
          [
            { 
              text: 'OK', 
              onPress: () => {
                // Clear any stored tokens
                SecureStore.deleteItemAsync('reset_token');
                // Navigate back to login
                router.replace('/sign-in');
              }
            }
          ]
        );
      } else {
        console.error('Direct password reset failed:', result.error);
        setError(`Direct reset failed: ${result.error || 'Unknown error'}`);
        
        // Show detailed error info in dev mode
        if (__DEV__) {
          Alert.alert(
            'Debug: Reset Failed', 
            `Method: ${result.method || 'unknown'}\nError: ${result.error || 'Unknown error'}`
          );
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error in direct password reset:', error);
      setError(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdatePassword = async () => {
    // Validate password inputs
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('Attempting to update password with active session');
      
      // First try the standard session-based approach
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        console.error('Error updating password with session:', error);
        
        if (error.message.includes('auth/session')) {
          console.log('Session error detected, trying direct password reset...');
          await resetPasswordDirectly();
          return;
        }
        
        throw error;
      }
      
      console.log('Password updated successfully with session');
      
      // Clear any stored tokens
      await SecureStore.deleteItemAsync('reset_token');
      await SecureStore.deleteItemAsync('supabase_recovery_token');
      
      Alert.alert(
        'Success',
        'Your password has been reset successfully.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/sign-in'),
          },
        ]
      );
    } catch (error) {
      console.error('Error in password update:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('auth/session')) {
        console.log('Session error detected, trying direct password reset...');
        await resetPasswordDirectly();
        return;
      }
      
      setError(`Failed to reset password: ${errorMessage}`);
      Alert.alert('Error', `Failed to reset password: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Debug function to set a mock token (development only)
  const setMockTokenForDebugging = async () => {
    if (__DEV__) {
      console.log('Setting mock token for debugging');
      const mockToken = 'mock_token_' + Math.random().toString(36).substring(2, 10);
      await SecureStore.setItemAsync('reset_token', mockToken);
      setResetToken(mockToken);
      setTokenSource('debug');
      setHasRecoveryMethod(true);
      Alert.alert('Debug', `Mock token set: ${mockToken}`);
    }
  };
  
  // Test function for Supabase verify URL handling
  const testSupabaseVerifyHandling = () => {
    if (__DEV__) {
      console.log('Testing Supabase verify URL handling');
      const testUrl = 'mimisdelivery://reset-password?code=test_code_12345&type=recovery';
      processManualResetLink(testUrl);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.replace('/sign-in')}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Reset Password</Text>
          
          {__DEV__ && (
            <View style={styles.debugIconsContainer}>
              <TouchableOpacity 
                style={styles.debugIcon}
                onPress={setMockTokenForDebugging}
              >
                <Ionicons name="bug-outline" size={20} color="gray" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.debugIcon}
                onPress={testSupabaseVerifyHandling}
              >
                <Ionicons name="flask-outline" size={20} color="gray" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <Text style={[styles.description, { color: colors.text }]}>
            {hasRecoveryMethod
              ? 'Create a new password for your account.'
              : statusMessage}
          </Text>
          
          {__DEV__ && tokenSource && (
            <View style={styles.debugContainer}>
              <Text style={styles.debugText}>
                Token source: {tokenSource}
                {resetToken && ` | Token: ${resetToken.substring(0, 5)}...`}
              </Text>
            </View>
          )}
          
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholder="New Password"
            placeholderTextColor={colors.lightText}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            autoCapitalize="none"
            editable={!loading && hasRecoveryMethod}
          />

          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholder="Confirm New Password"
            placeholderTextColor={colors.lightText}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            editable={!loading && hasRecoveryMethod}
          />

          <Button
            title="Update Password"
            onPress={handleUpdatePassword}
            disabled={loading || !hasRecoveryMethod}
            style={styles.button}
          />

          {!hasRecoveryMethod && (
            <>
            <Button
              title="Request New Reset Link"
              onPress={() => router.replace('/forgot-password')}
              style={styles.secondaryButton}
            />
              
              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => setModalVisible(true)}
              >
                <Text style={styles.linkButtonText}>Paste Reset Link</Text>
              </TouchableOpacity>

              <View style={styles.orContainer}>
                <View style={styles.divider} />
                <Text style={styles.orText}>OR</Text>
                <View style={styles.divider} />
              </View>

              <View style={styles.codeInputContainer}>
                <Text style={styles.codeInputLabel}>Paste reset code directly:</Text>
                <View style={styles.codeInputRow}>
                  <TextInput
                    style={styles.codeInput}
                    placeholder="Paste the reset code from your email"
                    placeholderTextColor="#999"
                    onChangeText={(text) => {
                      if (text && text.trim()) {
                        setResetToken(text.trim());
                      }
                    }}
                  />
                  <TouchableOpacity
                    style={styles.codeSubmitButton}
                    onPress={() => {
                      if (resetToken && resetToken.trim()) {
                        processResetCode(resetToken.trim());
                      } else {
                        Alert.alert('Error', 'Please enter a valid reset code');
                      }
                    }}
                  >
                    <Text style={styles.codeSubmitText}>Submit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          {loading && (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={styles.loading}
            />
          )}
          
          {/* Modal for manual link input */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Paste Reset Link
                </Text>
                
                <Text style={[styles.modalDescription, { color: colors.text }]}>
                  Paste the entire reset link from your email
                </Text>
                
                <TextInput
                  style={[styles.modalInput, { borderColor: colors.border, color: colors.text }]}
                  placeholder="https://..."
                  placeholderTextColor={colors.lightText}
                  value={resetLink}
                  onChangeText={setResetLink}
                  autoCapitalize="none"
                  multiline
                />
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={() => processManualResetLink(resetLink)}
                  >
                    <Text style={styles.modalButtonText}>Process Link</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {showTokenInput && (
            <View style={styles.inputContainer}>
              <Text style={styles.resetLabel}>Enter the reset link you received:</Text>
              <TextInput
                style={styles.linkInput}
                value={manualResetLink}
                onChangeText={setManualResetLink}
                placeholder="Paste reset link here"
                placeholderTextColor="#999"
                multiline={true}
                numberOfLines={3}
                autoCapitalize="none"
              />
              <Text style={styles.linkPreview}>
                {manualResetLink ? `Link: ${manualResetLink}` : 'No link entered yet'}
              </Text>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={() => processManualResetLink(manualResetLink)}
                disabled={isProcessingLink}
              >
                {isProcessingLink ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Process Reset Link</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  debugContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    width: '100%',
  },
  debugText: {
    flex: 1,
    fontSize: 14,
  },
  errorContainer: {
    marginBottom: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#dc3545',
    borderRadius: 8,
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  button: {
    marginTop: 8,
  },
  secondaryButton: {
    marginTop: 16,
    backgroundColor: '#6c757d',
  },
  loading: {
    marginTop: 20,
  },
  debugIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  debugIcon: {
    padding: 8,
    marginHorizontal: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  linkButton: {
    alignSelf: 'center',
    marginTop: 16,
    padding: 8,
  },
  linkButtonText: {
    color: '#0066CC',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    width: '100%',
    minHeight: 80,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  confirmButton: {
    backgroundColor: '#007bff',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  resetLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  linkInput: {
    width: '100%',
    height: 100,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 8,
  },
  linkPreview: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 8,
    borderRadius: 5,
    backgroundColor: '#f9f9f9',
    maxHeight: 100,
    overflow: 'scroll',
  },
  submitButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  orText: {
    marginHorizontal: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  codeInputContainer: {
    marginBottom: 20,
  },
  codeInputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  codeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 8,
  },
  codeSubmitButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  codeSubmitText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
}); 