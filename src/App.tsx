import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { TimerProvider } from "@/contexts/TimerContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import Header from "@/components/Header";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import History from "./pages/History";
import Settings from "./pages/Settings";
import ChipIn from "./pages/ChipIn";
import Leaderboard from "./pages/Leaderboard";
import Credits from "./pages/Credits"; // Import the new Credits page
import NotFound from "./pages/NotFound";
import { useEffect } from "react";

const queryClient = new QueryClient();

const AppContent = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent navigation if user is typing in an input field
      const targetTagName = (event.target as HTMLElement).tagName;
      if (targetTagName === 'INPUT' || targetTagName === 'TEXTAREA' || targetTagName === 'SELECT') {
        return;
      }

      const key = event.key.toLowerCase();

      switch (key) {
        case '1':
          navigate('/');
          break;
        case '2':
        case 'p':
          navigate('/profile');
          break;
        case '3':
        case 'l':
          navigate('/leaderboard');
          break;
        case '4':
        case 'h':
          navigate('/history');
          break;
        case '5':
        case 's':
          navigate('/settings');
          break;
        case '6':
        case 'c':
          navigate('/chip-in');
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/chip-in" element={<ChipIn />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/credits" element={<Credits />} /> {/* New Credits route */}
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <TimerProvider>
        <ProfileProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </ProfileProvider>
      </TimerProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;