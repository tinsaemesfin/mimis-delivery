import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../utils/supabase';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import * as Linking from 'expo-linking';

export default function PasswordResetRedirect() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        console.log('Password reset redirect params:', params);
        
        // Create a deep link to the reset-password screen
        const resetPasswordLink = Linking.createURL('/(auth)/reset-password');
        console.log('Redirecting to:', resetPasswordLink);
        
        // Open the reset password screen directly in the app
        await Linking.openURL(resetPasswordLink);
        
        // Since we've opened another link, close this screen
        setTimeout(() => {
          router.replace('/(auth)/reset-password');
        }, 500);
      } catch (error) {
        console.error('Error in password reset redirect:', error);
        // Fall back to direct navigation
        router.replace('/(auth)/reset-password');
      }
    };

    handleRedirect();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.text, { color: colors.text }]}>
        Redirecting to password reset...
      </Text>
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