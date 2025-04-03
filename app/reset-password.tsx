import React, { useEffect } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import { Text, View } from 'react-native';

export default function ResetPassword() {
  // Get URL params which might contain code or token
  const params = useLocalSearchParams();
  const code = params.code;
  
  // Log the parameters for debugging
  useEffect(() => {
    console.log('RESET PASSWORD ROUTE - URL PARAMS:', JSON.stringify(params));
    if (code) {
      console.log('FOUND CODE PARAMETER:', code);
    } else {
      console.log('WARNING: No code parameter found in URL params');
    }
  }, [params]);
  
  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false,
          // Route should be accessible without auth
          presentation: 'transparentModal'
        }} 
      />
      <ResetPasswordScreen initialCode={code as string} />
    </>
  );
} 