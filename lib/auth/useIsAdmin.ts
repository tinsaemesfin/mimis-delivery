import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';

/**
 * Hook to check if a user is an admin and super admin by looking up their user_id in the admins table
 * @param userId The user ID to check
 * @returns An object containing isAdmin, isSuperAdmin status and loading state
 */
export function useIsAdmin(userId: string | undefined) {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function checkAdminStatus() {
      if (!userId) {
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Query the admins table to check if the user_id exists and get super admin status
        const { data, error } = await supabase
          .from('admins')
          .select('*, is_super_admin')
          .eq('user_id', userId)
          .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 is the error code for "no rows returned"
          throw error;
        }
        
        // If data exists, the user is an admin
        const adminStatus = !!data;
        const superAdminStatus = !!data?.is_super_admin;
        
        setIsAdmin(adminStatus);
        setIsSuperAdmin(superAdminStatus);
      } catch (err) {
        console.error('Error checking admin status:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsAdmin(false);
        setIsSuperAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    checkAdminStatus();
  }, [userId]);

  return { isAdmin, isSuperAdmin, loading, error };
} 