import { useEffect, useState } from "react";

interface CircularProgressProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0-100
  children?: React.ReactNode;
  onInteract?: (progress: number) => void;
  interactive?: boolean;
  className?: string;
}

export const CircularProgress = ({
  size = 200,
  strokeWidth = 8,
  progress,
  children,
  onInteract,
  interactive = false,
  className = ""
}: CircularProgressProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!interactive) return;
    setIsDragging(true);
    // No need to call handleMouseMove here, it will be called by the global listener
  };

  const handleMouseMove = (e: React.MouseEvent | MouseEvent) => {
    if (!interactive || (!isDragging && e.type === 'mousemove')) return;
    
    const rect = (e.currentTarget as Element).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = e.clientX - centerX;
    const y = e.clientY - centerY;
    
    // Calculate angle from mouse position
    let angle = Math.atan2(y, x) * (180 / Math.PI);
    angle = (angle + 450) % 360; // Normalize to 0-360 starting from top (0 degrees at 12 o'clock)
    
    // Calculate radial distance from center
    const distance = Math.sqrt(x * x + y * y);
    
    // Calculate nominal radius (the radius of the progress circle)
    const nominalRadius = (size - strokeWidth) / 2;

    // Calculate radial adjustment to progress
    // A linear scaling factor: 100% progress change over the full radius range (from center to outer edge)
    // This means dragging from the center to the outer edge of the component (size/2)
    // or from the outer edge to the center will result in a significant change.
    // Let's make it less aggressive, e.g., 50% change over the full radius range.
    const radialSensitivity = 50 / (size / 2); // 50% change over size/2 pixels

    const radialAdjustment = (distance - nominalRadius) * radialSensitivity;

    // Calculate base progress from angle
    const angularProgress = (angle / 360) * 100;

    // Combine angular and radial progress, then clamp to 0-100
    let newProgress = angularProgress + radialAdjustment;
    newProgress = Math.max(0, Math.min(100, newProgress));

    onInteract?.(newProgress);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        const target = document.querySelector('.circular-progress-container');
        if (target) {
          handleMouseMove(e as any);
        }
      };
      
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, size, strokeWidth, onInteract]); // Added dependencies for useEffect

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className={`circular-progress-container transform -rotate-90 ${interactive ? 'cursor-pointer' : ''}`}
        onMouseDown={handleMouseDown}
        // onMouseMove is handled by global listener when dragging
      >
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-200 ease-out"
          style={{
            filter: interactive ? 'drop-shadow(0 0 8px hsl(var(--primary) / 0.3))' : undefined
          }}
        />
        
        {/* Interactive handle */}
        {interactive && (
          <circle
            // Position the handle based on the current 'progress' prop, which now includes radial adjustment
            cx={size / 2 + radius * Math.cos((progress / 100) * 2 * Math.PI - Math.PI / 2)}
            cy={size / 2 + radius * Math.sin((progress / 100) * 2 * Math.PI - Math.PI / 2)}
            r={strokeWidth / 2 + 2}
            fill="hsl(var(--primary))"
            className="cursor-grab active:cursor-grabbing"
            style={{
              filter: 'drop-shadow(0 2px 4px hsl(var(--primary) / 0.5))'
            }}
          />
        )}
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};