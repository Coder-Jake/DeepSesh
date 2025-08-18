import { useEffect, useState, useRef } from "react";

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
  const svgRef = useRef<SVGSVGElement>(null); // Ref for the SVG element
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!interactive) return;
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!interactive || !isDragging || !svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect(); // Get rect from the SVG ref
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
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, size, strokeWidth, onInteract]);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        ref={svgRef} // Attach the ref here
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