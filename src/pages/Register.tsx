import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Register = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background pt-16 lg:pt-20">
      <Card className="w-full max-w-md p-8 space-y-6 text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-foreground">Register</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Registration is currently disabled as we've disconnected from our backend.
            Please use the local login for now.
          </p>
          <Button asChild>
            <Link to="/login">Go to Local Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;