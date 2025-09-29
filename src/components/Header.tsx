import { Link, useLocation } from "react-router-dom";
import { useTimer } from "@/contexts/TimerContext";
import Navigation from "@/components/Navigation";

const Header = () => {
  const location = useLocation();
  const { timeLeft, formatTime, isRunning, isPaused, isFlashing } = useTimer();
  const isHomePage = location.pathname === "/";

  return (
    <header className="border-b border-border p-6">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <h1 className="text-3xl font-bold text-foreground">DeepSesh</h1>
        </Link>
        
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