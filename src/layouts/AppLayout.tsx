import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer'; // NEW: Import Footer
import ProfilePopUpCard from '@/components/ProfilePopUpCard';
import { useTheme } from '@/contexts/ThemeContext';
import { useProfilePopUp } from '@/contexts/ProfilePopUpContext';

const AppLayout = () => {
  const navigate = useNavigate();
  const { toggleDarkMode } = useTheme();
  const { isBlockingClicks } = useProfilePopUp();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) {
        return;
      }

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
        case 'p':
        case 'P':
          event.preventDefault();
          navigate('/profile');
          break;
        case '3':
        case 's':
        case 'S':
          event.preventDefault();
          navigate('/settings');
          break;
        case '4':
          event.preventDefault();
          navigate('/chip-in');
          break;
        case '5':
        case 'v':
        case 'V':
          event.preventDefault();
          navigate('/vibes');
          break;
        case 'd':
        case 'D':
          event.preventDefault();
          toggleDarkMode();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate, toggleDarkMode]);

  useEffect(() => {
    if (isBlockingClicks) {
      document.body.classList.add('block-pointer-events');
    } else {
      document.body.classList.remove('block-pointer-events');
    }
  }, [isBlockingClicks]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow">
        <Outlet />
      </div>
      <ProfilePopUpCard />
      <Footer /> {/* NEW: Render Footer component here */}
    </div>
  );
};

export default AppLayout;