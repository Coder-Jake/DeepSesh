import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

const Login = () => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name to continue.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      // Get or generate a unique ID for the guest user
      let guestId = localStorage.getItem('guest_user_id');
      if (!guestId) {
        guestId = uuidv4();
        localStorage.setItem('guest_user_id', guestId);
      }

      // Use a dummy email and password for Supabase authentication
      const dummyEmail = `guest-${guestId}@flows.sh`;
      const dummyPassword = `password-${guestId}`; // A simple generated password

      // Try to sign up the user first
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: dummyEmail,
        password: dummyPassword,
        options: {
          data: {
            first_name: name.trim(),
          },
        },
      });

      if (signUpError && signUpError.message !== 'User already registered') {
        throw signUpError;
      }

      // If signup was successful or user already registered, sign them in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: dummyEmail,
        password: dummyPassword,
      });

      if (signInError) {
        throw signInError;
      }

      toast({
        title: "Welcome!",
        description: `You are now logged in as ${name.trim()}.`,
      });

    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to DeepSesh</CardTitle>
          <p className="text-muted-foreground mt-2">Enter your name to get started</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Alice Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;