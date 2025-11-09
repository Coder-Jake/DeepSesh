"use client";

import React, { useEffect, useState, useRef, useLayoutEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, User, MessageSquare, Lightbulb, Users, Building2, Linkedin, UserPlus, UserCheck, UserMinus, Handshake, HelpCircle } from 'lucide-react';
import { useProfilePopUp } from '@/contexts/ProfilePopUpContext';
import { useProfile } from '@/contexts/ProfileContext';
import { Profile, ProfileDataJsonb } from '@/contexts/ProfileContext'; // NEW: Import ProfileDataJsonb
import { cn, VISIBILITY_OPTIONS_MAP, getIndexFromVisibility, getPrivacyColorClassFromIndex, getSociabilityGradientColor } from '@/lib/utils';
import { toast } from 'sonner';
import { useTimer } from '@/contexts/TimerContext';
import { useIsMobile } from '@/hooks/use-mobile';

const ProfilePopUpCard: React.FC = () => {
  const { isPopUpOpen, targetUserId, targetUserName, popUpPosition, toggleProfilePopUp, closeProfilePopUp, setIsBlockingClicks } = useProfilePopUp();
  const {
    getPublicProfile,
    profile: currentUserProfile,
    // NEW: Individual profile states from context for current user's profile
    bio,
    intention,
    linkedinUrl,
    canHelpWith,
    needHelpWith,
    focusPreference: currentUserFocusPreference,
    organization: currentUserOrganization,
    pronouns: currentUserPronouns,
    // Visibility states from context
    bioVisibility,
    intentionVisibility,
    linkedinVisibility,
    canHelpWithVisibility,
    needHelpWithVisibility,
    friendStatuses,
  } = useProfile();
  const { areToastsEnabled } = useTimer();
  const [targetProfile, setTargetProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const [adjustedPosition, setAdjustedPosition] = useState<{ x: number; y: number } | null>(null);

  const getDisplayVisibilityStatus = useCallback((visibility: ("public" | "friends" | "organisation" | "private")[]): string => {
    if (visibility.includes('private')) return 'private';
    if (visibility.includes('public')) return 'public';
    if (visibility.includes('friends') && visibility.includes('organisation')) return 'friends & organisation only';
    if (visibility.includes('friends')) return 'friends only';
    if (visibility.includes('organisation')) return 'organisation only';
    return 'public';
  }, []);

  const getDisplayFieldName = useCallback((fieldName: keyof ProfileDataJsonb): string => {
    switch (fieldName) {
      case 'bio': return 'Bio';
      case 'intention': return 'Intention';
      case 'linkedin_url': return 'LinkedIn';
      case 'can_help_with': return 'Can Help With';
      case 'need_help_with': return 'Need Help With';
      case 'pronouns': return 'Pronouns';
      default: return '';
    }
  }, []);

  // REMOVED: handleLabelClick function as it's for editing, not viewing.
  // The ProfilePopUpCard should only display, not allow editing of the current user's profile.

  useEffect(() => {
    const fetchTargetProfile = () => {
      if (targetUserId) {
        setLoading(true);
        setError(null);

        if (currentUserProfile && targetUserId === currentUserProfile.id) {
          // Use individual states from context for current user's profile
          setTargetProfile({
            ...currentUserProfile,
            first_name: currentUserProfile.first_name,
            organization: currentUserOrganization,
            focus_preference: currentUserFocusPreference,
            profile_data: {
              bio: { value: bio, visibility: bioVisibility },
              intention: { value: intention, visibility: intentionVisibility },
              linkedin_url: { value: linkedinUrl, visibility: linkedinVisibility },
              can_help_with: { value: canHelpWith, visibility: canHelpWithVisibility },
              need_help_with: { value: needHelpWith, visibility: needHelpWithVisibility },
              pronouns: { value: currentUserPronouns, visibility: ['public'] },
            }
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
    bio, intention, linkedinUrl, canHelpWith, needHelpWith, currentUserPronouns,
    bioVisibility, intentionVisibility, linkedinVisibility, canHelpWithVisibility, needHelpWithVisibility,
    currentUserFocusPreference, currentUserOrganization
  ]);

  useLayoutEffect(() => {
    if (isPopUpOpen && popUpPosition && cardRef.current) {
      const cardRect = cardRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const margin = 5;

      let newX;
      if (isMobile) {
        newX = viewportWidth - cardRect.width - margin;
      } else {
        newX = popUpPosition.x + 30;
      }

      let newY = popUpPosition.y + 10;

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
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        closeProfilePopUp();
        setIsBlockingClicks(true);
        setTimeout(() => {
          setIsBlockingClicks(false);
        }, 100);
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
  }, [isPopUpOpen, closeProfilePopUp, setIsBlockingClicks]);

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
    const currentFriendStatus = currentUserProfile?.id && friendStatuses[targetProfile.id] ? friendStatuses[targetProfile.id] : 'none';

    const isFieldVisible = (field: ProfileDataJsonb[keyof ProfileDataJsonb] | null | undefined) => {
      if (isCurrentUserProfile) return true;
      if (!field || !field.value || field.visibility.includes('private')) return false;

      const isFriend = currentFriendStatus === 'friends';
      const isOrgMember = currentUserProfile?.organization && targetProfile.organization && currentUserProfile.organization === targetProfile.organization;

      return (
        field.visibility.includes('public') ||
        (field.visibility.includes('friends') && isFriend) ||
        (field.visibility.includes('organisation') && isOrgMember)
      );
    };

    const allFieldsPrivate =
      (!targetProfile.profile_data.bio?.value || !isFieldVisible(targetProfile.profile_data.bio)) &&
      (!targetProfile.profile_data.intention?.value || !isFieldVisible(targetProfile.profile_data.intention)) &&
      (!targetProfile.profile_data.can_help_with?.value || !isFieldVisible(targetProfile.profile_data.can_help_with)) &&
      (!targetProfile.profile_data.need_help_with?.value || !isFieldVisible(targetProfile.profile_data.need_help_with)) &&
      (!targetProfile.profile_data.linkedin_url?.value || !isFieldVisible(targetProfile.profile_data.linkedin_url));

    if (!isCurrentUserProfile && allFieldsPrivate && targetProfile.focus_preference === null) {
      return (
        <div className="text-center space-y-2">
          <User className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="font-bold text-lg">{displayName}</p>
          <p className="text-sm text-muted-foreground">This profile is private.</p>
        </div>
      );
    }

    const targetBio = targetProfile.profile_data.bio;
    const targetIntention = targetProfile.profile_data.intention;
    const targetCanHelpWith = targetProfile.profile_data.can_help_with;
    const targetNeedHelpWith = targetProfile.profile_data.need_help_with;
    const targetLinkedinUrl = targetProfile.profile_data.linkedin_url;
    const targetPronouns = targetProfile.profile_data.pronouns;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <User className="h-6 w-6 text-primary" />
          <h3 className="font-bold text-xl">{displayName}</h3>
          {targetPronouns?.value && isFieldVisible(targetPronouns) && (
            <span className="text-sm text-muted-foreground ml-1">({targetPronouns.value})</span>
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
                  if (areToastsEnabled) toast.info("Friend request functionality not implemented in demo.");
                } else if (currentFriendStatus === 'friends') {
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

        {targetBio?.value && isFieldVisible(targetBio) && (
          <div>
            <h4
              className={cn(
                "font-semibold flex items-center gap-2 text-sm text-muted-foreground",
                // Removed onClick handler for isCurrentUserProfile
                getPrivacyColorClassFromIndex(getIndexFromVisibility(targetBio.visibility))
              )}
            >
              <MessageSquare size={16} /> Bio
            </h4>
            <p className="text-sm text-foreground mt-1">{targetBio.value}</p>
          </div>
        )}

        {targetIntention?.value && isFieldVisible(targetIntention) && (
          <div>
            <h4
              className={cn(
                "font-semibold flex items-center gap-2 text-sm text-muted-foreground",
                // Removed onClick handler for isCurrentUserProfile
                getPrivacyColorClassFromIndex(getIndexFromVisibility(targetIntention.visibility))
              )}
            >
              <Lightbulb size={16} /> Intention
            </h4>
            <p className="text-sm text-foreground mt-1">{targetIntention.value}</p>
          </div>
        )}

        {targetCanHelpWith?.value && isFieldVisible(targetCanHelpWith) && (
          <div>
            <h4
              className={cn(
                "font-semibold flex items-center gap-2 text-sm text-muted-foreground",
                // Removed onClick handler for isCurrentUserProfile
                getPrivacyColorClassFromIndex(getIndexFromVisibility(targetCanHelpWith.visibility))
              )}
            >
              <Handshake size={16} /> Can Help With
            </h4>
            <p className="text-sm text-foreground mt-1">{targetCanHelpWith.value}</p>
          </div>
        )}

        {targetNeedHelpWith?.value && isFieldVisible(targetNeedHelpWith) && (
          <div>
            <h4
              className={cn(
                "font-semibold flex items-center gap-2 text-sm text-muted-foreground",
                // Removed onClick handler for isCurrentUserProfile
                getPrivacyColorClassFromIndex(getIndexFromVisibility(targetNeedHelpWith.visibility))
              )}
            >
              <HelpCircle size={16} /> Need Help With
            </h4>
            <p className="text-sm text-foreground mt-1">{targetNeedHelpWith.value}</p>
          </div>
        )}

        {targetProfile.focus_preference !== null && (
          <div>
            <h4 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground">
              <Users size={16} /> Focus Preference
            </h4>
            <div className="w-full bg-secondary rounded-full h-2 mt-1">
              <div
                className="h-2 rounded-full"
                style={{ width: `${targetProfile.focus_preference}%`, backgroundColor: getSociabilityGradientColor(targetProfile.focus_preference) }}
              ></div>
            </div>
            <p className="text-xs text-muted-foreground mt-1 text-right">{targetProfile.focus_preference}%</p>
          </div>
        )}

        {targetProfile.organization && (isFieldVisible(targetBio) || isFieldVisible(targetIntention) || isFieldVisible(targetLinkedinUrl) || isFieldVisible(targetCanHelpWith) || isFieldVisible(targetNeedHelpWith)) && (
          <div>
            <h4 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 size={16} /> Organization
            </h4>
            <p className="text-sm text-foreground mt-1">{targetProfile.organization}</p>
          </div>
        )}

        {targetLinkedinUrl?.value && isFieldVisible(targetLinkedinUrl) && (
          <div>
            <h4
              className={cn(
                "font-semibold flex items-center gap-2 text-sm text-muted-foreground",
                // Removed onClick handler for isCurrentUserProfile
                getPrivacyColorClassFromIndex(getIndexFromVisibility(targetLinkedinUrl.visibility))
              )}
            >
              <Linkedin size={16} /> LinkedIn
            </h4>
            <a
              href={targetLinkedinUrl.value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline text-sm mt-1 block"
            >
              {targetLinkedinUrl.value.replace('https://www.linkedin.com/in/', '')}
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