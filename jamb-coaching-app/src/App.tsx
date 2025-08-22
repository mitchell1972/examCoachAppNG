import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';

// Components
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';
import Layout from './components/Layout';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PracticePage from './pages/PracticePage';
import SubjectPage from './pages/SubjectPage';
import QuestionSetsPage from './pages/QuestionSetsPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import PricingPage from './pages/PricingPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<PublicRoute><HomePage /></PublicRoute>} />
              <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
              <Route path="/pricing" element={<PricingPage />} />
              
              {/* Private routes */}
              <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/practice" element={<PracticePage />} />
                <Route path="/subject/:subject" element={<SubjectPage />} />
                <Route path="/question-sets/:subject" element={<QuestionSetsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/admin" element={<AdminPage />} />
              </Route>
              
              {/* Redirect unknown routes */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            
            <Toaster
              position="top-right"
              toastOptions={{
                className: '',
                duration: 3000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 2000,
                  iconTheme: {
                    primary: '#10B981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 4000,
                  iconTheme: {
                    primary: '#EF4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;