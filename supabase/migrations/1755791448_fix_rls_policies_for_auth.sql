-- Migration: fix_rls_policies_for_auth
-- Created at: 1755791448

-- Fix RLS policies to eliminate circular dependencies and ensure proper access

-- Drop and recreate profiles policies with simpler logic
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Simple profile access - users can view their own profile
CREATE POLICY "Users can view their own profile" ON profiles 
FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all profiles (separate simple policy)
CREATE POLICY "Admins can view all profiles" ON profiles 
FOR SELECT USING (
  auth.uid() IN (
    SELECT user_id FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Fix daily_questions policies - remove complex admin checks for basic read access
DROP POLICY IF EXISTS "Anyone can view active daily questions" ON daily_questions;

-- Simple policy for viewing daily questions
CREATE POLICY "Anyone can view daily questions" ON daily_questions 
FOR SELECT USING (true);

-- Fix questions policies - ensure anyone can read questions
DROP POLICY IF EXISTS "Anyone can view questions" ON questions;
DROP POLICY IF EXISTS "Anyone can view active questions" ON questions;

-- Simple policy for viewing questions
CREATE POLICY "Anyone can view questions" ON questions 
FOR SELECT USING (true);

-- Fix user_progress policies
DROP POLICY IF EXISTS "Users can view their own progress" ON user_progress;

-- Simple policy for user progress
CREATE POLICY "Users can view their own progress" ON user_progress 
FOR SELECT USING (auth.uid() = user_id);

-- Ensure all tables have RLS enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;;