import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen as BookOpenIcon,
  Trophy as TrophyIcon,
  Clock as ClockIcon,
  BarChart3 as ChartBarIcon,
  Flame as FireIcon,
  Calendar as CalendarIcon,
  Lock as LockIcon
} from 'lucide-react';
import { getUserProgress, analyzePerformance, getDailyQuestions, JAMB_SUBJECTS } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const { getQuestionSetAccess, getSubscriptionStatus, isSubscribed, getAvailableQuestionSets } = useSubscription();
  const [selectedSubject, setSelectedSubject] = useState<string>(JAMB_SUBJECTS[0]);

  // Fetch user progress
  const { data: userProgress = [], isLoading: progressLoading } = useQuery({
    queryKey: ['userProgress', user?.id],
    queryFn: () => user ? getUserProgress(user.id) : [],
    enabled: !!user
  });

  // Fetch daily questions for selected subject
  const { data: dailyQuestions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ['dailyQuestions', selectedSubject],
    queryFn: () => getDailyQuestions(selectedSubject),
    enabled: !!selectedSubject
  });

  // Calculate overall stats
  const overallStats = React.useMemo(() => {
    if (!userProgress.length) {
      return {
        totalQuestions: 0,
        totalCorrect: 0,
        averageScore: 0,
        predictedJambScore: 0,
        studyStreak: profile?.study_streak || 0
      };
    }

    const totals = userProgress.reduce(
      (acc, progress) => {
        acc.totalQuestions += progress.total_questions_attempted;
        acc.totalCorrect += progress.total_questions_correct;
        acc.predictedJambScore = Math.max(acc.predictedJambScore, progress.predicted_jamb_score);
        return acc;
      },
      { totalQuestions: 0, totalCorrect: 0, predictedJambScore: 0 }
    );

    return {
      ...totals,
      averageScore: totals.totalQuestions > 0 ? (totals.totalCorrect / totals.totalQuestions) * 100 : 0,
      studyStreak: profile?.study_streak || 0
    };
  }, [userProgress, profile]);

  const subjectProgress = React.useMemo(() => {
    return JAMB_SUBJECTS.map(subject => {
      const progress = userProgress.find(p => p.subject === subject);
      const questionSets = getAvailableQuestionSets(subject);
      const status = getSubscriptionStatus(subject);
      return {
        subject,
        score: progress?.average_score || 0,
        attempted: progress?.total_questions_attempted || 0,
        availableQuestionSets: questionSets,
        status,
        weakTopics: progress?.weak_topics || [],
        strongTopics: progress?.strong_topics || []
      };
    });
  }, [userProgress, getAvailableQuestionSets, getSubscriptionStatus]);

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

      {/* Stats Overview */}
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
                    Questions Practiced
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {overallStats.totalQuestions}
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
                    Average Score
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {Math.round(overallStats.averageScore)}%
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
                    Predicted JAMB Score
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {overallStats.predictedJambScore || 'N/A'}
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
                    Study Streak
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {overallStats.studyStreak} days
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subject Performance */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Subject Performance
          </h3>
          <div className="space-y-4">
            {subjectProgress.map((subject) => (
              <div key={subject.subject} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {subject.status === 'expired' && !isSubscribed ? (
                      <LockIcon className="h-6 w-6 text-red-400" />
                    ) : (
                      <BookOpenIcon className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{subject.subject}</h4>
                    <p className="text-sm text-gray-500">
                      {subject.attempted} questions attempted
                      {!isSubscribed && (
                        <span className={`ml-2 ${subject.status === 'expired' ? 'text-red-600' : 'text-blue-600'}`}>
                          • {subject.availableQuestionSets.accessible}/{subject.availableQuestionSets.total} question sets accessible
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {Math.round(subject.score)}%
                    </p>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${Math.min(subject.score, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  {subject.status === 'expired' && !isSubscribed ? (
                    <Link
                      to="/pricing"
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                    >
                      Upgrade
                    </Link>
                  ) : (
                    <Link
                      to={`/subject/${encodeURIComponent(subject.subject)}`}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                    >
                      Practice
                    </Link>
                  )}
                </div>
              </div>
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
                <p className="text-sm font-medium text-gray-900">View Progress</p>
                <p className="text-sm text-gray-500">Check detailed analytics</p>
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