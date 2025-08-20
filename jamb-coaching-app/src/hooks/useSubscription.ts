import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface SubscriptionData {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  price_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  jamb_coaching_plans?: {
    plan_type: string;
    price: number;
    monthly_limit: number;
  };
}

interface UserProgress {
  total_questions_attempted: number;
  subject: string;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [freeQuestionsUsed, setFreeQuestionsUsed] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [canAccessQuestions, setCanAccessQuestions] = useState(true);

  const FREE_QUESTIONS_PER_SUBJECT = 20; // 20 per subject

  useEffect(() => {
    if (user) {
      fetchSubscriptionData();
    } else {
      setLoading(false);
      resetState();
    }
  }, [user]);

  const resetState = () => {
    setSubscription(null);
    setUserProgress([]);
    setFreeQuestionsUsed(0);
    setIsSubscribed(false);
    setCanAccessQuestions(true);
  };

  const fetchSubscriptionData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Check active subscription
      const { data: subscriptionData } = await supabase
        .from('jamb_coaching_subscriptions')
        .select(`
          *,
          jamb_coaching_plans!price_id(
            plan_type,
            price,
            monthly_limit
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      // Get user progress to calculate free questions used
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('total_questions_attempted, subject')
        .eq('user_id', user.id);

      setSubscription(subscriptionData);
      setUserProgress(progressData || []);
      setIsSubscribed(!!subscriptionData);

      // Calculate total free questions used across all subjects
      const totalUsed = (progressData || []).reduce(
        (total, progress) => total + progress.total_questions_attempted,
        0
      );
      setFreeQuestionsUsed(totalUsed);

      // For general access, check if user has subscription or hasn't exceeded limits in all subjects
      const hasExceededAnySubject = (progressData || []).some(
        progress => progress.total_questions_attempted >= FREE_QUESTIONS_PER_SUBJECT
      );
      const canAccess = !!subscriptionData || !hasExceededAnySubject;
      setCanAccessQuestions(canAccess);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshSubscription = async () => {
    await fetchSubscriptionData();
  };

  const getRemainingFreeQuestions = (subject?: string) => {
    if (isSubscribed) return Infinity;
    
    if (subject) {
      // Get remaining questions for specific subject
      const subjectProgress = userProgress.find(p => p.subject === subject);
      const used = subjectProgress?.total_questions_attempted || 0;
      return Math.max(0, FREE_QUESTIONS_PER_SUBJECT - used);
    }
    
    // Get minimum remaining across all subjects for general display
    const JAMB_SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English Language'];
    let minRemaining = FREE_QUESTIONS_PER_SUBJECT;
    
    for (const subj of JAMB_SUBJECTS) {
      const subjectProgress = userProgress.find(p => p.subject === subj);
      const used = subjectProgress?.total_questions_attempted || 0;
      const remaining = Math.max(0, FREE_QUESTIONS_PER_SUBJECT - used);
      minRemaining = Math.min(minRemaining, remaining);
    }
    
    return minRemaining;
  };

  const getSubscriptionStatus = (subject?: string) => {
    if (loading) return 'loading';
    if (isSubscribed) return 'premium';
    
    if (subject) {
      // Check status for specific subject
      const subjectProgress = userProgress.find(p => p.subject === subject);
      const used = subjectProgress?.total_questions_attempted || 0;
      if (used >= FREE_QUESTIONS_PER_SUBJECT) return 'expired';
      return 'free';
    }
    
    // Check if any subject has exceeded limits for general status
    const hasExceededAnySubject = userProgress.some(
      progress => progress.total_questions_attempted >= FREE_QUESTIONS_PER_SUBJECT
    );
    if (hasExceededAnySubject) return 'expired';
    return 'free';
  };

  const checkQuestionAccess = (subject: string, questionsToAccess: number = 1) => {
    if (isSubscribed) return { canAccess: true, reason: null };
    
    const subjectProgress = userProgress.find(p => p.subject === subject);
    const used = subjectProgress?.total_questions_attempted || 0;
    const remaining = Math.max(0, FREE_QUESTIONS_PER_SUBJECT - used);
    
    if (remaining >= questionsToAccess) {
      return { canAccess: true, reason: null };
    }
    
    return {
      canAccess: false,
      reason: 'free_limit_exceeded',
      message: `You've used all ${FREE_QUESTIONS_PER_SUBJECT} free questions for ${subject}. Subscribe to continue practicing.`
    };
  };

  return {
    subscription,
    userProgress,
    loading,
    isSubscribed,
    freeQuestionsUsed,
    canAccessQuestions,
    refreshSubscription,
    getRemainingFreeQuestions,
    getSubscriptionStatus,
    checkQuestionAccess,
    FREE_QUESTIONS_PER_SUBJECT
  };
}