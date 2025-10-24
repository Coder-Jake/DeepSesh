import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { TimerProvider, useTimer } from "@/contexts/TimerContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProfilePopUpProvider } from "@/contexts/ProfilePopUpContext";
import ProfilePopUpCard from "@/components/ProfilePopUpCard";
import Header from "@/components/Header";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import History from "./pages/History";
import Settings from "./pages/Settings";
import ChipIn from "./pages/ChipIn";
import Leaderboard from "./pages/Leaderboard";
import Credits from "./pages/Credits";
import Login from "./pages/Login";
import Feedback from "./pages/Feedback";
import NotFound from "./pages/NotFound";
import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

const queryClient = new QueryClient();

const AppContent = () => {
  const navigate = useNavigate();
  const { toasts } = useToast();
  const { areToastsEnabled } = useTimer();

  // Removed all tooltip-related state and effects.

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
        <Route path="/credits" element={<Credits />} />
        <Route path="/login" element={<Login />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {areToastsEnabled && <Toaster />}
      <ProfilePopUpCard />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider delayDuration={0} skipDelayDuration={300}>
      <ThemeProvider>
        <AuthProvider>
          <ProfileProvider>
            <TimerProvider>
                <ProfilePopUpProvider>
                  <Sonner offset={96} />
                  <BrowserRouter>
                    <AppContent />
                  </BrowserRouter>
                </ProfilePopUpProvider>
            </TimerProvider>
          </ProfileProvider>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;