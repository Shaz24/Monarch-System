-- Custom Types
CREATE TYPE stat_category_enum AS ENUM (
  'strength', 'discipline', 'intelligence', 'creativity', 
  'endurance', 'charisma', 'focus', 'stoicism', 'wealth', 'consistency'
);

CREATE TYPE task_difficulty_enum AS ENUM ('E', 'D', 'C', 'B', 'A', 'S');

-- 1. Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  current_level INTEGER DEFAULT 1,
  current_xp INTEGER DEFAULT 0,
  rank TEXT DEFAULT 'E',
  aura_level INTEGER DEFAULT 100,
  streak_days INTEGER DEFAULT 0,
  visibility JSONB DEFAULT '{"show_level":true,"show_streak":true,"show_stats":false,"show_rank":true,"show_achievements":true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Stats
CREATE TABLE stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stat_name stat_category_enum NOT NULL,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, stat_name)
);

-- 3. Daily Tasks
CREATE TABLE daily_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  time_slot TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  xp_reward INTEGER DEFAULT 10,
  difficulty task_difficulty_enum DEFAULT 'E',
  stat_category stat_category_enum NOT NULL,
  is_recurring BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Task Completions
CREATE TABLE task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  task_id UUID REFERENCES daily_tasks(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  xp_earned INTEGER NOT NULL,
  streak_count INTEGER DEFAULT 1
);

-- 5. Fitness Logs
CREATE TABLE fitness_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg NUMERIC(5,2),
  body_fat_pct NUMERIC(5,2),
  calories INTEGER,
  protein_g INTEGER,
  water_ml INTEGER,
  sleep_hours NUMERIC(4,2),
  workout_done BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 6. Mind Logs
CREATE TABLE mind_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 5),
  meditation_done BOOLEAN DEFAULT false,
  journal_entry TEXT,
  focus_sessions INTEGER DEFAULT 0,
  dopamine_detox BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 7. Coding Logs
CREATE TABLE coding_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  leetcode_solved INTEGER DEFAULT 0,
  dsa_topic TEXT,
  mock_interview_done BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 8. Creator Logs
CREATE TABLE creator_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  instagram_uploads INTEGER DEFAULT 0,
  youtube_uploads INTEGER DEFAULT 0,
  gaming_recordings INTEGER DEFAULT 0,
  music_edits INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 9. Achievements (Global, not tied to a specific user)
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  xp_reward INTEGER DEFAULT 100,
  unlock_condition TEXT NOT NULL
);

-- 10. User Achievements
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Row Level Security (RLS)

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Stats
ALTER TABLE stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own stats" ON stats FOR ALL USING (auth.uid() = user_id);

-- Daily Tasks
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own tasks" ON daily_tasks FOR ALL USING (auth.uid() = user_id);

-- Task Completions
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own task completions" ON task_completions FOR ALL USING (auth.uid() = user_id);

-- Fitness Logs
ALTER TABLE fitness_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own fitness logs" ON fitness_logs FOR ALL USING (auth.uid() = user_id);

-- Mind Logs
ALTER TABLE mind_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own mind logs" ON mind_logs FOR ALL USING (auth.uid() = user_id);

-- Coding Logs
ALTER TABLE coding_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own coding logs" ON coding_logs FOR ALL USING (auth.uid() = user_id);

-- Creator Logs
ALTER TABLE creator_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own creator logs" ON creator_logs FOR ALL USING (auth.uid() = user_id);

-- Achievements (Public read-only)
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Achievements are viewable by everyone" ON achievements FOR SELECT USING (true);

-- User Achievements
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own achievements" ON user_achievements FOR ALL USING (auth.uid() = user_id);
