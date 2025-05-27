import { Redirect } from 'expo-router';
import { useAuth } from '../lib/auth/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { checkIsAdmin } from '../lib/auth/adminHelpers';
import { useEffect, useState } from 'react';

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];

  useEffect(() => {
    const checkUserRole = async () => {
      if (user?.id) {
        try {
          const adminStatus = await checkIsAdmin(user.id);
          setIsAdmin(adminStatus);
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      }
      setLoading(false);
    };

    if (!authLoading) {
      checkUserRole();
    }
  }, [user, authLoading]);

  // Show loading indicator while checking authentication status
  if (loading || authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Redirect based on authentication status
  if (!user) {
    // Allow guest access - redirect to main tabs instead of sign-in
    return <Redirect href="/(tabs)" />;
  }

  // Redirect based on user role
  if (isAdmin) {
    return <Redirect href="/(admin-tabs)" />;
  } else {
    return <Redirect href="/(tabs)" />;
  }
}