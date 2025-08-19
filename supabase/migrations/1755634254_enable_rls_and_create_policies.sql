-- Migration: enable_rls_and_create_policies
-- Created at: 1755634254

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_content_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Questions policies  
CREATE POLICY "Anyone can view active questions" ON questions FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage questions" ON questions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Daily questions policies
CREATE POLICY "Anyone can view active daily questions" ON daily_questions FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage daily questions" ON daily_questions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- User answers policies
CREATE POLICY "Users can view their own answers" ON user_answers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own answers" ON user_answers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all answers" ON user_answers FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Practice sessions policies
CREATE POLICY "Users can view their own sessions" ON practice_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sessions" ON practice_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sessions" ON practice_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all sessions" ON practice_sessions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- User progress policies
CREATE POLICY "Users can view their own progress" ON user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON user_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all progress" ON user_progress FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- AI content logs policies (admin only)
CREATE POLICY "Admins can manage AI logs" ON ai_content_logs FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- User achievements policies
CREATE POLICY "Users can view their own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert achievements" ON user_achievements FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all achievements" ON user_achievements FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage all notifications" ON notifications FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- User activity policies
CREATE POLICY "Users can view their own activity" ON user_activity FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert activity" ON user_activity FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all activity" ON user_activity FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
  )
);;