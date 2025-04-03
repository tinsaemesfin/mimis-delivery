import React from 'react';
import { Stack } from 'expo-router';
import ForgotPasswordScreen from '../../app/screens/ForgotPasswordScreen';

export default function ForgotPassword() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ForgotPasswordScreen />
    </>
  );
} 