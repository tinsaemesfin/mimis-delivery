-- Create RPC function to get user by ID
CREATE OR REPLACE FUNCTION get_user_by_id(user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_data JSON;
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
  SELECT to_json(au.*) INTO user_data
  FROM auth.users au
  WHERE au.id = get_user_by_id.user_id;

  RETURN user_data;
END;
$$;

-- Create RPC function to get user by email
CREATE OR REPLACE FUNCTION get_user_by_email(email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_data JSON;
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
  SELECT to_json(au.*) INTO user_data
  FROM auth.users au
  WHERE au.email = get_user_by_email.email;

  RETURN user_data;
END;
$$; 