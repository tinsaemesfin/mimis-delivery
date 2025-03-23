import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { AuthProvider } from '../lib/auth/AuthContext';
import { useColorScheme } from '../hooks/useColorScheme';
import Auth from './components/auth/Auth';
import Account from './components/auth/Account';
import { Colors } from '../constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AgreementDialog from './components/AgreementDialog';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure any route can link back to `/`
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// This ensures the sign-in screen appears first
export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  const [showAgreement, setShowAgreement] = useState(false);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    checkAgreementStatus();
  }, []);

  const checkAgreementStatus = async () => {
    try {
      const hasAccepted = await AsyncStorage.getItem('hasAcceptedAgreement');
      if (!hasAccepted) {
        setShowAgreement(true);
      }
    } catch (error) {
      console.error('Error checking agreement status:', error);
    }
  };

  const handleAcceptAgreement = async () => {
    try {
      await AsyncStorage.setItem('hasAcceptedAgreement', 'true');
      setShowAgreement(false);
    } catch (error) {
      console.error('Error saving agreement status:', error);
    }
  };

  if (!loaded) {
    return null;
  }

  return (
    <>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="sign-in" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ 
              headerShown: false,
              gestureEnabled: false, // Prevent going back to sign-in
            }} />
            <Stack.Screen name="(admin-tabs)" options={{ 
              headerShown: false,
              gestureEnabled: false, // Prevent going back to sign-in
            }} />
            <Stack.Screen name="animal-selection" options={{ 
              title: 'Select Animal',
              headerBackTitle: 'Back',
              animation: 'slide_from_right',
              
            }} />
            <Stack.Screen name="price-selection" options={{ 
              title: 'Select Price Option',
              headerBackTitle: 'Back',
              animation: 'slide_from_right',
            }} />
             <Stack.Screen name="cut-selection" options={{ 
              title: 'Customize your order',
              headerBackTitle: 'Back',
              animation: 'slide_from_right',
            }} />
            <Stack.Screen name="order-details" options={{ 
              title: 'Order Details',
              headerBackTitle: 'Back',
              animation: 'slide_from_right',
              presentation: 'modal',

            }} />
            <Stack.Screen name="order-confirmation" options={{ 
              headerShown: false,
              presentation: 'modal',

            }} />
            
          </Stack>
          {/* <Auth /> */}
        </ThemeProvider>
      </AuthProvider>
      <AgreementDialog
        visible={showAgreement}
        onAccept={handleAcceptAgreement}
      />
    </>
  );
}
