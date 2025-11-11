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
    backgroundFill = 'hsl(var(--card))'; // Always use card background when active
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
          fill={backgroundFill} // Use conditional fill
        />
        
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