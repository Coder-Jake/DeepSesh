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

  // Determine the progress stroke color based on timerType and theme
  let progressStrokeColor: string;
  if (timerType === 'focus') {
    progressStrokeColor = isDarkMode
      ? `url(#focus-gradient-dark)`
      : `url(#focus-gradient-light)`;
  } else { // timerType === 'break'
    progressStrokeColor = isDarkMode
      ? `url(#break-gradient-dark)`
      : `url(#break-gradient-light)`;
  }

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className={`circular-progress-container transform -rotate-90`}
      >
        <defs>
          {/* Focus Gradient - Light Mode */}
          <linearGradient id="focus-gradient-light" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--focus-gradient-start-light))" />
            <stop offset="100%" stopColor="hsl(var(--focus-gradient-end-light))" />
          </linearGradient>
          {/* Focus Gradient - Dark Mode */}
          <linearGradient id="focus-gradient-dark" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--focus-gradient-start-dark))" />
            <stop offset="100%" stopColor="hsl(var(--focus-gradient-end-dark))" />
          </linearGradient>
          {/* Break Gradient - Light Mode */}
          <linearGradient id="break-gradient-light" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--break-gradient-start-light))" />
            <stop offset="100%" stopColor="hsl(var(--break-gradient-end-light))" />
          </linearGradient>
          {/* Break Gradient - Dark Mode */}
          <linearGradient id="break-gradient-dark" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--break-gradient-start-dark))" />
            <stop offset="100%" stopColor="hsl(var(--break-gradient-end-dark))" />
          </linearGradient>
        </defs>

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
          stroke={progressStrokeColor} // Use gradient URL
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