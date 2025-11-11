import React from "react";
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface CircularProgressProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0-100
  children?: React.ReactNode;
  className?: string;
  timerType?: 'focus' | 'break';
  isActiveTimer?: boolean;
}

export const CircularProgress = ({
  size = 200,
  strokeWidth = 8,
  progress,
  children,
  className = "",
  timerType = 'focus',
  isActiveTimer = false,
}: CircularProgressProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const { isDarkMode } = useTheme();

  // Determine the background color for the outer div
  let backgroundColor: string;
  if (!isActiveTimer) {
    backgroundColor = 'hsl(var(--neutral-background))';
  } else {
    if (timerType === 'focus') {
      backgroundColor = isDarkMode
        ? 'hsl(var(--focus-background-solid-dark))'
        : 'hsl(var(--focus-background-solid-light))';
    } else { // timerType === 'break'
      backgroundColor = isDarkMode
        ? 'hsl(var(--break-background-solid-dark))'
        : 'hsl(var(--break-background-solid-light))';
    }
  }

  const progressStrokeColor = 'hsl(var(--foreground))';

  return (
    <div
      className={cn(
        `relative inline-flex items-center justify-center rounded-full overflow-hidden`,
        className
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: backgroundColor,
        transition: 'background-color 1s ease-in-out', // Add the transition here
      }}
    >
      <svg
        width={size}
        height={size}
        className={`circular-progress-container transform -rotate-90 absolute`}
      >
        {/* Background ring - now transparent, relying on parent div's background */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          fill="transparent" // Make SVG background transparent
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
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};