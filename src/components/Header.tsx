"use client";

import { Link, useLocation } from "react-router-dom";
import { useTimer } from "@/contexts/TimerContext";
import Navigation from "@/components/Navigation";
import { useState } from "react";

const Header = () => {
  const location = useLocation();
  const { timeLeft, formatTime, isRunning, isPaused, isFlashing } = useTimer();
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
    <header className="border-b border-border p-4 lg:p-6">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <div className="relative">
          <Link 
            to="/" 
            className="hover:opacity-80 transition-opacity header-gradient-link" // Added header-gradient-link class
            onClick={handleHeaderClick}
          >
            <h1 className="text-3xl font-bold header-gradient-text select-none">DeepSesh</h1> {/* Changed to header-gradient-text */}
          </Link>
          {showSecretTextDiv && ( // Conditionally render the div
            <div
              className={`absolute left-0 top-full mt-1 text-xs font-medium text-muted-foreground transition-opacity duration-1000 ${
                secretTextVisible ? "opacity-100" : "opacity-0"
              } select-none`}
            >
              Deep Work Study Sesh
            </div>
          )}
        </div>
        
        {/* Timer display on non-home pages */}
        {!isHomePage && (isRunning || isPaused || isFlashing) && (
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <div className={`text-2xl font-mono font-bold text-foreground transition-all duration-300 ${isFlashing ? 'animate-pulse' : ''} select-none`}>
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