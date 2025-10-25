import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import ProfilePopUpCard from '@/components/ProfilePopUpCard'; // NEW: Import ProfilePopUpCard

const AppLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow">
        <Outlet />
      </div>
      <ProfilePopUpCard /> {/* NEW: Render ProfilePopUpCard here */}
    </div>
  );
};

export default AppLayout;