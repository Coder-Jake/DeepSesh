import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon } from 'lucide-react';

const Login = () => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!name.trim()) {
      toast.error("Name is required", {
        description: "Please enter your name to log in.",
      });
      setLoading(false);
      return;
    }

    // Use a dummy email for OTP login, passing the name in user_metadata
    const dummyEmail = `${name.toLowerCase().replace(/\s/g, '')}@demo.com`;

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: dummyEmail,
        options: {
          data: {
            first_name: name.trim(),
            // You could add last_name here if you want to parse it from the input
          },
        },
      });

      if (error) {
        throw error;
      }

      toast.success("Welcome to FlowSesh!", {
        description: `Logged in as ${name}.`,
      });
      navigate('/'); // Redirect to home after successful login
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error("Login failed", {
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <UserIcon className="mx-auto h-10 w-10 text-primary mb-2" />
          <CardTitle className="text-2xl font-bold">Demo Login</CardTitle>
          <p className="text-muted-foreground text-sm">Enter your name to start your session.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Log In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;