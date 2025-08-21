import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

// Simple profile interface - only essential fields
interface SimpleProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: 'student' | 'admin';
}

interface AuthContextType {
  user: User | null;
  profile: SimpleProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<SimpleProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Simple function to get user profile
  const getSimpleProfile = async (userId: string): Promise<SimpleProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, email, full_name, role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
      return null;
    }
  };

  // Load user on mount - SIMPLE VERSION
  useEffect(() => {
    let isMounted = true;
    
    async function loadUser() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (!isMounted) return;
        
        if (error || !user) {
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        setUser(user);
        
        // Try to get profile but don't block if it fails
        const userProfile = await getSimpleProfile(user.id);
        if (isMounted) {
          setProfile(userProfile);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        if (isMounted) {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    }
    
    loadUser();

    // Simple auth listener - NO ASYNC OPERATIONS
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        // Only update user state, handle profile loading separately
        setUser(session?.user || null);
        
        if (!session?.user) {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Load profile when user changes (separate from auth state change)
  useEffect(() => {
    let isMounted = true;
    
    if (user && !profile) {
      getSimpleProfile(user.id).then(userProfile => {
        if (isMounted) {
          setProfile(userProfile);
        }
      });
    }
    
    return () => {
      isMounted = false;
    };
  }, [user, profile]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (error) throw error;
      
      // User state will be updated by auth listener
      toast.success('Successfully signed in!');
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast.error(error.message || 'Invalid email or password');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    setLoading(true);
    try {
      // Simple signup - NO EMAIL VERIFICATION
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: undefined, // Remove email redirect
          data: {
            full_name: fullName.trim()
          }
        }
      });

      if (error) throw error;
      
      if (data.user) {
        // Create profile immediately
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: data.user.id,
            email: data.user.email!,
            full_name: fullName.trim(),
            role: 'student'
          });
        
        if (profileError) {
          console.error('Profile creation error:', profileError);
        }

        // For unconfirmed accounts, automatically confirm them via admin API
        if (!data.user.email_confirmed_at) {
          try {
            // Auto-confirm the user account using Supabase edge function
            const response = await supabase.functions.invoke('confirm-user', {
              body: { userId: data.user.id }
            });
            
            if (response.error) {
              console.warn('Could not auto-confirm user, but registration succeeded:', response.error);
            }
          } catch (confirmError) {
            console.warn('Auto-confirmation failed, but registration succeeded:', confirmError);
          }
        }
      }

      toast.success('Account created successfully!');
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast.error(error.message || 'Failed to create account');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear state
      setUser(null);
      setProfile(null);
      
      toast.success('Successfully signed out!');
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signIn,
      signUp,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}