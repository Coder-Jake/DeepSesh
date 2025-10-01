"use client";

import { Link, useLocation } from "react-router-dom";
import { useTimer } from "@/contexts/TimerContext";
import { useSession } from "@/contexts/SessionContext"; // Import useSession
import Navigation from "@/components/Navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button"; // Import Button component

const Header = () => {
  const location = useLocation();
  const { timeLeft, formatTime, isRunning, isPaused, isFlashing } = useTimer();
  const { user, signOut } = useSession(); // Get user and signOut from session context
  const isHomePage = location.pathname === "/";

  const [secretTextVisible, setSecretTextVisible] = useState(false);
  const [showSecretTextDiv, setShowSecretTextDiv] = useState(false); // New state to control rendering

  const handleHeaderClick = () => {
    if (isHomePage) {
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
            <div className={`text-lg font-mono font-bold text-foreground transition-all duration-300 ${isFlashing ? 'animate-pulse' : ''} select-none`}>
              {formatTime(timeLeft)}
            </div>
          </Link>
        )}
        
        <div className="flex items-center gap-4">
          {user && ( // Show logout button only if user is logged in
            <Button variant="ghost" size="sm" onClick={signOut} className="text-sm">
              Logout
            </Button>
          )}
          <Navigation />
        </div>
      </div>
    </header>
  );
};

export default Header;