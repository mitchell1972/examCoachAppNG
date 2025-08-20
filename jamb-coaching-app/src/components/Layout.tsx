import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Home as HomeIcon,
  BookOpen as BookOpenIcon,
  User as UserIcon,
  BarChart3 as ChartBarIcon,
  Settings as CogIcon,
  LogOut as LogOutIcon,
  Menu as MenuIcon,
  X as XIcon,
  CreditCard
} from 'lucide-react';
import { JAMB_SUBJECTS } from '../lib/supabase';
import SubscriptionBadge from './SubscriptionBadge';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Practice', href: '/practice', icon: BookOpenIcon },
  { name: 'Pricing', href: '/pricing', icon: CreditCard },
  { name: 'Profile', href: '/profile', icon: UserIcon },
];

export default function Layout() {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar */}
      <div className={`md:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 flex z-40">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <XIcon className="h-6 w-6 text-white" />
              </button>
            </div>
            <SidebarContent
              navigation={navigation}
              location={location}
              profile={profile}
              onSignOut={handleSignOut}
            />
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <SidebarContent
            navigation={navigation}
            location={location}
            profile={profile}
            onSignOut={handleSignOut}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
          <button
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            onClick={() => setSidebarOpen(true)}
          >
            <MenuIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  navigation,
  location,
  profile,
  onSignOut
}: {
  navigation: any[];
  location: any;
  profile: any;
  onSignOut: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <img className="h-8 w-auto" src="/images/clean_pwa_progressive_web_app_icon_shopping_bag.jpg" alt="JAMB Coach" />
          <span className="ml-2 text-xl font-bold text-gray-900">JAMB Coach</span>
        </div>
        
        {/* User info */}
        <div className="mt-5 px-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white font-medium">
                  {profile?.full_name?.charAt(0) || 'U'}
                </span>
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">{profile?.full_name || 'User'}</p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">{profile?.role || 'Student'}</p>
                <SubscriptionBadge />
              </div>
            </div>
          </div>
        </div>

        <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  isActive
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
              >
                <item.icon
                  className={`${
                    isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  } mr-3 flex-shrink-0 h-6 w-6`}
                />
                {item.name}
              </Link>
            );
          })}
          
          {/* Subject navigation */}
          <div className="mt-6">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Subjects
            </h3>
            <div className="mt-1 space-y-1">
              {JAMB_SUBJECTS.map((subject) => {
                const href = `/subject/${encodeURIComponent(subject)}`;
                const isActive = location.pathname === href;
                return (
                  <Link
                    key={subject}
                    to={href}
                    className={`${
                      isActive
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    <BookOpenIcon className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400" />
                    {subject}
                  </Link>
                );
              })}
            </div>
          </div>
          
          {/* Admin link for admin users */}
          {profile?.role === 'admin' && (
            <div className="mt-6">
              <Link
                to="/admin"
                className={`${
                  location.pathname === '/admin'
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
              >
                <CogIcon className="mr-3 flex-shrink-0 h-6 w-6 text-gray-400" />
                Admin Panel
              </Link>
            </div>
          )}
        </nav>
      </div>
      
      {/* Sign out */}
      <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
        <button
          onClick={onSignOut}
          className="flex-shrink-0 w-full group block"
        >
          <div className="flex items-center">
            <LogOutIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                Sign Out
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}