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

interface QuestionSetAccess {
  subject: string;
  totalSets: number;
  accessibleSets: number;
  firstSetFree: boolean;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [questionSetAccess, setQuestionSetAccess] = useState<Record<string, QuestionSetAccess>>({});
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const JAMB_SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English Language'];

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
    setQuestionSetAccess({});
    setIsSubscribed(false);
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

      setSubscription(subscriptionData);
      setIsSubscribed(!!subscriptionData);

      // For each subject, get question set access information
      const accessInfo: Record<string, QuestionSetAccess> = {};
      
      for (const subject of JAMB_SUBJECTS) {
        try {
          // Get all question sets for this subject
          const { data: allSets } = await supabase
            .from('question_sets')
            .select('id, delivery_date, created_at')
            .eq('subject', subject)
            .eq('is_active', true)
            .order('delivery_date', { ascending: false });

          // Get user's access to question sets for this subject
          const { data: userAccess } = await supabase
            .from('user_question_set_access')
            .select('question_set_id, can_access')
            .eq('user_id', user.id)
            .eq('can_access', true);

          const accessibleSetIds = new Set(userAccess?.map(access => access.question_set_id) || []);
          const totalSets = allSets?.length || 0;
          const accessibleSets = userAccess?.length || 0;
          
          // First set is always free for each subject
          const firstSetFree = totalSets > 0;

          accessInfo[subject] = {
            subject,
            totalSets,
            accessibleSets: !!subscriptionData ? totalSets : accessibleSets,
            firstSetFree
          };
        } catch (error) {
          console.error(`Error fetching access info for ${subject}:`, error);
          accessInfo[subject] = {
            subject,
            totalSets: 0,
            accessibleSets: 0,
            firstSetFree: false
          };
        }
      }

      setQuestionSetAccess(accessInfo);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshSubscription = async () => {
    await fetchSubscriptionData();
  };

  const getQuestionSetAccess = (subject: string) => {
    return questionSetAccess[subject] || {
      subject,
      totalSets: 0,
      accessibleSets: 0,
      firstSetFree: false
    };
  };

  const getSubscriptionStatus = (subject?: string) => {
    if (loading) return 'loading';
    if (isSubscribed) return 'premium';
    
    if (subject) {
      const access = getQuestionSetAccess(subject);
      if (access.totalSets === 0) return 'no_content';
      if (access.accessibleSets > 0) return 'free';
      return 'expired';
    }
    
    // Check if user has access to any question sets
    const hasAnyAccess = Object.values(questionSetAccess).some(
      access => access.accessibleSets > 0
    );
    return hasAnyAccess ? 'free' : 'expired';
  };

  const checkQuestionSetAccess = (subject: string) => {
    if (isSubscribed) return { canAccess: true, reason: 'subscription' };
    
    const access = getQuestionSetAccess(subject);
    
    if (access.accessibleSets > 0) {
      return { 
        canAccess: true, 
        reason: access.accessibleSets === 1 && access.firstSetFree ? 'free_first_set' : 'previously_granted'
      };
    }
    
    return {
      canAccess: false,
      reason: 'subscription_required',
      message: `Subscribe to access question sets for ${subject}. Fresh questions delivered every 3 days at 6 AM Nigerian time.`
    };
  };

  const getAvailableQuestionSets = (subject: string) => {
    const access = getQuestionSetAccess(subject);
    return {
      total: access.totalSets,
      accessible: access.accessibleSets,
      locked: Math.max(0, access.totalSets - access.accessibleSets)
    };
  };

  return {
    subscription,
    questionSetAccess,
    loading,
    isSubscribed,
    refreshSubscription,
    getQuestionSetAccess,
    getSubscriptionStatus,
    checkQuestionSetAccess,
    getAvailableQuestionSets,
    // Legacy compatibility (will show question set info instead)
    freeQuestionsUsed: 0, // No longer applicable
    canAccessQuestions: true, // Will be determined by question set access
    FREE_QUESTIONS_PER_SUBJECT: 0 // No longer applicable
  };
}