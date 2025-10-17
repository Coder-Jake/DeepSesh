import React, { createContext, useContext, ReactNode } from 'react';

interface ToastSettingsContextType {
  areToastsEnabled: boolean;
}

const ToastSettingsContext = createContext<ToastSettingsContextType | undefined>(undefined);

export const ToastSettingsProvider = ({ children, areToastsEnabled }: { children: ReactNode; areToastsEnabled: boolean }) => {
  return (
    <ToastSettingsContext.Provider value={{ areToastsEnabled }}>
      {children}
    </ToastSettingsContext.Provider>
  );
};

export const useToastSettings = () => {
  const context = useContext(ToastSettingsContext);
  if (context === undefined) {
    throw new Error('useToastSettings must be used within a ToastSettingsProvider');
  }
  return context;
};