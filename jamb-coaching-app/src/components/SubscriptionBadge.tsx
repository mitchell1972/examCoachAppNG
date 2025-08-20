import React from 'react';
import { Crown, Clock, CheckCircle } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { useParams } from 'react-router-dom';

export default function SubscriptionBadge() {
  const { getSubscriptionStatus, getAvailableQuestionSets, isSubscribed, loading } = useSubscription();
  const { subject } = useParams<{ subject: string }>();

  if (loading) {
    return (
      <div className="flex items-center px-2 py-1 rounded-full bg-gray-100">
        <div className="animate-pulse h-3 w-3 bg-gray-300 rounded-full mr-1"></div>
        <span className="text-xs text-gray-500">Loading...</span>
      </div>
    );
  }

  const status = getSubscriptionStatus(subject);
  const questionSetInfo = subject ? getAvailableQuestionSets(subject) : { accessible: 0, total: 0, locked: 0 };

  if (isSubscribed) {
    return (
      <div className="flex items-center px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
        <Crown className="h-3 w-3 mr-1" />
        <span className="text-xs font-medium">Premium</span>
      </div>
    );
  }

  switch (status) {
    case 'free':
      return (
        <div className="flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          <span className="text-xs font-medium">
            {subject ? `${questionSetInfo.accessible} sets` : 'Free access'}
          </span>
        </div>
      );
    
    case 'expired':
    case 'no_content':
      return (
        <div className="flex items-center px-2 py-1 rounded-full bg-orange-100 text-orange-800">
          <Clock className="h-3 w-3 mr-1" />
          <span className="text-xs font-medium">Subscribe</span>
        </div>
      );
    
    default:
      return (
        <div className="flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800">
          <Clock className="h-3 w-3 mr-1" />
          <span className="text-xs font-medium">Question Sets</span>
        </div>
      );
  }
}