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
import { TimerProvider } from './contexts/TimerContext';
import { ProfileProvider, useProfile } from './contexts/ProfileContext'; // Import useProfile
import OnboardingLayout from './components/onboarding/OnboardingLayout'; // NEW
import WelcomePage from './components/onboarding/WelcomePage'; // NEW
import VisibilityPage from './components/onboarding/VisibilityPage'; // NEW

const queryClient = new QueryClient();

// NEW: OnboardingWrapper component to handle conditional rendering
const OnboardingWrapper: React.FC = () => {
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const { areToastsEnabled } = useTimer(); // MODIFIED: Get areToastsEnabled from TimerContext
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  useEffect(() => {
    if (!profileLoading && profile) {
      setIsOnboardingComplete(profile.onboarding_complete || false);
    }
  }, [profile, profileLoading]);

  const handleOnboardingComplete = async () => {
    if (profile) {
      await updateProfile({ onboarding_complete: true }, "Onboarding complete!");
      setIsOnboardingComplete(true);
    }
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
        <WelcomePage areToastsEnabled={areToastsEnabled} /> {/* MODIFIED: Pass areToastsEnabled */}
        <VisibilityPage areToastsEnabled={areToastsEnabled} /> {/* MODIFIED: Pass areToastsEnabled */}
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
              <ProfileProvider areToastsEnabled={areToastsEnabled}>
                <TimerProvider areToastsEnabled={areToastsEnabled} setAreToastsEnabled={setAreToastsEnabled}>
                  <ProfilePopUpProvider>
                    <OnboardingWrapper /> {/* NEW: Render OnboardingWrapper */}
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