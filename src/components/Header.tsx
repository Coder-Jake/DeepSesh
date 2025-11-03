"use client";

import { Link, useLocation } from "react-router-dom";
import { useTimer } from "@/contexts/TimerContext";
import Navigation from "@/components/Navigation";
import { useState, useRef } from "react"; // Added useRef
import { cn } from "@/lib/utils";

const Header = () => {
  const location = useLocation();
  const { timeLeft, formatTime, isRunning, isPaused, isFlashing, hasWonPrize } = useTimer();
  const isHomePage = location.pathname === "/";

  const [secretTextVisible, setSecretTextVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null); // Ref to store timeout ID

  const handleHeaderClick = () => {
    if (isHomePage) {
      // Clear any existing timeout to prevent overlapping animations
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setSecretTextVisible(true); // Make it visible immediately

      // Set a timeout to hide it after 3 seconds
      timeoutRef.current = setTimeout(() => {
        setSecretTextVisible(false);
        timeoutRef.current = null; // Clear the ref after timeout
      }, 3000); // Visible for 3 seconds
    }
  };

  return (
    <header className="fixed top-0 w-full z-50 border-b border-border px-4 py-2 lg:px-6 lg:py-3 bg-background">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <div className="relative flex items-center">
          <Link 
            to="/" 
            className="hover:opacity-80 transition-opacity flex items-center"
            onClick={handleHeaderClick}
          >
            <img 
              src="/DS-logo-small.png" 
              alt="DeepSesh Logo" 
              className="h-8 w-8 mr-0 mt-[-6px]"
            />
            {/* Wrapper div for H1 and secret text */}
            <div className="flex flex-col items-start pb-1">
              <h1 className="text-3xl font-bold select-none bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text">
                DeepSesh
                <span className={cn(
                  "ml-0.5 text-[0.6rem] text-gray-400 font-normal transition-opacity duration-200",
                  isHomePage ? "opacity-100" : "opacity-0 pointer-events-none"
                )}>
                  (demo)
                </span>
              </h1>
              {/* Secret text div is always rendered to reserve space */}
              <div
                className={`text-xs font-medium text-muted-foreground transition-opacity duration-1000 ${
                  secretTextVisible ? "opacity-100" : "opacity-0 pointer-events-none" // Added pointer-events-none
                } select-none -mt-2`}
              >
                Deep Work Study Sesh
              </div>
            </div>
          </Link>
        </div>
        
        {/* Timer display on non-home pages */}
        {!isHomePage && (isRunning || isPaused || isFlashing) && (
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <div 
              className={`text-lg font-mono font-bold text-foreground transition-all duration-300 ${isFlashing ? 'animate-pulse' : ''} select-none`}
              style={hasWonPrize ? { color: 'hsl(50 100% 40%)' } : {}}
            >
              {formatTime(timeLeft)}
            </div>
          </Link>
        )}
        
        <Navigation />
      </div>
    </header>
  );
};

export default Header;