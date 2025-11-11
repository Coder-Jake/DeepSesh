import { useEffect, useState, useRef } from "react";
import { useTheme } from '@/contexts/ThemeContext'; // NEW: Import useTheme

interface CircularProgressProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0-100
  children?: React.ReactNode;
  className?: string;
  timerType?: 'focus' | 'break'; // New prop
  isActiveTimer?: boolean; // New prop
}

export const CircularProgress = ({
  size = 200,
  strokeWidth = 8,
  progress,
  children,
  className = "",
  timerType = 'focus', // Default to focus
  isActiveTimer = false, // Default to false
}: CircularProgressProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const { isDarkMode } = useTheme(); // NEW: Get dark mode status

  // Determine the background fill for the circle
  let backgroundFill: string;
  if (!isActiveTimer) {
    backgroundFill = 'hsl(var(--neutral-background))';
  } else {
    if (timerType === 'focus') {
      backgroundFill = isDarkMode 
        ? 'linear-gradient(to bottom right, hsl(var(--focus-gradient-start-dark)), hsl(var(--focus-gradient-end-dark)))'
        : 'linear-gradient(to bottom right, hsl(var(--focus-gradient-start-light)), hsl(var(--focus-gradient-end-light)))';
    } else { // timerType === 'break'
      backgroundFill = isDarkMode 
        ? 'linear-gradient(to bottom right, hsl(var(--break-gradient-start-dark)), hsl(var(--break-gradient-end-dark)))'
        : 'linear-gradient(to bottom right, hsl(var(--break-gradient-start-light)), hsl(var(--break-gradient-end-light)))';
    }
  }

  // Progress stroke color will always be the foreground color for consistency
  const progressStrokeColor = 'hsl(var(--foreground))';

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className={`circular-progress-container transform -rotate-90`}
      >
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          fill={isActiveTimer ? 'url(#gradientFill)' : backgroundFill} // Use gradientFill for active timer
        />
        
        {/* Define gradient for active timer background */}
        {isActiveTimer && (
          <defs>
            <linearGradient id="gradientFill" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isDarkMode ? (timerType === 'focus' ? 'hsl(var(--focus-gradient-start-dark))' : 'hsl(var(--break-gradient-start-dark))') : (timerType === 'focus' ? 'hsl(var(--focus-gradient-start-light))' : 'hsl(var(--break-gradient-start-light))')} />
              <stop offset="100%" stopColor={isDarkMode ? (timerType === 'focus' ? 'hsl(var(--focus-gradient-end-dark))' : 'hsl(var(--break-gradient-end-dark))') : (timerType === 'focus' ? 'hsl(var(--focus-gradient-end-light))' : 'hsl(var(--break-gradient-end-light))')} />
            </linearGradient>
          </defs>
        )}

        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressStrokeColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-200 ease-out"
          // Removed the filter drop-shadow as it was tied to the old coloring
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};