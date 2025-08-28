import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { TimerProvider } from "@/contexts/TimerContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { SessionProvider, useSession } from "@/contexts/SessionContext"; // Import SessionProvider and useSession
import Header from "@/components/Header";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import History from "./pages/History";
import Settings from "./pages/Settings";
import ChipIn from "./pages/ChipIn";
import Leaderboard from "./pages/Leaderboard";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login"; // Import Login page
import { useEffect } from "react";

const queryClient = new QueryClient();

const AppContent = () => {
  const navigate = useNavigate();
  const { loading: sessionLoading, user } = useSession(); // Use session context

  useEffect(() => {
    // Only set up keyboard shortcuts if a user is logged in and session is not loading
    if (!sessionLoading && user) {
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
    }
  }, [navigate, sessionLoading, user]);

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading application...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {user && <Header />} {/* Only show header if user is logged in */}
      <Routes>
        <Route path="/login" element={<Login />} /> {/* New Login route */}
        {user ? ( // Protected routes
          <>
            <Route path="/" element={<Index />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/chip-in" element={<ChipIn />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </>
        ) : (
          // Redirect any other path to login if not authenticated
          <Route path="*" element={<Login />} />
        )}
      </Routes>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter> {/* BrowserRouter needs to be outside SessionProvider for navigate to work */}
        <SessionProvider> {/* Wrap with SessionProvider */}
          <TimerProvider>
            <ProfileProvider>
              <Toaster />
              <Sonner />
              <AppContent />
            </ProfileProvider>
          </TimerProvider>
        </SessionProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;