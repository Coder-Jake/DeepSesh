"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import OnboardingWrapper from '@/components/onboarding/OnboardingWrapper'; // Corrected import path
import { useTimer } from '@/contexts/TimerContext';
import { ProfileProvider } from '@/contexts/ProfileContext';

interface AuthSessionWrapperProps {
  areToastsEnabled: boolean;
}

const AuthSessionWrapper: React.FC<AuthSessionWrapperProps> = ({ areToastsEnabled }) => {
  const { session } = useAuth();

  return (
    <ProfileProvider areToastsEnabled={areToastsEnabled} session={session}>
      <OnboardingWrapper areToastsEnabled={areToastsEnabled} session={session} />
    </ProfileProvider>
  );
};

export default AuthSessionWrapper;