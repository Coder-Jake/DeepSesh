"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ProfilePopUpContextType {
  isProfilePopUpOpen: boolean;
  currentProfileId: string | null;
  currentProfileName: string | null;
  position: { x: number; y: number } | null;
  toggleProfilePopUp: (id: string, name: string, x: number, y: number) => void;
}

const ProfilePopUpContext = createContext<ProfilePopUpContextType | undefined>(undefined);

export const ProfilePopUpProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isProfilePopUpOpen, setIsProfilePopUpOpen] = useState(false);
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [currentProfileName, setCurrentProfileName] = useState<string | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  const toggleProfilePopUp = (id: string, name: string, x: number, y: number) => {
    // If the same profile is clicked AND it's currently open, close it.
    if (isProfilePopUpOpen && currentProfileId === id) {
      setIsProfilePopUpOpen(false);
      setCurrentProfileId(null); // Clear the ID when closing
      setCurrentProfileName(null);
      setPosition(null);
    } else {
      // Otherwise, open it for the new (or different) profile
      setIsProfilePopUpOpen(true);
      setCurrentProfileId(id); // Set the ID when opening
      setCurrentProfileName(name);
      setPosition({ x, y });
    }
  };

  return (
    <ProfilePopUpContext.Provider value={{
      isProfilePopUpOpen,
      currentProfileId,
      currentProfileName,
      position,
      toggleProfilePopUp,
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