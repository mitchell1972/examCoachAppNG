import { createClient } from '@supabase/supabase-js';

// Use environment variables in production, fallback to direct values for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zjfilhbczaquokqlcoej.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqZmlsaGJjemFxdW9rcWxjb2VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1MzQ2MjIsImV4cCI6MjA3MTExMDYyMn0.b6YATor8UyDwYSiSagOQUxM_4sqfCv-89CBXVgC2hP0';

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

export interface QuestionSet {
  id: string;
  subject: string;
  title: string;
  description?: string;
  created_at: string;
  is_free: boolean;
  is_active: boolean;
  generation_source: string;
  total_questions: number;
  delivery_date: string;
  can_access?: boolean;
  access_reason?: string;
  is_first_set?: boolean;
}

export interface QuestionSetQuestion {
  id: string;
  question_set_id: string;
  question_id: string;
  position: number;
  created_at: string;
}

export interface UserQuestionSetAccess {
  id: string;
  user_id: string;
  question_set_id: string;
  can_access: boolean;
  accessed_at?: string;
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
      emailRedirectTo: `${window.location.protocol}//${window.location.host}/auth/callback`,
      data: {
        full_name: userData.full_name,
        school_name: userData.school_name,
        state: userData.state
      }
    }
  });

  if (error) {
    console.error('Error signing up:', error.message);
    throw error;
  }

  // Profile will be created automatically by database trigger
  // Update profile with additional data if needed
  if (data.user && (userData.school_name || userData.state)) {
    setTimeout(async () => {
      try {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            school_name: userData.school_name,
            state: userData.state,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', data.user.id);

        if (updateError) {
          console.error('Error updating profile:', updateError);
        }
      } catch (err) {
        console.error('Error in profile update:', err);
      }
    }, 1000); // Wait 1 second for profile to be created by trigger
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

// Question Set Functions
export async function getAvailableQuestionSets(subject: string): Promise<QuestionSet[]> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get all question sets for the subject
  const { data: questionSets, error: setsError } = await supabase
    .from('question_sets')
    .select('*')
    .eq('subject', subject)
    .eq('is_active', true)
    .order('delivery_date', { ascending: false });

  if (setsError) {
    console.error('Error fetching question sets:', setsError);
    throw new Error('Failed to fetch question sets');
  }

  if (!questionSets || questionSets.length === 0) {
    return [];
  }

  // Check user subscription status
  const { data: subscriptionData } = await supabase
    .from('jamb_coaching_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  const hasActiveSubscription = !!subscriptionData;

  // Check user's access to question sets
  const { data: userAccess } = await supabase
    .from('user_question_set_access')
    .select('question_set_id, can_access')
    .eq('user_id', user.id);

  const accessMap = new Map(userAccess?.map(access => [access.question_set_id, access.can_access]) || []);

  // Process question sets with access information
  const processedSets = [];
  for (let i = 0; i < questionSets.length; i++) {
    const set = questionSets[i];
    const isFirstSet = i === questionSets.length - 1; // Oldest set (first for the subject)
    const hasExistingAccess = accessMap.get(set.id);
    
    let canAccess = false;
    let accessReason = '';

    if (hasActiveSubscription) {
      canAccess = true;
      accessReason = 'subscription';
    } else if (isFirstSet || hasExistingAccess) {
      canAccess = true;
      accessReason = isFirstSet ? 'free_first_set' : 'previously_granted';
    } else {
      canAccess = false;
      accessReason = 'subscription_required';
    }

    // Grant access to first set if not already granted
    if (isFirstSet && !hasExistingAccess && !accessMap.has(set.id)) {
      const { error: accessError } = await supabase
        .from('user_question_set_access')
        .insert({
          user_id: user.id,
          question_set_id: set.id,
          can_access: true
        });
      
      if (accessError) {
        console.error('Error granting first set access:', accessError);
      }
    }

    processedSets.push({
      ...set,
      can_access: canAccess,
      access_reason: accessReason,
      is_first_set: isFirstSet
    });
  }

  return processedSets;
}

export async function getQuestionSetQuestions(questionSetId: string): Promise<Question[]> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Check if user has access to this question set
  const { data: userAccess } = await supabase
    .from('user_question_set_access')
    .select('*')
    .eq('user_id', user.id)
    .eq('question_set_id', questionSetId)
    .eq('can_access', true)
    .maybeSingle();

  // Also check if user has active subscription
  const { data: subscriptionData } = await supabase
    .from('jamb_coaching_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  const hasActiveSubscription = !!subscriptionData;
  const hasDirectAccess = !!userAccess;

  if (!hasDirectAccess && !hasActiveSubscription) {
    throw new Error('Access denied to this question set');
  }

  // Get questions for the question set
  const { data: questionSetQuestions, error: qsError } = await supabase
    .from('question_set_questions')
    .select('question_id, position')
    .eq('question_set_id', questionSetId)
    .order('position', { ascending: true });

  if (qsError) {
    console.error('Error fetching question set questions:', qsError);
    throw new Error('Failed to fetch question set questions');
  }

  if (!questionSetQuestions || questionSetQuestions.length === 0) {
    return [];
  }

  const questionIds = questionSetQuestions.map(qsq => qsq.question_id);

  // Fetch the actual questions
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('*')
    .in('id', questionIds)
    .eq('is_active', true);

  if (questionsError) {
    console.error('Error fetching questions details:', questionsError);
    throw new Error('Failed to fetch questions details');
  }

  if (!questions) {
    return [];
  }

  // Sort questions by position
  const sortedQuestions = questions.sort((a, b) => {
    const positionA = questionSetQuestions.find(qsq => qsq.question_id === a.id)?.position || 0;
    const positionB = questionSetQuestions.find(qsq => qsq.question_id === b.id)?.position || 0;
    return positionA - positionB;
  });

  return sortedQuestions;
}

export async function deleteQuestionSet(questionSetId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Soft delete the question set (mark as inactive)
  const { error: deleteError } = await supabase
    .from('question_sets')
    .update({ is_active: false })
    .eq('id', questionSetId);

  if (deleteError) {
    console.error('Error deleting question set:', deleteError);
    throw new Error('Failed to delete question set');
  }

  // Also remove user's access to this set
  const { error: accessError } = await supabase
    .from('user_question_set_access')
    .delete()
    .eq('user_id', user.id)
    .eq('question_set_id', questionSetId);

  if (accessError) {
    console.error('Error removing user access:', accessError);
    // Don't throw here as the main deletion succeeded
  }
}

// Updated daily questions function to work with question sets
export async function getDailyQuestionsFromSets(subject: string): Promise<Question[]> {
  try {
    const questionSets = await getAvailableQuestionSets(subject);
    
    // Get the most recent question set that the user can access
    const accessibleSets = questionSets.filter(set => set.can_access);
    
    if (accessibleSets.length === 0) {
      return [];
    }

    // Get the most recent set
    const latestSet = accessibleSets[0];
    return await getQuestionSetQuestions(latestSet.id);
  } catch (error) {
    console.error('Error getting daily questions from sets:', error);
    return [];
  }
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