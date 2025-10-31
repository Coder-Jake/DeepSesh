"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface ProfilePopUpContextType {
  isPopUpOpen: boolean;
  targetUserId: string | null;
  targetUserName: string | null;
  popUpPosition: { x: number; y: number } | null;
  toggleProfilePopUp: (id: string, name: string, x: number, y: number) => void;
  closeProfilePopUp: () => void;
}

const ProfilePopUpContext = createContext<ProfilePopUpContextType | undefined>(undefined);

export const ProfilePopUpProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isPopUpOpen, setIsPopUpOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [targetUserName, setTargetUserName] = useState<string | null>(null);
  const [popUpPosition, setPopUpPosition] = useState<{ x: number; y: number } | null>(null);

  const closeProfilePopUp = useCallback(() => {
    setIsPopUpOpen(false);
    setTargetUserId(null);
    setTargetUserName(null);
    setPopUpPosition(null);
  }, []);

  const toggleProfilePopUp = useCallback((id: string, name: string, x: number, y: number) => {
    if (isPopUpOpen && targetUserId === id) {
      // Clicked the same profile, close it
      closeProfilePopUp();
    } else if (isPopUpOpen && targetUserId !== id) {
      // Clicked a different profile while one is open
      // Close the current one first to trigger the closing animation
      closeProfilePopUp(); 
      // Then, after a short delay, open the new one
      setTimeout(() => {
        setIsPopUpOpen(true);
        setTargetUserId(id);
        setTargetUserName(name);
        setPopUpPosition({ x, y });
      }, 100); // 100ms delay to allow closing animation to start
    } else {
      // No profile is open, open the new one
      setIsPopUpOpen(true);
      setTargetUserId(id);
      setTargetUserName(name);
      setPopUpPosition({ x, y });
    }
  }, [isPopUpOpen, targetUserId, closeProfilePopUp]);

  return (
    <ProfilePopUpContext.Provider value={{
      isPopUpOpen,
      targetUserId,
      targetUserName,
      popUpPosition,
      toggleProfilePopUp,
      closeProfilePopUp,
    }}>
      {children}
    </ProfilePopUpContext.Provider>
  );
};

export const useProfilePopUp = () => {
  const context = useContext(ProfilePopUpContext);
  if (context === undefined) {
    throw new Error('useProfilePopUp must be used within a ProfilePopUpProvider');
  }
  return context;
};