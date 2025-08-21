import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  Play as PlayIcon,
  Trash2 as Trash2Icon,
  Lock as LockIcon,
  CheckCircle as CheckCircleIcon,
  BookOpen as BookOpenIcon,
  AlertCircle as AlertCircleIcon
} from 'lucide-react';
import { getAvailableQuestionSets, deleteQuestionSet, QuestionSet } from '../lib/supabase';
import PaywallModal from '../components/PaywallModal';
import toast from 'react-hot-toast';

export default function QuestionSetsPage() {
  const { subject } = useParams<{ subject: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isSubscribed, checkQuestionSetAccess, getAvailableQuestionSets: getAccessInfo } = useSubscription();
  const queryClient = useQueryClient();
  
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedSetForDeletion, setSelectedSetForDeletion] = useState<QuestionSet | null>(null);

  // Fetch question sets
  const { data: questionSets = [], isLoading, error } = useQuery({
    queryKey: ['questionSets', subject],
    queryFn: () => {
      if (!subject) throw new Error('Subject is required');
      return getAvailableQuestionSets(subject);
    },
    enabled: !!subject && !!user
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteQuestionSet,
    onSuccess: () => {
      toast.success('Question set deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['questionSets', subject] });
      setSelectedSetForDeletion(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete question set');
    }
  });

  const handleStartPractice = (questionSet: QuestionSet) => {
    if (!questionSet.can_access) {
      setShowPaywall(true);
      return;
    }
    
    // Navigate to practice with question set ID
    navigate(`/practice/${subject}?question_set_id=${questionSet.id}`);
  };

  const handleDeleteQuestionSet = (questionSet: QuestionSet) => {
    setSelectedSetForDeletion(questionSet);
  };

  const confirmDelete = () => {
    if (selectedSetForDeletion) {
      deleteMutation.mutate(selectedSetForDeletion.id);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAccessBadge = (questionSet: QuestionSet) => {
    if (questionSet.can_access) {
      if (questionSet.access_reason === 'subscription') {
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Premium
          </span>
        );
      } else if (questionSet.access_reason === 'free_first_set') {
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Free
          </span>
        );
      } else {
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Accessible
          </span>
        );
      }
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          <LockIcon className="h-3 w-3 mr-1" />
          Subscription Required
        </span>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading question sets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircleIcon className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading question sets</h3>
        <p className="mt-1 text-sm text-gray-500">
          {error instanceof Error ? error.message : 'Please try again later'}
        </p>
      </div>
    );
  }

  if (!questionSets.length) {
    return (
      <div className="text-center py-12">
        <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No question sets available</h3>
        <p className="mt-1 text-sm text-gray-500">
          Question sets for {subject} will be delivered every 3 days at 6 AM Nigerian time.
        </p>
        <div className="mt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <ClockIcon className="h-5 w-5 text-blue-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Automated Question Delivery
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Fresh sets of 50 questions are automatically generated and delivered every 3 days.</p>
                  <p className="mt-1">Next delivery: Check back soon!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const accessInfo = getAccessInfo(subject || '');

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{subject} Question Sets</h1>
              <p className="mt-1 text-sm text-gray-500">
                Fresh questions delivered every 3 days at 6 AM Nigerian time
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{accessInfo.accessible}</div>
              <div className="text-sm text-gray-500">Accessible Sets</div>
            </div>
          </div>
          
          {/* Stats */}
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">{accessInfo.total}</div>
              <div className="text-xs text-gray-500">Total Sets</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">{accessInfo.accessible}</div>
              <div className="text-xs text-gray-500">Accessible</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-orange-600">{accessInfo.locked}</div>
              <div className="text-xs text-gray-500">Locked</div>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Info */}
      {!isSubscribed && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <ClockIcon className="h-5 w-5 text-blue-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Question Set Delivery Schedule
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>50 fresh questions are automatically delivered every 3 days at 6:00 AM Nigerian time.</p>
                <p className="mt-1">The first question set for each subject is completely free.</p>
                <p className="mt-1">Subscribe to access all question sets and get unlimited practice.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Question Sets List */}
      <div className="space-y-4">
        {questionSets.map((questionSet) => (
          <div
            key={questionSet.id}
            className={`bg-white shadow rounded-lg overflow-hidden ${
              questionSet.can_access ? 'hover:shadow-md' : 'opacity-75'
            } transition-shadow`}
          >
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      {questionSet.title}
                    </h3>
                    {getAccessBadge(questionSet)}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">
                    {questionSet.description}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      Delivered: {formatDate(questionSet.delivery_date)}
                    </div>
                    <div className="flex items-center">
                      <BookOpenIcon className="h-4 w-4 mr-1" />
                      {questionSet.total_questions} Questions
                    </div>
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {questionSet.generation_source}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleStartPractice(questionSet)}
                    disabled={!questionSet.can_access}
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md ${
                      questionSet.can_access
                        ? 'text-white bg-blue-600 hover:bg-blue-700'
                        : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    }`}
                  >
                    <PlayIcon className="h-4 w-4 mr-2" />
                    {questionSet.can_access ? 'Start Practice' : 'Locked'}
                  </button>
                  
                  {questionSet.can_access && (
                    <button
                      onClick={() => handleDeleteQuestionSet(questionSet)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Paywall Modal */}
      {showPaywall && (
        <PaywallModal
          isOpen={showPaywall}
          onClose={() => setShowPaywall(false)}
          title="Subscribe for Full Access"
          description={`Subscribe to access all question sets for ${subject}. Get 50 fresh questions delivered every 3 days automatically.`}
        />
      )}

      {/* Delete Confirmation Modal */}
      {selectedSetForDeletion && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2Icon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-2">
                Delete Question Set
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete "{selectedSetForDeletion.title}"? This action cannot be undone.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex space-x-3">
                  <button
                    onClick={() => setSelectedSetForDeletion(null)}
                    className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={deleteMutation.isPending}
                    className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 disabled:opacity-50"
                  >
                    {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}