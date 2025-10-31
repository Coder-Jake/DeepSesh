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
  const { user, loading, login } = useAuth();
  const { areToastsEnabled } = useTimer();

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');

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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      login(email.trim(), firstName.trim() || undefined);
    } else {
      if (areToastsEnabled) {
        toast.error("Login Failed", {
          description: "Please enter an email address.",
        });
      }
    }
  };

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
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name (optional)</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;