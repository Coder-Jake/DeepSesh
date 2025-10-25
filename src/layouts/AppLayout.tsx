import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom'; // Import useNavigate
import Header from '@/components/Header';
import ProfilePopUpCard from '@/components/ProfilePopUpCard';

const AppLayout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'p' || event.key === 'P') {
        navigate('/profile');
      } else if (event.key === 's' || event.key === 'S') {
        navigate('/settings');
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow">
        <Outlet />
      </div>
      <ProfilePopUpCard />
    </div>
  );
};

export default AppLayout;