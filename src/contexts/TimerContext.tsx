import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TimerContextType {
  focusMinutes: number;
  setFocusMinutes: (minutes: number) => void;
  breakMinutes: number;
  setBreakMinutes: (minutes: number) => void;
  hideSessionsDuringTimer: boolean;
  setHideSessionsDuringTimer: (hide: boolean) => void;
  timerIncrement: number; // New state for timer increments
  setTimerIncrement: (increment: number) => void; // Setter for timer increments
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider = ({ children }: { children: ReactNode }) => {
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [hideSessionsDuringTimer, setHideSessionsDuringTimer] = useState(false);
  const [timerIncrement, setTimerIncrement] = useState(5); // Default to 5-minute increments

  return (
    <TimerContext.Provider
      value={{
        focusMinutes,
        setFocusMinutes,
        breakMinutes,
        setBreakMinutes,
        hideSessionsDuringTimer,
        setHideSessionsDuringTimer,
        timerIncrement,
        setTimerIncrement,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};