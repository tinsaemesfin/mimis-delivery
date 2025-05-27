-- Add is_super_admin column to admins table
alter table admins add column if not exists is_super_admin boolean default false;

-- Update RLS policy for super admin management
drop policy if exists "Super admins can manage admins" on admins;

create policy "Super admins can manage admins" 
  on admins for all using (
    auth.uid() in (
      select user_id from admins where is_super_admin = true
    )
  );

-- Create policy for regular admins to view admin list (but not modify)
create policy "Admins can view admin list" 
  on admins for select using (
    auth.uid() in (select user_id from admins)
  ); 