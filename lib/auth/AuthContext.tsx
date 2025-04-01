import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

type AuthContextType = {
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<any>;
  signUpWithEmail: (email: string, password: string, fullName: string, phoneNumber: string) => Promise<any>;
  signOut: () => Promise<void>;
  user: any;
  error: Error | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Initialize auth state
    const initializeAuth = async () => {
      try {
        setLoading(true);
        console.log('Initializing auth...');
        
        // First check AsyncStorage for existing session
        const storedSession = await AsyncStorage.getItem('session');
        if (storedSession) {
          console.log('Found stored session');
          const parsedSession = JSON.parse(storedSession);
          setSession(parsedSession);
        }

        // Then try to get the current session from Supabase
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          throw sessionError;
        }

        if (currentSession) {
          console.log('Got current session from Supabase');
          setSession(currentSession);
          await AsyncStorage.setItem('session', JSON.stringify(currentSession));
        } else {
          console.log('No current session found');
        }

        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
          console.log('Auth state changed:', _event, !!newSession);
          setSession(newSession);
          
          try {
            if (newSession) {
              await AsyncStorage.setItem('session', JSON.stringify(newSession));
            } else {
              await AsyncStorage.removeItem('session');
            }
          } catch (err) {
            console.error('Error updating stored session:', err);
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error('Error initializing auth:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        // Clear session on error
        setSession(null);
        try {
          await AsyncStorage.removeItem('session');
        } catch (storageErr) {
          console.error('Error clearing stored session:', storageErr);
        }
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Attempting sign in for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      if (data.session) {
        console.log('Sign in successful');
        setSession(data.session);
        await AsyncStorage.setItem('session', JSON.stringify(data.session));
      }
      
      return data;
    } catch (err) {
      console.error('Email sign in error:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string, phoneNumber: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Attempting sign up for:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        phone: phoneNumber,
        options: {
          data: {
            full_name: fullName,
            phone: phoneNumber
          },
          emailRedirectTo: 'mimisdelivery://auth-callback'
        }
      });

      if (error) throw error;
      
      if (data.session) {
        console.log('Sign up successful');
        setSession(data.session);
        await AsyncStorage.setItem('session', JSON.stringify(data.session));
      }
      
      return data;
    } catch (err) {
      console.error('Email sign up error:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Attempting sign out');
      
      await supabase.auth.signOut();
      await AsyncStorage.removeItem('session');
      setSession(null);
      console.log('Sign out successful');
    } catch (err) {
      console.error('Sign out error:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    session,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    user: session?.user ?? null,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 