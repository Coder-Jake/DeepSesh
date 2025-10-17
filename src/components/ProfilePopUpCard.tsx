import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, User, MessageSquare, Lightbulb, Users, Building2, Linkedin } from 'lucide-react';
import { useProfilePopUp } from '@/contexts/ProfilePopUpContext';
import { useProfile } from '@/contexts/ProfileContext';
import { Profile } from '@/contexts/ProfileContext'; // Import the Profile type
import { cn } from '@/lib/utils';

const ProfilePopUpCard: React.FC = () => {
  const { isPopUpOpen, targetUserId, targetUserName, popUpPosition, closeProfilePopUp } = useProfilePopUp();
  const { getPublicProfile, profile: currentUserProfile } = useProfile(); // Get current user's profile for comparison
  const [targetProfile, setTargetProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // State for adjusted position
  const [adjustedPosition, setAdjustedPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const fetchTargetProfile = async () => {
      if (targetUserId) {
        setLoading(true);
        setError(null);
        
        // Check if the target user is the current user
        if (currentUserProfile && targetUserId === currentUserProfile.id) {
          setTargetProfile(currentUserProfile);
          setLoading(false);
        } else {
          try {
            const fetchedProfile = await getPublicProfile(targetUserId, targetUserName || "Unknown User");
            setTargetProfile(fetchedProfile);
          } catch (err: any) {
            setError(err.message || "Failed to load profile.");
            setTargetProfile(null);
          } finally {
            setLoading(false);
          }
        }
      }
    };

    if (isPopUpOpen) {
      fetchTargetProfile();
    } else {
      setTargetProfile(null);
      setLoading(true);
      setError(null);
    }
  }, [isPopUpOpen, targetUserId, targetUserName, getPublicProfile, currentUserProfile]);

  // Effect to adjust position based on viewport
  useLayoutEffect(() => {
    if (isPopUpOpen && popUpPosition && cardRef.current) {
      const cardRect = cardRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const margin = 15; // Margin from viewport edges

      let newX = popUpPosition.x + 10; // Initial offset from cursor
      let newY = popUpPosition.y + 10;

      // Check if card goes off right edge
      if (newX + cardRect.width + margin > viewportWidth) {
        newX = viewportWidth - cardRect.width - margin;
      }
      // Check if card goes off bottom edge
      if (newY + cardRect.height + margin > viewportHeight) {
        newY = viewportHeight - cardRect.height - margin;
      }
      // Ensure it doesn't go off left edge
      if (newX < margin) {
        newX = margin;
      }
      // Ensure it doesn't go off top edge
      if (newY < margin) {
        newY = margin;
      }

      setAdjustedPosition({ x: newX, y: newY });
    }
  }, [isPopUpOpen, popUpPosition, targetProfile, loading, error]); // Recalculate if content changes

  // Close pop-up if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        closeProfilePopUp();
      }
    };

    if (isPopUpOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPopUpOpen, closeProfilePopUp]);

  if (!isPopUpOpen || !popUpPosition) {
    return null;
  }

  // Use adjustedPosition for styling
  const style: React.CSSProperties = {
    position: 'fixed',
    left: adjustedPosition?.x,
    top: adjustedPosition?.y,
    zIndex: 10000, // Higher than other elements
  };

  // Determine visibility based on target user's profileVisibility settings
  // If it's the current user's profile, always show full details
  const isCurrentUser = currentUserProfile && targetProfile?.id === currentUserProfile.id;
  const isPublic = targetProfile?.profileVisibility?.includes('public');
  const isFriends = targetProfile?.profileVisibility?.includes('friends'); // Placeholder for future friend logic
  const isOrganization = targetProfile?.profileVisibility?.includes('organisation'); // Placeholder for future org logic
  const isPrivate = targetProfile?.profileVisibility?.includes('private');

  const showFullProfile = isCurrentUser || isPublic || (isFriends && false) || (isOrganization && false); // Simplified for now

  const renderContent = () => {
    if (loading) {
      return <p className="text-center text-muted-foreground">Loading profile...</p>;
    }
    if (error) {
      return <p className="text-center text-destructive">{error}</p>;
    }
    if (!targetProfile) {
      return <p className="text-center text-muted-foreground">Profile not found.</p>;
    }

    const displayName = targetProfile.first_name || targetUserName || "Unknown User";

    if (!isCurrentUser && isPrivate && targetProfile.profileVisibility?.length === 1) {
      return (
        <div className="text-center space-y-2">
          <User className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="font-bold text-lg">{displayName}</p>
          <p className="text-sm text-muted-foreground">This profile is private.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <User className="h-6 w-6 text-primary" />
          <h3 className="font-bold text-xl">{displayName}</h3>
        </div>

        {targetProfile.bio && showFullProfile && (
          <div>
            <h4 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground">
              <MessageSquare size={16} /> Bio
            </h4>
            <p className="text-sm text-foreground mt-1">{targetProfile.bio}</p>
          </div>
        )}

        {targetProfile.intention && showFullProfile && (
          <div>
            <h4 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground">
              <Lightbulb size={16} /> Intention
            </h4>
            <p className="text-sm text-foreground mt-1">{targetProfile.intention}</p>
          </div>
        )}

        {targetProfile.sociability !== null && showFullProfile && (
          <div>
            <h4 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground">
              <Users size={16} /> Sociability
            </h4>
            <div className="w-full bg-secondary rounded-full h-2 mt-1">
              <div
                className="bg-primary h-2 rounded-full"
                style={{ width: `${targetProfile.sociability}%` }}
              ></div>
            </div>
            <p className="text-xs text-muted-foreground mt-1 text-right">{targetProfile.sociability}%</p>
          </div>
        )}

        {targetProfile.organization && showFullProfile && (
          <div>
            <h4 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 size={16} /> Organization
            </h4>
            <p className="text-sm text-foreground mt-1">{targetProfile.organization}</p>
          </div>
        )}

        {targetProfile.linkedin_url && showFullProfile && (
          <div>
            <h4 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground">
              <Linkedin size={16} /> LinkedIn
            </h4>
            <a
              href={targetProfile.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline text-sm mt-1 block"
            >
              {targetProfile.linkedin_url.replace('https://www.linkedin.com/in/', '')}
            </a>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card
      ref={cardRef}
      className={cn(
        "absolute w-80 max-w-xs bg-popover border border-border shadow-lg rounded-lg p-4",
        "transition-all duration-200 ease-out",
        isPopUpOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
      )}
      style={style}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={closeProfilePopUp}
        className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-foreground"
        aria-label="Close profile pop-up"
      >
        <X className="h-4 w-4" />
      </Button>
      <CardContent className="p-0 pt-6">
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default ProfilePopUpCard;