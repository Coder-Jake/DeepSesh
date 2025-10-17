import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { TimerProvider, useTimer } from "@/contexts/TimerContext"; // Import useTimer here
import { ProfileProvider } from "@/contexts/ProfileContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { GlobalTooltipProvider, useGlobalTooltip } from "@/contexts/GlobalTooltipContext";
import { ProfilePopUpProvider } from "@/contexts/ProfilePopUpContext"; // NEW: Import ProfilePopUpProvider
import GlobalTooltip from "@/components/GlobalTooltip";
import ProfilePopUpCard from "@/components/ProfilePopUpCard"; // NEW: Import ProfilePopUpCard
import Header from "@/components/Header";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import History from "./pages/History";
import Settings from "./pages/Settings";
import ChipIn from "./pages/ChipIn";
import Leaderboard from "./pages/Leaderboard";
import Credits from "./pages/Credits";
import Login from "./pages/Login";
import Feedback from "./pages/Feedback"; // NEW: Import Feedback page
import NotFound from "./pages/NotFound";
import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

const queryClient = new QueryClient();

const AppContent = () => {
  const navigate = useNavigate();
  const { toasts } = useToast();
  const { setIsShiftPressed, setTooltip, hideTooltip, isShiftPressed } = useGlobalTooltip();
  const { areToastsEnabled } = useTimer(); // NEW: Get areToastsEnabled from TimerContext
  const lastHoveredElementRef = useRef<HTMLElement | null>(null); // Fixed: Initialized with null

  const getElementName = (element: HTMLElement): string | null => {
    // 1. Prioritize data-name attribute for explicit naming
    if (element.dataset.name) {
      return element.dataset.name;
    }

    // 2. Common accessibility and semantic attributes
    if (element.ariaLabel) {
      return element.ariaLabel;
    }
    if (element.title) {
      return element.title;
    }
    if (element instanceof HTMLInputElement) { // Type guard for HTMLInputElement
      if (element.placeholder) {
        return `${element.placeholder} Input`;
      }
      if (element.type === 'number') return 'Number Input';
      if (element.type === 'email') return 'Email Input';
      if (element.type === 'password') return 'Password Input';
      if (element.type === 'text') return 'Text Input';
      return 'Input Field';
    }
    if (element instanceof HTMLImageElement && element.alt) {
      return `${element.alt} Image`;
    }

    // 3. Specific component/element types based on text content or structure
    if (element.tagName === 'BUTTON') {
      const text = element.textContent?.trim();
      if (text && text.length > 0 && text.length < 50) {
        return `${text} Button`;
      }
    }
    if (element.tagName === 'LABEL') {
      const text = element.textContent?.trim();
      if (text && text.length > 0 && text.length < 50) {
        return `${text} Label`;
      }
    }
    if (element.tagName === 'TEXTAREA') {
      return 'Textarea Field';
    }
    if (element.tagName === 'SELECT') {
      return 'Select Dropdown';
    }
    if (element.tagName.startsWith('H')) { // H1, H2, H3, etc.
      const text = element.textContent?.trim();
      if (text && text.length > 0 && text.length < 50) {
        return `${text} Heading`;
      }
    }

    // 4. Contextual naming for shadcn/ui Card Titles
    const parentCardHeader = element.closest('.card-header'); // Assuming CardHeader has this class
    if (parentCardHeader && element.tagName.startsWith('H')) {
      const cardTitle = element.textContent?.trim();
      if (cardTitle) return `${cardTitle} Card Title`;
    }

    // 5. Fallback to a more descriptive tag name
    return `${element.tagName} Element`;
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Shift' && !isShiftPressed) {
        setIsShiftPressed(true);
        // Removed setTooltip call here, it will be handled by mousemove/mouseover
      }

      const targetTagName = (event.target as HTMLElement).tagName;
      if (targetTagName === 'INPUT' || targetTagName === 'TEXTAREA' || targetTagName === 'SELECT') {
        return;
      }

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
      if (isShiftPressed && lastHoveredElementRef.current) {
        const name = getElementName(lastHoveredElementRef.current);
        if (name) {
          setTooltip(name, event.clientX, event.clientY);
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
        <Route path="/credits" element={<Credits />} />
        <Route path="/login" element={<Login />} />
        <Route path="/feedback" element={<Feedback />} /> {/* NEW: Add Feedback route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      {areToastsEnabled && <Toaster toasts={toasts} />} {/* NEW: Conditionally render Toaster */}
      <GlobalTooltip />
      <ProfilePopUpCard /> {/* NEW: Render the ProfilePopUpCard */}
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider delayDuration={0} skipDelayDuration={300}> {/* Increased skipDelayDuration */}
      <ThemeProvider>
        <AuthProvider>
          <ProfileProvider>
            <TimerProvider>
              <GlobalTooltipProvider>
                <ProfilePopUpProvider> {/* NEW: Wrap with ProfilePopUpProvider */}
                  <Sonner />
                  <BrowserRouter>
                    <AppContent />
                  </BrowserRouter>
                </ProfilePopUpProvider>
              </GlobalTooltipProvider>
            </TimerProvider>
          </ProfileProvider>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;