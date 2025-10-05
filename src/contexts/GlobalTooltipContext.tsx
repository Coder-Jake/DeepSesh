import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface GlobalTooltipContextType {
  isShiftPressed: boolean;
  setIsShiftPressed: (pressed: boolean) => void;
  tooltipContent: string | null;
  tooltipPosition: { x: number; y: number } | null;
  isTooltipVisible: boolean;
  setTooltip: (content: string, x: number, y: number) => void;
  hideTooltip: () => void;
}

const GlobalTooltipContext = createContext<GlobalTooltipContextType | undefined>(undefined);

export const GlobalTooltipProvider = ({ children }: { children: ReactNode }) => {
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [tooltipContent, setTooltipContent] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  const setTooltip = useCallback((content: string, x: number, y: number) => {
    setTooltipContent(content);
    setTooltipPosition({ x, y });
    setIsTooltipVisible(true);
  }, []);

  const hideTooltip = useCallback(() => {
    setIsTooltipVisible(false);
    setTooltipContent(null);
    setTooltipPosition(null);
  }, []);

  return (
    <GlobalTooltipContext.Provider
      value={{
        isShiftPressed,
        setIsShiftPressed,
        tooltipContent,
        tooltipPosition,
        isTooltipVisible,
        setTooltip,
        hideTooltip,
      }}
    >
      {children}
    </GlobalTooltipContext.Provider>
  );
};

export const useGlobalTooltip = () => {
  const context = useContext(GlobalTooltipContext);
  if (context === undefined) {
    throw new Error('useGlobalTooltip must be used within a GlobalTooltipProvider');
  }
  return context;
};