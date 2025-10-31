import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import ProfilePopUpCard from '@/components/ProfilePopUpCard';
import { useTheme } from '@/contexts/ThemeContext'; // Import useTheme

const AppLayout = () => {
  const navigate = useNavigate();
  const { toggleDarkMode } = useTheme(); // Use the toggleDarkMode function

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent navigation if a modifier key is pressed
      if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) {
        return;
      }

      // Prevent navigation if the active element is an input field or contenteditable
      const activeElement = document.activeElement;
      const isTyping = 
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.hasAttribute('contenteditable');

      if (isTyping) {
        return;
      }

      switch (event.key) {
        case '1':
          event.preventDefault();
          navigate('/');
          break;
        case '2':
        case 's': // Added 's' for Settings
        case 'S': // Added 'S' for Settings
          event.preventDefault();
          navigate('/settings');
          break;
        case '3':
        case 'p': // Added 'p' for Profile
        case 'P': // Added 'P' for Profile
          event.preventDefault();
          navigate('/profile');
          break;
        case '4':
          event.preventDefault();
          navigate('/chip-in');
          break;
        case 'd': // NEW: Toggle dark mode with 'd' key
        case 'D':
          event.preventDefault();
          toggleDarkMode();
          break;
        default:
          // Do nothing for other keys
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate, toggleDarkMode]); // Add toggleDarkMode to dependencies

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow">
        <Outlet />
      </div>
      <ProfilePopUpCard />
    </div>
  );
};

export default AppLayout;