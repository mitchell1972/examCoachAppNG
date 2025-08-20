import React from 'react';
import { Crown, Clock } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';

export default function SubscriptionBadge() {
  const { getSubscriptionStatus, getRemainingFreeQuestions, loading } = useSubscription();

  if (loading) {
    return (
      <div className="flex items-center px-2 py-1 rounded-full bg-gray-100">
        <div className="animate-pulse h-3 w-3 bg-gray-300 rounded-full mr-1"></div>
        <span className="text-xs text-gray-500">Loading...</span>
      </div>
    );
  }

  const status = getSubscriptionStatus();
  const remaining = getRemainingFreeQuestions();

  switch (status) {
    case 'premium':
      return (
        <div className="flex items-center px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
          <Crown className="h-3 w-3 mr-1" />
          <span className="text-xs font-medium">Premium</span>
        </div>
      );
    
    case 'free':
      return (
        <div className="flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800">
          <Clock className="h-3 w-3 mr-1" />
          <span className="text-xs font-medium">{remaining} left</span>
        </div>
      );
    
    case 'expired':
      return (
        <div className="flex items-center px-2 py-1 rounded-full bg-red-100 text-red-800">
          <Clock className="h-3 w-3 mr-1" />
          <span className="text-xs font-medium">Upgrade</span>
        </div>
      );
    
    default:
      return null;
  }
}