import { useState } from "react";
import { Menu, X, User, Settings, Heart, Sparkles } from "lucide-react"; // Added Sparkles icon
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/contexts/ProfileContext"; // Import useProfile

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { localFirstName } = useProfile(); // Get localFirstName from ProfileContext

  const navigationItems = [
    { name: localFirstName, href: "/profile", icon: User }, // Profile moved to top
    { name: "Settings", href: "/settings", icon: Settings },
    { name: "Vibes", href: "/vibes", icon: Sparkles },
    { name: "Chip In", href: "/chip-in", icon: Heart },
  ];

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      {/* Hamburger Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleMenu}
        className="p-2"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-popover border border-border rounded-md shadow-lg z-50">
            <div className="py-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-muted ${
                      isActive 
                        ? "bg-muted text-primary font-medium" 
                        : "text-foreground"
                    }`}
                  >
                    <Icon size={16} />
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