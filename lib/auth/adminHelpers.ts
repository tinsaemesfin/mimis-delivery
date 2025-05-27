import { supabase } from '../../utils/supabase';

/**
 * Check if a user is an admin by looking up their user_id in the admins table
 * @param userId The user ID to check
 * @returns Promise that resolves to a boolean indicating if the user is an admin
 */
export async function checkIsAdmin(userId: string | undefined): Promise<boolean> {
  if (!userId) {
    return false;
  }

  try {
    // Query the admins table to check if the user_id exists
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is the error code for "no rows returned"
      console.error('Error checking admin status:', error);
      return false;
    }
    
    // If data exists, the user is an admin
    return !!data;
  } catch (err) {
    console.error('Error checking admin status:', err);
    return false;
  }
}

/**
 * Check if a user is a super admin
 * @param userId The user ID to check
 * @returns Promise that resolves to a boolean indicating if the user is a super admin
 */
export async function checkIsSuperAdmin(userId: string | undefined): Promise<boolean> {
  if (!userId) {
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('admins')
      .select('is_super_admin')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error checking super admin status:', error);
      return false;
    }
    
    return !!data?.is_super_admin;
  } catch (err) {
    console.error('Error checking super admin status:', err);
    return false;
  }
}

/**
 * Get admin details including super admin status
 * @param userId The user ID to check
 * @returns Promise that resolves to admin details or null
 */
export async function getAdminDetails(userId: string | undefined): Promise<{
  isAdmin: boolean;
  isSuperAdmin: boolean;
  adminData?: any;
} | null> {
  if (!userId) {
    return { isAdmin: false, isSuperAdmin: false };
  }

  try {
    const { data, error } = await supabase
      .from('admins')
      .select('*, is_super_admin')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error getting admin details:', error);
      return { isAdmin: false, isSuperAdmin: false };
    }
    
    if (!data) {
      return { isAdmin: false, isSuperAdmin: false };
    }
    
    return {
      isAdmin: true,
      isSuperAdmin: !!data.is_super_admin,
      adminData: data
    };
  } catch (err) {
    console.error('Error getting admin details:', err);
    return { isAdmin: false, isSuperAdmin: false };
  }
} 