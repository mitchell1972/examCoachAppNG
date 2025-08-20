import React from 'react';
import { Link } from 'react-router-dom';
import { X, Lock, Star, ArrowRight } from 'lucide-react';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  freeQuestionsUsed: number;
  totalFreeQuestions: number;
}

export default function PaywallModal({ 
  isOpen, 
  onClose, 
  freeQuestionsUsed, 
  totalFreeQuestions 
}: PaywallModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" 
        onClick={onClose}
      ></div>
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center">
            <div className="bg-white bg-opacity-20 rounded-full p-2 mr-3">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Upgrade to Continue</h2>
              <p className="text-blue-100 text-sm">
                You've used all {totalFreeQuestions} free questions
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Free Questions Used</span>
              <span>{freeQuestionsUsed}/{totalFreeQuestions}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full" 
                style={{ width: '100%' }}
              ></div>
            </div>
          </div>

          {/* Benefits */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">
              Upgrade to Premium and get:
            </h3>
            <ul className="space-y-2">
              {[
                'Unlimited access to all JAMB questions',
                'New questions every 4 days',
                'Detailed explanations for every answer',
                'Performance analytics and progress tracking',
                'Mobile and offline access'
              ].map((benefit, index) => (
                <li key={index} className="flex items-center text-sm text-gray-700">
                  <Star className="h-4 w-4 text-yellow-400 mr-2 flex-shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <Link
              to="/pricing"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center transition-colors"
            >
              View Pricing Plans
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
            
            <button
              onClick={onClose}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Continue with Free Account
            </button>
          </div>

          {/* Pricing Preview */}
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-center">
              <p className="text-sm font-medium text-green-800">
                Special Offer: Annual Plan
              </p>
              <p className="text-2xl font-bold text-green-600">
                ₦40,000/year
              </p>
              <p className="text-xs text-green-600">
                Save ₦4,400 compared to monthly billing
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}