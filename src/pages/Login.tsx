import React, { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner'; // Changed to sonner toast
import { useTimer } from '@/contexts/TimerContext'; // NEW: Import useTimer

const Login = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { areToastsEnabled } = useTimer(); // NEW: Get areToastsEnabled

  useEffect(() => {
    if (!loading && user) {
      if (areToastsEnabled) { // NEW: Conditional toast
        toast.success("Logged in successfully!", {
          description: `Welcome back, ${user.email}.`,
        });
      }
      navigate('/');
    }
  }, [user, loading, navigate, areToastsEnabled]); // Added areToastsEnabled to dependencies

  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background pt-16 lg:pt-20">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center text-foreground">Welcome!</h1>
        <Auth
          supabaseClient={supabase}
          providers={[]}
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
          theme="light"
          redirectTo={window.location.origin + '/'}
          localization={{
            variables: {
              sign_in: {
                email_label: ' ',
                password_label: ' ',
                email_input_placeholder: 'Email',
                password_input_placeholder: 'Password',
              },
              sign_up: {
                email_label: ' ',
                password_label: ' ',
                email_input_placeholder: 'Email',
                password_input_placeholder: 'Password',
              },
              forgotten_password: {
                email_label: 'Email',
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default Login;