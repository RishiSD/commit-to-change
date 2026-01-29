/**
 * Custom hook for managing Supabase authentication state.
 * 
 * This hook provides:
 * - Current user and session information
 * - Loading states during authentication
 * - Sign out functionality
 * - Access token for API calls
 * - Automatic session refresh
 * 
 * Usage:
 *   const { user, session, isLoading, signOut, getAccessToken } = useSupabaseAuth();
 */

"use client";

import { useState, useEffect } from "react";
import { User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

export interface UseSupabaseAuth {
  /** Current authenticated user (null if not authenticated) */
  user: User | null;
  
  /** Current session with access token (null if not authenticated) */
  session: Session | null;
  
  /** Whether authentication state is being determined */
  isLoading: boolean;
  
  /** Error during authentication (if any) */
  error: Error | null;
  
  /** Sign out the current user */
  signOut: () => Promise<void>;
  
  /** Get current access token for API calls */
  getAccessToken: () => string | null;
}

export function useSupabaseAuth(): UseSupabaseAuth {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        const { data: { session: initialSession }, error: sessionError } = 
          await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Error getting session:", sessionError);
          setError(sessionError);
          setSession(null);
          setUser(null);
        } else {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          setError(null);
        }
      } catch (err) {
        console.error("Error initializing auth:", err);
        setError(err as Error);
        setSession(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes (sign in, sign out, token refresh, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, currentSession: Session | null) => {
        console.log("Auth state changed:", event, currentSession?.user?.email);
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsLoading(false);
        
        // Handle different auth events
        switch (event) {
          case "SIGNED_IN":
            console.log("User signed in:", currentSession?.user?.email);
            break;
          case "SIGNED_OUT":
            console.log("User signed out");
            break;
          case "TOKEN_REFRESHED":
            console.log("Token refreshed");
            break;
          case "USER_UPDATED":
            console.log("User updated");
            break;
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Sign out the current user.
   * Clears session and redirects to login.
   */
  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error: signOutError } = await supabase.auth.signOut();
      
      if (signOutError) {
        console.error("Error signing out:", signOutError);
        setError(signOutError);
        throw signOutError;
      }
      
      // Clear local state
      setSession(null);
      setUser(null);
      setError(null);
      
      console.log("Successfully signed out");
    } catch (err) {
      console.error("Sign out failed:", err);
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get the current access token for API calls.
   * Returns null if not authenticated.
   */
  const getAccessToken = (): string | null => {
    return session?.access_token ?? null;
  };

  return {
    user,
    session,
    isLoading,
    error,
    signOut,
    getAccessToken,
  };
}
