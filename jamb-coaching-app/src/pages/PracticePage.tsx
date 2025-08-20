import React from 'react';
import { Link } from 'react-router-dom';
import { useSubscription } from '../hooks/useSubscription';
import {
  BookOpen as BookOpenIcon,
  Clock as ClockIcon,
  Play as PlayIcon,
  Crown,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { JAMB_SUBJECTS } from '../lib/supabase';

export default function PracticePage() {
  const { 
    getSubscriptionStatus, 
    getAvailableQuestionSets,
    isSubscribed,
    loading: subscriptionLoading 
  } = useSubscription();

  const subscriptionStatus = getSubscriptionStatus();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Practice Center</h1>
        <p className="mt-2 text-gray-600">
          Choose a subject to access question sets and start practicing
        </p>
        
        {/* Subscription Status */}
        {!subscriptionLoading && (
          <div className="mt-4 inline-flex items-center justify-center">
            {subscriptionStatus === 'premium' ? (
              <div className="flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full">
                <Crown className="h-5 w-5 mr-2" />
                <span className="font-medium">Premium Member - Unlimited Access</span>
              </div>
            ) : (
              <div className="flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full">
                <Calendar className="h-5 w-5 mr-2" />
                <span className="font-medium">Question sets delivered every 3 days at 6 AM Nigerian time</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Automated Delivery Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <ClockIcon className="h-6 w-6 text-blue-500 mt-1 mr-4" />
          <div>
            <h3 className="text-lg font-medium text-blue-900 mb-2">
              Automated Question Delivery System
            </h3>
            <p className="text-blue-700 mb-3">
              Fresh sets of 50 questions are automatically generated and delivered every 3 days at 6:00 AM Nigerian time for each subject.
            </p>
            <ul className="text-sm text-blue-600 space-y-1">
              <li>• First question set for each subject is completely free</li>
              <li>• Subscribe to access all question sets and get unlimited practice</li>
              <li>• Manage and delete question sets you no longer need</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Subject Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {JAMB_SUBJECTS.map((subject) => {
          const subjectImages = {
            'Mathematics': '/images/clean_mathematics_equations_chalkboard_background.jpg',
            'Physics': '/images/physics_laboratory_equipment_collection.jpg',
            'Chemistry': '/images/Colorful-Standard-Chemistry-Periodic-Table.jpg',
            'Biology': '/images/abstract_biology_cellular_data_visualization.jpg',
            'English Language': '/images/classic-english-literature-book-covers-collage.jpg'
          };

          const questionSetInfo = getAvailableQuestionSets(subject);

          return (
            <div key={subject} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
              <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url(${subjectImages[subject as keyof typeof subjectImages]})` }}>
                <div className="h-full bg-black bg-opacity-40 flex items-end">
                  <div className="p-4">
                    <h3 className="text-lg font-medium text-white">{subject}</h3>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    <span>50 questions per set</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Every 3 days</span>
                  </div>
                </div>
                
                {/* Question Set Stats */}
                <div className="mb-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-lg font-bold text-gray-900">{questionSetInfo.total}</div>
                      <div className="text-xs text-gray-500">Total Sets</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600">{questionSetInfo.accessible}</div>
                      <div className="text-xs text-gray-500">Accessible</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-orange-600">{questionSetInfo.locked}</div>
                      <div className="text-xs text-gray-500">Locked</div>
                    </div>
                  </div>
                </div>

                {/* Access Status */}
                <div className="mb-4">
                  {questionSetInfo.accessible > 0 ? (
                    <div className="text-sm text-green-700 bg-green-50 px-2 py-1 rounded">
                      {isSubscribed ? 'Full Access' : 
                       questionSetInfo.accessible === 1 ? 'Free Set Available' : 
                       `${questionSetInfo.accessible} Sets Available`}
                    </div>
                  ) : (
                    <div className="text-sm text-orange-700 bg-orange-50 px-2 py-1 rounded">
                      Subscribe for Access
                    </div>
                  )}
                </div>

                <Link
                  to={`/question-sets/${encodeURIComponent(subject)}`}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                >
                  <BookOpenIcon className="h-4 w-4 mr-2" />
                  View Question Sets
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* How It Works */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5">
          <h2 className="text-lg font-medium text-gray-900 mb-4">How the Automated System Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <ClockIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Automated Delivery</h3>
              <p className="text-sm text-gray-600">
                Fresh question sets are automatically generated every 3 days at 6 AM Nigerian time.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <BookOpenIcon className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">50 Questions Each</h3>
              <p className="text-sm text-gray-600">
                Every question set contains 50 high-quality JAMB questions with detailed explanations.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <PlayIcon className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Practice & Manage</h3>
              <p className="text-sm text-gray-600">
                Access your question sets, practice at your pace, and delete sets you no longer need.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}