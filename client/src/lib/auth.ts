// Authentication utilities for Supabase
import { getSupabase } from './supabase';
import { User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Sign up new user
export async function signUp(email: string, password: string): Promise<{ 
  success: boolean; 
  user?: AuthUser; 
  error?: any 
}> {
  try {
    // Get the initialized Supabase instance
    const supabase = await getSupabase();
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      console.error('Sign up error:', error);
      return { success: false, error };
    }

    if (data?.user) {
      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email || email
      };
      return { success: true, user: authUser };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error during sign up:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Sign in existing user
export async function signIn(email: string, password: string): Promise<{ 
  success: boolean; 
  user?: AuthUser; 
  error?: any 
}> {
  try {
    // Get the initialized Supabase instance
    const supabase = await getSupabase();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Sign in error:', error);
      return { success: false, error };
    }

    if (data?.user) {
      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email || email
      };
      return { success: true, user: authUser };
    }

    return { success: false, error: 'No user returned after login' };
  } catch (error) {
    console.error('Unexpected error during sign in:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Sign out user
export async function signOut(): Promise<{ success: boolean; error?: any }> {
  try {
    // Get the initialized Supabase instance
    const supabase = await getSupabase();
    
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Sign out error:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error during sign out:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Get current user
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    // Get the initialized Supabase instance
    const supabase = await getSupabase();
    
    const { data, error } = await supabase.auth.getUser();
    
    if (error || !data?.user) {
      return null;
    }

    return {
      id: data.user.id,
      email: data.user.email || ''
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Listen for auth state changes
export async function onAuthStateChanged(callback: (user: AuthUser | null) => void) {
  try {
    // Get the initialized Supabase instance
    const supabase = await getSupabase();
    
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        callback({
          id: session.user.id,
          email: session.user.email || ''
        });
      } else if (event === 'SIGNED_OUT') {
        callback(null);
      }
    });

    return data.subscription;
  } catch (error) {
    console.error('Error setting up auth state change listener:', error);
    // Return a dummy subscription
    return { unsubscribe: () => {} };
  }
}