-- activity_logs table for unified event tracking (Fitness, Mind, Coding, Creator)
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('fitness', 'mind', 'coding', 'creator')),
  activity_type TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own activity logs"
ON activity_logs FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select their own activity logs"
ON activity_logs FOR SELECT TO authenticated
USING (auth.uid() = user_id);
