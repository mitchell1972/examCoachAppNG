import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  User as UserIcon,
  Mail as MailIcon,
  Shield as ShieldIcon,
  Calendar as CalendarIcon
} from 'lucide-react';

export default function ProfilePage() {
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center space-x-5">
            <div className="flex-shrink-0">
              <div className="h-16 w-16 bg-blue-500 rounded-full flex items-center justify-center">
                <UserIcon className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {profile?.full_name || 'Student'}
              </h1>
              <p className="text-sm text-gray-500">
                Role: <span className="capitalize font-medium">{profile?.role || 'Student'}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Account Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-3">
              <MailIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Email Address</p>
                <p className="text-sm text-gray-600">{profile?.email || user?.email || 'Not available'}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <ShieldIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Account Type</p>
                <p className="text-sm text-gray-600 capitalize">{profile?.role || 'Student'}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <UserIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Full Name</p>
                <p className="text-sm text-gray-600">{profile?.full_name || 'Not set'}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">User ID</p>
                <p className="text-sm text-gray-600 font-mono">{user?.id || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Account Actions
          </h3>
          
          <div className="space-y-3">
            <button
              onClick={handleSignOut}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Authentication Status */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-3 w-3 bg-green-400 rounded-full"></div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-green-800">
              Authentication Status: Active
            </p>
            <p className="text-sm text-green-700">
              You are successfully logged in and can access all available features.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}