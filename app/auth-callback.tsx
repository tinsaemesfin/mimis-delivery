import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../utils/supabase';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];

  useEffect(() => {
    const handleDeepLink = async () => {
      // Process the auth callback
      const { type, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('Auth callback error:', error);
        router.replace('/sign-in');
        return;
      }

      // Check if the type is recovery (password reset)
      if (params.type === 'recovery') {
        router.replace('/reset-password');
        return;
      }

      // For other types, just go to the home page
      router.replace('/');
    };

    handleDeepLink();
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