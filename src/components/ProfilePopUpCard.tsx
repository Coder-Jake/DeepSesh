import React, { useEffect, useState, useRef, useLayoutEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, User, MessageSquare, Lightbulb, Users, Building2, Linkedin, UserPlus, UserCheck, UserMinus } from 'lucide-react'; // NEW: Import UserPlus, UserCheck, UserMinus
import { useProfilePopUp } from '@/contexts/ProfilePopUpContext';
import { useProfile } from '@/contexts/ProfileContext';
import { Profile } from '@/contexts/ProfileContext'; // Import the Profile type
import { cn, VISIBILITY_OPTIONS_MAP, getIndexFromVisibility, getPrivacyColorClassFromIndex } from '@/lib/utils'; // Import shared utils
import { useToast } from '@/hooks/use-toast'; // NEW: Import useToast

const ProfilePopUpCard: React.FC = () => {
  const { isPopUpOpen, targetUserId, targetUserName, popUpPosition, closeProfilePopUp } = useProfilePopUp();
  const { 
    getPublicProfile, 
    profile: currentUserProfile, 
    bioVisibility, setBioVisibility, 
    intentionVisibility, setIntentionVisibility, 
    linkedinVisibility, setLinkedinVisibility,
    friendStatuses, sendFriendRequest, acceptFriendRequest, removeFriend // NEW: Get friend states and functions
  } = useProfile(); // Get current user's profile and visibility setters
  const [targetProfile, setTargetProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast(); // NEW: Initialize useToast

  // State for adjusted position
  const [adjustedPosition, setAdjustedPosition] = useState<{ x: number; y: number } | null>(null);

  // NEW: Helper to get display name for visibility status (copied from Profile.tsx for consistency)
  const getDisplayVisibilityStatus = useCallback((visibility: ('public' | 'friends' | 'organisation' | 'private')[]): string => {
    if (visibility.includes('private')) return 'private';
    if (visibility.includes('public')) return 'public';
    if (visibility.includes('friends') && visibility.includes('organisation')) return 'friends & organisation only';
    if (visibility.includes('friends')) return 'friends only';
    if (visibility.includes('organisation')) return 'organisation only';
    return 'public'; // Fallback
  }, []);

  // NEW: Helper to get display name for field (copied from Profile.tsx for consistency)
  const getDisplayFieldName = useCallback((fieldName: 'bio_visibility' | 'intention_visibility' | 'linkedin_visibility'): string => {
    switch (fieldName) {
      case 'bio_visibility': return 'Bio';
      case 'intention_visibility': return 'Intention';
      case 'linkedin_visibility': return 'LinkedIn';
      default: return '';
    }
  }, []);

  const handleLabelClick = useCallback(async (
    currentVisibility: ('public' | 'friends' | 'organisation' | 'private')[], 
    visibilitySetter: React.Dispatch<React.SetStateAction<('public' | 'friends' | 'organisation' | 'private')[]>>,
    fieldName: 'bio_visibility' | 'intention_visibility' | 'linkedin_visibility'
  ) => {
    const currentIndex = getIndexFromVisibility(currentVisibility);
    const nextIndex = (currentIndex + 1) % VISIBILITY_OPTIONS_MAP.length;
    const newVisibility = VISIBILITY_OPTIONS_MAP[nextIndex] as ('public' | 'friends' | 'organisation' | 'private')[];
    
    visibilitySetter(newVisibility); // Update context state immediately
    
    // Construct specific success message for immediate toast feedback
    const successMessage = `${getDisplayFieldName(fieldName)} is now ${getDisplayVisibilityStatus(newVisibility)}.`;
    toast({
      title: "Privacy Setting Changed",
      description: successMessage,
    });

    // The actual saving to Supabase is now handled by the main Profile page's Save button.
    // This function only updates the local context state and provides immediate UI feedback.
  }, [toast, getDisplayFieldName, getDisplayVisibilityStatus]); // NEW: Added toast, getDisplayFieldName, getDisplayVisibilityStatus to dependencies

  useEffect(() => {
    const fetchTargetProfile = async () => {
      if (targetUserId) {
        setLoading(true);
        setError(null);
        
        // Check if the target user is the current user
        if (currentUserProfile && targetUserId === currentUserProfile.id) {
          // If it's the current user, use the profile from context directly
          setTargetProfile({
            ...currentUserProfile,
            bio_visibility: bioVisibility,
            intention_visibility: intentionVisibility,
            linkedin_visibility: linkedinVisibility,
          });
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
  }, [isPopUpOpen, targetUserId, targetUserName, getPublicProfile, currentUserProfile, bioVisibility, intentionVisibility, linkedinVisibility]); // Add visibility states as dependencies

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
    };

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

  const renderContent = () => {
    if (loading) {
      return <p className="text-center text-muted-foreground">Loading profile...</p>;
    }
    if (error) {
      return <p className="text-center text-destructive">{error}</p>;
    }
    
    // Handle cases where no Supabase profile is found for the targetUserId
    if (!targetProfile) {
      // If targetUserName is available, display a generic card for it
      if (targetUserName) {
        return (
          <div className="text-center space-y-2">
            <User className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="font-bold text-lg">{targetUserName}</p>
            <p className="text-sm text-muted-foreground">Details for this user are not available.</p>
            {targetUserId?.startsWith('mock-user-id-') && (
              <p className="text-xs text-muted-foreground">(This is a mock profile)</p>
            )}
          </div>
        );
      }
      // Fallback if neither profile nor username is available (should ideally not happen)
      return <p className="text-center text-muted-foreground">Profile not found.</p>;
    }

    const displayName = targetProfile.first_name || targetUserName || "Unknown User";
    const isCurrentUserProfile = currentUserProfile && targetProfile.id === currentUserProfile.id;
    const currentFriendStatus = friendStatuses[targetProfile.id] || 'none'; // NEW: Get friend status

    // Helper to determine if a specific field should be visible
    const isFieldVisible = (fieldVisibility: ('public' | 'friends' | 'organisation' | 'private')[] | null | undefined) => {
      if (isCurrentUserProfile) return true; // Always show own profile details
      if (!fieldVisibility || fieldVisibility.includes('private')) return false; // Explicitly private
      // For demo, if it's not private, and includes public, friends, or organisation, show it.
      return fieldVisibility.includes('public') || fieldVisibility.includes('friends') || fieldVisibility.includes('organisation');
    };

    // If the profile is explicitly private and not the current user, show only name
    if (!isCurrentUserProfile && targetProfile.bio_visibility?.includes('private') && 
        targetProfile.intention_visibility?.includes('private') && 
        targetProfile.linkedin_visibility?.includes('private')) {
      return (
        <div className="text-center space-y-2">
          <User className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="font-bold text-lg">{displayName}</p>
          <p className="text-sm text-muted-foreground">This profile is private.</p>
        </div>
      );
    }

    // Derive current visibility for labels (only for current user, otherwise use targetProfile's saved visibility)
    const currentBioVisibility = isCurrentUserProfile ? bioVisibility : (targetProfile.bio_visibility || ['public']);
    const currentIntentionVisibility = isCurrentUserProfile ? intentionVisibility : (targetProfile.intention_visibility || ['public']);
    const currentLinkedinVisibility = isCurrentUserProfile ? linkedinVisibility : (targetProfile.linkedin_visibility || ['public']);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <User className="h-6 w-6 text-primary" />
          <h3 className="font-bold text-xl">{displayName}</h3>
          
          {/* NEW: Friend Icon */}
          {!isCurrentUserProfile && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "ml-auto h-8 w-8",
                currentFriendStatus === 'none' && "text-foreground hover:text-primary",
                currentFriendStatus === 'pending' && "text-gray-500 cursor-default",
                currentFriendStatus === 'friends' && "text-green-500 hover:text-green-600"
              )}
              onClick={() => {
                if (currentFriendStatus === 'none') {
                  sendFriendRequest(targetProfile.id);
                } else if (currentFriendStatus === 'friends') {
                  removeFriend(targetProfile.id);
                }
                // No action for 'pending' state on click
              }}
              disabled={currentFriendStatus === 'pending'}
            >
              {currentFriendStatus === 'none' && (
                <UserPlus size={18} />
              )}
              {currentFriendStatus === 'pending' && (
                <UserPlus size={18} className="opacity-50" /> // Greyed out for pending
              )}
              {currentFriendStatus === 'friends' && (
                <UserCheck size={18} />
              )}
            </Button>
          )}
        </div>

        {targetProfile.bio && isFieldVisible(targetProfile.bio_visibility) && (
          <div>
            <h4 
              className={cn(
                "font-semibold flex items-center gap-2 text-sm text-muted-foreground",
                isCurrentUserProfile && "cursor-pointer select-none",
                getPrivacyColorClassFromIndex(getIndexFromVisibility(currentBioVisibility))
              )}
              onClick={isCurrentUserProfile ? () => handleLabelClick(currentBioVisibility, setBioVisibility, 'bio_visibility', bioVisibility, intentionVisibility, linkedinVisibility) : undefined}
            >
              <MessageSquare size={16} /> Bio
            </h4>
            <p className="text-sm text-foreground mt-1">{targetProfile.bio}</p>
          </div>
        )}

        {targetProfile.intention && isFieldVisible(targetProfile.intention_visibility) && (
          <div>
            <h4 
              className={cn(
                "font-semibold flex items-center gap-2 text-sm text-muted-foreground",
                isCurrentUserProfile && "cursor-pointer select-none",
                getPrivacyColorClassFromIndex(getIndexFromVisibility(currentIntentionVisibility))
              )}
              onClick={isCurrentUserProfile ? () => handleLabelClick(currentIntentionVisibility, setIntentionVisibility, 'intention_visibility', bioVisibility, intentionVisibility, linkedinVisibility) : undefined}
            >
              <Lightbulb size={16} /> Intention
            </h4>
            <p className="text-sm text-foreground mt-1">{targetProfile.intention}</p>
          </div>
        )}

        {targetProfile.sociability !== null && (isFieldVisible(targetProfile.bio_visibility) || isFieldVisible(targetProfile.intention_visibility) || isFieldVisible(targetProfile.linkedin_visibility)) && (
          // Sociability is generally visible if any other field is visible, or if it's explicitly public (though no direct sociability_visibility field)
          // For now, tie its visibility to other fields or assume it's always visible if not private overall.
          // A more robust solution would involve a dedicated sociability_visibility field.
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

        {targetProfile.organization && (isFieldVisible(targetProfile.bio_visibility) || isFieldVisible(targetProfile.intention_visibility) || isFieldVisible(targetProfile.linkedin_visibility)) && (
          // Organization is generally visible if any other field is visible, or if it's explicitly public.
          <div>
            <h4 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 size={16} /> Organization
            </h4>
            <p className="text-sm text-foreground mt-1">{targetProfile.organization}</p>
          </div>
        )}

        {targetProfile.linkedin_url && isFieldVisible(targetProfile.linkedin_visibility) && (
          <div>
            <h4 
              className={cn(
                "font-semibold flex items-center gap-2 text-sm text-muted-foreground",
                isCurrentUserProfile && "cursor-pointer select-none",
                getPrivacyColorClassFromIndex(getIndexFromVisibility(currentLinkedinVisibility))
              )}
              onClick={isCurrentUserProfile ? () => handleLabelClick(currentLinkedinVisibility, setLinkedinVisibility, 'linkedin_visibility', bioVisibility, intentionVisibility, linkedinVisibility) : undefined}
            >
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