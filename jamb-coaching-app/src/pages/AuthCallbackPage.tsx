import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const hashFragment = window.location.hash;

        if (hashFragment && hashFragment.length > 0) {
          const { data, error } = await supabase.auth.getSession();

          if (error) {
            console.error('Error getting session:', error.message);
            toast.error('Authentication failed. Please try again.');
            navigate('/login');
            return;
          }

          if (data.session) {
            toast.success('Email verified successfully!');
            navigate('/dashboard');
            return;
          }
        }

        // If we get here, something went wrong
        toast.error('Authentication incomplete. Please try signing in again.');
        navigate('/login');
      } catch (error) {
        console.error('Auth callback error:', error);
        toast.error('Something went wrong. Please try again.');
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <h2 className="mt-4 text-xl font-semibold text-gray-900">Verifying your account...</h2>
        <p className="mt-2 text-gray-600">Please wait while we complete your authentication.</p>
      </div>
    </div>
  );
}