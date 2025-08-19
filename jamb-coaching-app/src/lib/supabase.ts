import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Replace these with your actual Supabase credentials
// Get these from your Supabase project dashboard
const supabaseUrl = 'https://zjfilhbczaquokqlcoej.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqZmlsaGJjemFxdW9rcWxjb2VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NDU3MzIsImV4cCI6MjA4NjQyMTczMn0.LowG3Ak2_C_gstx0lHWyR9PBgEOKZY_4_C4TovKsGU8';

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: 'student' | 'admin';
  school_name?: string;
  state?: string;
  target_score?: number;
  preferred_subjects?: string[];
  study_streak: number;
  total_practice_time: number;
  last_activity_date?: string;
  jamb_year?: number;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  subject: string;
  topic: string;
  difficulty_level: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  year?: number;
  source: string;
  tags?: string[];
  is_active: boolean;
  times_answered: number;
  correct_rate: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface UserAnswer {
  id: string;
  user_id: string;
  question_id: string;
  selected_answer: 'A' | 'B' | 'C' | 'D';
  is_correct: boolean;
  time_spent_seconds: number;
  answered_at: string;
}

export interface PracticeSession {
  id: string;
  user_id: string;
  subject: string;
  questions_attempted: number;
  questions_correct: number;
  total_time_seconds: number;
  score_percentage: number;
  session_type: string;
  started_at: string;
  completed_at?: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  subject: string;
  total_questions_attempted: number;
  total_questions_correct: number;
  average_score: number;
  weak_topics: string[];
  strong_topics: string[];
  last_practice_date?: string;
  study_streak: number;
  predicted_jamb_score: number;
  created_at: string;
  updated_at: string;
}

export interface DailyQuestions {
  id: string;
  date: string;
  subject: string;
  question_ids: string[];
  is_active: boolean;
  created_at: string;
}

// Auth helper functions
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  return user;
}

export async function signUp(email: string, password: string, userData: { full_name: string; school_name?: string; state?: string }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.protocol}//${window.location.host}/auth/callback`
    }
  });

  if (error) {
    console.error('Error signing up:', error.message);
    throw error;
  }

  // Create profile after successful signup
  if (data.user) {
    const profileData = {
      user_id: data.user.id,
      email: data.user.email!,
      full_name: userData.full_name,
      school_name: userData.school_name,
      state: userData.state,
      role: 'student' as const
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .insert([profileData]);

    if (profileError) {
      console.error('Error creating profile:', profileError);
    }
  }

  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error('Error signing in:', error.message);
    throw error;
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

// Profile functions
export async function getUserProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
}

export async function updateUserProfile(userId: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }

  return data;
}

// Question functions
export async function getDailyQuestions(subject: string, date?: string): Promise<Question[]> {
  const targetDate = date || new Date().toISOString().split('T')[0];
  
  const { data: dailyQuestions, error: dailyError } = await supabase
    .from('daily_questions')
    .select('question_ids')
    .eq('subject', subject)
    .eq('date', targetDate)
    .eq('is_active', true)
    .maybeSingle();

  if (dailyError || !dailyQuestions) {
    console.error('Error fetching daily questions:', dailyError);
    return [];
  }

  if (!dailyQuestions.question_ids || dailyQuestions.question_ids.length === 0) {
    return [];
  }

  const { data: questions, error } = await supabase
    .from('questions')
    .select('*')
    .in('id', dailyQuestions.question_ids)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching questions:', error);
    return [];
  }

  return questions || [];
}

export async function getQuestionsBySubjectAndTopic(subject: string, topic?: string, limit = 20): Promise<Question[]> {
  let query = supabase
    .from('questions')
    .select('*')
    .eq('subject', subject)
    .eq('is_active', true)
    .limit(limit);

  if (topic) {
    query = query.eq('topic', topic);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching questions:', error);
    return [];
  }

  return data || [];
}

// Answer submission
export async function submitAnswer(questionId: string, selectedAnswer: 'A' | 'B' | 'C' | 'D', timeSpent: number) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase.functions.invoke('submit-answer', {
    body: {
      user_id: user.id,
      question_id: questionId,
      selected_answer: selectedAnswer,
      time_spent_seconds: timeSpent
    }
  });

  if (error) {
    console.error('Error submitting answer:', error);
    throw error;
  }

  return data;
}

// Performance analysis
export async function analyzePerformance(userId: string) {
  const { data, error } = await supabase.functions.invoke('analyze-performance', {
    body: { user_id: userId }
  });

  if (error) {
    console.error('Error analyzing performance:', error);
    throw error;
  }

  return data;
}

// Generate questions (for admin)
export async function generateQuestions(subject: string, topic: string, difficultyLevel: number, count = 5) {
  const { data, error } = await supabase.functions.invoke('generate-questions', {
    body: {
      subject,
      topic,
      difficulty_level: difficultyLevel,
      count
    }
  });

  if (error) {
    console.error('Error generating questions:', error);
    throw error;
  }

  return data;
}

// Get user progress
export async function getUserProgress(userId: string): Promise<UserProgress[]> {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user progress:', error);
    return [];
  }

  return data || [];
}

// Constants
export const JAMB_SUBJECTS = [
  'Mathematics',
  'Physics', 
  'Chemistry',
  'Biology',
  'English Language'
] as const;

export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
  'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
  'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
  'Yobe', 'Zamfara'
] as const;