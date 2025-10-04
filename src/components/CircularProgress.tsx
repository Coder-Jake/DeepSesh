import { useEffect, useState, useRef } from "react";

interface CircularProgressProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0-100
  children?: React.ReactNode;
  onInteract?: (progress: number) => void;
  interactive?: boolean;
  className?: string;
  backgroundColor?: string; // New prop for background fill color
}

export const CircularProgress = ({
  size = 200,
  strokeWidth = 8,
  progress,
  children,
  onInteract,
  interactive = false,
  className = "",
  backgroundColor = "hsl(var(--background))" // Default to background color
}: CircularProgressProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!interactive) return;
    setIsDragging(true);
    handleMouseMove(e);
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
    angle = (angle + 450) % 360; // Normalize to 0-360 starting from top
    
    const newProgress = (angle / 360) * 100;
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
  }, [isDragging]);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className={`circular-progress-container transform -rotate-90 ${interactive ? 'cursor-pointer' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      >
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          fill={backgroundColor} // Use the new backgroundColor prop
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
            filter: `drop-shadow(0 0 4px hsl(var(--primary) / 0.2)) ${interactive ? 'drop-shadow(0 0 8px hsl(var(--primary) / 0.3))' : ''}` // Added subtle shadow, stronger for interactive
          }}
        />
        
        {/* Interactive handle */}
        {interactive && (
          <circle
            cx={size / 2 + radius * Math.cos((progress / 100) * 2 * Math.PI - Math.PI / 2)}
            cy={size / 2 + radius * Math.sin((progress / 100) * 2 * Math.PI - Math.PI / 2)}
            r={strokeWidth / 2 + 4} // Slightly larger
            fill="hsl(var(--primary))"
            stroke="hsl(var(--primary-foreground))" // Added a stroke
            strokeWidth={2} // Stroke width
            className="cursor-grab active:cursor-grabbing"
            style={{
              filter: 'drop-shadow(0 2px 6px hsl(var(--primary) / 0.6))' // Stronger shadow for handle
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