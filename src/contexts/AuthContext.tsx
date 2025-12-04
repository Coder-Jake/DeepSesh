import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client'; // Import Supabase client

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  previousUserId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const previousUserIdRef = useRef<string | null>(null); // Ref to store the user ID before a change

  useEffect(() => {
    let isMounted = true;

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;

        const oldUserId = previousUserIdRef.current;
        const newUserId = currentSession?.user?.id || null;

        if (event === 'INITIAL_SESSION' || event === 'SIGNED_OUT') {
          if (!currentSession) {
            const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
            if (anonError) {
              console.error("Error signing in anonymously:", anonError);
              setSession(null);
              setUser(null);
            } else {
              setSession(anonData.session);
              setUser(anonData.user);
              previousUserIdRef.current = anonData.user?.id || null; // Update ref
            }
          } else {
            setSession(currentSession);
            setUser(currentSession.user);
            previousUserIdRef.current = currentSession.user?.id || null; // Update ref
          }
          setLoading(false);
        } else {
          setSession(currentSession);
          setUser(currentSession?.user || null);

          // Handle user ID change (e.g., anonymous to authenticated)
          if (event === 'SIGNED_IN' && oldUserId && newUserId && oldUserId !== newUserId) {
            console.log(`AuthContext: User ID changed from ${oldUserId} to ${newUserId}. Invoking migration.`);
            try {
              const response = await supabase.functions.invoke('migrate-session-host', {
                body: JSON.stringify({ oldUserId, newUserId }),
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${currentSession.access_token}`, // Use new session token
                },
              });

              if (response.error) throw response.error;
              if (response.data.error) throw new Error(response.data.error);
              console.log("AuthContext: Session host migration successful:", response.data.message);
            } catch (error: any) {
              console.error("AuthContext: Error invoking migrate-session-host Edge Function:", error);
              // Optionally show a toast here, but it might be too early in the app load
            }
          }
          previousUserIdRef.current = newUserId; // Update ref after potential migration
        }
      }
    );

    // Initial check for session
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (isMounted && loading) {
        const oldUserId = previousUserIdRef.current; // Should be null initially
        const newUserId = initialSession?.user?.id || null;

        if (!initialSession) {
          const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
          if (anonError) {
            console.error("Error during initial anonymous sign-in:", anonError);
            setSession(null);
            setUser(null);
          } else {
            setSession(anonData.session);
            setUser(anonData.user);
            previousUserIdRef.current = anonData.user?.id || null;
          }
        } else {
          setSession(initialSession);
          setUser(initialSession.user);
          previousUserIdRef.current = initialSession.user?.id || null;
        }
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    previousUserId: previousUserIdRef.current, // Expose for debugging if needed
  }), [user, session, loading]);

  return (
    <AuthContext.Provider value={value}>
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