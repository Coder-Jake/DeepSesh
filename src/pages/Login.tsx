import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useTimer } from '@/contexts/TimerContext';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client'; // Import Supabase client
import { useTheme } from '@/contexts/ThemeContext'; // NEW: Import useTheme

const Login = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { areToastsEnabled } = useTimer();
  const { isDarkMode } = useTheme(); // NEW: Get isDarkMode from ThemeContext

  useEffect(() => {
    if (!loading && user) {
      if (areToastsEnabled) {
        toast.success("Logged in successfully!", {
          description: `Welcome back, ${user.user_metadata.first_name || user.email}.`,
        });
      }
      navigate('/');
    }
  }, [user, loading, navigate, areToastsEnabled]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background pt-16 lg:pt-20">
      <div className="w-full max-w-md p-8 space-y-6">
        <Auth
          supabaseClient={supabase}
          providers={[]} // You can add 'google', 'github', etc. here if configured in Supabase
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(var(--primary))',
                  brandAccent: 'hsl(var(--primary-foreground))',
                },
              },
            },
          }}
          theme={isDarkMode ? "dark" : "light"} // MODIFIED: Make theme dynamic based on isDarkMode
          redirectTo={window.location.origin + '/'}
        />
      </div>
    </div>
  );
};

export default Login;