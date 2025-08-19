import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus as PlusIcon,
  Trash as TrashIcon,
  Edit as EditIcon,
  Play as PlayIcon,
  Users as UsersIcon,
  BookOpen as BookOpenIcon,
  BarChart3 as ChartBarIcon,
  Settings as CogIcon
} from 'lucide-react';
import { generateQuestions, getQuestionsBySubjectAndTopic, JAMB_SUBJECTS } from '../lib/supabase';
import toast from 'react-hot-toast';

const TOPICS_BY_SUBJECT = {
  'Mathematics': ['Algebra', 'Geometry', 'Trigonometry', 'Statistics', 'Calculus'],
  'Physics': ['Mechanics', 'Waves and Sound', 'Electricity', 'Light and Optics', 'Modern Physics'],
  'Chemistry': ['Atomic Structure', 'Chemical Bonding', 'Acids, Bases and Salts', 'Organic Chemistry', 'Rates of Reaction'],
  'Biology': ['Cell Biology', 'Genetics', 'Evolution', 'Ecology', 'Human Physiology'],
  'English Language': ['Grammar', 'Comprehension', 'Summary', 'Essay Writing', 'Oral English']
};

export default function AdminPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('questions');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const queryClient = useQueryClient();

  // Check if user is admin
  if (profile?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <CogIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
        <p className="mt-1 text-sm text-gray-500">
          You don't have permission to access the admin panel.
        </p>
      </div>
    );
  }

  const tabs = [
    { id: 'questions', name: 'Question Management', icon: BookOpenIcon },
    { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
    { id: 'users', name: 'User Management', icon: UsersIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-600">Manage questions, view analytics, and configure the platform</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5 inline mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'questions' && <QuestionManagement />}
      {activeTab === 'analytics' && <AnalyticsDashboard />}
      {activeTab === 'users' && <UserManagement />}
    </div>
  );
}

function QuestionManagement() {
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    subject: '',
    topic: '',
    difficulty: 1,
    count: 5
  });
  const queryClient = useQueryClient();

  // Fetch questions
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['adminQuestions', selectedSubject, selectedTopic],
    queryFn: () => selectedSubject ? getQuestionsBySubjectAndTopic(selectedSubject, selectedTopic, 50) : [],
    enabled: !!selectedSubject
  });

  // Generate questions mutation
  const generateMutation = useMutation({
    mutationFn: ({ subject, topic, difficulty, count }: any) => 
      generateQuestions(subject, topic, difficulty, count),
    onSuccess: () => {
      toast.success('Questions generated successfully!');
      queryClient.invalidateQueries({ queryKey: ['adminQuestions'] });
      setShowGenerateForm(false);
      setGenerateForm({ subject: '', topic: '', difficulty: 1, count: 5 });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to generate questions');
    }
  });

  const handleGenerate = () => {
    if (!generateForm.subject || !generateForm.topic) {
      toast.error('Please select subject and topic');
      return;
    }
    generateMutation.mutate(generateForm);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Question Management</h3>
            <button
              onClick={() => setShowGenerateForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Generate Questions
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setSelectedTopic('');
                }}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">Select a subject</option>
                {JAMB_SUBJECTS.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Topic
              </label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                disabled={!selectedSubject}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md disabled:bg-gray-100"
              >
                <option value="">All topics</option>
                {selectedSubject && TOPICS_BY_SUBJECT[selectedSubject as keyof typeof TOPICS_BY_SUBJECT]?.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Questions List */}
      {selectedSubject && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4">
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              Questions for {selectedSubject} {selectedTopic && `- ${selectedTopic}`}
            </h4>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading questions...</p>
              </div>
            ) : questions.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">{questions.length} questions found</p>
                {questions.map((question, index) => (
                  <div key={question.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="text-sm font-medium text-gray-900">
                          Question {index + 1} • {question.topic} • 
                          <span className={`ml-1 px-2 py-1 text-xs rounded ${
                            question.difficulty_level === 1 ? 'bg-green-100 text-green-800' :
                            question.difficulty_level === 2 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {question.difficulty_level === 1 ? 'Easy' : 
                             question.difficulty_level === 2 ? 'Medium' : 'Hard'}
                          </span>
                        </h5>
                        <p className="text-sm text-gray-600 mt-1">
                          {question.question_text}
                        </p>
                        <div className="mt-2 text-xs text-gray-500">
                          Correct Answer: {question.correct_answer} • 
                          Times Answered: {question.times_answered} • 
                          Success Rate: {Math.round((question.correct_rate || 0) * 100)}%
                        </div>
                      </div>
                      <div className="ml-4 flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-700">
                          <EditIcon className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-700">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No questions found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No questions available for the selected criteria.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generate Questions Modal */}
      {showGenerateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Generate AI Questions
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <select
                    value={generateForm.subject}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, subject: e.target.value, topic: '' }))}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="">Select subject</option>
                    {JAMB_SUBJECTS.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Topic
                  </label>
                  <select
                    value={generateForm.topic}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, topic: e.target.value }))}
                    disabled={!generateForm.subject}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md disabled:bg-gray-100"
                  >
                    <option value="">Select topic</option>
                    {generateForm.subject && TOPICS_BY_SUBJECT[generateForm.subject as keyof typeof TOPICS_BY_SUBJECT]?.map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={generateForm.difficulty}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, difficulty: Number(e.target.value) }))}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value={1}>Easy</option>
                    <option value={2}>Medium</option>
                    <option value={3}>Hard</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Questions
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={generateForm.count}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, count: Number(e.target.value) }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowGenerateForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {generateMutation.isPending ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </div>
                  ) : (
                    'Generate Questions'
                  )}
                </button>
              </div>
              
              {/* Note about AI availability */}
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> AI question generation requires a Gemini API key. 
                  Without it, mock questions will be generated instead.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AnalyticsDashboard() {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Analytics</h3>
          <div className="text-center py-8">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Analytics Coming Soon</h3>
            <p className="mt-1 text-sm text-gray-500">
              Detailed analytics dashboard is under development.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserManagement() {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">User Management</h3>
          <div className="text-center py-8">
            <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">User Management Coming Soon</h3>
            <p className="mt-1 text-sm text-gray-500">
              User management features are under development.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}