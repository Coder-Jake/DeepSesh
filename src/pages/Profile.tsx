import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useEffect, useState, useRef, useCallback } from "react";
import { useProfile } from "@/contexts/ProfileContext";
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Linkedin, Clipboard, Key, Users, UserMinus, HelpCircle, Handshake, ChevronDown, ChevronUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn, VISIBILITY_OPTIONS_MAP, getIndexFromVisibility, getPrivacyColorClassFromIndex, getSociabilityGradientColor } from "@/lib/utils";
import { useTimer } from "@/contexts/TimerContext";
import { useProfilePopUp } from "@/contexts/ProfilePopUpContext";
import { ProfileUpdate, ProfileDataJsonb } from "@/contexts/ProfileContext"; // NEW: Import ProfileUpdate and ProfileDataJsonb

const PRONOUN_OPTIONS = ["", "They/Them", "She/Her", "He/Him"];

const Profile = () => {
  const {
    profile, loading, updateProfile, localFirstName, setLocalFirstName, hostCode, setHostCode,
    // Individual states from context
    bio, setBio,
    intention, setIntention,
    canHelpWith, setCanHelpWith,
    needHelpWith, setNeedHelpWith,
    focusPreference, setFocusPreference,
    organization, setOrganization,
    linkedinUrl, setLinkedinUrl,
    pronouns, setPronouns,
    // Visibility states from context
    bioVisibility, setBioVisibility,
    intentionVisibility, setIntentionVisibility,
    linkedinVisibility, setLinkedinVisibility,
    canHelpWithVisibility, setCanHelpWithVisibility,
    needHelpWithVisibility, setNeedHelpWithVisibility,
    friendStatuses, getPublicProfile, blockedUsers, blockUser, unblockUser,
  } = useProfile();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isRunning, isPaused, isScheduleActive, isSchedulePrepared, isSchedulePending, areToastsEnabled } = useTimer();
  const { toggleProfilePopUp } = useProfilePopUp();

  const [currentPronounIndex, setCurrentPronounIndex] = useState(0);

  const [isEditingHostCode, setIsEditingHostCode] = useState(false);
  const hostCodeInputRef = useRef<HTMLInputElement>(null);
  const [isCopied, setIsCopied] = useState(false);

  const [hasChanges, setHasChanges] = useState(false);

  const [originalValues, setOriginalValues] = useState({
    firstName: "",
    bio: "",
    intention: "",
    canHelpWith: "",
    needHelpWith: "",
    focusPreference: 50,
    organization: "",
    linkedinUrl: "",
    hostCode: "",
    bioVisibility: ['public'] as ("public" | "friends" | "organisation" | "private")[],
    intentionVisibility: ['public'] as ("public" | "friends" | "organisation" | "private")[],
    linkedinVisibility: ['public'] as ("public" | "friends" | "organisation" | "private")[],
    canHelpWithVisibility: ['public'] as ("public" | "friends" | "organisation" | "private")[],
    needHelpWithVisibility: ['public'] as ("public" | "friends" | "organisation" | "private")[],
    pronouns: null as string | null,
  });

  const [isEditingFirstName, setIsEditingFirstName] = useState(false);
  const firstNameInputRef = useRef<HTMLInputElement>(null);

  const [isOrganizationDialogOpen, setIsOrganizationDialogOpen] = useState(false);

  const isTimerActive = isRunning || isPaused || isScheduleActive || isSchedulePrepared || isSchedulePending;

  const longPressRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  const [bioLabelColorIndex, setBioLabelColorIndex] = useState(0);
  const [intentionLabelColorIndex, setIntentionLabelColorIndex] = useState(0);
  const [canHelpWithLabelColorIndex, setCanHelpWithLabelColorIndex] = useState(0);
  const [needHelpWithLabelColorIndex, setNeedHelpWithLabelColorIndex] = useState(0);
  const [linkedinLabelColorIndex, setLinkedinLabelColorIndex] = useState(0);

  const [longPressedFriendId, setLongPressedFriendId] = useState<string | null>(null);
  const friendLongPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [isKeyTooltipOpen, setIsKeyTooltipOpen] = useState(false);
  const keyTooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getDisplayVisibilityStatus = useCallback((visibility: ("public" | "friends" | "organisation" | "private")[] | null): string => {
    if (!visibility || visibility.length === 0) return 'public';
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

  const handleLabelClick = useCallback(async (
    currentVisibility: ("public" | "friends" | "organisation" | "private")[],
    visibilitySetter: React.Dispatch<React.SetStateAction<("public" | "friends" | "organisation" | "private")[]>>,
    fieldName: keyof ProfileDataJsonb
  ) => {
    const currentIndex = getIndexFromVisibility(currentVisibility);
    const nextIndex = (currentIndex + 1) % VISIBILITY_OPTIONS_MAP.length;
    const newVisibility = VISIBILITY_OPTIONS_MAP[nextIndex] as ("public" | "friends" | "organisation" | "private")[];

    visibilitySetter(newVisibility);

    if (areToastsEnabled) {
      const successMessage = `${getDisplayFieldName(fieldName)} is now ${getDisplayVisibilityStatus(newVisibility)}.`;
      toast.success("Privacy Setting Changed", {
        description: successMessage,
      });
    }

    // Update profile context immediately
    const updatePayload: ProfileUpdate = {
      [fieldName]: { value: profile?.profile_data[fieldName]?.value || null, visibility: newVisibility }
    };
    await updateProfile(updatePayload);
  }, [areToastsEnabled, getDisplayFieldName, getDisplayVisibilityStatus, updateProfile, profile]);

  const handleLongPressStart = (callback: () => void) => {
    isLongPress.current = false;
    longPressRef.current = setTimeout(() => {
      isLongPress.current = true;
      callback();
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
    }
    isLongPress.current = false;
  };

  const handleFocusPreferenceLongPress = () => {
    if (isLongPress.current) {
      navigate('/profile#social-preferences');
    }
  };

  const handleNameClick = useCallback(async (userId: string, userName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const targetProfileData = getPublicProfile(userId, userName);
    if (targetProfileData) {
      toggleProfilePopUp(targetProfileData.id, targetProfileData.first_name || userName, event.clientX, event.clientY);
    } else {
      toggleProfilePopUp(userId, userName, event.clientX, event.clientY);
    }
  }, [toggleProfilePopUp, getPublicProfile]);

  const handleFriendLongPressStart = useCallback((friendId: string) => {
    friendLongPressTimerRef.current = setTimeout(() => {
      setLongPressedFriendId(friendId);
    }, 500);
  }, []);

  const handleFriendLongPressEnd = useCallback(() => {
    if (friendLongPressTimerRef.current) {
      clearTimeout(friendLongPressTimerRef.current);
    }
  }, []);

  const handleFriendClick = useCallback((friendId: string, userName: string, event: React.MouseEvent) => {
    if (longPressedFriendId === friendId) {
      setLongPressedFriendId(null);
    } else {
      handleNameClick(friendId, userName, event);
    }
  }, [longPressedFriendId, handleNameClick]);

  const handleUnfriend = useCallback((friendId: string) => {
    // TODO: Implement actual unfriend logic here
    if (areToastsEnabled) {
      toast.info("Unfriend Action", {
        description: `Unfriending user with ID: ${friendId}`,
      });
    }
    setLongPressedFriendId(null);
  }, [areToastsEnabled]);

  const handlePronounCycle = useCallback(async () => {
    const nextIndex = (currentPronounIndex + 1) % PRONOUN_OPTIONS.length;
    const newPronoun = PRONOUN_OPTIONS[nextIndex];
    setCurrentPronounIndex(nextIndex);
    setPronouns(newPronoun === "" ? null : newPronoun);

    if (areToastsEnabled) {
      toast.info("Pronouns Updated", {
        description: newPronoun === "" ? "Your pronouns are now hidden." : `Your pronouns are set to '${newPronoun}'.`,
      });
    }
    await updateProfile({ pronouns: { value: newPronoun === "" ? null : newPronoun, visibility: ['public'] } }); // Assuming pronouns are always public
  }, [currentPronounIndex, setPronouns, areToastsEnabled, updateProfile]);

  // Effect to initialize originalValues and color indices from context states
  useEffect(() => {
    if (!loading && profile) {
      setOriginalValues({
        firstName: localFirstName || "You",
        bio: bio || "",
        intention: intention || "",
        canHelpWith: canHelpWith || "",
        needHelpWith: needHelpWith || "",
        focusPreference: focusPreference || 50,
        organization: organization || "",
        linkedinUrl: linkedinUrl ? (linkedinUrl.startsWith("https://www.linkedin.com/in/") ? linkedinUrl.substring("https://www.linkedin.com/in/".length) : linkedinUrl) : "",
        hostCode: hostCode || "",
        bioVisibility: bioVisibility || ['public'],
        intentionVisibility: intentionVisibility || ['public'],
        linkedinVisibility: linkedinVisibility || ['public'],
        canHelpWithVisibility: canHelpWithVisibility || ['public'],
        needHelpWithVisibility: needHelpWithVisibility || ['public'],
        pronouns: pronouns || null,
      });

      setCurrentPronounIndex(PRONOUN_OPTIONS.indexOf(pronouns || ""));
      setBioLabelColorIndex(getIndexFromVisibility(bioVisibility || ['public']));
      setIntentionLabelColorIndex(getIndexFromVisibility(intentionVisibility || ['public']));
      setLinkedinLabelColorIndex(getIndexFromVisibility(linkedinVisibility || ['public']));
      setCanHelpWithLabelColorIndex(getIndexFromVisibility(canHelpWithVisibility || ['public']));
      setNeedHelpWithLabelColorIndex(getIndexFromVisibility(needHelpWithVisibility || ['public']));
      setHasChanges(false);
    }
  }, [
    loading, profile, localFirstName, bio, intention, canHelpWith, needHelpWith, focusPreference, organization, linkedinUrl, hostCode,
    bioVisibility, intentionVisibility, linkedinVisibility, canHelpWithVisibility, needHelpWithVisibility, pronouns
  ]);

  useEffect(() => {
    if (isEditingFirstName && firstNameInputRef.current) {
      firstNameInputRef.current.focus();
      firstNameInputRef.current.select();
    }
  }, [isEditingFirstName]);

  useEffect(() => {
    if (isEditingHostCode && hostCodeInputRef.current) {
      hostCodeInputRef.current.focus();
      hostCodeInputRef.current.select();
    }
  }, [isEditingHostCode]);

  const checkForChanges = useCallback(() => {
    const currentLinkedinUsername = linkedinUrl ? (linkedinUrl.startsWith("https://www.linkedin.com/in/")
                                    ? linkedinUrl.substring("https://www.linkedin.com/in/".length)
                                    : linkedinUrl) : "";

    const changed = localFirstName !== originalValues.firstName ||
                   bio !== originalValues.bio ||
                   intention !== originalValues.intention ||
                   canHelpWith !== originalValues.canHelpWith ||
                   needHelpWith !== originalValues.needHelpWith ||
                   focusPreference !== originalValues.focusPreference ||
                   organization !== originalValues.organization ||
                   currentLinkedinUsername !== originalValues.linkedinUrl ||
                   hostCode !== originalValues.hostCode ||
                   JSON.stringify(bioVisibility) !== JSON.stringify(originalValues.bioVisibility) ||
                   JSON.stringify(intentionVisibility) !== JSON.stringify(originalValues.intentionVisibility) ||
                   JSON.stringify(linkedinVisibility) !== JSON.stringify(originalValues.linkedinVisibility) ||
                   JSON.stringify(canHelpWithVisibility) !== JSON.stringify(originalValues.canHelpWithVisibility) ||
                   JSON.stringify(needHelpWithVisibility) !== JSON.stringify(originalValues.needHelpWithVisibility) ||
                   pronouns !== originalValues.pronouns;
    setHasChanges(changed);
  }, [
    localFirstName, bio, intention, canHelpWith, needHelpWith, focusPreference, organization, linkedinUrl, hostCode,
    bioVisibility, intentionVisibility, linkedinVisibility, canHelpWithVisibility, needHelpWithVisibility,
    pronouns,
    originalValues
  ]);

  useEffect(() => {
    checkForChanges();
  }, [
    localFirstName, bio, intention, canHelpWith, needHelpWith, focusPreference, organization, linkedinUrl, hostCode,
    bioVisibility, intentionVisibility, linkedinVisibility, canHelpWithVisibility, needHelpWithVisibility,
    pronouns,
    checkForChanges
  ]);

  const handleHostCodeClick = () => {
    setIsEditingHostCode(true);
  };

  const handleHostCodeInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditingHostCode(false);
      e.currentTarget.blur();
      await validateAndSaveHostCode(hostCode || "");
    }
  };

  const handleHostCodeInputBlur = async () => {
    setIsEditingHostCode(false);
    await validateAndSaveHostCode(hostCode || "");
  };

  const validateAndSaveHostCode = async (code: string) => {
    const trimmedCode = code.trim();
    if (trimmedCode.length < 4 || trimmedCode.length > 20) {
      if (areToastsEnabled) {
        toast.error("Invalid Host Code", {
          description: "Host code must be between 4 and 20 characters.",
        });
      }
      return;
    }
    await updateProfile({ host_code: trimmedCode }, "Host Code Saved!");
  };

  const handleFirstNameClick = () => {
    setIsEditingFirstName(true);
  };

  const handleFirstNameInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditingFirstName(false);
      e.currentTarget.blur();
      const nameToSave = localFirstName.trim() === "" ? "You" : localFirstName.trim();
      await updateProfile({ first_name: nameToSave }, "First Name Saved!");
    }
  };

  const handleFirstNameInputBlur = async () => {
    setIsEditingFirstName(false);
    const nameToSave = localFirstName.trim() === "" ? "You" : localFirstName.trim();
    await updateProfile({ first_name: nameToSave }, "First Name Saved!");
  };

  const handleSaveOrganization = async () => {
    const trimmedOrganization = organization?.trim() || "";
    await updateProfile({ organization: trimmedOrganization === "" ? null : trimmedOrganization }, "Organization Saved!");
    setIsOrganizationDialogOpen(false);
  };

  const handleSave = async () => {
    const nameToSave = localFirstName.trim() === "" ? "You" : localFirstName.trim();

    const trimmedHostCode = hostCode?.trim() || "";
    if (trimmedHostCode.length < 4 || trimmedHostCode.length > 20) {
      if (areToastsEnabled) {
        toast.error("Invalid Host Code", {
          description: "Host code must be between 4 and 20 characters. Please correct it before saving.",
        });
      }
      return;
    }

    const dataToUpdate: ProfileUpdate = {
      first_name: nameToSave,
      focus_preference: focusPreference,
      organization: organization?.trim() === "" ? null : organization?.trim(),
      host_code: trimmedHostCode,
      // Update profile_data fields
      bio: { value: bio, visibility: bioVisibility },
      intention: { value: intention, visibility: intentionVisibility },
      linkedin_url: { value: (linkedinUrl === null || linkedinUrl.trim() === "") ? null : `https://www.linkedin.com/in/${linkedinUrl.trim()}`, visibility: linkedinVisibility },
      can_help_with: { value: canHelpWith, visibility: canHelpWithVisibility },
      need_help_with: { value: needHelpWith, visibility: needHelpWithVisibility },
      pronouns: { value: pronouns, visibility: ['public'] }, // Assuming pronouns are always public
    };

    await updateProfile(dataToUpdate);
    setHasChanges(false);
  };

  const handleCopyHostCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(hostCode || "");
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
      if (areToastsEnabled) {
        toast.success("Copied to clipboard!", {
          description: "Your host code has been copied.",
        });
      }
    } catch (err) {
      console.error('Failed to copy host code: ', err);
      if (areToastsEnabled) {
        toast.error("Copy Failed", {
          description: "Could not copy host code. Please try again.",
        });
    }
    }
  }, [hostCode, areToastsEnabled]);

  const handleCancel = useCallback(() => {
    // Revert all context states to their original values
    setLocalFirstName(originalValues.firstName);
    setBio(originalValues.bio);
    setIntention(originalValues.intention);
    setCanHelpWith(originalValues.canHelpWith);
    setNeedHelpWith(originalValues.needHelpWith);
    setFocusPreference(originalValues.focusPreference);
    setOrganization(originalValues.organization);
    setLinkedinUrl(originalValues.linkedinUrl);
    setHostCode(originalValues.hostCode);
    setPronouns(originalValues.pronouns);
    setCurrentPronounIndex(PRONOUN_OPTIONS.indexOf(originalValues.pronouns || ""));

    setBioVisibility(originalValues.bioVisibility);
    setIntentionVisibility(originalValues.intentionVisibility);
    setLinkedinVisibility(originalValues.linkedinVisibility);
    setCanHelpWithVisibility(originalValues.canHelpWithVisibility);
    setNeedHelpWithVisibility(originalValues.needHelpWithVisibility);

    setBioLabelColorIndex(getIndexFromVisibility(originalValues.bioVisibility));
    setIntentionLabelColorIndex(getIndexFromVisibility(originalValues.intentionVisibility));
    setLinkedinLabelColorIndex(getIndexFromVisibility(originalValues.linkedinVisibility));
    setCanHelpWithLabelColorIndex(getIndexFromVisibility(originalValues.canHelpWithVisibility));
    setNeedHelpWithLabelColorIndex(getIndexFromVisibility(originalValues.needHelpWithVisibility));

    setIsEditingFirstName(false);
    setIsEditingHostCode(false);
    setIsCopied(false);
    setHasChanges(false);
    setLongPressedFriendId(null);
  }, [
    originalValues, setLocalFirstName, setBio, setIntention, setCanHelpWith, setNeedHelpWith, setFocusPreference,
    setOrganization, setLinkedinUrl, setHostCode, setPronouns, setCurrentPronounIndex,
    setBioVisibility, setIntentionVisibility, setLinkedinVisibility, setCanHelpWithVisibility, setNeedHelpWithVisibility,
    setBioLabelColorIndex, setIntentionLabelColorIndex, setLinkedinLabelColorIndex, setCanHelpWithLabelColorIndex, setNeedHelpWithLabelColorIndex
  ]);

  const friends = Object.entries(friendStatuses)
    .filter(([, status]) => status === 'friends')
    .map(([userId]) => userId);

  const handleBlockUser = (userName: string) => {
    blockUser(userName);
  };

  const handleUnblockUser = (userName: string) => {
    unblockUser(userName);
  };

  const handleKeyTooltipClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsKeyTooltipOpen(true);
    if (keyTooltipTimeoutRef.current) {
      clearTimeout(keyTooltipTimeoutRef.current);
    }
    keyTooltipTimeoutRef.current = setTimeout(() => {
      setIsKeyTooltipOpen(false);
      keyTooltipTimeoutRef.current = null;
    }, 2000);
  };

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto pt-16 px-4 pb-4 lg:pt-20 lg:px-6 lg:pb-6 text-center text-muted-foreground">
        Loading profile...
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto pt-16 px-4 pb-[100px] lg:pt-20 lg:px-6 lg:pb-[100px]">
      <div className="mb-6 flex justify-between items-center relative">
        <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        {hasChanges && (
          <div className="absolute right-0">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="shadow-lg"
            >
              {loading ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        )}
      </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader className="relative">
              <CardTitle
                className="flex items-center gap-1 cursor-pointer select-none"
                onClick={handlePronounCycle}
              >
                <span>About</span>
                {isEditingFirstName ? (
                  <Input
                    ref={firstNameInputRef}
                    value={localFirstName}
                    onChange={(e) => setLocalFirstName(e.target.value)}
                    onKeyDown={handleFirstNameInputKeyDown}
                    onBlur={handleFirstNameInputBlur}
                    placeholder="your name"
                    className="text-lg font-semibold h-auto py-1 px-2 italic"
                  />
                ) : (
                  <span
                    className={cn(
                      "cursor-pointer select-none",
                      localFirstName === "You" && "animate-fade-in-out"
                    )}
                    onClick={(e) => { e.stopPropagation(); handleFirstNameClick(); }}
                  >
                    {localFirstName || "You"}
                  </span>
                )}
                {pronouns && (
                  <span className="text-sm text-muted-foreground ml-1">({pronouns})</span>
                )}
              </CardTitle>
                <Tooltip
                  open={isKeyTooltipOpen}
                  onOpenChange={(openState) => {
                    if (!openState && keyTooltipTimeoutRef.current) {
                      return;
                    }
                    setIsKeyTooltipOpen(openState);
                  }}
                  delayDuration={0}
                >
                  <TooltipTrigger asChild>
                    <Key
                      className="absolute top-4 right-4 h-4 w-4 text-muted-foreground cursor-help"
                      onClick={handleKeyTooltipClick}
                    />
                  </TooltipTrigger>
                  <TooltipContent className="p-2 select-none">
                    <p className="font-semibold mb-1">Visibility Settings:</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-green-600" />
                        <span className="font-bold text-foreground">Public</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-blue-500" />
                        <span className="font-bold text-foreground">Friends Only</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-red-500" />
                        <span className="font-bold text-foreground">Organisation Only</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-purple-500" />
                        <span className="font-bold text-foreground">Friends & Organisation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-gray-500" />
                        <span className="font-bold text-foreground">Private</span>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label
                  htmlFor="bio"
                  onClick={() => handleLabelClick(bioVisibility, setBioVisibility, 'bio')}
                  className={cn("cursor-pointer select-none", getPrivacyColorClassFromIndex(getIndexFromVisibility(bioVisibility)))}
                >
                  Brief Bio
                </Label>
                <Textarea
                  id="bio"
                  placeholder="Share a bit about yourself..."
                  value={bio || ""}
                  onChange={(e) => setBio(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label
                  htmlFor="intention"
                  onClick={() => handleLabelClick(intentionVisibility, setIntentionVisibility, 'intention')}
                  className={cn("cursor-pointer select-none", getPrivacyColorClassFromIndex(getIndexFromVisibility(intentionVisibility)))}
                >
                  Statement of Intention
                </Label>
                <Textarea
                  id="intention"
                  placeholder="What are you working on? Goals and intentions for upcoming sessions?"
                  value={intention || ""}
                  onChange={(e) => setIntention(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label
                  htmlFor="can-help-with"
                  onClick={() => handleLabelClick(canHelpWithVisibility, setCanHelpWithVisibility, 'can_help_with')}
                  className={cn("cursor-pointer select-none", getPrivacyColorClassFromIndex(getIndexFromVisibility(canHelpWithVisibility)))}
                >
                  <Handshake size={16} className="inline-block mr-1" /> I can help with
                </Label>
                <Textarea
                  id="can-help-with"
                  placeholder="e.g., React, TypeScript, UI/UX Design, Project Management"
                  value={canHelpWith || ""}
                  onChange={(e) => setCanHelpWith(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label
                  htmlFor="need-help-with"
                  onClick={() => handleLabelClick(needHelpWithVisibility, setNeedHelpWithVisibility, 'need_help_with')}
                  className={cn("cursor-pointer select-none", getPrivacyColorClassFromIndex(getIndexFromVisibility(needHelpWithVisibility)))}
                >
                  <HelpCircle size={16} className="inline-block mr-1" /> I need help with
                </Label>
                <Textarea
                  id="need-help-with"
                  placeholder="e.g., Backend integration, Advanced algorithms, Marketing strategy"
                  value={needHelpWith || ""}
                  onChange={(e) => setNeedHelpWith(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label
                  htmlFor="linkedin-username"
                  onClick={() => handleLabelClick(linkedinVisibility, setLinkedinVisibility, 'linkedin_url')}
                  className={cn("cursor-pointer select-none", getPrivacyColorClassFromIndex(getIndexFromVisibility(linkedinVisibility)))}
                >
                  LinkedIn Handle
                </Label>
                <div className="flex items-center gap-0 mt-2 border rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                  <span className="pl-3 pr-1 text-muted-foreground bg-input rounded-l-md py-2 text-sm">
                    linkedin.com/in/
                  </span>
                  <Input
                    id="linkedin-username"
                    type="text"
                    placeholder="yourusername"
                    value={linkedinUrl ? (linkedinUrl.startsWith("https://www.linkedin.com/in/") ? linkedinUrl.substring("https://www.linkedin.com/in/".length) : linkedinUrl) : ""}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="flex-1 border-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-l-none"
                  />
                  {linkedinUrl && (
                    <a
                      href={`https://www.linkedin.com/in/${linkedinUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 transition-colors p-2"
                      aria-label="Visit LinkedIn Profile"
                    >
                      <Linkedin size={20} />
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle id="social-preferences">Focus Preference</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-6">
                  How would you prefer to balance focus vs socialising?
                </p>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Banter</span>
                    <span>Deep Focus</span>
                  </div>
                  <div className="relative group">
                    <Slider
                      value={[focusPreference]}
                      onValueChange={(val) => setFocusPreference(val[0])}
                      max={100}
                      min={0}
                      step={1}
                      className="w-full"
                      rangeColor={getSociabilityGradientColor(focusPreference)}
                    />
                  </div>
                  <div
                    className="text-center mt-3 text-sm text-muted-foreground cursor-pointer select-none"
                    onMouseDown={() => handleLongPressStart(handleFocusPreferenceLongPress)}
                    onMouseUp={handleLongPressEnd}
                    onMouseLeave={handleLongPressEnd}
                    onTouchStart={() => handleLongPressStart(handleFocusPreferenceLongPress)}
                    onTouchEnd={handleLongPressEnd}
                    onClick={() => {
                      if (!isLongPress.current) {
                      }
                    }}
                  >
                    {focusPreference <= 20 && "Looking to collaborate/brainstorm"}
                    {focusPreference > 20 && focusPreference <= 40 && "Happy to chat while we work"}
                    {focusPreference > 40 && focusPreference <= 60 && "I don't mind"}
                    {focusPreference > 60 && focusPreference <= 80 && "Socialise only during breaks"}
                    {focusPreference > 80 && "Minimal interaction even during breaks"}
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-6 mt-6">
                <h3 className="text-lg font-semibold mb-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">Hosting Code</span>
                      </TooltipTrigger>
                      <TooltipContent className="select-none">
                        <p>Others can use this code to join your sessions.</p>
                      </TooltipContent>
                    </Tooltip>
                </h3>
                <div className="flex items-center gap-2">
                  {isEditingHostCode ? (
                    <Input
                      ref={hostCodeInputRef}
                      value={hostCode || ""}
                      onChange={(e) => setHostCode(e.target.value)}
                      onKeyDown={handleHostCodeInputKeyDown}
                      onBlur={handleHostCodeInputBlur}
                      placeholder="yourhostcode"
                      className="text-lg font-semibold h-auto py-1 px-2 italic flex-grow"
                      minLength={4}
                      maxLength={20}
                    />
                  ) : (
                    <span
                      className={cn(
                        "text-lg font-semibold flex-grow select-none",
                        "text-foreground cursor-pointer hover:text-primary"
                      )}
                      onClick={handleHostCodeClick}
                    >
                      {hostCode}
                    </span>
                  )}
                  {!isEditingHostCode && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCopyHostCode}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="Copy host code"
                    >
                      <Clipboard size={16} className={cn(isCopied ? "text-green-500" : "text-muted-foreground")} />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organisation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {organization ? (
                <p className="text-sm text-muted-foreground">
                  Currently affiliated with: <span className="font-medium text-foreground">{organization}</span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Not currently affiliated with an organisation.
                </p>
              )}
              <Button onClick={() => setIsOrganizationDialogOpen(true)}>
                {organization ? "Edit Organisation" : "Add Organisation"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Friends
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {friends.length > 0 ? (
                friends.map((friendId) => (
                  <div
                    key={friendId}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted cursor-pointer hover:bg-muted/80 relative"
                    onClick={(e) => handleFriendClick(friendId, friendId, e)}
                    onMouseDown={() => handleFriendLongPressStart(friendId)}
                    onMouseUp={handleFriendLongPressEnd}
                    onMouseLeave={handleFriendLongPressEnd}
                    onTouchStart={() => handleLongPressStart(() => handleFriendLongPressStart(friendId))} // FIX HERE
                    onTouchEnd={handleFriendLongPressEnd}
                  >
                    <p className="font-medium">{friendId}</p>
                    {longPressedFriendId === friendId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 hover:bg-red-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnfriend(friendId);
                        }}
                        aria-label={`Unfriend ${friendId}`}
                      >
                        <UserMinus size={20} />
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No friends yet. Send some requests!</p>
              )}
            </CardContent>
          </Card>
        </div>

        {hasChanges && (
          <div className="fixed bottom-4 right-4 z-50 transition-opacity duration-300 opacity-100 pointer-events-auto">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="shadow-lg"
            >
              {loading ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        )}

      {hasChanges && (
        <div className="fixed bottom-4 left-4 z-50">
          <Button
            onClick={handleCancel}
            className="shadow-lg bg-cancel text-cancel-foreground hover:bg-cancel/80"
          >
            Cancel
          </Button>
        </div>
      )}

      <Dialog open={isOrganizationDialogOpen} onOpenChange={setIsOrganizationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{organization ? "Edit Organisation Name" : "Add Organisation Name"}</DialogTitle>
            <DialogDescription>
              Enter the name of your organization. This will be visible to others.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="organization-name">Organisation Name</Label>
              <Input
                id="organization-name"
                value={organization || ""}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="e.g., StartSpace"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOrganizationDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveOrganization}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Profile;