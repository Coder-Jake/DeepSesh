"use client";

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import Index from './pages/Index';
import './index.css';
import { TimerProvider } from './contexts/TimerContext';
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
import { ProfileProvider } from './contexts/ProfileContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProfilePopUpProvider } from './contexts/ProfilePopUpContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

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