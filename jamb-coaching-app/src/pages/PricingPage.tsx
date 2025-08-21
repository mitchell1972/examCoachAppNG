import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle, X, CreditCard, Users, BookOpen, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface PricingPlan {
  type: 'monthly' | 'annual';
  name: string;
  price: string;
  originalPrice?: string;
  savings?: string;
  features: string[];
  popular?: boolean;
}

const PRICING_PLANS: PricingPlan[] = [
  {
    type: 'monthly',
    name: 'Monthly Plan',
    price: '₦3,700',
    features: [
      'Access to all JAMB questions',
      'New questions every 3 days',
      '5 subjects: Math, Physics, Chemistry, Biology, English',
      'Detailed explanations for all answers',
      'Performance analytics and progress tracking',
      'Mobile and offline access'
    ]
  },
  {
    type: 'annual',
    name: 'Annual Plan',
    price: '₦40,000',
    originalPrice: '₦44,400',
    savings: 'Save ₦4,400',
    features: [
      'Everything in Monthly Plan',
      'Best value - only ₦3,333 per month',
      'Priority customer support',
      'Exclusive practice tests',
      'Advanced study recommendations',
      '2 months free compared to monthly billing'
    ],
    popular: true
  }
];

export default function PricingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    checkSubscriptionStatus();
    handlePaymentResult();
  }, [user]);

  const checkSubscriptionStatus = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
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

      setSubscription(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const handlePaymentResult = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const subscriptionStatus = urlParams.get('subscription');

    if (subscriptionStatus === 'success') {
      toast.success('Payment successful! Welcome to JAMB Coach Premium!');
      window.history.replaceState({}, document.title, window.location.pathname);
      
      setTimeout(() => {
        checkSubscriptionStatus();
      }, 2000);
    } else if (subscriptionStatus === 'cancelled') {
      toast.error('Payment was cancelled. You can try again anytime!');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const handleSubscribe = async (planType: string) => {
    if (!user) {
      toast.error('Please sign in to subscribe');
      navigate('/login');
      return;
    }

    setLoading(planType);

    try {
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          planType,
          customerEmail: user.email
        }
      });

      if (error) throw error;

      if (data?.data?.checkoutUrl) {
        toast.success('Redirecting to payment...');
        window.location.href = data.data.checkoutUrl;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast.error(error.message || 'Failed to create subscription');
    } finally {
      setLoading(null);
    }
  };

  if (subscription) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-400 mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            You're Already a Premium Member!
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Enjoy unlimited access to all JAMB questions and features.
          </p>
          <button
            onClick={() => navigate('/practice')}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            Continue Practicing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Choose Your JAMB Coaching Plan
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Get unlimited access to thousands of JAMB questions and boost your exam scores
          </p>
        </div>

        {/* Free Tier Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-medium text-blue-900">Free Tier</h3>
              <p className="text-blue-700 mt-1">
                Get started with 100 free questions (20 per subject) to experience our platform
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.type}
              className={`relative rounded-lg shadow-lg divide-y divide-gray-200 ${plan.popular ? 'border-2 border-blue-500' : 'border border-gray-200'} bg-white`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="inline-flex px-4 py-1 rounded-full text-sm font-semibold bg-blue-500 text-white">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-6">
                <div className="text-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {plan.name}
                  </h3>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-base font-medium text-gray-500">
                      /{plan.type === 'monthly' ? 'month' : 'year'}
                    </span>
                  </div>
                  {plan.originalPrice && (
                    <div className="mt-2">
                      <span className="text-sm text-gray-500 line-through">
                        {plan.originalPrice}
                      </span>
                      <span className="ml-2 text-sm font-medium text-green-600">
                        {plan.savings}
                      </span>
                    </div>
                  )}
                  {plan.type === 'annual' && (
                    <p className="mt-2 text-sm text-green-600 font-medium">
                      Only ₦3,333 per month
                    </p>
                  )}
                </div>
              </div>

              <div className="px-6 pt-6 pb-8">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <CheckCircle className="flex-shrink-0 h-5 w-5 text-green-400" />
                      <span className="ml-3 text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.type)}
                  disabled={loading === plan.type}
                  className={`mt-8 w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white ${
                    plan.popular
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-800 hover:bg-gray-900'
                  } disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                >
                  {loading === plan.type ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      Subscribe to {plan.name}
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Features Section */}
        <div className="mt-16">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900">
              Why Choose JAMB Coach Premium?
            </h3>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mx-auto">
                <BookOpen className="h-6 w-6" />
              </div>
              <h4 className="mt-4 text-lg font-medium text-gray-900">
                Comprehensive Question Bank
              </h4>
              <p className="mt-2 text-gray-600">
                Access thousands of JAMB questions across all 5 subjects with detailed explanations.
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white mx-auto">
                <Clock className="h-6 w-6" />
              </div>
              <h4 className="mt-4 text-lg font-medium text-gray-900">
                Fresh Content
              </h4>
              <p className="mt-2 text-gray-600">
                New questions added every 3 days to keep your practice sessions engaging and challenging.
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-purple-500 text-white mx-auto">
                <Users className="h-6 w-6" />
              </div>
              <h4 className="mt-4 text-lg font-medium text-gray-900">
                Performance Analytics
              </h4>
              <p className="mt-2 text-gray-600">
                Track your progress, identify weak areas, and get personalized study recommendations.
              </p>
            </div>
          </div>
        </div>

        {/* Security & Trust */}
        <div className="mt-16 bg-gray-100 rounded-lg p-8">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">
              Secure Payment & Trusted by Students
            </h3>
            <p className="mt-2 text-gray-600">
              Your payment information is secure with industry-standard encryption. Join thousands of students who trust JAMB Coach.
            </p>
            <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
              <span>Powered by Stripe • SSL Secured • 30-day Money Back Guarantee</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}