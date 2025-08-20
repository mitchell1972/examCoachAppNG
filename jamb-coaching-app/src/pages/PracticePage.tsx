import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSubscription } from '../hooks/useSubscription';
import {
  BookOpen as BookOpenIcon,
  Clock as ClockIcon,
  Play as PlayIcon,
  Trophy as TrophyIcon,
  Crown,
  AlertCircle
} from 'lucide-react';
import { getQuestionsBySubjectAndTopic, JAMB_SUBJECTS } from '../lib/supabase';

const TOPICS_BY_SUBJECT = {
  'Mathematics': ['Algebra', 'Geometry', 'Trigonometry', 'Statistics', 'Calculus'],
  'Physics': ['Mechanics', 'Waves and Sound', 'Electricity', 'Light and Optics', 'Modern Physics'],
  'Chemistry': ['Atomic Structure', 'Chemical Bonding', 'Acids, Bases and Salts', 'Organic Chemistry', 'Rates of Reaction'],
  'Biology': ['Cell Biology', 'Genetics', 'Evolution', 'Ecology', 'Human Physiology'],
  'English Language': ['Grammar', 'Comprehension', 'Summary', 'Essay Writing', 'Oral English']
};

export default function PracticePage() {
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [difficultyLevel, setDifficultyLevel] = useState<number>(1);
  const { 
    getSubscriptionStatus, 
    getRemainingFreeQuestions, 
    loading: subscriptionLoading 
  } = useSubscription();

  // Fetch questions when subject/topic changes
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['questions', selectedSubject, selectedTopic],
    queryFn: () => getQuestionsBySubjectAndTopic(selectedSubject, selectedTopic),
    enabled: !!selectedSubject
  });

  const handleSubjectChange = (subject: string) => {
    setSelectedSubject(subject);
    setSelectedTopic(''); // Reset topic when subject changes
  };

  const subscriptionStatus = getSubscriptionStatus();
  const remainingQuestions = getRemainingFreeQuestions();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Practice Center</h1>
        <p className="mt-2 text-gray-600">
          Choose a subject and topic to start your practice session
        </p>
        
        {/* Subscription Status */}
        {!subscriptionLoading && (
          <div className="mt-4 inline-flex items-center justify-center">
            {subscriptionStatus === 'premium' ? (
              <div className="flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full">
                <Crown className="h-5 w-5 mr-2" />
                <span className="font-medium">Premium Member - Unlimited Access</span>
              </div>
            ) : subscriptionStatus === 'free' ? (
              <div className="flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full">
                <ClockIcon className="h-5 w-5 mr-2" />
                <span className="font-medium">{remainingQuestions} Free Questions Remaining (Min Across Subjects)</span>
              </div>
            ) : (
              <div className="flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-full">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span className="font-medium">Free Questions Exhausted - </span>
                <Link to="/pricing" className="ml-1 underline font-bold">Upgrade Now</Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Practice Options */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Select Practice Options</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Subject Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => handleSubjectChange(e.target.value)}
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

            {/* Topic Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topic (Optional)
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

            {/* Difficulty Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level
              </label>
              <select
                value={difficultyLevel}
                onChange={(e) => setDifficultyLevel(Number(e.target.value))}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value={1}>Easy</option>
                <option value={2}>Medium</option>
                <option value={3}>Hard</option>
              </select>
            </div>
          </div>

          {/* Available Questions Info */}
          {selectedSubject && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <BookOpenIcon className="h-5 w-5 text-blue-400 mr-2" />
                <span className="text-sm font-medium text-blue-800">
                  {isLoading ? 'Loading...' : `${questions.length} questions available`}
                  {selectedTopic && ` for ${selectedTopic}`}
                </span>
              </div>
              
              {questions.length > 0 && (
                <div className="mt-3">
                  <Link
                    to={`/subject/${encodeURIComponent(selectedSubject)}${selectedTopic ? `?topic=${encodeURIComponent(selectedTopic)}` : ''}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <PlayIcon className="h-4 w-4 mr-2" />
                    Start Practice Session
                  </Link>
                </div>
              )}
            </div>
          )}
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
                <div className="flex items-center text-sm text-gray-500 mb-3">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  <span>20 questions per session</span>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900">Topics covered:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {TOPICS_BY_SUBJECT[subject as keyof typeof TOPICS_BY_SUBJECT]?.slice(0, 3).map((topic) => (
                      <li key={topic}>• {topic}</li>
                    ))}
                    {TOPICS_BY_SUBJECT[subject as keyof typeof TOPICS_BY_SUBJECT]?.length > 3 && (
                      <li className="text-blue-600">• + {TOPICS_BY_SUBJECT[subject as keyof typeof TOPICS_BY_SUBJECT].length - 3} more topics</li>
                    )}
                  </ul>
                </div>
                <Link
                  to={`/subject/${encodeURIComponent(subject)}`}
                  className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                >
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Practice {subject}
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Practice Tips */}
      <div className="bg-green-50 border border-green-200 rounded-lg">
        <div className="p-6">
          <h3 className="text-lg font-medium text-green-800 mb-4">
            <TrophyIcon className="h-6 w-6 inline mr-2" />
            Practice Tips
          </h3>
          <ul className="space-y-2 text-sm text-green-700">
            <li>• Start with easier topics and gradually increase difficulty</li>
            <li>• Review explanations for wrong answers to learn from mistakes</li>
            <li>• Practice regularly - consistency is key to improvement</li>
            <li>• Focus extra time on your weak subjects and topics</li>
            <li>• Time yourself to simulate real exam conditions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}