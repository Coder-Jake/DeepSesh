import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface ProfilePopUpContextType {
  isPopUpOpen: boolean;
  targetUserId: string | null;
  targetUserName: string | null;
  popUpPosition: { x: number; y: number } | null;
  toggleProfilePopUp: (userId: string, userName: string, x: number, y: number) => void; // Renamed and modified
  closeProfilePopUp: () => void;
}

const ProfilePopUpContext = createContext<ProfilePopUpContextType | undefined>(undefined);

export const ProfilePopUpProvider = ({ children }: { children: ReactNode }) => {
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

  // Renamed from openProfilePopUp to toggleProfilePopUp
  const toggleProfilePopUp = useCallback((userId: string, userName: string, x: number, y: number) => {
    if (isPopUpOpen && targetUserId === userId) {
      // If the same user's pop-up is already open, close it.
      closeProfilePopUp();
    } else {
      // Otherwise, open it for the new user (or reopen if it was closed).
      setTargetUserId(userId);
      setTargetUserName(userName);
      setPopUpPosition({ x, y });
      setIsPopUpOpen(true);
    }
  }, [isPopUpOpen, targetUserId, closeProfilePopUp]); // Dependencies are crucial here

  return (
    <ProfilePopUpContext.Provider
      value={{
        isPopUpOpen,
        targetUserId,
        targetUserName,
        popUpPosition,
        toggleProfilePopUp, // Renamed
        closeProfilePopUp,
      }}
    >
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