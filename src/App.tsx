import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import About from './pages/About';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import AuthLayout from './layouts/AuthLayout';
import AppLayout from './layouts/AppLayout';
import { AuthProvider } from './contexts/AuthContext';
import { TimerProvider } from './contexts/TimerContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from './components/ui/sonner';
import { TooltipProvider } from './components/ui/tooltip';
import { ProfileProvider } from './contexts/ProfileContext';
import { ProfilePopUpProvider } from './contexts/ProfilePopUpContext';
import ChipIn from './pages/ChipIn';
import Feedback from './pages/Feedback';
import Credits from './pages/Credits';
import UpcomingFeatures from './pages/UpcomingFeatures'; // NEW: Import UpcomingFeatures

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <ProfileProvider>
            <TimerProvider>
              <ProfilePopUpProvider>
                <TooltipProvider>
                  <Toaster />
                  <Routes>
                    <Route path="/" element={<AppLayout />}>
                      <Route index element={<Index />} />
                      <Route path="about" element={<About />} />
                      <Route path="settings" element={<Settings />} />
                      <Route path="profile" element={<Profile />} />
                      <Route path="chip-in" element={<ChipIn />} />
                      <Route path="feedback" element={<Feedback />} />
                      <Route path="credits" element={<Credits />} />
                      <Route path="upcoming-features" element={<UpcomingFeatures />} /> {/* NEW: Add route */}
                    </Route>
                    <Route path="/" element={<AuthLayout />}>
                      <Route path="login" element={<Login />} />
                      <Route path="register" element={<Register />} />
                      <Route path="forgot-password" element={<ForgotPassword />} />
                      <Route path="reset-password" element={<ResetPassword />} />
                      <Route path="verify-email" element={<VerifyEmail />} />
                    </Route>
                  </Routes>
                </TooltipProvider>
              </ProfilePopUpProvider>
            </TimerProvider>
          </ProfileProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;