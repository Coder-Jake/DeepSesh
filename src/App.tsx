"use client";

import React from 'react';
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
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import NotFound from './pages/NotFound';
import { AuthProvider } from './contexts/AuthContext';
import { ProfileProvider } from './contexts/ProfileContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProfilePopUpProvider } from './contexts/ProfilePopUpContext';

function App() {
  return (
    <TooltipProvider>
      <Router>
        <ThemeProvider>
          <AuthProvider>
            <TimerProvider> {/* TimerProvider now wraps ProfileProvider */}
              <ProfileProvider>
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
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </ProfilePopUpProvider>
              </ProfileProvider>
            </TimerProvider>
          </AuthProvider>
        </ThemeProvider>
      </Router>
    </TooltipProvider>
  );
}

export default App;