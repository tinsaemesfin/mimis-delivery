import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export default function ResetToken() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    const handleTokenParam = async () => {
      console.log('ResetToken page loaded with params:', JSON.stringify(params));
      
      // Get token from params
      const token = params.token || 
                   (typeof params.token === 'string' ? params.token : 
                    Array.isArray(params.token) ? params.token[0] : undefined);
      
      if (token && typeof token === 'string') {
        console.log('Found token in params:', token.substring(0, 5) + '...');
        
        // Store the token for the reset password screen
        await SecureStore.setItemAsync('supabase_recovery_token', token);
        console.log('Stored token from direct params');
        
        // Go to the reset password screen
        router.replace('/(auth)/reset-password');
      } else {
        console.log('No token found in params');
        Alert.alert(
          'Invalid Link',
          'The password reset link appears to be invalid. Please request a new one.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(auth)/forgot-password'),
            },
          ]
        );
      }
    };
    
    handleTokenParam();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Processing reset token...</Text>
      <ActivityIndicator size="large" color="#0066CC" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
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