import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useProfilePopUp } from '@/contexts/ProfilePopUpContext';
import { useProfile } from '@/contexts/ProfileContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, UserPlus, UserMinus, MessageSquare, Linkedin, HelpCircle, Handshake, Globe, Users, Building2, Lock } from 'lucide-react';
import { cn, getPrivacyColorClassFromIndex, getIndexFromVisibility } from '@/lib/utils';
import { toast } from 'sonner';

const ProfilePopUpCard = () => {
  const { 
    isOpen, 
    closeProfilePopUp, 
    profileId: targetProfileId, 
    profileName: targetProfileName, 
    position 
  } = useProfilePopUp();
  const { 
    profile: currentUserProfile, 
    getPublicProfile, 
    friendStatuses, 
    blockUser, 
    unblockUser 
  } = useProfile();
  const cardRef = useRef<HTMLDivElement>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [bioLabelColorIndex, setBioLabelColorIndex] = useState(0);
  const [intentionLabelColorIndex, setIntentionLabelColorIndex] = useState(0);
  const [linkedinLabelColorIndex, setLinkedinLabelColorIndex] = useState(0);
  const [canHelpWithLabelColorIndex, setCanHelpWithLabelColorIndex] = useState(0);
  const [needHelpWithLabelColorIndex, setNeedHelpWithLabelColorIndex] = useState(0);
  const [pronounsLabelColorIndex, setPronounsLabelColorIndex] = useState(0); // NEW

  const friendStatus = targetProfileId ? friendStatuses[targetProfileId] : 'none';

  const fetchTargetProfile = useCallback(async () => {
    if (!targetProfileId) {
      setProfileData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getPublicProfile(targetProfileId, targetProfileName || 'Unknown User');
      setProfileData(data);
      if (data) {
        setBioLabelColorIndex(getIndexFromVisibility(data.bio_visibility || ['public']));
        setIntentionLabelColorIndex(getIndexFromVisibility(data.intention_visibility || ['public']));
        setLinkedinLabelColorIndex(getIndexFromVisibility(data.linkedin_visibility || ['public']));
        setCanHelpWithLabelColorIndex(getIndexFromVisibility(data.can_help_with_visibility || ['public']));
        setNeedHelpWithLabelColorIndex(getIndexFromVisibility(data.need_help_with_visibility || ['public']));
        setPronounsLabelColorIndex(getIndexFromVisibility(data.pronouns_visibility || ['public'])); // NEW
      }
    } catch (err) {
      setError("Failed to load profile data.");
      console.error("Failed to fetch public profile:", err);
    } finally {
      setLoading(false);
    }
  }, [targetProfileId, targetProfileName, getPublicProfile]);

  useEffect(() => {
    if (isOpen) {
      fetchTargetProfile();
    } else {
      setProfileData(null);
      setLoading(true);
      setError(null);
    }
  }, [isOpen, fetchTargetProfile]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        closeProfilePopUp();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, closeProfilePopUp]);

  if (!isOpen) return null;

  const cardStyle: React.CSSProperties = {
    position: 'fixed',
    left: position.x,
    top: position.y,
    transform: 'translate(-50%, -50%)', // Center the card on the click position
    zIndex: 1000,
    maxWidth: '400px',
    width: '90vw',
  };

  const handleAddFriend = () => {
    if (targetProfileId) {
      toast.info("Friend Request Sent (Simulated)", {
        description: `A friend request has been sent to ${targetProfileName || 'this user'}.`,
      });
      // In a real app, you'd call an API to send a friend request
    }
  };

  const handleRemoveFriend = () => {
    if (targetProfileId) {
      toast.info("Friend Removed (Simulated)", {
        description: `${targetProfileName || 'This user'} has been removed from your friends.`,
      });
      // In a real app, you'd call an API to remove a friend
    }
  };

  const handleBlock = () => {
    if (targetProfileName) {
      blockUser(targetProfileName);
      closeProfilePopUp();
    }
  };

  const handleUnblock = () => {
    if (targetProfileName) {
      unblockUser(targetProfileName);
      closeProfilePopUp();
    }
  };

  const renderVisibilityIcon = (visibility: ('public' | 'friends' | 'organisation' | 'private')[] | null) => {
    if (!visibility || visibility.includes('private')) return <Lock size={14} className="text-gray-500 ml-1" />;
    if (visibility.includes('public')) return <Globe size={14} className="text-green-600 ml-1" />;
    if (visibility.includes('friends') && visibility.includes('organisation')) return <Users size={14} className="text-purple-500 ml-1" />;
    if (visibility.includes('friends')) return <Users size={14} className="text-blue-500 ml-1" />;
    if (visibility.includes('organisation')) return <Building2 size={14} className="text-red-500 ml-1" />;
    return null;
  };

  return (
    <Card ref={cardRef} style={cardStyle} className="p-4 shadow-2xl border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          {targetProfileName || "Loading..."}
          {profileData?.pronouns && ( // NEW: Display pronouns if available
            <span className="text-sm text-muted-foreground font-normal">({profileData.pronouns})</span>
          )}
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={closeProfilePopUp} className="text-muted-foreground">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {loading ? (
          <p className="text-muted-foreground">Loading profile details...</p>
        ) : error ? (
          <p className="text-destructive">{error}</p>
        ) : profileData ? (
          <>
            {profileData.bio && (
              <div>
                <p className={cn("font-semibold flex items-center", getPrivacyColorClassFromIndex(bioLabelColorIndex))}>
                  Bio {renderVisibilityIcon(profileData.bio_visibility)}
                </p>
                <p className="text-muted-foreground">{profileData.bio}</p>
              </div>
            )}

            {profileData.intention && (
              <div>
                <p className={cn("font-semibold flex items-center", getPrivacyColorClassFromIndex(intentionLabelColorIndex))}>
                  Intention {renderVisibilityIcon(profileData.intention_visibility)}
                </p>
                <p className="text-muted-foreground">{profileData.intention}</p>
              </div>
            )}

            {profileData.can_help_with && (
              <div>
                <p className={cn("font-semibold flex items-center", getPrivacyColorClassFromIndex(canHelpWithLabelColorIndex))}>
                  <Handshake size={14} className="inline-block mr-1" /> Can Help With {renderVisibilityIcon(profileData.can_help_with_visibility)}
                </p>
                <p className="text-muted-foreground">{profileData.can_help_with}</p>
              </div>
            )}

            {profileData.need_help_with && (
              <div>
                <p className={cn("font-semibold flex items-center", getPrivacyColorClassFromIndex(needHelpWithLabelColorIndex))}>
                  <HelpCircle size={14} className="inline-block mr-1" /> Need Help With {renderVisibilityIcon(profileData.need_help_with_visibility)}
                </p>
                <p className="text-muted-foreground">{profileData.need_help_with}</p>
              </div>
            )}

            {profileData.linkedin_url && (
              <div>
                <p className={cn("font-semibold flex items-center", getPrivacyColorClassFromIndex(linkedinLabelColorIndex))}>
                  LinkedIn {renderVisibilityIcon(profileData.linkedin_visibility)}
                </p>
                <a 
                  href={profileData.linkedin_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Linkedin size={16} /> {profileData.linkedin_url.replace('https://www.linkedin.com/in/', '')}
                </a>
              </div>
            )}

            {profileData.organization && (
              <div>
                <p className="font-semibold">Organization</p>
                <p className="text-muted-foreground">{profileData.organization}</p>
              </div>
            )}

            <div className="flex justify-around pt-4 border-t border-border mt-4">
              {targetProfileId !== currentUserProfile?.id && ( // Don't show friend/block options for self
                <>
                  {friendStatus === 'friends' ? (
                    <Button variant="outline" onClick={handleRemoveFriend} className="flex items-center gap-2">
                      <UserMinus size={16} /> Unfriend
                    </Button>
                  ) : (
                    <Button onClick={handleAddFriend} className="flex items-center gap-2">
                      <UserPlus size={16} /> Add Friend
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => toast.info("Message (Simulated)", { description: `Opening chat with ${targetProfileName}.` })} className="flex items-center gap-2">
                    <MessageSquare size={16} /> Message
                  </Button>
                </>
              )}
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">No profile data available.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfilePopUpCard;