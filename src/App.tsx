import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { TimerProvider } from "@/contexts/TimerContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { AuthProvider } from "@/contexts/AuthContext"; // Import AuthProvider
import { ThemeProvider } from "@/contexts/ThemeContext"; // Import ThemeProvider
import { GlobalTooltipProvider, useGlobalTooltip } from "@/contexts/GlobalTooltipContext"; // NEW: Import GlobalTooltipProvider and useGlobalTooltip
import GlobalTooltip from "@/components/GlobalTooltip"; // NEW: Import GlobalTooltip
import Header from "@/components/Header";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import History from "./pages/History";
import Settings from "./pages/Settings";
import ChipIn from "./pages/ChipIn";
import Leaderboard from "./pages/Leaderboard";
import Credits from "./pages/Credits"; // Import the new Credits page
import Login from "./pages/Login"; // Import the new Login page
import NotFound from "./pages/NotFound";
import { useEffect, useRef } from "react"; // NEW: Import useRef
import { useToast } from "@/hooks/use-toast"; // Import useToast

const queryClient = new QueryClient();

const AppContent = () => {
  const navigate = useNavigate();
  const { toasts } = useToast(); // Get toasts from useToast hook
  const { setIsShiftPressed, setTooltip, hideTooltip, isShiftPressed } = useGlobalTooltip(); // NEW: Use global tooltip context
  const lastHoveredElementRef = useRef<HTMLElement | null>(null); // NEW: Ref to track last hovered element

  // NEW: Helper function to get element's name
  const getElementName = (element: HTMLElement): string | null => {
    // Prioritize data-name attribute
    if (element.dataset.name) {
      return element.dataset.name;
    }
    // Common attributes
    if (element.ariaLabel) {
      return element.ariaLabel;
    }
    if (element.title) {
      return element.title;
    }
    if (element instanceof HTMLInputElement && element.placeholder) {
      return element.placeholder;
    }
    if (element instanceof HTMLImageElement && element.alt) {
      return element.alt;
    }
    // Text content for buttons, labels, titles, etc.
    if (element.tagName === 'BUTTON' || element.tagName === 'LABEL' || element.tagName.startsWith('H')) {
      const text = element.textContent?.trim();
      if (text && text.length > 0 && text.length < 50) { // Limit length to avoid large blocks of text
        return text;
      }
    }
    // Fallback to tag name
    return element.tagName;
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Shift' && !isShiftPressed) {
        setIsShiftPressed(true);
        // If an element is already hovered, show tooltip immediately
        if (lastHoveredElementRef.current) {
          const name = getElementName(lastHoveredElementRef.current);
          if (name) {
            setTooltip(name, event.clientX, event.clientY);
          }
        }
      }

      // Prevent navigation if user is typing in an input field
      const targetTagName = (event.target as HTMLElement).tagName;
      if (targetTagName === 'INPUT' || targetTagName === 'TEXTAREA' || targetTagName === 'SELECT') {
        return;
      }

      // Prevent navigation if any modifier key is pressed
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
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

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        setIsShiftPressed(false);
        hideTooltip();
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (isShiftPressed) {
        // Update tooltip position if already visible
        if (lastHoveredElementRef.current) {
          const name = getElementName(lastHoveredElementRef.current);
          if (name) {
            setTooltip(name, event.clientX, event.clientY);
          }
        }
      }
    };

    const handleMouseOver = (event: MouseEvent) => {
      lastHoveredElementRef.current = event.target as HTMLElement;
      if (isShiftPressed) {
        const name = getElementName(event.target as HTMLElement);
        if (name) {
          setTooltip(name, event.clientX, event.clientY);
        }
      }
    };

    const handleMouseOut = (event: MouseEvent) => {
      if (lastHoveredElementRef.current === (event.target as HTMLElement)) {
        lastHoveredElementRef.current = null;
      }
      if (isShiftPressed) {
        hideTooltip();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, [isShiftPressed, setIsShiftPressed, setTooltip, hideTooltip, navigate]);

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
        <Route path="/login" element={<Login />} /> {/* New Login route */}
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster toasts={toasts} /> {/* Pass toasts prop here */}
      <GlobalTooltip /> {/* NEW: Render the global tooltip */}
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider> {/* ThemeProvider wraps AuthProvider */}
        <AuthProvider>
          <ProfileProvider>
            <TimerProvider>
              <GlobalTooltipProvider> {/* NEW: GlobalTooltipProvider wraps AppContent */}
                {/* Toaster is now rendered inside AppContent */}
                <Sonner />
                <BrowserRouter>
                  <AppContent />
                </BrowserRouter>
              </GlobalTooltipProvider>
            </TimerProvider>
          </ProfileProvider>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;