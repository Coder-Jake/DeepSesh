"use client";

import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Index from '@/pages/Index';
import AppLayout from '@/layouts/AppLayout';
import Settings from '@/pages/Settings';
import Profile from '@/pages/Profile';
import ChipIn from '@/pages/ChipIn';
import Feedback from '@/pages/Feedback';
import UpcomingFeatures from '@/pages/UpcomingFeatures';
import Credits from '@/pages/Credits';
import Vibes from '@/pages/Vibes';
import NotFound from '@/pages/NotFound';
import { useTimer } from '@/contexts/TimerContext';
import { useProfile } from '@/contexts/ProfileContext';
import OnboardingLayout from '@/components/onboarding/OnboardingLayout';
import WelcomePage from '@/components/onboarding/WelcomePage';
import VisibilityPage from '@/components/onboarding/VisibilityPage';
import MockSessionSeeder from '@/components/MockSessionSeeder';
import { Session } from '@supabase/supabase-js'; // Import Session type

// NEW: Local storage key for onboarding status
const LOCAL_STORAGE_ONBOARDING_COMPLETE_KEY = 'deepsesh_onboarding_complete_local';

interface OnboardingWrapperProps {
  areToastsEnabled: boolean;
  session: Session | null; // Now accepts session as a prop
}

const OnboardingWrapper: React.FC<OnboardingWrapperProps> = ({ areToastsEnabled, session }) => {
  const { profile, loading: profileLoading } = useProfile();
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(LOCAL_STORAGE_ONBOARDING_COMPLETE_KEY) === 'true';
    }
    return false;
  });

  // Removed the useEffect that implicitly marked onboarding complete based on profile data.
  // Onboarding will now only be marked complete when handleOnboardingComplete is explicitly called.

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

export default OnboardingWrapper;