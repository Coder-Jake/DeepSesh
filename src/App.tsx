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
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProfilePopUpProvider } from './contexts/ProfilePopUpContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TimerProvider, useTimer } from './contexts/TimerContext';
import { ProfileProvider, useProfile } from './contexts/ProfileContext';
import OnboardingLayout from './components/onboarding/OnboardingLayout';
import WelcomePage from './components/onboarding/WelcomePage';
import VisibilityPage from './components/onboarding/VisibilityPage';
import MockSessionSeeder from './components/MockSessionSeeder'; // NEW: Import MockSessionSeeder

const queryClient = new QueryClient();

// NEW: Local storage key for onboarding status
const LOCAL_STORAGE_ONBOARDING_COMPLETE_KEY = 'deepsesh_onboarding_complete_local';

const OnboardingWrapper: React.FC = () => {
  const { profile, loading: profileLoading } = useProfile();
  const { areToastsEnabled } = useTimer();
  const { session } = useAuth(); // NEW: Get session from AuthContext
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(LOCAL_STORAGE_ONBOARDING_COMPLETE_KEY) === 'true';
    }
    return false;
  });

  useEffect(() => {
    // If profile is loaded and onboarding is not yet marked complete locally,
    // but the profile has a first name or join code, consider it implicitly onboarded.
    // This handles cases where a user might have an existing profile but no local onboarding flag.
    if (!profileLoading && profile && !isOnboardingComplete) {
      if (profile.first_name || profile.join_code) {
        setIsOnboardingComplete(true);
        localStorage.setItem(LOCAL_STORAGE_ONBOARDING_COMPLETE_KEY, 'true');
      }
    }
  }, [profile, profileLoading, isOnboardingComplete]);

  const handleOnboardingComplete = () => {
    // Update local state and local storage directly
    setIsOnboardingComplete(true);
    localStorage.setItem(LOCAL_STORAGE_ONBOARDING_COMPLETE_KEY, 'true');
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading application...
      </div>
    );
  }

  if (!isOnboardingComplete) {
    return (
      <OnboardingLayout onComplete={handleOnboardingComplete} totalSteps={2}>
        <WelcomePage areToastsEnabled={areToastsEnabled} />
        <VisibilityPage areToastsEnabled={areToastsEnabled} />
      </OnboardingLayout>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Index />} />
        <Route path="settings" element={<Settings />} />
        <Route path="profile" element={<Profile />} />
        <Route path="chip-in" element={<ChipIn />} />
        <Route path="feedback" element={<Feedback />} />
        <Route path="upcoming-features" element={<UpcomingFeatures />} />
        <Route path="credits" element={<Credits />} />
        <Route path="vibes" element={<Vibes />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};


function App() {
  const [areToastsEnabled, setAreToastsEnabled] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router>
          <ThemeProvider>
            <AuthProvider>
              <ProfileProvider areToastsEnabled={areToastsEnabled} session={useAuth().session}> {/* MODIFIED: Pass session from AuthProvider */}
                <TimerProvider areToastsEnabled={areToastsEnabled} setAreToastsEnabled={setAreToastsEnabled}>
                  <ProfilePopUpProvider>
                    <MockSessionSeeder /> {/* NEW: Render MockSessionSeeder here */}
                    <OnboardingWrapper />
                  </ProfilePopUpProvider>
                </TimerProvider>
              </ProfileProvider>
            </AuthProvider>
          </ThemeProvider>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;