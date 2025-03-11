import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useAuth } from '../lib/auth/AuthContext';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { supabase } from '../utils/supabase';

export default function TestAuthScreen() {
  const { signInWithEmail, user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];

  const handleEmailSignIn = async () => {
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      
      console.log('Starting Email Sign-In...');
      await signInWithEmail(email, password);
      
      // Get the session to verify authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw sessionError;
      }
      
      setResult({
        user: session?.user,
        session: session
      });
      
      console.log('Sign-in successful:', session);
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setError(err.message || 'An error occurred during sign-in');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      setError(null);
      await signOut();
      setResult(null);
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign-out');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Authentication Test</Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>Processing...</Text>
          </View>
        ) : (
          <>
            {!user ? (
              <View style={styles.formContainer}>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
                  placeholder="Email"
                  placeholderTextColor={colors.lightText}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
                  placeholder="Password"
                  placeholderTextColor={colors.lightText}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
                
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.primary }]}
                  onPress={handleEmailSignIn}
                >
                  <Text style={styles.buttonText}>Sign In with Email</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.error }]}
                onPress={handleSignOut}
              >
                <Text style={styles.buttonText}>Sign Out</Text>
              </TouchableOpacity>
            )}
          </>
        )}
        
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
            <Text style={[styles.errorTitle, { color: colors.error }]}>Error</Text>
            <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
          </View>
        )}
        
        {result && (
          <View style={[styles.resultContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.resultTitle, { color: colors.text }]}>Success!</Text>
            <Text style={[styles.resultText, { color: colors.lightText }]}>
              User ID: {result.user?.id}{'\n'}
              Email: {result.user?.email}{'\n'}
              Full Name: {result.user?.user_metadata?.full_name || 'Not provided'}{'\n'}
              Phone: {result.user?.user_metadata?.phone || 'Not provided'}{'\n'}
              Provider: {result.user?.app_metadata?.provider || 'Email/Password'}
            </Text>
          </View>
        )}

        {user && (
          <View style={[styles.userContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Current User:</Text>
            <Text style={[styles.userText, { color: colors.lightText }]}>
              ID: {user.id}{'\n'}
              Email: {user.email}{'\n'}
              Full Name: {user.user_metadata?.full_name || 'Not provided'}{'\n'}
              Phone: {user.user_metadata?.phone || 'Not provided'}{'\n'}
              Provider: {user.app_metadata?.provider || 'Email/Password'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  formContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    width: '100%',
    padding: 16,
    marginTop: 20,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
  },
  resultContainer: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 14,
  },
  userContainer: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  userText: {
    fontSize: 14,
  },
}); 