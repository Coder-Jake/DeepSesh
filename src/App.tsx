"use client";

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import Index from './pages/Index';
import './index.css';
import AppLayout from './layouts/AppLayout';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import ChipIn from './pages/ChipIn';
import Feedback from './pages/Feedback';
import UpcomingFeatures from './pages/UpcomingFeatures';
import Credits from './pages/Credits';
import Vibes from './pages/Vibes';
import NotFound from './pages/NotFound';
import { AuthProvider, useAuth } from './contexts/AuthContext'; // Import useAuth
import { ThemeProvider } from './contexts/ThemeContext';
import { ProfilePopUpProvider } from './contexts/ProfilePopUpContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TimerProvider } from './contexts/TimerContext';
import { ProfileProvider } from './contexts/ProfileContext';
import OnboardingWrapper from './components/onboarding/OnboardingWrapper';
import MockSessionSeeder from './components/MockSessionSeeder';

const queryClient = new QueryClient();

function App() {
  const [areToastsEnabled, setAreToastsEnabled] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router future={{ v7_startTransition: true }}>
          <ThemeProvider>
            <AuthProvider>
              {/* useAuth must be called inside AuthProvider, so we get the session here */}
              <AuthConsumer
                areToastsEnabled={areToastsEnabled}
                setAreToastsEnabled={setAreToastsEnabled}
              />
            </AuthProvider>
          </ThemeProvider>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

// New component to consume AuthContext and render subsequent providers
const AuthConsumer: React.FC<{
  areToastsEnabled: boolean;
  setAreToastsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ areToastsEnabled, setAreToastsEnabled }) => {
  const { session } = useAuth(); // Now useAuth is called within AuthProvider's scope

  return (
    <ProfileProvider areToastsEnabled={areToastsEnabled} session={session}>
      <TimerProvider areToastsEnabled={areToastsEnabled} setAreToastsEnabled={setAreToastsEnabled}>
        <ProfilePopUpProvider>
          <MockSessionSeeder />
          <OnboardingWrapper areToastsEnabled={areToastsEnabled} session={session} />
        </ProfilePopUpProvider>
      </TimerProvider>
    </ProfileProvider>
  );
};

export default App;