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
import UpcomingFeatures from './pages/UpcomingFeatures';
import NotFound from './pages/NotFound'; // Import NotFound
import Vibes from './pages/Vibes'; // NEW: Import Vibes

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <TimerProvider>
            <ProfileProvider>
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
                      <Route path="upcoming-features" element={<UpcomingFeatures />} />
                      <Route path="vibes" element={<Vibes />} />
                      {/* Removed explicit login/register routes */}
                      {/* <Route path="login" element={<Login />} /> */}
                      {/* <Route path="register" element={<Register />} /> */}
                      {/* <Route path="forgot-password" element={<ForgotPassword />} /> */}
                      {/* <Route path="reset-password" element={<ResetPassword />} /> */}
                      {/* <Route path="verify-email" element={<VerifyEmail />} /> */}
                      <Route path="*" element={<NotFound />} /> {/* Catch-all for 404 */}
                    </Route>
                  </Routes>
                </TooltipProvider>
              </ProfilePopUpProvider>
            </ProfileProvider>
          </TimerProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;