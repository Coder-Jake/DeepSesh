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
  } else if (timerType === 'break') {
    backgroundFill = 'hsl(var(--break-background))';
  } else { // timerType === 'focus'
    // For focus, we use the gradient defined in SVG defs
    backgroundFill = 'url(#focusGradient)';
  }

  const progressStrokeColor = timerType === 'break' ? 'silver' : 'hsl(var(--primary))';

  // NEW: Determine which CSS variables to use for the gradient based on theme
  const focusGradientStartVar = isDarkMode ? 'var(--focus-gradient-start-dark)' : 'var(--focus-gradient-start-light)';
  const focusGradientEndVar = isDarkMode ? 'var(--focus-gradient-end-dark)' : 'var(--focus-gradient-end-light)';

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className={`circular-progress-container transform -rotate-90`}
      >
        <defs>
          {/* NEW: Define the linear gradient for focus periods */}
          <linearGradient id="focusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={`hsl(${focusGradientStartVar})`} />
            <stop offset="100%" stopColor={`hsl(${focusGradientEndVar})`} />
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
          stroke={progressStrokeColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-200 ease-out"
          style={{
            filter: `drop-shadow(0 0 4px ${timerType === 'break' ? 'rgba(192, 192, 192, 0.4)' : 'hsl(var(--primary) / 0.2)'})` // Added subtle shadow, adjusted for silver
          }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};