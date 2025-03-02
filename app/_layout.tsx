import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { useColorScheme } from '../hooks/useColorScheme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="sign-in" options={{ 
          headerShown: false,
          animation: 'slide_from_right',
        }} />
        <Stack.Screen name="animal-selection" options={{ 
          title: 'Select Animal',
          headerBackTitle: 'Home',
          animation: 'slide_from_right',
        }} />
        <Stack.Screen name="order-details" options={{ 
          title: 'Order Details',
          headerBackTitle: 'Back',
          animation: 'slide_from_right',
          // Reset the navigation stack to prevent going back through all screens
          presentation: 'modal',
        }} />
        <Stack.Screen name="order-confirmation" options={{ 
          headerShown: false,
          // Reset the navigation stack to prevent going back through all screens 
          presentation: 'modal',
        }} />
      </Stack>
    </ThemeProvider>
  );
}
