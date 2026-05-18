-- Overhaul & Expansion Tables

-- Mood Logs Table
CREATE TABLE IF NOT EXISTS mood_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  mood_score INTEGER NOT NULL CHECK (mood_score >= 1 AND mood_score <= 5),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own mood logs"
  ON mood_logs FOR ALL USING (auth.uid() = user_id);

-- Journal Entries Table
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own journal entries"
  ON journal_entries FOR ALL USING (auth.uid() = user_id);

-- Pomodoro Sessions Table
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  task_title TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 25,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own pomodoro sessions"
  ON pomodoro_sessions FOR ALL USING (auth.uid() = user_id);

-- Content Ideas Table
CREATE TABLE IF NOT EXISTS content_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'idea',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE content_ideas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own content ideas"
  ON content_ideas FOR ALL USING (auth.uid() = user_id);

-- Sponsorships Table
CREATE TABLE IF NOT EXISTS sponsorships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  partner_name TEXT NOT NULL,
  deal_details TEXT,
  stage TEXT NOT NULL DEFAULT 'Outreach',
  amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sponsorships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own sponsorships"
  ON sponsorships FOR ALL USING (auth.uid() = user_id);

-- Body Weight Logs Table
CREATE TABLE IF NOT EXISTS body_weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  weight NUMERIC NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

ALTER TABLE body_weight_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own body weight logs"
  ON body_weight_logs FOR ALL USING (auth.uid() = user_id);

-- Project Goals Table
CREATE TABLE IF NOT EXISTS project_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  goal_title TEXT NOT NULL,
  target_value INTEGER NOT NULL,
  current_value INTEGER DEFAULT 0,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE project_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own project goals"
  ON project_goals FOR ALL USING (auth.uid() = user_id);
