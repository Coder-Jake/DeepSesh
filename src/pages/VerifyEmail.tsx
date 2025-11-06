import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const VerifyEmail = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/login');
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background pt-16 lg:pt-20">
      <p className="text-muted-foreground">Redirecting to login...</p>
    </div>
  );
};

export default VerifyEmail;