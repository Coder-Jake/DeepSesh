import { useEffect, useState, useRef } from "react";

interface CircularProgressProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0-100
  children?: React.ReactNode;
  className?: string;
  timerType?: 'focus' | 'break';
  isActiveTimer?: boolean;
  interactive?: boolean; // New prop to control interactivity
  onInteract?: (newProgress: number) => void; // Callback for interaction
}

export const CircularProgress = ({
  size = 200,
  strokeWidth = 8,
  progress,
  children,
  className = "",
  timerType = 'focus',
  isActiveTimer = false,
  interactive = false, // Default to non-interactive
  onInteract,
}: CircularProgressProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const backgroundColor = isActiveTimer
    ? (timerType === 'focus' ? 'hsl(var(--focus-background))' : 'hsl(var(--break-background))')
    : 'hsl(var(--neutral-background))';

  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleInteractionStart = (clientX: number, clientY: number) => {
    if (!interactive || !svgRef.current) return;
    setIsDragging(true);
    updateProgress(clientX, clientY);
  };

  const handleInteractionMove = (clientX: number, clientY: number) => {
    if (!interactive || !isDragging) return;
    updateProgress(clientX, clientY);
  };

  const handleInteractionEnd = () => {
    if (!interactive || !isDragging) return;
    setIsDragging(false);
  };

  const updateProgress = (clientX: number, clientY: number) => {
    if (!svgRef.current) return;

    const svgRect = svgRef.current.getBoundingClientRect();
    const centerX = svgRect.left + size / 2;
    const centerY = svgRect.top + size / 2;

    const angle = Math.atan2(clientY - centerY, clientX - centerX);
    let newProgress = (angle / (2 * Math.PI)) * 100 + 25; // Adjust for -90deg rotation and 0-100 scale
    if (newProgress < 0) newProgress += 100; // Ensure positive value

    onInteract?.(newProgress);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleInteractionMove(e.clientX, e.clientY);
    const handleMouseUp = () => handleInteractionEnd();
    const handleTouchMove = (e: TouchEvent) => handleInteractionMove(e.touches[0].clientX, e.touches[0].clientY);
    const handleTouchEnd = () => handleInteractionEnd();

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleTouchEnd);
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, interactive]);

  // Calculate position of the draggable handle
  const handleAngle = (progress - 25) * (2 * Math.PI / 100); // Adjust for -90deg rotation
  const handleX = size / 2 + radius * Math.cos(handleAngle);
  const handleY = size / 2 + radius * Math.sin(handleAngle);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        ref={svgRef}
        width={size}
        height={size}
        className={`circular-progress-container transform -rotate-90`}
        onMouseDown={(e) => handleInteractionStart(e.clientX, e.clientY)}
        onTouchStart={(e) => handleInteractionStart(e.touches[0].clientX, e.touches[0].clientY)}
      >
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          fill={backgroundColor}
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
            filter: `drop-shadow(0 0 4px hsl(var(--primary) / 0.2))`
          }}
        />

        {/* Draggable handle */}
        {interactive && (
          <circle
            cx={handleX}
            cy={handleY}
            r={strokeWidth * 1.2} // Slightly larger handle
            fill="hsl(var(--primary))"
            stroke="hsl(var(--background))"
            strokeWidth={strokeWidth / 2}
            className="cursor-grab active:cursor-grabbing transition-colors duration-100"
            style={{
              filter: `drop-shadow(0 0 4px hsl(var(--primary) / 0.4))`
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