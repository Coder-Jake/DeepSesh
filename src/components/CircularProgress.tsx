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
  progress: initialProgress, // Rename prop to avoid conflict with internal state
  children,
  onInteract,
  interactive = false,
  className = ""
}: CircularProgressProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(initialProgress);
  const lastAngleRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null); // Ref for the container to get its position

  // Update internal progress when initialProgress prop changes (e.g., from parent)
  useEffect(() => {
    setCurrentProgress(initialProgress);
  }, [initialProgress]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (currentProgress / 100) * circumference;

  const getAngleAndRadius = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return { angle: 0, r: 0 };

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = e.clientX - centerX;
    const y = e.clientY - centerY;
    
    let angle = Math.atan2(y, x) * (180 / Math.PI);
    angle = (angle + 450) % 360; // Normalize to 0-360 starting from top (0 at 12 o'clock, clockwise)
    
    const r = Math.sqrt(x*x + y*y); // Radial distance from center
    return { angle, r };
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    lastAngleRef.current = null;
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!interactive || !isDragging) return;
    
    const { angle: currentAngle, r } = getAngleAndRadius(e);

    if (lastAngleRef.current !== null) {
      let deltaAngle = currentAngle - lastAngleRef.current;

      // Handle wrap-around (e.g., moving from 350 to 10 degrees)
      if (deltaAngle > 180) deltaAngle -= 360;
      if (deltaAngle < -180) deltaAngle += 360;

      // Calculate sensitivity based on radial distance
      const baseSensitivity = 0.2; // How much progress changes per degree of angle
      let radialFactor = 1;
      const maxRadialDistanceForEffect = size / 2; // Max distance from center to consider for radial effect

      if (r > radius) {
        // If dragging outside the main circle, increase sensitivity
        radialFactor = 1 + ((r - radius) / (maxRadialDistanceForEffect - radius)) * 2; // Scale up to 3x sensitivity
        radialFactor = Math.min(radialFactor, 3); // Cap at 3x for example
      } else {
        // If dragging inside the main circle, decrease sensitivity
        radialFactor = 1 - ((radius - r) / radius) * 0.5; // Scale down to 0.5x sensitivity
        radialFactor = Math.max(radialFactor, 0.5); // Cap at 0.5x
      }
      
      const effectiveSensitivity = baseSensitivity * radialFactor;
      
      // Use a functional update for currentProgress to get the latest value
      setCurrentProgress(prevProgress => {
        let newProgressValue = prevProgress + (deltaAngle * effectiveSensitivity);
        newProgressValue = Math.max(0, Math.min(100, newProgressValue));
        onInteract?.(newProgressValue); // Call onInteract with the new value
        return newProgressValue;
      });
    }
    lastAngleRef.current = currentAngle;
  }, [isDragging, interactive, getAngleAndRadius, onInteract, radius, size]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!interactive) return;
    setIsDragging(true);
    const { angle } = getAngleAndRadius(e.nativeEvent); // Use nativeEvent for consistency with global listener
    lastAngleRef.current = angle;
  }, [interactive, getAngleAndRadius]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div ref={containerRef} className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
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
            cx={size / 2 + radius * Math.cos((currentProgress / 100) * 2 * Math.PI - Math.PI / 2)}
            cy={size / 2 + radius * Math.sin((currentProgress / 100) * 2 * Math.PI - Math.PI / 2)}
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