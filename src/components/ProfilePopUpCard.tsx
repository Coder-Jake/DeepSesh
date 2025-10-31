"use client";

import React, { useEffect, useState, useRef, useLayoutEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, User, MessageSquare, Lightbulb, Users, Building2, Linkedin, UserPlus, UserCheck, UserMinus, Handshake, HelpCircle } from 'lucide-react';
import { useProfilePopUp } from '@/contexts/ProfilePopUpContext';
import { useProfile } from '@/contexts/ProfileContext';
import { Profile } from '@/contexts/ProfileContext';
import { cn, VISIBILITY_OPTIONS_MAP, getIndexFromVisibility, getPrivacyColorClassFromIndex } from '@/lib/utils';
import { toast } from 'sonner';
import { useTimer } from '@/contexts/TimerContext';
import { useIsMobile } from '@/hooks/use-mobile';

const ProfilePopUpCard: React.FC = () => {
  const { isPopUpOpen, targetUserId, targetUserName, popUpPosition, toggleProfilePopUp, closeProfilePopUp } = useProfilePopUp();
  const { 
    getPublicProfile, 
    profile: currentUserProfile, 
    bioVisibility, setBioVisibility, 
    intentionVisibility, setIntentionVisibility, 
    linkedinVisibility, setLinkedinVisibility,
    canHelpWithVisibility, setCanHelpWithVisibility,
    needHelpWithVisibility, setNeedHelpWithVisibility,
    pronouns: currentUserPronouns,
    // NEW: Individual profile states from context for current user's profile
    bio: currentUserBio,
    intention: currentUserIntention,
    canHelpWith: currentUserCanHelpWith,
    needHelpWith: currentUserNeedHelpWith,
    sociability: currentUserSociability,
    organization: currentUserOrganization,
    linkedinUrl: currentUserLinkedinUrl,
    friendStatuses, // NEW: Import friendStatuses directly
  } = useProfile();
  const { areToastsEnabled } = useTimer();
  const [targetProfile, setTargetProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const [adjustedPosition, setAdjustedPosition] = useState<{ x: number; y: number } | null>(null);

  const getDisplayVisibilityStatus = useCallback((visibility: ('public' | 'friends' | 'organisation' | 'private')[]): string => {
    if (visibility.includes('private')) return 'private';
    if (visibility.includes('public')) return 'public';
    if (visibility.includes('friends') && visibility.includes('organisation')) return 'friends & organisation only';
    if (visibility.includes('friends')) return 'friends only';
    if (visibility.includes('organisation')) return 'organisation only';
    return 'public';
  }, []);

  const getDisplayFieldName = useCallback((fieldName: 'bio_visibility' | 'intention_visibility' | 'linkedin_visibility' | 'can_help_with_visibility' | 'need_help_with_visibility'): string => {
    switch (fieldName) {
      case 'bio_visibility': return 'Bio';
      case 'intention_visibility': return 'Intention';
      case 'linkedin_visibility': return 'LinkedIn';
      case 'can_help_with_visibility': return 'Can Help With';
      case 'need_help_with_visibility': return 'Need Help With';
      default: return '';
    }
  }, []);

  const handleLabelClick = useCallback(async (
    currentVisibility: ('public' | 'friends' | 'organisation' | 'private')[], 
    visibilitySetter: React.Dispatch<React.SetStateAction<('public' | 'friends' | 'organisation' | 'private')[]>>,
    fieldName: 'bio_visibility' | 'intention_visibility' | 'linkedin_visibility' | 'can_help_with_visibility' | 'need_help_with_visibility'
  ) => {
    const currentIndex = getIndexFromVisibility(currentVisibility);
    const nextIndex = (currentIndex + 1) % VISIBILITY_OPTIONS_MAP.length;
    const newVisibility = VISIBILITY_OPTIONS_MAP[nextIndex] as ('public' | 'friends' | 'organisation' | 'private')[];
    
    visibilitySetter(newVisibility);
    
    if (areToastsEnabled) {
      const successMessage = `${getDisplayFieldName(fieldName)} is now ${getDisplayVisibilityStatus(newVisibility)}.`;
      toast.success("Privacy Setting Changed", {
        description: successMessage,
      });
    }
  }, [areToastsEnabled, getDisplayFieldName, getDisplayVisibilityStatus]);

  useEffect(() => {
    const fetchTargetProfile = () => {
      if (targetUserId) {
        setLoading(true);
        setError(null);
        
        if (currentUserProfile && targetUserId === currentUserProfile.id) {
          // Use individual states from context for current user's profile
          setTargetProfile({
            ...currentUserProfile,
            bio: currentUserBio,
            intention: currentUserIntention,
            linkedin_url: currentUserLinkedinUrl,
            can_help_with: currentUserCanHelpWith,
            need_help_with: currentUserNeedHelpWith,
            sociability: currentUserSociability,
            organization: currentUserOrganization,
            pronouns: currentUserPronouns,
            bio_visibility: bioVisibility,
            intention_visibility: intentionVisibility,
            linkedin_visibility: linkedinVisibility,
            can_help_with_visibility: canHelpWithVisibility,
            need_help_with_visibility: needHelpWithVisibility,
          });
          setLoading(false);
        } else {
          try {
            const fetchedProfile = getPublicProfile(targetUserId, targetUserName || "Unknown User");
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
  }, [
    isPopUpOpen, targetUserId, targetUserName, getPublicProfile, currentUserProfile, 
    bioVisibility, intentionVisibility, linkedinVisibility, canHelpWithVisibility, needHelpWithVisibility, 
    currentUserPronouns, currentUserBio, currentUserIntention, currentUserCanHelpWith, currentUserNeedHelpWith,
    currentUserSociability, currentUserOrganization, currentUserLinkedinUrl
  ]);

  useLayoutEffect(() => {
    if (isPopUpOpen && popUpPosition && cardRef.current) {
      const cardRect = cardRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const margin = 5; // Reduced margin to 5px

      let newX;
      if (isMobile) {
        newX = viewportWidth - cardRect.width - margin; // Flush right on mobile
      } else {
        newX = popUpPosition.x + 30; // Increased offset to move it further right on desktop
      }
      
      let newY = popUpPosition.y + 10;

      // Ensure it doesn't go off-screen
      if (newX + cardRect.width + margin > viewportWidth) {
        newX = viewportWidth - cardRect.width - margin;
      }
      if (newY + cardRect.height + margin > viewportHeight) {
        newY = viewportHeight - cardRect.height - margin;
      }
      if (newX < margin) {
        newX = margin;
      }
      if (newY < margin) {
        newY = margin;
      }

      setAdjustedPosition({ x: newX, y: newY });
    }
  }, [isPopUpOpen, popUpPosition, targetProfile, loading, error, isMobile]);

  useEffect(() => {
    const handleTemporaryClick = (event: MouseEvent) => {
      event.stopPropagation();
      event.preventDefault(); // Prevent default action for the click event
      document.removeEventListener('click', handleTemporaryClick, true); // Remove itself after one use
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        closeProfilePopUp();
        // After closing, prevent the subsequent click event from triggering on the underlying element
        document.addEventListener('click', handleTemporaryClick, true); // Use capture phase to catch it early
      }
    };

    if (isPopUpOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
      // Also ensure any lingering temporary click listeners are removed if the pop-up closes by other means
      document.removeEventListener('click', handleTemporaryClick, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('click', handleTemporaryClick, true); // Cleanup on unmount
    };
  }, [isPopUpOpen, closeProfilePopUp]);

  if (!isPopUpOpen || !popUpPosition) {
    return null;
  }

  const style: React.CSSProperties = {
    position: 'fixed',
    left: adjustedPosition?.x,
    top: adjustedPosition?.y,
    zIndex: 10000,
  };

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
    const isCurrentUserProfile = currentUserProfile && targetProfile.id === currentUserProfile.id;
    // Use the directly imported friendStatuses
    const currentFriendStatus = currentUserProfile?.id && friendStatuses[targetProfile.id] ? friendStatuses[targetProfile.id] : 'none';

    const isFieldVisible = (fieldVisibility: ('public' | 'friends' | 'organisation' | 'private')[] | null | undefined) => {
      if (isCurrentUserProfile) return true;
      if (!fieldVisibility || fieldVisibility.includes('private')) return false;
      
      const isFriend = currentFriendStatus === 'friends';
      const isOrgMember = currentUserProfile?.organization && targetProfile.organization && currentUserProfile.organization === targetProfile.organization;

      return (
        fieldVisibility.includes('public') ||
        (fieldVisibility.includes('friends') && isFriend) ||
        (fieldVisibility.includes('organisation') && isOrgMember)
      );
    };

    // Check if all fields are private for non-current user
    const allFieldsPrivate = 
      (!targetProfile.bio || !isFieldVisible(targetProfile.bio_visibility)) &&
      (!targetProfile.intention || !isFieldVisible(targetProfile.intention_visibility)) &&
      (!targetProfile.can_help_with || !isFieldVisible(targetProfile.can_help_with_visibility)) &&
      (!targetProfile.need_help_with || !isFieldVisible(targetProfile.need_help_with_visibility)) &&
      (!targetProfile.linkedin_url || !isFieldVisible(targetProfile.linkedin_visibility));

    if (!isCurrentUserProfile && allFieldsPrivate) {
      return (
        <div className="text-center space-y-2">
          <User className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="font-bold text-lg">{displayName}</p>
          <p className="text-sm text-muted-foreground">This profile is private.</p>
        </div>
      );
    }

    const currentBioVisibility = isCurrentUserProfile ? bioVisibility : (targetProfile.bio_visibility || ['public']);
    const currentIntentionVisibility = isCurrentUserProfile ? intentionVisibility : (targetProfile.intention_visibility || ['public']);
    const currentCanHelpWithVisibility = isCurrentUserProfile ? canHelpWithVisibility : (targetProfile.can_help_with_visibility || ['public']);
    const currentNeedHelpWithVisibility = isCurrentUserProfile ? needHelpWithVisibility : (targetProfile.need_help_with_visibility || ['public']);
    const currentLinkedinVisibility = isCurrentUserProfile ? linkedinVisibility : (targetProfile.linkedin_visibility || ['public']);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <User className="h-6 w-6 text-primary" />
          <h3 className="font-bold text-xl">{displayName}</h3>
          {targetProfile.pronouns && ( // Display pronouns if available
            <span className="text-sm text-muted-foreground ml-1">({targetProfile.pronouns})</span>
          )}
          
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
                  // Assuming sendFriendRequest is available in useProfile
                  // sendFriendRequest(targetProfile.id); 
                  if (areToastsEnabled) toast.info("Friend request functionality not implemented in demo.");
                } else if (currentFriendStatus === 'friends') {
                  // Assuming removeFriend is available in useProfile
                  // removeFriend(targetProfile.id);
                  if (areToastsEnabled) toast.info("Remove friend functionality not implemented in demo.");
                }
              }}
              disabled={currentFriendStatus === 'pending'}
            >
              {currentFriendStatus === 'none' && (
                <UserPlus size={18} />
              )}
              {currentFriendStatus === 'pending' && (
                <UserPlus size={18} className="opacity-50" />
              )}
              {currentFriendStatus === 'friends' && (
                <UserCheck size={18} />
              )}
            </Button>
          )}
        </div>

        {targetProfile.bio && isFieldVisible(targetProfile.bio_visibility as ('public' | 'friends' | 'organisation' | 'private')[]) && (
          <div>
            <h4 
              className={cn(
                "font-semibold flex items-center gap-2 text-sm text-muted-foreground",
                isCurrentUserProfile && "cursor-pointer select-none",
                getPrivacyColorClassFromIndex(getIndexFromVisibility(currentBioVisibility))
              )}
              onClick={isCurrentUserProfile ? () => handleLabelClick(currentBioVisibility, setBioVisibility, 'bio_visibility') : undefined}
            >
              <MessageSquare size={16} /> Bio
            </h4>
            <p className="text-sm text-foreground mt-1">{targetProfile.bio}</p>
          </div>
        )}

        {targetProfile.intention && isFieldVisible(targetProfile.intention_visibility as ('public' | 'friends' | 'organisation' | 'private')[]) && (
          <div>
            <h4 
              className={cn(
                "font-semibold flex items-center gap-2 text-sm text-muted-foreground",
                isCurrentUserProfile && "cursor-pointer select-none",
                getPrivacyColorClassFromIndex(getIndexFromVisibility(currentIntentionVisibility))
              )}
              onClick={isCurrentUserProfile ? () => handleLabelClick(currentIntentionVisibility, setIntentionVisibility, 'intention_visibility') : undefined}
            >
              <Lightbulb size={16} /> Intention
            </h4>
            <p className="text-sm text-foreground mt-1">{targetProfile.intention}</p>
          </div>
        )}

        {/* NEW: Can Help With */}
        {targetProfile.can_help_with && isFieldVisible(targetProfile.can_help_with_visibility as ('public' | 'friends' | 'organisation' | 'private')[]) && (
          <div>
            <h4 
              className={cn(
                "font-semibold flex items-center gap-2 text-sm text-muted-foreground",
                isCurrentUserProfile && "cursor-pointer select-none",
                getPrivacyColorClassFromIndex(getIndexFromVisibility(currentCanHelpWithVisibility))
              )}
              onClick={isCurrentUserProfile ? () => handleLabelClick(currentCanHelpWithVisibility, setCanHelpWithVisibility, 'can_help_with_visibility') : undefined}
            >
              <Handshake size={16} /> Can Help With
            </h4>
            <p className="text-sm text-foreground mt-1">{targetProfile.can_help_with}</p>
          </div>
        )}

        {/* NEW: Need Help With */}
        {targetProfile.need_help_with && isFieldVisible(targetProfile.need_help_with_visibility as ('public' | 'friends' | 'organisation' | 'private')[]) && (
          <div>
            <h4 
              className={cn(
                "font-semibold flex items-center gap-2 text-sm text-muted-foreground",
                isCurrentUserProfile && "cursor-pointer select-none",
                getPrivacyColorClassFromIndex(getIndexFromVisibility(currentNeedHelpWithVisibility))
              )}
              onClick={isCurrentUserProfile ? () => handleLabelClick(currentNeedHelpWithVisibility, setNeedHelpWithVisibility, 'need_help_with_visibility') : undefined}
            >
              <HelpCircle size={16} /> Need Help With
            </h4>
            <p className="text-sm text-foreground mt-1">{targetProfile.need_help_with}</p>
          </div>
        )}

        {targetProfile.sociability !== null && (isFieldVisible(targetProfile.bio_visibility as ('public' | 'friends' | 'organisation' | 'private')[]) || isFieldVisible(targetProfile.intention_visibility as ('public' | 'friends' | 'organisation' | 'private')[]) || isFieldVisible(targetProfile.linkedin_visibility as ('public' | 'friends' | 'organisation' | 'private')[]) || isFieldVisible(targetProfile.can_help_with_visibility as ('public' | 'friends' | 'organisation' | 'private')[]) || isFieldVisible(targetProfile.need_help_with_visibility as ('public' | 'friends' | 'organisation' | 'private')[])) && (
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

        {targetProfile.organization && (isFieldVisible(targetProfile.bio_visibility as ('public' | 'friends' | 'organisation' | 'private')[]) || isFieldVisible(targetProfile.intention_visibility as ('public' | 'friends' | 'organisation' | 'private')[]) || isFieldVisible(targetProfile.linkedin_visibility as ('public' | 'friends' | 'organisation' | 'private')[]) || isFieldVisible(targetProfile.can_help_with_visibility as ('public' | 'friends' | 'organisation' | 'private')[]) || isFieldVisible(targetProfile.need_help_with_visibility as ('public' | 'friends' | 'organisation' | 'private')[])) && (
          <div>
            <h4 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 size={16} /> Organization
            </h4>
            <p className="text-sm text-foreground mt-1">{targetProfile.organization}</p>
          </div>
        )}

        {targetProfile.linkedin_url && isFieldVisible(targetProfile.linkedin_visibility as ('public' | 'friends' | 'organisation' | 'private')[]) && (
          <div>
            <h4 
              className={cn(
                "font-semibold flex items-center gap-2 text-sm text-muted-foreground",
                isCurrentUserProfile && "cursor-pointer select-none",
                getPrivacyColorClassFromIndex(getIndexFromVisibility(currentLinkedinVisibility))
              )}
              onClick={isCurrentUserProfile ? () => handleLabelClick(currentLinkedinVisibility, setLinkedinVisibility, 'linkedin_visibility') : undefined}
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