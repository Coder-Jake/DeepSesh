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
import AuthSessionWrapper from './components/AuthSessionWrapper'; // NEW: Import AuthSessionWrapper

const queryClient = new QueryClient();

// NEW: Local storage key for onboarding status
const LOCAL_STORAGE_ONBOARDING_COMPLETE_KEY = 'deepsesh_onboarding_complete_local';

// The OnboardingWrapper component has been moved to src/components/onboarding/OnboardingWrapper.tsx
// and is now rendered inside AuthSessionWrapper.

function App() {
  const [areToastsEnabled, setAreToastsEnabled] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router>
          <ThemeProvider>
            <AuthProvider>
              <TimerProvider areToastsEnabled={areToastsEnabled} setAreToastsEnabled={setAreToastsEnabled}>
                <ProfilePopUpProvider>
                  <MockSessionSeeder />
                  <AuthSessionWrapper areToastsEnabled={areToastsEnabled} /> {/* Use AuthSessionWrapper here */}
                </ProfilePopUpProvider>
              </TimerProvider>
            </AuthProvider>
          </ThemeProvider>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;