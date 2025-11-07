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

        // Only set loading to false once the initial session is determined
        // For subsequent events, just update session/user
        if (event === 'INITIAL_SESSION') {
          setSession(currentSession);
          setUser(currentSession?.user || null);
          setLoading(false); 
        } else {
          setSession(currentSession);
          setUser(currentSession?.user || null);
        }
      }
    );

    // Fetch initial session directly as a fallback/immediate check.
    // The onAuthStateChange 'INITIAL_SESSION' event is the primary source of truth.
    // We only set loading to false here if onAuthStateChange hasn't already done it.
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (isMounted && loading) { // Only update if still loading and mounted
        setSession(initialSession);
        setUser(initialSession?.user || null);
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