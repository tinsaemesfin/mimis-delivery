import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams, useSegments } from 'expo-router';
import { supabase } from '../utils/supabase';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const segments = useSegments();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];

  useEffect(() => {
    console.log('AuthCallback mounted with params:', JSON.stringify(params));
    
    const setupDeepLinks = () => {
      // Register for URL opening events
      const subscription = Linking.addEventListener('url', handleDeepLink);
      return () => subscription.remove();
    };

    const handleDeepLink = async (event: { url: string }) => {
      console.log('Received deep link:', event.url);
      
      try {
        // Enhanced logging for debugging
        console.log('Full deep link URL:', event.url);
        
        // Extract the pkce_token from params (this is coming directly from app)
        const pkceToken = params.token || 
                         (typeof params.token === 'string' ? params.token : 
                          Array.isArray(params.token) ? params.token[0] : undefined);
        
        if (pkceToken && typeof pkceToken === 'string') {
          console.log('Found PKCE token directly in params:', pkceToken.substring(0, 5) + '...');
          await SecureStore.setItemAsync('supabase_recovery_token', pkceToken);
          console.log('Stored PKCE token from params');
          
          // Navigate to reset password
          router.replace('/(auth)/reset-password');
          return;
        }
        
        // Special case for handling Supabase verify URLs directly
        if (event.url.includes('supabase.co/auth/v1/verify')) {
          console.log('Detected Supabase verify URL, extracting token...');
          
          // Parse the URL
          const url = new URL(event.url);
          
          // Get the token directly from the URL
          const token = url.searchParams.get('token');
          const type = url.searchParams.get('type');
          
          console.log('Extracted from verify URL:', { 
            hasToken: !!token, 
            type,
            tokenPreview: token ? `${token.substring(0, 5)}...` : 'none' 
          });
          
          if (token && type === 'recovery') {
            console.log('Valid recovery token found in verify URL');
            await SecureStore.setItemAsync('supabase_recovery_token', token);
            console.log('Stored recovery token from verify URL');
            
            // Navigate to reset password
            router.replace('/(auth)/reset-password');
            return;
          }
        }
        
        // Parse URL and extract all parameters, including from the fragment/hash
        const { queryParams, path } = Linking.parse(event.url);
        console.log('Deep link parsed data:', JSON.stringify({ queryParams, path }));
        
        // Try to parse the URL to get raw search params
        let url;
        try {
          url = new URL(event.url);
          console.log('URL parsed successfully:', url.toString());
          
          // Try to get a token directly from the URL
          const directToken = url.searchParams.get('token');
          if (directToken) {
            console.log('Found token directly in URL parameter');
            await SecureStore.setItemAsync('supabase_recovery_token', directToken);
            console.log('Stored direct token from URL parameter');
          }
        } catch (e) {
          console.error('Error parsing URL:', e);
          // Try to construct a valid URL
          try {
            // If it's a custom scheme URL, convert it to a format URL can parse
            if (event.url.startsWith('mimisdelivery://')) {
              const httpUrl = event.url.replace('mimisdelivery://', 'https://mimisdelivery.com/');
              url = new URL(httpUrl);
              console.log('Converted URL for parsing:', url.toString());
            } else {
              throw new Error('URL format not recognized');
            }
          } catch (e2) {
            console.error('Could not convert URL:', e2);
            url = { hash: '', searchParams: new URLSearchParams() };
          }
        }
        
        // Handle the hash part - important for redirect from web browser
        const hash = url.hash ? url.hash.substring(1) : ''; // Remove the # character
        const hashParams = new URLSearchParams(hash);
        console.log('Hash params:', JSON.stringify(Object.fromEntries(hashParams.entries())));
        
        // Check URL search params
        console.log('URL search params:', 
          url.searchParams ? JSON.stringify(Object.fromEntries(url.searchParams.entries())) : 'No search params');
        
        // Special case for handling Supabase reset password tokens
        let tokenFromSpecialCases = null;
        
        // Try to find token in various parts of the URL
        if (event.url.includes('type=recovery') && event.url.includes('token=')) {
          const tokenMatch = event.url.match(/token=([^&]+)/);
          if (tokenMatch && tokenMatch[1]) {
            tokenFromSpecialCases = tokenMatch[1];
            console.log('Found token from URL pattern:', tokenFromSpecialCases);
          }
        }
        
        // Check for fragment tokens (common when redirected from web browser)
        if (event.url.includes('#access_token=') || hash.includes('access_token=')) {
          const fragmentTokenMatch = event.url.match(/#access_token=([^&]+)/);
          if (fragmentTokenMatch && fragmentTokenMatch[1]) {
            tokenFromSpecialCases = fragmentTokenMatch[1];
            console.log('Found token from fragment:', tokenFromSpecialCases);
          } else if (hashParams.get('access_token')) {
            tokenFromSpecialCases = hashParams.get('access_token');
            console.log('Found token from hash params:', tokenFromSpecialCases);
          }
        }
        
        // Extract token for various auth operations
        const token = 
          queryParams?.token || 
          hashParams.get('token') || 
          tokenFromSpecialCases ||
          (typeof params.token === 'string' ? params.token : Array.isArray(params.token) ? params.token[0] : undefined);
        
        const accessToken = 
          queryParams?.access_token || 
          hashParams.get('access_token') || 
          tokenFromSpecialCases ||
          (typeof params.access_token === 'string' ? params.access_token : Array.isArray(params.access_token) ? params.access_token[0] : undefined);
          
        const refreshToken = 
          queryParams?.refresh_token || 
          hashParams.get('refresh_token') || 
          (typeof params.refresh_token === 'string' ? params.refresh_token : Array.isArray(params.refresh_token) ? params.refresh_token[0] : undefined);
        
        const type = 
          queryParams?.type || 
          hashParams.get('type') || 
          (typeof params.type === 'string' ? params.type : Array.isArray(params.type) ? params.type[0] : undefined);
          
        console.log('Found tokens:', { 
          hasAccessToken: !!accessToken, 
          hasRefreshToken: !!refreshToken,
          type,
          tokenPreview: accessToken ? 
            (typeof accessToken === 'string' ? `${accessToken.substring(0, 5)}...` : 'array-token') : 
            'none'
        });
        
        if (accessToken) {
          // Convert to string if it's an array
          const accessTokenStr = Array.isArray(accessToken) ? accessToken[0] : accessToken;
          await SecureStore.setItemAsync('supabase_recovery_token', accessTokenStr);
          console.log('Stored recovery token successfully');
          
          if (refreshToken) {
            // Convert to string if it's an array
            const refreshTokenStr = Array.isArray(refreshToken) ? refreshToken[0] : refreshToken;
            await SecureStore.setItemAsync('supabase_refresh_token', refreshTokenStr);
            console.log('Stored refresh token successfully');
          }
          
          try {
            // Try to set the session with the tokens
            const { data, error } = await supabase.auth.setSession({
              access_token: accessTokenStr,
              refresh_token: refreshToken ? (Array.isArray(refreshToken) ? refreshToken[0] : refreshToken) : '',
            });
            
            if (error) {
              console.error('Error setting session:', error.message);
              // Even if setting session fails, we'll still try to proceed with reset
            } else {
              console.log('Session established successfully', data);
            }
          } catch (e) {
            console.error('Exception setting session:', e);
          }
          
          // Always navigate to reset password when we have a token
          router.replace('/(auth)/reset-password');
          return;
        }
        
        // Handle the query parameters based on type
        if (type === 'signup') {
          console.log('Processing signup confirmation');
          
          try {
            // For signup, we directly handle the verification in the app
            if (token) {
              const tokenHash = typeof token === 'string' ? token : Array.isArray(token) ? token[0] : '';
              const { error } = await supabase.auth.verifyEmail({
                token_hash: tokenHash,
              });
              
              if (error) {
                console.error('Error verifying email:', error);
                Alert.alert(
                  'Verification Error',
                  'There was an error verifying your email. Please try again.',
                  [{ text: 'OK', onPress: () => router.replace('/sign-in') }]
                );
              } else {
                console.log('Email verified successfully');
                // Set verification status in AsyncStorage
                await AsyncStorage.setItem('email_verification_success', 'true');
                Alert.alert(
                  'Email Verified',
                  'Your email has been verified successfully. You can now sign in.',
                  [{ text: 'Sign In', onPress: () => router.replace('/sign-in') }]
                );
              }
            }
          } catch (error) {
            console.error('Error during email verification:', error);
            Alert.alert('Verification Error', 'Failed to verify your email. Please try signing in again.');
            router.replace('/sign-in');
          }
        } else if (type === 'recovery' || queryParams?.type === 'recovery') {
          // For password recovery, we now redirect to the web page
          console.log('Recovery flow is now handled on the web, redirecting to login');
          Alert.alert(
            'Password Reset',
            'Your password has been reset successfully on our website. You can now sign in with your new password.',
            [{ text: 'Sign In', onPress: () => router.replace('/sign-in') }]
          );
        } else {
          // Default redirect
          router.replace('/');
        }
      } catch (error) {
        console.error('Error handling deep link:', error);
        Alert.alert(
          'Link Processing Error',
          'There was an error processing your reset link. Please try requesting a new one.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(auth)/forgot-password'),
            },
          ]
        );
      }
    };
    
    // Handle initial URL when app is opened from a link
    const processInitialURL = async () => {
      try {
        const initialURL = await Linking.getInitialURL();
        console.log('Initial URL:', initialURL);
        
        // Check if we have token in params (this often happens with web to app redirects)
        if (params.token) {
          console.log('Found token in params:', typeof params.token === 'string' ? params.token.substring(0, 5) + '...' : 'non-string token');
          const tokenStr = typeof params.token === 'string' ? params.token : 
                          Array.isArray(params.token) ? params.token[0] : '';
          
          if (tokenStr) {
            await SecureStore.setItemAsync('supabase_recovery_token', tokenStr);
            console.log('Stored token from params');
            router.replace('/(auth)/reset-password');
            return;
          }
        }
        
        if (initialURL) {
          await handleDeepLink({ url: initialURL });
        } else if (params.type === 'recovery' || params.access_token) {
          // If we have recovery params but no initial URL, construct one
          const constructedUrl = Linking.createURL('auth-callback', {
            queryParams: {
              type: typeof params.type === 'string' ? params.type : Array.isArray(params.type) ? params.type[0] : '',
              access_token: typeof params.access_token === 'string' ? params.access_token : Array.isArray(params.access_token) ? params.access_token[0] : '',
              refresh_token: typeof params.refresh_token === 'string' ? params.refresh_token : Array.isArray(params.refresh_token) ? params.refresh_token[0] : ''
            }
          });
          console.log('Constructed URL from params:', constructedUrl);
          await handleDeepLink({ url: constructedUrl });
        } else {
          console.log('No initial URL and no recovery params');
          router.replace('/');
        }
      } catch (error) {
        console.error('Error processing initial URL:', error);
        router.replace('/');
      }
    };
    
    const cleanup = setupDeepLinks();
    processInitialURL();
    
    return cleanup;
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.text, { color: colors.text }]}>Processing authentication...</Text>
      <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  loader: {
    marginTop: 20,
  },
}); 