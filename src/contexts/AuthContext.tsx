import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client'; // Import Supabase client

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates on unmounted component

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;

        if (event === 'INITIAL_SESSION' || event === 'SIGNED_OUT') {
          if (!currentSession) {
            // If no session, try to sign in anonymously
            const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
            if (anonError) {
              console.error("Error signing in anonymously:", anonError);
              // Fallback to no user if anonymous sign-in fails
              setSession(null);
              setUser(null);
            } else {
              setSession(anonData.session);
              setUser(anonData.user);
            }
          } else {
            setSession(currentSession);
            setUser(currentSession.user);
          }
          setLoading(false); // Set loading to false after initial session or anonymous sign-in attempt
        } else {
          // For other events (SIGNED_IN, USER_UPDATED, etc.), just update session/user
          setSession(currentSession);
          setUser(currentSession?.user || null);
        }
      }
    );

    // Initial check for session to handle cases where onAuthStateChange might be delayed
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (isMounted && loading) { // Only update if still loading and mounted
        if (!initialSession) {
          // If no initial session, attempt anonymous sign-in
          const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
          if (anonError) {
            console.error("Error during initial anonymous sign-in:", anonError);
            setSession(null);
            setUser(null);
          } else {
            setSession(anonData.session);
            setUser(anonData.user);
          }
        } else {
          setSession(initialSession);
          setUser(initialSession.user);
        }
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};