import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthContextType = {
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<any>;
  signUpWithEmail: (email: string, password: string, fullName: string, phoneNumber: string) => Promise<any>;
  signOut: () => Promise<void>;
  user: any;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize auth state
    const initializeAuth = async () => {
      try {
        // First try to get the current session from Supabase
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession) {
          setSession(currentSession);
          await AsyncStorage.setItem('session', JSON.stringify(currentSession));
        }

        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
          setSession(newSession);
          if (newSession) {
            await AsyncStorage.setItem('session', JSON.stringify(newSession));
          } else {
            await AsyncStorage.removeItem('session');
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      if (data.session) {
        setSession(data.session);
        await AsyncStorage.setItem('session', JSON.stringify(data.session));
      }
      
      return data;
    } catch (error) {
      console.error('Email sign in error:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string, phoneNumber: string) => {
    try {
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
        setSession(data.session);
        await AsyncStorage.setItem('session', JSON.stringify(data.session));
      }
      
      return data;
    } catch (error) {
      console.error('Email sign up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      await AsyncStorage.removeItem('session');
      setSession(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const value = {
    session,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    user: session?.user ?? null,
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