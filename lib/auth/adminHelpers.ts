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