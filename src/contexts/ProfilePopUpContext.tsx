import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface ProfilePopUpContextType {
  isPopUpOpen: boolean;
  targetUserId: string | null;
  targetUserName: string | null;
  popUpPosition: { x: number; y: number } | null;
  openProfilePopUp: (userId: string, userName: string, x: number, y: number) => void;
  closeProfilePopUp: () => void;
}

const ProfilePopUpContext = createContext<ProfilePopUpContextType | undefined>(undefined);

export const ProfilePopUpProvider = ({ children }: { children: ReactNode }) => {
  const [isPopUpOpen, setIsPopUpOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [targetUserName, setTargetUserName] = useState<string | null>(null);
  const [popUpPosition, setPopUpPosition] = useState<{ x: number; y: number } | null>(null);

  const openProfilePopUp = useCallback((userId: string, userName: string, x: number, y: number) => {
    setTargetUserId(userId);
    setTargetUserName(userName);
    setPopUpPosition({ x, y });
    setIsPopUpOpen(true);
  }, []);

  const closeProfilePopUp = useCallback(() => {
    setIsPopUpOpen(false);
    setTargetUserId(null);
    setTargetUserName(null);
    setPopUpPosition(null);
  }, []);

  return (
    <ProfilePopUpContext.Provider
      value={{
        isPopUpOpen,
        targetUserId,
        targetUserName,
        popUpPosition,
        openProfilePopUp,
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