"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface ProfilePopUpContextType {
  isPopUpOpen: boolean; // Renamed for consistency
  targetUserId: string | null; // Renamed for consistency
  targetUserName: string | null; // Renamed for consistency
  popUpPosition: { x: number; y: number } | null; // Renamed for consistency
  toggleProfilePopUp: (id: string, name: string, x: number, y: number) => void;
  closeProfilePopUp: () => void; // Added dedicated close function
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
    // If the same profile is clicked AND it's currently open, close it.
    if (isPopUpOpen && targetUserId === id) {
      closeProfilePopUp();
    } else {
      // Otherwise, open it for the new (or different) profile
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