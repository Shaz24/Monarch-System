-- PHASE 1: Safe additive schema changes only
-- Does NOT touch any existing tables except adding columns to profiles

-- Add new columns to profiles (safe - IF NOT EXISTS)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS aura_score INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS journey_start_date DATE DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_xp_alltime INTEGER DEFAULT 0;

-- Daily Laws table
CREATE TABLE IF NOT EXISTS daily_laws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  workout_done BOOLEAN DEFAULT false,
  protein_hit BOOLEAN DEFAULT false,
  sleep_done BOOLEAN DEFAULT false,
  no_junk BOOLEAN DEFAULT false,
  no_doomscroll BOOLEAN DEFAULT false,
  social_done BOOLEAN DEFAULT false,
  routine_followed BOOLEAN DEFAULT false,
  no_addictions BOOLEAN DEFAULT false,
  all_laws_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Boss Battles table
CREATE TABLE IF NOT EXISTS boss_battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  boss_name TEXT NOT NULL,
  boss_description TEXT,
  condition_target INTEGER NOT NULL,
  condition_current INTEGER DEFAULT 0,
  condition_type TEXT NOT NULL,
  reward_xp INTEGER DEFAULT 0,
  reward_title TEXT,
  reward_aura INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  month_year TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aura Log table
CREATE TABLE IF NOT EXISTS aura_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  aura_change INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for daily_laws
ALTER TABLE daily_laws ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own daily laws"
  ON daily_laws FOR ALL USING (auth.uid() = user_id);

-- RLS for boss_battles
ALTER TABLE boss_battles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own boss battles"
  ON boss_battles FOR ALL USING (auth.uid() = user_id);

-- RLS for aura_log
ALTER TABLE aura_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own aura log"
  ON aura_log FOR ALL USING (auth.uid() = user_id);
