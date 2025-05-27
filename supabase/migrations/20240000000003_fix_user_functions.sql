-- Fix RPC functions with correct data types
-- Drop existing functions first
DROP FUNCTION IF EXISTS get_user_by_id(UUID);
DROP FUNCTION IF EXISTS search_users_by_email(TEXT);

-- Step 1: Create RPC function to get user by ID (matching exact types)
CREATE OR REPLACE FUNCTION get_user_by_id(user_id UUID)
RETURNS TABLE(
  id UUID,
  email VARCHAR(255),
  raw_user_meta_data JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the current user is a super admin
  IF NOT EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.user_id = auth.uid() 
    AND admins.is_super_admin = TRUE
  ) THEN
    RAISE EXCEPTION 'Access denied. Super admin privileges required.';
  END IF;

  -- Get user data from auth.users
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.raw_user_meta_data,
    au.created_at
  FROM auth.users au
  WHERE au.id = get_user_by_id.user_id;
END;
$$;

-- Step 2: Create RPC function to search users by email (matching exact types)
CREATE OR REPLACE FUNCTION search_users_by_email(search_term TEXT)
RETURNS TABLE(
  id UUID,
  email VARCHAR(255),
  full_name VARCHAR(255)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the current user is a super admin
  IF NOT EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.user_id = auth.uid() 
    AND admins.is_super_admin = TRUE
  ) THEN
    RAISE EXCEPTION 'Access denied. Super admin privileges required.';
  END IF;

  -- Search users by email (case insensitive, partial match)
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    COALESCE(
      au.raw_user_meta_data->>'full_name',
      split_part(au.email, '@', 1)
    )::VARCHAR(255) as full_name
  FROM auth.users au
  WHERE au.email ILIKE '%' || search_term || '%'
  AND au.email_confirmed_at IS NOT NULL
  ORDER BY au.email
  LIMIT 10;
END;
$$; 