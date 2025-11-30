import { useState, useEffect } from "react";
import { Menu, Home, User, Settings, Heart, Sparkles } from "lucide-react"; // Changed X to Home icon
import { Link, useLocation, useNavigate } from "react-router-dom"; // Added useNavigate
import { Button } from "@/components/ui/button";
import { useProfile } from "@/contexts/ProfileContext"; // Import useProfile

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate(); // Initialize useNavigate
  const { localFirstName } = useProfile(); // Get localFirstName from ProfileContext

  const navigationItems = [
    { name: localFirstName, href: "/profile", icon: User }, // Profile moved to top
    { name: "Settings", href: "/settings", icon: Settings },
    { name: "Vibes", href: "/vibes", icon: Sparkles },
    { name: "Chip In", href: "/chip-in", icon: Heart },
  ];

  // Effect to close the menu when the route changes
  useEffect(() => {
    if (isOpen) {
      setIsOpen(false);
    }
  }, [location.pathname]); // Dependency on location.pathname

  const handleMenuButtonClick = () => {
    if (isOpen) { // If menu is open (showing Home icon)
      navigate("/"); // Navigate to home
      // setIsOpen(false) is removed here, as the useEffect will handle it
    } else { // If menu is closed (showing Menu icon)
      setIsOpen(true); // Open menu
    }
  };

  return (
    <div className="relative">
      {/* Hamburger/Home Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleMenuButtonClick} // Updated onClick handler
        className="p-2 hover:bg-accent-hover"
      >
        {isOpen ? <Home size={20} /> : <Menu size={20} />} {/* Changed X to Home */}
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop - Closes menu when clicked outside */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 min-w-[9rem] max-w-xs bg-popover border border-border rounded-md shadow-lg z-50">
            <div className="py-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    // onClick={() => setIsOpen(false)} is removed here, as the useEffect will handle it
                    className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                      isActive 
                        ? "bg-muted text-primary font-medium" 
                        : "text-foreground hover:bg-accent-hover"
                    }`}
                  >
                    <Icon size={20} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Navigation;