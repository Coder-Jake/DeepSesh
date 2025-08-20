import { useEffect, useState, useRef, useCallback } from "react";

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
  const svgRef = useRef<SVGSVGElement>(null);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Calculate handle position
  const handleAngle = (progress / 100) * 2 * Math.PI - Math.PI / 2; // Angle in radians, starting from top (12 o'clock)
  const handleX = size / 2 + radius * Math.cos(handleAngle);
  const handleY = size / 2 + radius * Math.sin(handleAngle);

  const calculateProgress = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const x = clientX - centerX;
    const y = clientY - centerY;

    let angle = Math.atan2(y, x); // radians from -PI to PI
    
    // Adjust angle to be 0 at 12 o'clock and increase clockwise (0 to 2*PI)
    angle = (angle + 2 * Math.PI + Math.PI / 2) % (2 * Math.PI);
    
    const newProgress = (angle / (2 * Math.PI)) * 100;
    onInteract?.(newProgress);
  }, [onInteract]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!interactive) return;
    setIsDragging(true);
    calculateProgress(e.clientX, e.clientY); // Set initial position on click
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        calculateProgress(e.clientX, e.clientY);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, calculateProgress]);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        ref={svgRef}
        className={`circular-progress-container transform -rotate-90 ${interactive ? 'cursor-pointer' : ''}`}
        onMouseDown={handleMouseDown}
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
            cx={handleX}
            cy={handleY}
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