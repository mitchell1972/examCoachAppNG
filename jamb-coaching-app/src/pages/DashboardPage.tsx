import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen as BookOpenIcon,
  Trophy as TrophyIcon,
  Clock as ClockIcon,
  BarChart3 as ChartBarIcon,
  Flame as FireIcon,
  Calendar as CalendarIcon
} from 'lucide-react';
import { getDailyQuestions, JAMB_SUBJECTS } from '../lib/supabase';

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState<string>(JAMB_SUBJECTS[0]);

  // Fetch daily questions for selected subject
  const { data: dailyQuestions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ['dailyQuestions', selectedSubject],
    queryFn: () => getDailyQuestions(selectedSubject),
    enabled: !!selectedSubject
  });

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {profile?.full_name || 'Student'}!
        </h1>
        <p className="text-blue-100">
          Ready to continue your JAMB preparation? Let's achieve your target score together.
        </p>
      </div>

      {/* Basic Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpenIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Role
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 capitalize">
                    {profile?.role || 'Student'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrophyIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Account Status
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    Active
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Email
                  </dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {profile?.email || user?.email || 'Not available'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FireIcon className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Status
                  </dt>
                  <dd className="text-lg font-medium text-green-600">
                    Online
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subject Selection */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Choose Your Subject
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {JAMB_SUBJECTS.map((subject) => (
              <Link
                key={subject}
                to={`/subject/${encodeURIComponent(subject)}`}
                className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
              >
                <BookOpenIcon className="h-6 w-6 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{subject}</p>
                  <p className="text-sm text-gray-500">Practice questions</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Questions Preview */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Today's Questions
            </h3>
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-500">
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
          
          {/* Subject selector */}
          <div className="mb-4">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              {JAMB_SUBJECTS.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          {questionsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading questions...</p>
            </div>
          ) : dailyQuestions.length > 0 ? (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                {dailyQuestions.length} questions available for {selectedSubject}
              </p>
              <Link
                to={`/subject/${encodeURIComponent(selectedSubject)}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Start Practice Session
              </Link>
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No questions available</h3>
              <p className="mt-1 text-sm text-gray-500">
                New questions will be available soon. Check back later!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              to="/practice"
              className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <BookOpenIcon className="h-6 w-6 text-blue-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Free Practice</p>
                <p className="text-sm text-gray-500">Practice any subject</p>
              </div>
            </Link>
            
            <Link
              to="/profile"
              className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <ChartBarIcon className="h-6 w-6 text-green-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">View Profile</p>
                <p className="text-sm text-gray-500">Check your information</p>
              </div>
            </Link>
            
            {profile?.role === 'admin' && (
              <Link
                to="/admin"
                className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <TrophyIcon className="h-6 w-6 text-purple-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Admin Panel</p>
                  <p className="text-sm text-gray-500">Manage questions</p>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}