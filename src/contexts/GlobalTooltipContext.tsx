import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';

interface GlobalTooltipContextType {
  isShiftPressed: boolean;
  setIsShiftPressed: (pressed: boolean) => void;
  tooltipContent: string | React.ReactNode | null; // Allow ReactNode for content
  tooltipPosition: { x: number; y: number } | null;
  isTooltipVisible: boolean;
  setTooltip: (content: string | React.ReactNode, x: number, y: number) => void; // Allow ReactNode
  hideTooltip: () => void;
  isLongPressActive: boolean; // NEW
  setIsLongPressActive: (active: boolean) => void; // NEW
  longPressTargetRef: React.MutableRefObject<HTMLElement | null>; // NEW
  longPressTimerRef: React.MutableRefObject<NodeJS.Timeout | null>; // NEW
}

const GlobalTooltipContext = createContext<GlobalTooltipContextType | undefined>(undefined);

export const GlobalTooltipProvider = ({ children }: { children: ReactNode }) => {
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [tooltipContent, setTooltipContent] = useState<string | React.ReactNode | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [isLongPressActive, setIsLongPressActive] = useState(false); // NEW
  const longPressTargetRef = useRef<HTMLElement | null>(null); // NEW
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null); // NEW

  const setTooltip = useCallback((content: string | React.ReactNode, x: number, y: number) => {
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
        isLongPressActive, // NEW
        setIsLongPressActive, // NEW
        longPressTargetRef, // NEW
        longPressTimerRef, // NEW
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