-- Create order logs table to track all order operations
CREATE TABLE IF NOT EXISTS order_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL, -- Reference to the order (even if deleted)
  order_ticket VARCHAR(50), -- Store order ticket for reference
  action VARCHAR(20) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
  performed_by UUID REFERENCES auth.users(id), -- Who performed the action
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Store complete order data as JSON for historical reference
  order_data JSONB NOT NULL,
  
  -- Store what changed (for updates)
  changes JSONB,
  
  -- Additional metadata
  user_agent TEXT,
  ip_address INET,
  
  CONSTRAINT order_logs_order_id_check CHECK (order_id IS NOT NULL)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_order_logs_order_id ON order_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_order_logs_performed_by ON order_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_order_logs_performed_at ON order_logs(performed_at);
CREATE INDEX IF NOT EXISTS idx_order_logs_action ON order_logs(action);
CREATE INDEX IF NOT EXISTS idx_order_logs_order_ticket ON order_logs(order_ticket);

-- Enable RLS
ALTER TABLE order_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Super admins can view all logs
CREATE POLICY "Super admins can view all order logs" ON order_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid() 
      AND admins.is_super_admin = TRUE
    )
  );

-- Regular admins can view logs but not delete logs
CREATE POLICY "Regular admins can view order logs" ON order_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
    )
  );

-- Only the system can insert logs (via triggers)
CREATE POLICY "System can insert order logs" ON order_logs
  FOR INSERT
  WITH CHECK (true);

-- Function to log order operations
CREATE OR REPLACE FUNCTION log_order_operation()
RETURNS TRIGGER AS $$
DECLARE
  action_type TEXT;
  order_data_json JSONB;
  changes_json JSONB;
  current_user_id UUID;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    action_type := 'CREATE';
    order_data_json := to_jsonb(NEW);
    changes_json := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'UPDATE';
    order_data_json := to_jsonb(NEW);
    -- Calculate changes
    changes_json := jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    );
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'DELETE';
    order_data_json := to_jsonb(OLD);
    changes_json := NULL;
  END IF;

  -- Insert log entry
  INSERT INTO order_logs (
    order_id,
    order_ticket,
    action,
    performed_by,
    order_data,
    changes
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.order_ticket, OLD.order_ticket),
    action_type,
    current_user_id,
    order_data_json,
    changes_json
  );

  -- Return appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers on orders table
DROP TRIGGER IF EXISTS trigger_log_order_operations ON orders;
CREATE TRIGGER trigger_log_order_operations
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_operation();

-- Function to get order logs (for super admins)
CREATE OR REPLACE FUNCTION get_order_logs(
  order_id_param UUID DEFAULT NULL,
  limit_param INTEGER DEFAULT 50,
  offset_param INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  order_id UUID,
  order_ticket VARCHAR(50),
  action VARCHAR(20),
  performed_by UUID,
  performed_at TIMESTAMP WITH TIME ZONE,
  order_data JSONB,
  changes JSONB,
  performer_email VARCHAR(255)
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

  -- Return order logs with performer email
  RETURN QUERY
  SELECT 
    ol.id,
    ol.order_id,
    ol.order_ticket,
    ol.action,
    ol.performed_by,
    ol.performed_at,
    ol.order_data,
    ol.changes,
    au.email as performer_email
  FROM order_logs ol
  LEFT JOIN auth.users au ON ol.performed_by = au.id
  WHERE (order_id_param IS NULL OR ol.order_id = order_id_param)
  ORDER BY ol.performed_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$; 