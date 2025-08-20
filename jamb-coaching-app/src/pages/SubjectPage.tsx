import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { useSubscription } from '../hooks/useSubscription';
import {
  CheckCircle as CheckCircleIcon,
  XCircle as XCircleIcon,
  Clock as ClockIcon,
  ArrowRight as ArrowRightIcon,
  ArrowLeft as ArrowLeftIcon,
  BookOpen as BookOpenIcon
} from 'lucide-react';
import { getDailyQuestions, getQuestionsBySubjectAndTopic, submitAnswer, Question } from '../lib/supabase';
import PaywallModal from '../components/PaywallModal';
import toast from 'react-hot-toast';

export default function SubjectPage() {
  const { subject } = useParams<{ subject: string }>();
  const [searchParams] = useSearchParams();
  const topic = searchParams.get('topic');
  const { user } = useAuth();
  const { checkQuestionAccess, freeQuestionsUsed, FREE_QUESTIONS_PER_SUBJECT, refreshSubscription } = useSubscription();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [sessionStartTime] = useState<number>(Date.now());
  const [showResults, setShowResults] = useState(false);
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  // Fetch questions
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['practiceQuestions', subject, topic],
    queryFn: () => {
      if (!subject) return [];
      
      // Try daily questions first, then fallback to general questions
      return getDailyQuestions(subject).then(dailyQuestions => {
        if (dailyQuestions.length > 0) {
          return dailyQuestions;
        }
        return getQuestionsBySubjectAndTopic(subject, topic || undefined, 20);
      });
    },
    enabled: !!subject
  });

  const currentQuestion = questions[currentQuestionIndex];

  // Check access before showing questions
  useEffect(() => {
    if (questions.length > 0 && user && subject) {
      const access = checkQuestionAccess(subject);
      if (!access.canAccess) {
        setShowPaywall(true);
      }
    }
  }, [questions, user, subject, checkQuestionAccess]);

  // Reset timer when question changes
  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);

  const handleAnswerSelect = (answer: 'A' | 'B' | 'C' | 'D') => {
    // Check access before allowing answer selection
    if (!subject) return;
    
    const access = checkQuestionAccess(subject);
    if (!access.canAccess) {
      setShowPaywall(true);
      return;
    }

    if (!currentQuestion) return;
    
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }));
  };

  const handleNextQuestion = async () => {
    // Check access before proceeding
    if (!subject) return;
    
    const access = checkQuestionAccess(subject);
    if (!access.canAccess) {
      setShowPaywall(true);
      return;
    }

    if (!currentQuestion || !user) return;

    const selectedAnswer = userAnswers[currentQuestion.id];
    if (!selectedAnswer) {
      toast.error('Please select an answer before proceeding');
      return;
    }

    setLoading(true);
    try {
      const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
      
      const result = await submitAnswer(currentQuestion.id, selectedAnswer, timeSpent);
      
      setSubmittedAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: result.data
      }));

      // Refresh subscription status to update question count
      refreshSubscription();

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        setShowResults(true);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit answer');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const calculateResults = () => {
    const totalQuestions = questions.length;
    const correctAnswers = Object.values(submittedAnswers).filter(answer => answer.is_correct).length;
    const totalTime = Math.floor((Date.now() - sessionStartTime) / 1000);
    
    return {
      totalQuestions,
      correctAnswers,
      percentage: totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
      totalTime
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="text-center py-12">
        <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No questions available</h3>
        <p className="mt-1 text-sm text-gray-500">
          No questions found for {subject} {topic && `- ${topic}`}. Please try a different subject or topic.
        </p>
      </div>
    );
  }

  if (showResults) {
    const results = calculateResults();
    
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-8 text-center">
            <div className="mb-6">
              {results.percentage >= 70 ? (
                <CheckCircleIcon className="mx-auto h-16 w-16 text-green-400" />
              ) : (
                <XCircleIcon className="mx-auto h-16 w-16 text-red-400" />
              )}
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Practice Session Complete!
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{results.correctAnswers}</div>
                <div className="text-sm text-gray-500">Correct Answers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{results.percentage}%</div>
                <div className="text-sm text-gray-500">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {Math.floor(results.totalTime / 60)}:{(results.totalTime % 60).toString().padStart(2, '0')}
                </div>
                <div className="text-sm text-gray-500">Total Time</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 mr-4"
              >
                Practice Again
              </button>
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Back to Practice
              </button>
            </div>
          </div>
          
          {/* Detailed Results */}
          <div className="border-t border-gray-200 px-6 py-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Question Review</h3>
            <div className="space-y-4">
              {questions.map((question, index) => {
                const userAnswer = userAnswers[question.id];
                const result = submittedAnswers[question.id];
                const isCorrect = result?.is_correct;
                
                return (
                  <div key={question.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">
                          Question {index + 1}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {question.question_text}
                        </p>
                      </div>
                      <div className="ml-4">
                        {isCorrect ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-400" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 text-red-400" />
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm">
                      <p className="text-gray-600">
                        Your answer: <span className={`font-medium ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                          {userAnswer} - {question[`option_${userAnswer.toLowerCase()}` as keyof Question]}
                        </span>
                      </p>
                      {!isCorrect && (
                        <p className="text-gray-600">
                          Correct answer: <span className="font-medium text-green-600">
                            {question.correct_answer} - {question[`option_${question.correct_answer.toLowerCase()}` as keyof Question]}
                          </span>
                        </p>
                      )}
                      {question.explanation && (
                        <p className="text-gray-500 mt-2">
                          <strong>Explanation:</strong> {question.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{subject}</h1>
            {topic && <p className="text-gray-600">{topic}</p>}
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <ClockIcon className="h-4 w-4 mr-1" />
              <span>{Math.floor((Date.now() - sessionStartTime) / 1000 / 60)}m</span>
            </div>
            <span>
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4">
          <div className="bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Question */}
      {currentQuestion && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-8">
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                {currentQuestion.question_text}
              </h2>
              
              <div className="space-y-3">
                {(['A', 'B', 'C', 'D'] as const).map((option) => {
                  const optionText = currentQuestion[`option_${option.toLowerCase()}` as keyof Question] as string;
                  const isSelected = userAnswers[currentQuestion.id] === option;
                  
                  return (
                    <button
                      key={option}
                      onClick={() => handleAnswerSelect(option)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium mr-3 ${
                          isSelected
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {option}
                        </span>
                        <span className="text-gray-900">{optionText}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Previous
              </button>
              
              <span className="text-sm text-gray-500">
                {currentQuestion.topic} • Difficulty: {currentQuestion.difficulty_level}/3
              </span>
              
              <button
                onClick={handleNextQuestion}
                disabled={!userAnswers[currentQuestion.id] || loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <ArrowRightIcon className="h-4 w-4 mr-2" />
                )}
                {currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        subject={subject || ''}
        freeQuestionsUsed={freeQuestionsUsed}
        freeQuestionsPerSubject={FREE_QUESTIONS_PER_SUBJECT}
      />
    </div>
  );
}