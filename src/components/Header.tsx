"use client";

import { Link, useLocation } from "react-router-dom";
import { useTimer } from "@/contexts/TimerContext";
import Navigation from "@/components/Navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const Header = () => {
  const location = useLocation();
  const { timeLeft, formatTime, isRunning, isPaused, isFlashing, hasWonPrize } = useTimer();
  const isHomePage = location.pathname === "/";

  const [secretTextVisible, setSecretTextVisible] = useState(false);
  const [showSecretTextDiv, setShowSecretTextDiv] = useState(false);
  const [showDemoText, setShowDemoText] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isHomePage) {
      setShowDemoText(true);
      timer = setTimeout(() => {
        setShowDemoText(false);
      }, 3000);
    } else {
      setShowDemoText(false);
    }

    return () => {
      clearTimeout(timer);
    };
  }, [isHomePage]);

  const handleHeaderClick = () => {
    if (isHomePage) {
      setShowSecretTextDiv(true);
      
      setTimeout(() => {
        setSecretTextVisible(true);
        setTimeout(() => {
          setSecretTextVisible(false);
          setTimeout(() => {
            setShowSecretTextDiv(false);
          }, 1000); 
        }, 3000);
      }, 1000);
    }
  };

  return (
    <header className="fixed top-0 w-full z-50 border-b border-border px-4 pt-[3px] pb-[0px] lg:px-6 lg:pt-[7px] lg:pb-[2px] bg-background">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <div className="relative flex items-center">
          <Link 
            to="/" 
            className="hover:opacity-80 transition-opacity flex items-center relative"
            onClick={handleHeaderClick}
          >
            <img 
              src="/ds-logo.png" 
              alt="DeepSesh Logo" 
              className="h-8 w-8 mr-0 mt-[-6px]"
            />
            <h1 className="text-3xl font-bold select-none bg-gradient-to-r from-[#1a8cff] to-[#8c25f4] text-transparent bg-clip-text">
              DeepSesh
              <span className={cn(
                "ml-0.5 text-[0.6rem] text-gray-400 font-normal transition-opacity duration-200",
                isHomePage && showDemoText ? "opacity-100" : "opacity-0 pointer-events-none"
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
                  style={{ left: '32px', top: '31px' }}
                >
                  Deep Work
                </div>
                <div
                  className={`absolute text-xs font-medium text-muted-foreground transition-opacity duration-1000 ${
                    secretTextVisible ? "opacity-100" : "opacity-0"
                  } select-none`}
                  style={{ left: '107px', top: '31px' }}
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