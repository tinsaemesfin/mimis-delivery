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
  ScrollView,
  Clipboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import Button from '../../components/Button';
import { supabase, resetPasswordForEmail } from '../../utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

export default function ForgotPasswordScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugModalVisible, setDebugModalVisible] = useState(false);
  const [debugUrls, setDebugUrls] = useState<string[]>([]);
  
  // Monitor network requests for reset password URLs (for debugging)
  useEffect(() => {
    if (__DEV__) {
      // Set up interceptor to capture the reset password URL
      const originalFetch = global.fetch;
      
      global.fetch = function(...args) {
        const [url, options] = args;
        
        // Return the original fetch but also monitor response
        return originalFetch.apply(this, args)
          .then(async (response) => {
            try {
              // If this is a reset password request
              if (
                typeof url === 'string' && 
                url.includes('/auth/v1/recover') && 
                options?.method === 'POST'
              ) {
                console.log('[Debug] Reset password request detected');
                
                // Clone the response so we can read the body
                const clonedResponse = response.clone();
                const responseData = await clonedResponse.json();
                
                if (responseData) {
                  console.log('[Debug] Reset email will be sent with data:', responseData);
                  
                  // Find important URLs to display
                  const redirectTo = options.body ? 
                    JSON.parse(options.body.toString()).redirect_to : null;
                  
                  if (redirectTo) {
                    setDebugUrls(prev => [
                      ...prev, 
                      `Expected Redirect URL: ${redirectTo}`,
                      `Simulated Full Reset URL: ${responseData.action_link || 
                        `https://app.supabase.com/auth/v1/verify?token=EXAMPLE_TOKEN&type=recovery&redirect_to=${encodeURIComponent(redirectTo)}`}`
                    ]);
                  }
                }
              }
            } catch (e) {
              console.error('Error in fetch monitor:', e);
            }
            
            return response;
          });
      };
      
      // Clean up
      return () => {
        global.fetch = originalFetch;
      };
    }
  }, []);

  // Add a function to handle opening the link in an in-app browser
  const handleOpenInBrowser = async (url: string) => {
    try {
      // Open the URL in an in-app browser
      const result = await WebBrowser.openBrowserAsync(url);
      console.log('Browser result:', result);
      
      if (result.type === 'cancel') {
        console.log('Browser was closed by user');
      } else {
        console.log('Browser completed action');
        
        // After the browser is closed, navigate to the reset password screen
        // in case the token was processed
        setTimeout(() => {
          router.replace('/(auth)/reset-password');
        }, 1000);
      }
    } catch (error) {
      console.error('Error opening browser:', error);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      
      console.log('Sending password reset for email:', email);
      
      // Add to debug URLs
      if (__DEV__) {
        setDebugUrls(prev => [
          ...prev, 
          `Requested reset for: ${email}`,
          `Time: ${new Date().toISOString()}`
        ]);
      }
      
      // Use the improved resetPasswordForEmail function that redirects to web
      const { data, error } = await resetPasswordForEmail(email);

      if (error) {
        console.error('Reset password API error:', error);
        throw error;
      }

      console.log('Reset password email sent successfully');
      
      // Add to debug URLs
      if (__DEV__) {
        setDebugUrls(prev => [
          ...prev, 
          `Reset email sent successfully`,
          `Check your inbox for the reset link`
        ]);
        
        // Show debug modal in development
        setDebugModalVisible(true);
      }

      // Success - show alert with explanation of web flow
      Alert.alert(
        'Check your email',
        'We have sent you a password reset link. Please check your inbox and spam folders. You will be redirected to our secure website to complete the password reset.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (!__DEV__) {
                router.replace('/sign-in');
              }
            },
          }
        ]
      );
    } catch (error: any) {
      console.error('Password reset request error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to send reset link. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };
  
  // Copy URL to clipboard
  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied', 'Text copied to clipboard');
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
          
          {/* Add a debug button in development mode */}
          {__DEV__ && (
            <TouchableOpacity
              style={styles.debugButton}
              onPress={() => setDebugModalVisible(true)}
            >
              <Ionicons name="bug-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.content}>
          <Text style={[styles.description, { color: colors.text }]}>
            Enter your email address and we'll send you a link to reset your password.
          </Text>
          
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              For your security, the password reset process will be completed on our secure website.
            </Text>
          </View>

          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholder="Email address"
            placeholderTextColor={colors.lightText}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            editable={!loading}
          />

          <Button
            title="Send Reset Link"
            onPress={handleResetPassword}
            disabled={loading}
            style={styles.button}
          />

          {loading && (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={styles.loading}
            />
          )}
        </View>
        
        {/* Debug Modal - only visible in development */}
        {__DEV__ && (
          <Modal
            visible={debugModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setDebugModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Debug: Reset Password URLs
                </Text>
                
                <ScrollView style={styles.urlList}>
                  {debugUrls.length > 0 ? (
                    debugUrls.map((url, index) => (
                      <TouchableOpacity 
                        key={index} 
                        style={styles.urlItem}
                        onPress={() => copyToClipboard(url)}
                      >
                        <Text style={[styles.urlText, { color: colors.text }]}>
                          {url}
                        </Text>
                        <Ionicons name="copy-outline" size={18} color={colors.lightText} />
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={{ color: colors.lightText, textAlign: 'center', padding: 20 }}>
                      No reset links detected yet. Request a password reset to see details here.
                    </Text>
                  )}
                </ScrollView>
                
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setDebugModalVisible(false)}
                >
                  <Text style={styles.modalCloseButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
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
  debugButton: {
    marginLeft: 'auto',
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
  loading: {
    marginTop: 20,
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
    maxHeight: '80%',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  urlList: {
    maxHeight: 400,
  },
  urlItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  urlText: {
    fontSize: 14,
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  modalCloseButton: {
    marginTop: 20,
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f4fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
}); 