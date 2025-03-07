import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  Image,
  Platform,
  Dimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import Button from '../components/Button';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { createShadow } from '../utils/styling';

const { width, height } = Dimensions.get('window');

export default function SignInScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSignInWithGoogle = async () => {
    setIsLoading(true);
    
    try {
      // In a real app, here you would use the Google Authentication SDK
      // For this mock, we'll just simulate a successful login
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Navigate to Home screen after successful login
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Google sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleContinueAsGuest = () => {
    // Navigate to home screen
    router.replace('/(tabs)');
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={[styles.logoCircle, createShadow('rgba(200, 25, 25, 0.5)', { width: 0, height: 4 }, 0.25, 10)]}>
            <Image
              source={require('../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.appName, { color: colors.text }]}>Mimi's Delivery</Text>
          <Text style={[styles.tagline, { color: colors.lightText }]}>
            Fresh, whole lamb delivered to your door
          </Text>
        </View>
        
        <View style={styles.authContainer}>
          <TouchableOpacity
            style={[styles.googleButton, { borderColor: colors.border }, createShadow(colors.text, { width: 0, height: 2 }, 0.1, 3)]}
            onPress={handleSignInWithGoogle}
            disabled={isLoading}
          >
            <Image
              source={require('../assets/images/google-logo.png')}
              style={styles.googleLogo}
              resizeMode="contain"
            />
            <Text style={[styles.googleButtonText, { color: colors.text }]}>
              {isLoading ? 'Signing in...' : 'Sign in with Google'}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.dividerContainer}>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.lightText }]}>OR</Text>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
          </View>
          
          <Button
            title="Continue as Guest"
            onPress={handleContinueAsGuest}
            style={styles.guestButton}
            variant="outline"
          />
          
          <Text style={[styles.note, { color: colors.lightText }]}>
            <Ionicons name="information-circle-outline" size={16} color={colors.lightText} />
            {' '}
            Note: You'll need to sign in to track your order status
          </Text>
        </View>
      </View>
      
      <Image
        source={require('../assets/images/meat-banner.png')}
        style={[styles.backgroundPattern, { opacity: colorScheme === 'dark' ? 0.05 : 0.1 }]}
        resizeMode="cover"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
    zIndex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: height * 0.08,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
  },
  authContainer: {
    width: '100%',
    marginBottom: Platform.OS === 'ios' ? 30 : 10,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    marginBottom: 20,
  },
  googleLogo: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
  },
  guestButton: {
    marginBottom: 20,
  },
  note: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  backgroundPattern: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  }
}); 