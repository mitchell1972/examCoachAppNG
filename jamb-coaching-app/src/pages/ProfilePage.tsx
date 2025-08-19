import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import {
  User as UserIcon,
  BarChart3 as ChartBarIcon,
  Trophy as TrophyIcon,
  BookOpen as BookOpenIcon,
  Clock as ClockIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  X as XIcon
} from 'lucide-react';
import { getUserProgress, updateUserProfile, analyzePerformance, NIGERIAN_STATES, JAMB_SUBJECTS } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    school_name: profile?.school_name || '',
    state: profile?.state || '',
    target_score: profile?.target_score || 300,
    preferred_subjects: profile?.preferred_subjects || []
  });
  const [loading, setLoading] = useState(false);

  // Fetch user progress
  const { data: userProgress = [], isLoading: progressLoading } = useQuery({
    queryKey: ['userProgress', user?.id],
    queryFn: () => user ? getUserProgress(user.id) : [],
    enabled: !!user
  });

  // Fetch performance analysis
  const { data: performanceAnalysis, isLoading: analysisLoading } = useQuery({
    queryKey: ['performanceAnalysis', user?.id],
    queryFn: () => user ? analyzePerformance(user.id) : null,
    enabled: !!user
  });

  const handleEdit = () => {
    setFormData({
      full_name: profile?.full_name || '',
      school_name: profile?.school_name || '',
      state: profile?.state || '',
      target_score: profile?.target_score || 300,
      preferred_subjects: profile?.preferred_subjects || []
    });
    setEditing(true);
  };

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await updateUserProfile(user.id, formData);
      await refreshProfile();
      setEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setFormData({
      full_name: profile?.full_name || '',
      school_name: profile?.school_name || '',
      state: profile?.state || '',
      target_score: profile?.target_score || 300,
      preferred_subjects: profile?.preferred_subjects || []
    });
  };

  const handleSubjectToggle = (subject: string) => {
    setFormData(prev => {
      const subjects = prev.preferred_subjects || [];
      const newSubjects = subjects.includes(subject)
        ? subjects.filter(s => s !== subject)
        : [...subjects, subject];
      return { ...prev, preferred_subjects: newSubjects };
    });
  };

  const overallStats = React.useMemo(() => {
    if (!userProgress.length) {
      return {
        totalQuestions: 0,
        totalCorrect: 0,
        averageScore: 0,
        predictedJambScore: 0
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
      averageScore: totals.totalQuestions > 0 ? (totals.totalCorrect / totals.totalQuestions) * 100 : 0
    };
  }, [userProgress]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="h-20 w-20 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {profile?.full_name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="ml-6">
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile?.full_name || 'User'}
                </h1>
                <p className="text-gray-600">{profile?.email}</p>
                <div className="flex items-center mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {profile?.role || 'Student'}
                  </span>
                </div>
              </div>
            </div>
            
            {!editing && (
              <button
                onClick={handleEdit}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <EditIcon className="h-4 w-4 mr-2" />
                Edit Profile
              </button>
            )}
          </div>

          {editing ? (
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    School Name
                  </label>
                  <input
                    type="text"
                    value={formData.school_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, school_name: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select state</option>
                    {NIGERIAN_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target JAMB Score
                  </label>
                  <input
                    type="number"
                    min="200"
                    max="400"
                    value={formData.target_score}
                    onChange={(e) => setFormData(prev => ({ ...prev, target_score: Number(e.target.value) }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Subjects
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {JAMB_SUBJECTS.map((subject) => (
                    <label key={subject} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.preferred_subjects?.includes(subject) || false}
                        onChange={() => handleSubjectToggle(subject)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{subject}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <XIcon className="h-4 w-4 mr-2" />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <SaveIcon className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Personal Information</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">School:</span> {profile?.school_name || 'Not specified'}</p>
                  <p><span className="font-medium">State:</span> {profile?.state || 'Not specified'}</p>
                  <p><span className="font-medium">Target Score:</span> {profile?.target_score || 300}/400</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Preferred Subjects</h3>
                <div className="flex flex-wrap gap-2">
                  {profile?.preferred_subjects?.length ? (
                    profile.preferred_subjects.map((subject) => (
                      <span
                        key={subject}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {subject}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">No preferences set</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Performance Overview */}
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
                    Total Questions
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
                    Predicted JAMB
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
                <ClockIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Study Streak
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {profile?.study_streak || 0} days
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subject Progress */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Subject Progress</h3>
          
          {progressLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading progress...</p>
            </div>
          ) : userProgress.length > 0 ? (
            <div className="space-y-4">
              {userProgress.map((progress) => (
                <div key={progress.subject} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900">{progress.subject}</h4>
                    <span className="text-sm font-medium text-gray-900">
                      {Math.round(progress.average_score)}%
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${Math.min(progress.average_score, 100)}%` }}
                    ></div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">
                        Questions: {progress.total_questions_attempted} • 
                        Correct: {progress.total_questions_correct}
                      </p>
                      {progress.weak_topics?.length > 0 && (
                        <div className="mt-1">
                          <span className="text-red-600 font-medium">Weak: </span>
                          <span className="text-red-600">
                            {progress.weak_topics.slice(0, 2).join(', ')}
                            {progress.weak_topics.length > 2 && ` +${progress.weak_topics.length - 2} more`}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <p className="text-gray-600">
                        Predicted Score: {progress.predicted_jamb_score}/400
                      </p>
                      {progress.strong_topics?.length > 0 && (
                        <div className="mt-1">
                          <span className="text-green-600 font-medium">Strong: </span>
                          <span className="text-green-600">
                            {progress.strong_topics.slice(0, 2).join(', ')}
                            {progress.strong_topics.length > 2 && ` +${progress.strong_topics.length - 2} more`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No progress data yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start practicing to see your progress and analytics.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Performance Analysis */}
      {performanceAnalysis?.data && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5">
            <h3 className="text-lg font-medium text-gray-900 mb-4">AI Recommendations</h3>
            
            {performanceAnalysis.data.recommendations?.length > 0 ? (
              <div className="space-y-3">
                {performanceAnalysis.data.recommendations.map((rec: any, index: number) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-l-4 ${
                      rec.priority === 'high'
                        ? 'bg-red-50 border-red-400'
                        : rec.priority === 'medium'
                        ? 'bg-yellow-50 border-yellow-400'
                        : 'bg-blue-50 border-blue-400'
                    }`}
                  >
                    <p className="text-sm text-gray-700">{rec.message}</p>
                    {rec.subject && (
                      <span className="inline-block mt-1 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">
                        {rec.subject}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Keep practicing to get personalized recommendations!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}