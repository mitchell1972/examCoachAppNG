-- Migration: temporarily_disable_rls_for_debugging
-- Created at: 1755737244

-- Temporarily disable RLS on problematic tables for debugging
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_questions DISABLE ROW LEVEL SECURITY;

-- Also check if we have any data in these tables
SELECT 'profiles' as table_name, count(*) as record_count FROM profiles
UNION ALL
SELECT 'user_progress' as table_name, count(*) as record_count FROM user_progress
UNION ALL
SELECT 'daily_questions' as table_name, count(*) as record_count FROM daily_questions;;