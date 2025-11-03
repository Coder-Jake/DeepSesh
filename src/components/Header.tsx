"use client";

import { Link, useLocation } from "react-router-dom";
import { useTimer } from "@/contexts/TimerContext";
import Navigation from "@/components/Navigation";
import { useState } from "react";
import { cn } from "@/lib/utils"; // Fixed import for cn

const Header = () => {
  const location = useLocation();
  const { timeLeft, formatTime, isRunning, isPaused, isFlashing, hasWonPrize } = useTimer(); // NEW: Get hasWonPrize
  const isHomePage = location.pathname === "/";

  const [secretTextVisible, setSecretTextVisible] = useState(false);
  const [showSecretTextDiv, setShowSecretTextDiv] = useState(false); // New state to control rendering

  const handleHeaderClick = () => {
    if (isHomePage) {
      // Ensure any previous timeouts are cleared to prevent overlapping animations
      // (This part is not strictly necessary for this specific request but good practice)
      // if (timeoutRef.current) clearTimeout(timeoutRef.current);

      setShowSecretTextDiv(true); // Start rendering the div with initial opacity-0
      
      setTimeout(() => {
        setSecretTextVisible(true); // Trigger fade-in after 1s delay
        setTimeout(() => {
          setSecretTextVisible(false); // Trigger fade-out after 3s
          setTimeout(() => {
            setShowSecretTextDiv(false); // Remove from DOM after fade-out completes (1s transition)
          }, 1000); 
        }, 3000);
      }, 1000); // Initial delay before fade-in starts
    }
  };

  return (
    <header className="fixed top-0 w-full z-50 border-b border-border px-4 py-2 lg:px-6 lg:py-3 bg-background">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <div className="relative flex items-center">
          <Link 
            to="/" 
            className="hover:opacity-80 transition-opacity flex items-center relative" // Added 'relative' here
            onClick={handleHeaderClick}
          >
            <img 
              src="/DS-logo-small.png" 
              alt="DeepSesh Logo" 
              className="h-8 w-8 mr-0 mt-[-6px]"
            />
            <h1 className="text-3xl font-bold select-none bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text">
              DeepSesh
              <span className={cn(
                "ml-0.5 text-[0.6rem] text-gray-400 font-normal transition-opacity duration-200",
                isHomePage ? "opacity-100" : "opacity-0 pointer-events-none"
              )}>
                (demo)
              </span>
            </h1>
            {showSecretTextDiv && (
              <>
                <div
                  className={`absolute text-xs font-medium text-muted-foreground transition-opacity duration-1000 ${
                    secretTextVisible ? "opacity-100" : "opacity-0"
                  } select-none`}
                  style={{ left: '32px', top: '31px' }} // Position "Deep Work" below "Deep"
                >
                  Deep Work
                </div>
                <div
                  className={`absolute text-xs font-medium text-muted-foreground transition-opacity duration-1000 ${
                    secretTextVisible ? "opacity-100" : "opacity-0"
                  } select-none`}
                  style={{ left: '90px', top: '31px' }} // Adjusted positioning for "Study Sesh"
                >
                  Study Sesh
                </div>
              </>
            )}
          </Link>
        </div>
        
        {/* Timer display on non-home pages */}
        {!isHomePage && (isRunning || isPaused || isFlashing) && (
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <div 
              className={`text-lg font-mono font-bold text-foreground transition-all duration-300 ${isFlashing ? 'animate-pulse' : ''} select-none`}
              style={hasWonPrize ? { color: 'hsl(50 100% 40%)' } : {}} // NEW: Apply prize color
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