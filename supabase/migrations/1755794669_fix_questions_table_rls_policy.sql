-- Migration: fix_questions_table_rls_policy
-- Created at: 1755794669

-- Fix RLS policy on questions table to allow authenticated users to read questions
DROP POLICY IF EXISTS "Allow authenticated users to read questions" ON public.questions;

CREATE POLICY "Allow authenticated users to read questions" 
ON public.questions 
FOR SELECT 
TO authenticated 
USING (true);;