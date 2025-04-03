import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ""

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration. Please check your environment variables.');
}

// Check if we're in development mode
const isDevelopment = __DEV__ || Constants.appOwnership === 'expo';

// Get the redirect URL - using the proper format according to Expo deep linking
const getRedirectUrl = () => {
  return Linking.createURL('auth-callback', {
    queryParams: { type: 'recovery' }
  });
};

// Create the Supabase client with the recommended mobile settings
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Changed to false for mobile apps per blog article
    flowType: 'pkce', // Important for mobile apps
    debug: true, // Keep this for troubleshooting
  },
  global: {
    headers: {
      'x-app-version': '1.0.0',
    },
  },
})

// Log auth events to help with debugging
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase auth event:', event, session ? 'With session' : 'No session');
  
  if (event === 'PASSWORD_RECOVERY') {
    console.log('Password recovery event detected');
    // We could handle the recovery here if needed
  }
});

// Helper function for password reset with correct redirect URL
export const resetPasswordForEmail = async (email: string) => {
  // Use a deep link that works with Expo's Linking system
  // IMPORTANT: Make sure this matches EXACTLY what's in Supabase redirect URLs
  const appResetUrl = Platform.select({
    ios: 'mimisdelivery://reset-password',
    android: 'mimisdelivery://reset-password',
    default: 'mimisdelivery://reset-password'
  });
  
  console.log('[CRITICAL] Reset password redirect URL:', appResetUrl);
  
  try {
    console.log('Sending reset email to:', email);
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: appResetUrl,
    });
    
    if (error) {
      console.error('Error sending reset email:', error);
    } else {
      console.log('Reset email sent successfully');
      console.log('IMPORTANT: When clicked, the link should open your app with:');
      console.log('mimisdelivery://reset-password?code=XXXX');
    }
    
    return { data, error };
  } catch (err) {
    console.error('Exception sending reset email:', err);
    throw err;
  }
};

// Helper function to process a reset link URL and extract the token
export const extractTokenFromResetLink = async (link: string): Promise<{
  success: boolean;
  token?: string;
  type?: 'verify' | 'standard';
  error?: string;
}> => {
  console.log('Attempting to extract token from:', link);
  
  if (!link) {
    console.error('No link provided to extract token from');
    return { success: false, error: 'No link provided' };
  }

  try {
    // Parse the URL
    let url;
    try {
      url = new URL(link);
      console.log('Successfully parsed URL:', url.toString());
    } catch (e) {
      console.error('Could not parse URL:', link, e);
      return { success: false, error: 'Invalid URL format' };
    }

    // First check for standard Supabase verify URL
    // Format: https://xyz.supabase.co/auth/v1/verify?token=ABC&type=recovery&redirect_to=...
    if (url.pathname.includes('/auth/v1/verify')) {
      console.log('Detected Supabase verify URL pattern');
      
      // Check for token parameter
      const token = url.searchParams.get('token');
      if (token) {
        console.log('Found token in verify URL:', token);
        return { success: true, token, type: 'verify' };
      }
    }
    
    // Check for token in 'token' query parameter (most common)
    const tokenParam = url.searchParams.get('token');
    if (tokenParam) {
      console.log('Found token in query parameter:', tokenParam);
      return { success: true, token: tokenParam, type: 'standard' };
    }
    
    // Check for token in 'access_token' query parameter
    const accessToken = url.searchParams.get('access_token');
    if (accessToken) {
      console.log('Found access_token in query parameter:', accessToken);
      return { success: true, token: accessToken, type: 'standard' };
    }
    
    // Check for token in hash fragment (#token=xyz)
    const hashParams = new URLSearchParams(url.hash.substring(1));
    const hashToken = hashParams.get('token') || hashParams.get('access_token');
    if (hashToken) {
      console.log('Found token in URL hash fragment:', hashToken);
      return { success: true, token: hashToken, type: 'standard' };
    }
    
    // Check if the URL ends with the token (some custom implementations)
    const lastPathSegment = url.pathname.split('/').pop();
    if (lastPathSegment && lastPathSegment.length > 20) {
      console.log('Using last path segment as potential token:', lastPathSegment);
      return { success: true, token: lastPathSegment, type: 'standard' };
    }
    
    console.error('No token found in URL:', link);
    return { success: false, error: 'No token found in URL' };
  } catch (e: unknown) {
    console.error('Error extracting token:', e);
    return { 
      success: false, 
      error: 'Error processing URL: ' + (e instanceof Error ? e.message : String(e)) 
    };
  }
};

// Parse Supabase's URL format which uses # instead of ? for query params
// This is identified as a key issue in the blog article
export const parseSupabaseUrl = (url: string) => {
  let parsedUrl = url;
  if (url.includes("#")) {
    parsedUrl = url.replace("#", "?");
  }
  return parsedUrl;
};

// Helper function to handle auth tokens from deeplinks
export const loginWithToken = async (access_token: string, refresh_token?: string) => {
  try {
    console.log('Setting session with tokens');
    
    await supabase.auth.setSession({
      access_token,
      refresh_token: refresh_token || '',
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error setting session with token:', error);
    return { success: false, error };
  }
};

// Helper function to directly verify a PKCE token for password recovery
export const verifyPkceToken = async (token: string) => {
  if (!token.startsWith('pkce_')) {
    return { 
      success: false, 
      error: 'Not a PKCE token' 
    };
  }

  try {
    console.log('Verifying PKCE token for password recovery');
    
    // Use the verifyOtp method which is designed to handle PKCE tokens
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'recovery',
    });

    if (error) {
      console.error('Error verifying PKCE token:', error.message);
      return { 
        success: false, 
        error: error.message 
      };
    }

    console.log('PKCE token verified successfully:', data);
    return { 
      success: true, 
      data 
    };
  } catch (error) {
    console.error('Exception verifying PKCE token:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify token'
    };
  }
};

// Admin function to update user password by directly using token
export const adminUpdatePassword = async (token: string, newPassword: string): Promise<{
  success: boolean;
  error?: string;
  method?: 'direct_admin' | 'recovery_endpoint';
}> => {
  console.log('Attempting admin password update with token (service key available: ', 
    !!process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY, ')');
  
  // First attempt: Use admin API if service key is available
  if (process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY) {
    try {
      // Try to extract user ID from token if possible
      let userId = '';
      try {
        // Try to decode JWT - this only works with JWT tokens, not PKCE tokens
        const base64Url = token.split('.')[1];
        if (base64Url) {
          // Safe atob polyfill for React Native
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const decodedData = (() => {
            try {
              // Use built-in atob if available
              return atob(base64);
            } catch (e) {
              // Fallback for React Native which doesn't have atob
              return Buffer.from(base64, 'base64').toString('binary');
            }
          })();
          
          const jsonPayload = decodeURIComponent(
            Array.from(decodedData).map(c => {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join('')
          );
          
          const payload = JSON.parse(jsonPayload);
          userId = payload.sub;
          console.log('Extracted user ID from token:', userId);
        }
      } catch (e) {
        console.error('Could not extract user ID from token:', e);
        // We'll try direct token approach instead if we can't get the user ID
      }
      
      if (userId) {
        // Use admin API to directly update the password if we have a user ID
        console.log('Making admin API call to update password for user:', userId);
        
        const adminClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || '',
          process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY || '',
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          }
        );
        
        const { error } = await adminClient.auth.admin.updateUserById(
          userId,
          { password: newPassword }
        );
        
        if (error) {
          console.error('Admin password update failed:', error);
          // We'll try recovery endpoint as fallback
        } else {
          console.log('Admin password update successful');
          return { success: true, method: 'direct_admin' };
        }
      }
    } catch (error) {
      console.error('Error during admin password update:', error);
      // We'll try recovery endpoint as fallback
    }
  } else {
    console.log('No service key available, skipping direct admin update');
  }
  
  // Second attempt: Use recovery endpoint
  try {
    console.log('Trying password update via recovery endpoint');
    
    // First ensure we have the token in the session
    // This will help with authorization for the updateUser call
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session before password update:', sessionError);
    } else if (!session?.session) {
      console.log('No active session, attempting to recover with token');
      try {
        // Try to use the token to create a session
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'recovery'
        });
        
        if (verifyError) {
          console.error('Error verifying token:', verifyError);
        }
      } catch (e) {
        console.error('Error in token verification:', e);
      }
    }
    
    // Now attempt to update the password
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) {
      console.error('Recovery endpoint password update failed:', error);
      return { 
        success: false, 
        error: `Recovery update failed: ${error.message}`, 
        method: 'recovery_endpoint' 
      };
    }
    
    console.log('Recovery endpoint password update successful');
    return { success: true, method: 'recovery_endpoint' };
  } catch (error: unknown) {
    console.error('Unhandled error in recovery endpoint update:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { 
      success: false, 
      error: `Unhandled error: ${errorMessage}`, 
      method: 'recovery_endpoint'
    };
  }
};

export const debugDeepLink = async () => {
  try {
    const initialUrl = await Linking.getInitialURL();
    console.log('Initial URL:', initialUrl);
    
    const redirectUrl = Linking.createURL('reset-token', {
      queryParams: { type: 'recovery' }
    });
    console.log('Redirect URL that should be used:', redirectUrl);
    
    return { initialUrl, redirectUrl };
  } catch (e) {
    console.error('Debug deep link error:', e);
    return null;
  }
};

// Helper function for user sign-up (email confirmation uses deep links)
export const signUpWithEmail = async (email: string, password: string) => {
  // Use deep linking for email confirmation
  const redirectUrl = Linking.createURL('auth-callback', {
    queryParams: { type: 'signup' }
  });
  
  console.log('Email confirmation redirect URL:', redirectUrl);
  
  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
    }
  });
};
        