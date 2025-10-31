import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useTimer } from '@/contexts/TimerContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Login = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth(); // MODIFIED: Removed login
  const { areToastsEnabled } = useTimer();

  // Removed email and firstName states as they are no longer needed for explicit login
  // Removed handleLogin function as it is no longer needed

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

  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background pt-16 lg:pt-20">
      <Card className="w-full max-w-md p-8 space-y-6 text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-foreground">Welcome!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            You are automatically logged in with a local user profile.
            You can customize your profile in the settings.
          </p>
          <Button onClick={() => navigate('/')} className="w-full">
            Go to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;