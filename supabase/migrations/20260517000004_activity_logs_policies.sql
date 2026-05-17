-- Drop the restrictive policies on activity_logs
DROP POLICY IF EXISTS "Users can insert their own activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Users can select their own activity logs" ON activity_logs;

-- Create comprehensive policy for managing activity logs
CREATE POLICY "Users can manage their own activity logs"
ON activity_logs FOR ALL USING (auth.uid() = user_id);
