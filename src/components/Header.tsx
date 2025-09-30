import { Link, useLocation } from "react-router-dom";
import { useTimer } from "@/contexts/TimerContext";
import Navigation from "@/components/Navigation";
import { useState } from "react"; // Import useState

const Header = () => {
  const location = useLocation();
  const { timeLeft, formatTime, isRunning, isPaused, isFlashing } = useTimer();
  const isHomePage = location.pathname === "/";

  const [secretTextVisible, setSecretTextVisible] = useState(false);

  const handleHeaderClick = () => {
    if (isHomePage) {
      setSecretTextVisible(true);
      setTimeout(() => {
        setSecretTextVisible(false);
      }, 3000); // Text visible for 3 seconds
    }
  };

  return (
    <header className="border-b border-border p-4 lg:p-6">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <div className="relative"> {/* Added relative positioning for the secret text */}
          <Link to="/" className="hover:opacity-80 transition-opacity" onClick={handleHeaderClick}>
            <h1 className="text-3xl font-bold text-foreground">DeepSesh</h1>
          </Link>
          {secretTextVisible && (
            <div
              className={`absolute left-0 top-full mt-1 text-sm font-medium text-muted-foreground transition-opacity duration-500 ${
                secretTextVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              Deep Work Study Sesh
            </div>
          )}
        </div>
        
        {/* Timer display on non-home pages */}
        {!isHomePage && (isRunning || isPaused || isFlashing) && (
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <div className={`text-2xl font-mono font-bold text-foreground transition-all duration-300 ${isFlashing ? 'animate-pulse' : ''}`}>
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