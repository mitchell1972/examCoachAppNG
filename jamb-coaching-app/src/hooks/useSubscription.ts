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

  const FREE_QUESTIONS_LIMIT = 25; // 5 per subject

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

      // Calculate total free questions used
      const totalUsed = (progressData || []).reduce(
        (total, progress) => total + progress.total_questions_attempted,
        0
      );
      setFreeQuestionsUsed(totalUsed);

      // Determine if user can access questions
      const canAccess = !!subscriptionData || totalUsed < FREE_QUESTIONS_LIMIT;
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

  const getRemainingFreeQuestions = () => {
    if (isSubscribed) return Infinity;
    return Math.max(0, FREE_QUESTIONS_LIMIT - freeQuestionsUsed);
  };

  const getSubscriptionStatus = () => {
    if (loading) return 'loading';
    if (isSubscribed) return 'premium';
    if (freeQuestionsUsed >= FREE_QUESTIONS_LIMIT) return 'expired';
    return 'free';
  };

  const checkQuestionAccess = (questionsToAccess: number = 1) => {
    if (isSubscribed) return { canAccess: true, reason: null };
    
    const remaining = getRemainingFreeQuestions();
    if (remaining >= questionsToAccess) {
      return { canAccess: true, reason: null };
    }
    
    return {
      canAccess: false,
      reason: 'free_limit_exceeded',
      message: 'You\'ve used all your free questions. Subscribe to continue practicing.'
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
    FREE_QUESTIONS_LIMIT
  };
}