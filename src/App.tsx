"use client";

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import Index from './pages/Index';
import './index.css';
import { TimerProvider } from './contexts/TimerContext'; // Import TimerProvider
import AppLayout from './layouts/AppLayout'; // Import AppLayout
import Settings from './pages/Settings'; // Import Settings
import Profile from './pages/Profile'; // Import Profile
import ChipIn from './pages/ChipIn'; // Import ChipIn
import Feedback from './pages/Feedback'; // Import Feedback
import UpcomingFeatures from './pages/UpcomingFeatures'; // Import UpcomingFeatures
import Credits from './pages/Credits'; // Import Credits
import Vibes from './pages/Vibes'; // Import Vibes
import Login from './pages/Login'; // Import Login
import Register from './pages/Register'; // Import Register
import ForgotPassword from './pages/ForgotPassword'; // Import ForgotPassword
import ResetPassword from './pages/ResetPassword'; // Import ResetPassword
import VerifyEmail from './pages/VerifyEmail'; // Import VerifyEmail
import NotFound from './pages/NotFound'; // Import NotFound
import { AuthProvider } from './contexts/AuthContext'; // Import AuthProvider
import { ProfileProvider } from './contexts/ProfileContext'; // Import ProfileProvider
import { ThemeProvider } from './contexts/ThemeContext'; // Import ThemeProvider
import { ProfilePopUpProvider } from './contexts/ProfilePopUpContext'; // Import ProfilePopUpProvider

function App() {
  return (
    <TooltipProvider>
      <Router>
        <ThemeProvider>
          <AuthProvider>
            <ProfileProvider>
              <TimerProvider>
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
              </TimerProvider>
            </ProfileProvider>
          </AuthProvider>
        </ThemeProvider>
      </Router>
    </TooltipProvider>
  );
}

export default App;