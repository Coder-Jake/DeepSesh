import React, { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
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
import { useAuth } from "@/contexts/AuthContext"; // Corrected import path
import { useNavigate } from "react-router-dom";
import { Linkedin, Clipboard, Users, UserMinus, HelpCircle, Handshake, ChevronDown, ChevronUp, Globe, UserStar, Building2, HeartHandshake, Lock, MessageSquare, Lightbulb } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn, VISIBILITY_OPTIONS_MAP, getIndexFromVisibility, getPrivacyColorClassFromIndex, getSociabilityGradientColor } from "@/lib/utils";
import { useTimer } from "@/contexts/TimerContext";
import { useProfilePopUp } from "@/contexts/ProfilePopUpContext";
import { ProfileUpdate, ProfileDataJsonb } from "@/contexts/ProfileContext";

const PRONOUN_OPTIONS = ["", "They/Them", "She/Her", "He/Him"];

// Define the shape of the original values
type OriginalValuesType = {
  firstName: string;
  bio: string;
  intention: string;
  canHelpWith: string;
  needHelpWith: string;
  focusPreference: number;
  organization: string;
  linkedinUrl: string; // raw username part
  joinCode: string; // RENAMED: hostCode to joinCode
  bioVisibility: ("public" | "friends" | "organisation" | "private")[];
  intentionVisibility: ("public" | "friends" | "organisation" | "private")[];
  linkedinVisibility: ("public" | "friends" | "organisation" | "private")[];
  canHelpWithVisibility: ("public" | "friends" | "organisation" | "private")[];
  needHelpWithVisibility: ("public" | "friends" | "organisation" | "private")[];
  pronouns: string | null;
  profileVisibility: ("public" | "friends" | "organisation" | "private")[];
};

const Profile = () => {
  const {
    profile, loading, updateProfile, getPublicProfile, blockedUsers, unblockUser, blockUser,
    friendStatuses,
    // Context setters are now only called on save
    setLocalFirstName: setContextFirstName,
    setBio: setContextBio,
    setIntention: setContextIntention,
    setCanHelpWith: setContextCanHelpWith,
    setNeedHelpWith: setContextNeedHelpWith,
    setFocusPreference: setContextFocusPreference,
    setOrganization: setContextOrganization,
    setLinkedinUrl: setContextLinkedinUrl,
    setJoinCode: setContextJoinCode, // RENAMED: setHostCode to setJoinCode
    setPronouns: setContextPronouns,
    setBioVisibility: setContextBioVisibility,
    setIntentionVisibility: setContextIntentionVisibility,
    setLinkedinVisibility: setContextLinkedinVisibility,
    setCanHelpWithVisibility: setContextCanHelpWithVisibility,
    setNeedHelpWithVisibility: setContextNeedHelpWithVisibility,
    profileVisibility: contextProfileVisibility,
    setProfileVisibility: setContextProfileVisibility,
  } = useProfile();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isRunning, isPaused, isScheduleActive, isSchedulePrepared, isSchedulePending, areToastsEnabled } = useTimer();
  const { toggleProfilePopUp } = useProfilePopUp();

  // Local states for editable fields
  const [firstNameInput, setFirstNameInput] = useState("You");
  const [bioInput, setBioInput] = useState<string | null>(null);
  const [intentionInput, setIntentionInput] = useState<string | null>(null);
  const [canHelpWithInput, setCanHelpWithInput] = useState<string | null>(null);
  const [needHelpWithInput, setNeedHelpWithInput] = useState<string | null>(null);
  const [focusPreferenceInput, setFocusPreferenceInput] = useState(50);
  const [organizationInput, setOrganizationInput] = useState<string | null>(null);
  const [linkedinUrlInput, setLinkedinUrlInput] = useState<string | null>(null); // Stores username part
  const [joinCodeInput, setJoinCodeInput] = useState<string | null>(null); // RENAMED: hostCodeInput to joinCodeInput
  const [pronounsInput, setPronounsInput] = useState<string | null>(null);

  // Local states for visibility settings
  const [bioVisibilityInput, setBioVisibilityInput] = useState<("public" | "friends" | "organisation" | "private")[]>(['public']);
  const [intentionVisibilityInput, setIntentionVisibilityInput] = useState<("public" | "friends" | "organisation" | "private")[]>(['public']);
  const [linkedinVisibilityInput, setLinkedinVisibilityInput] = useState<("public" | "friends" | "organisation" | "private")[]>(['public']);
  const [canHelpWithVisibilityInput, setCanHelpWithVisibilityInput] = useState<("public" | "friends" | "organisation" | "private")[]>(['public']);
  const [needHelpWithVisibilityInput, setNeedHelpWithVisibilityInput] = useState<("public" | "friends" | "organisation" | "private")[]>(['public']);
  const [profileVisibilityInput, setProfileVisibilityInput] = useState<("public" | "friends" | "organisation" | "private")[]>(['public']);

  const [currentPronounIndex, setCurrentPronounIndex] = useState(0);

  const [isEditingJoinCode, setIsEditingJoinCode] = useState(false); // RENAMED: isEditingHostCode to isEditingJoinCode
  const joinCodeInputRef = useRef<HTMLInputElement>(null); // RENAMED: hostCodeInputRef to joinCodeInputRef
  const [isCopied, setIsCopied] = useState(false);

  const [hasChanges, setHasChanges] = useState(false);
  const [originalValues, setOriginalValues] = useState<OriginalValuesType | null>(null);


  const [isEditingFirstName, setIsEditingFirstName] = useState(false);
  const firstNameInputRef = useRef<HTMLInputElement>(null);

  const [isOrganizationDialogOpen, setIsOrganizationDialogOpen] = useState(false);

  const isTimerActive = isRunning || isPaused || isScheduleActive || isSchedulePrepared || isSchedulePending;

  const longPressRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  // NEW: States for momentary tooltips (click-triggered)
  const [isBioClickTooltipOpen, setIsBioClickTooltipOpen] = useState(false);
  const [isIntentionClickTooltipOpen, setIsIntentionClickTooltipOpen] = useState(false);
  const [isLinkedinClickTooltipOpen, setIsLinkedinClickTooltipOpen] = useState(false);
  const [isCanHelpWithClickTooltipOpen, setIsCanHelpWithClickTooltipOpen] = useState(false);
  const [isNeedHelpWithClickTooltipOpen, setIsNeedHelpWithClickTooltipOpen] = useState(false);
  const clickTooltipTimeoutRefs = useRef<Record<string, NodeJS.Timeout>>({});

  // NEW: States for momentary tooltips (icon-hover-triggered)
  const [isBioIconHoverTooltipOpen, setIsBioIconHoverTooltipOpen] = useState(false);
  const bioIconHoverTooltipRef = useRef<NodeJS.Timeout | null>(null);
  const [isIntentionIconHoverTooltipOpen, setIsIntentionIconHoverTooltipOpen] = useState(false);
  const intentionIconHoverTooltipRef = useRef<NodeJS.Timeout | null>(null);
  const [isLinkedinIconHoverTooltipOpen, setIsLinkedinIconHoverTooltipOpen] = useState(false);
  const linkedinIconHoverTooltipRef = useRef<NodeJS.Timeout | null>(null);
  const [isCanHelpWithIconHoverTooltipOpen, setIsCanHelpWithIconHoverTooltipOpen] = useState(false);
  const canHelpWithIconHoverTooltipRef = useRef<NodeJS.Timeout | null>(null);
  const [isNeedHelpWithIconHoverTooltipOpen, setIsNeedHelpWithIconHoverTooltipOpen] = useState(false);
  const needHelpWithIconHoverTooltipRef = useRef<NodeJS.Timeout | null>(null);


  const [longPressedFriendId, setLongPressedFriendId] = useState<string | null>(null);
  const friendLongPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // NEW: Slider drag state and refs
  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);

  const getDisplayVisibilityStatus = useCallback((visibility: ("public" | "friends" | "organisation" | "private")[] | null): string => {
    if (!visibility || visibility.length === 0) return 'Public';
    if (visibility.includes('private')) return 'Private';
    if (visibility.includes('public')) return 'Public';
    if (visibility.includes('friends') && visibility.includes('organisation')) return 'Friends & Organisation';
    if (visibility.includes('friends')) return 'Friends Only';
    if (visibility.includes('organisation')) return 'Organisation Only';
    return 'Public';
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
    fieldName: keyof ProfileDataJsonb | 'profileVisibility',
    clickTooltipSetter: React.Dispatch<React.SetStateAction<boolean>> // NEW: Add clickTooltipSetter
  ) => {
    const currentIndex = getIndexFromVisibility(currentVisibility);
    const nextIndex = (currentIndex + 1) % VISIBILITY_OPTIONS_MAP.length;
    const newVisibility = VISIBILITY_OPTIONS_MAP[nextIndex] as ("public" | "friends" | "organisation" | "private")[];

    visibilitySetter(newVisibility);

    // NEW: Show momentary tooltip (click-triggered)
    clickTooltipSetter(true);
    const key = fieldName.toString();
    if (clickTooltipTimeoutRefs.current[key]) {
      clearTimeout(clickTooltipTimeoutRefs.current[key]);
    }
    clickTooltipTimeoutRefs.current[key] = setTimeout(() => {
      clickTooltipSetter(false);
      clickTooltipTimeoutRefs.current[key] = null;
    }, 1000); // Display for 1 second

    if (areToastsEnabled) {
      const fieldDisplayName = fieldName === 'profileVisibility' ? 'Profile Visibility' : getDisplayFieldName(fieldName as keyof ProfileDataJsonb);
      const successMessage = `${fieldDisplayName} is now ${getDisplayVisibilityStatus(newVisibility)}.`;
      toast.success("Privacy Setting Changed", {
        description: successMessage,
      });
    }
  }, [areToastsEnabled, getDisplayFieldName, getDisplayVisibilityStatus]);

  // NEW: Generic handler for icon hover tooltips
  const handleIconHoverTooltip = useCallback((
    isOpen: boolean,
    hoverTooltipSetter: React.Dispatch<React.SetStateAction<boolean>>,
    hoverTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>
  ) => {
    if (isOpen) {
      hoverTooltipSetter(true);
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      hoverTimeoutRef.current = setTimeout(() => {
        hoverTooltipSetter(false);
        hoverTimeoutRef.current = null;
      }, 1000); // 1 second duration
    } else {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      hoverTooltipSetter(false);
    }
  }, []);

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
    const targetProfileData = await getPublicProfile(userId, userName);
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

  const handleFriendClick = useCallback(async (friendId: string, userName: string, event: React.MouseEvent) => {
    if (longPressedFriendId === friendId) {
      setLongPressedFriendId(null);
    } else {
      await handleNameClick(friendId, userName, event);
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
    setPronounsInput(newPronoun === "" ? null : newPronoun);

    if (areToastsEnabled) {
      toast.info("Pronouns Updated", {
        description: newPronoun === "" ? "Your pronouns are now hidden." : `Your pronouns are set to '${newPronoun}'.`,
      });
    }
  }, [currentPronounIndex, areToastsEnabled]);

  // Effect to initialize local states and originalValues when profile is loaded or changes
  useEffect(() => {
    // This effect should run whenever the 'profile' object from context changes
    // and 'loading' is false, indicating the profile data is stable.
    if (!loading && profile) {
      const currentLinkedinUsername = profile.profile_data?.linkedin_url?.value ? (profile.profile_data.linkedin_url.value.startsWith("https://www.linkedin.com/in/") ? profile.profile_data.linkedin_url.value.substring("https://www.linkedin.com/in/".length) : profile.profile_data.linkedin_url.value) : "";

      setOriginalValues({
        firstName: profile.first_name || "You",
        bio: profile.profile_data?.bio?.value || "",
        intention: profile.profile_data?.intention?.value || "",
        canHelpWith: profile.profile_data?.can_help_with?.value || "",
        needHelpWith: profile.profile_data?.need_help_with?.value || "",
        focusPreference: profile.focus_preference || 50,
        organization: profile.organization || "",
        linkedinUrl: currentLinkedinUsername,
        joinCode: profile.join_code || "",
        bioVisibility: profile.profile_data?.bio?.visibility || ['public'],
        intentionVisibility: profile.profile_data?.intention?.visibility || ['public'],
        linkedinVisibility: profile.profile_data?.linkedin_url?.visibility || ['public'],
        canHelpWithVisibility: profile.profile_data?.can_help_with?.visibility || ['public'],
        needHelpWithVisibility: profile.profile_data?.need_help_with?.visibility || ['public'],
        pronouns: profile.profile_data?.pronouns?.value || null,
        profileVisibility: profile.visibility || ['public'],
      });

      // Also, when originalValues are updated from the source of truth,
      // the local input states should also be reset to match,
      // and hasChanges should be set to false.
      setFirstNameInput(profile.first_name || "You");
      setBioInput(profile.profile_data?.bio?.value || null);
      setIntentionInput(profile.profile_data?.intention?.value || null);
      setCanHelpWithInput(profile.profile_data?.can_help_with?.value || null);
      setNeedHelpWithInput(profile.profile_data?.need_help_with?.value || null);
      setFocusPreferenceInput(profile.focus_preference || 50);
      setOrganizationInput(profile.organization);
      setLinkedinUrlInput(currentLinkedinUsername === "" ? null : currentLinkedinUsername);
      setJoinCodeInput(profile.join_code);
      setPronounsInput(profile.profile_data?.pronouns?.value || null);
      setCurrentPronounIndex(PRONOUN_OPTIONS.indexOf(profile.profile_data?.pronouns?.value || ""));
      setBioVisibilityInput(profile.profile_data?.bio?.visibility || ['public']);
      setIntentionVisibilityInput(profile.profile_data?.intention?.visibility || ['public']);
      setLinkedinVisibilityInput(profile.profile_data?.linkedin_url?.visibility || ['public']);
      setCanHelpWithVisibilityInput(profile.profile_data?.can_help_with?.visibility || ['public']);
      setNeedHelpWithVisibilityInput(profile.profile_data?.need_help_with?.visibility || ['public']);
      setProfileVisibilityInput(profile.visibility || ['public']);

      setHasChanges(false); // No changes immediately after loading/saving
    }
  }, [loading, profile]); // Depend on loading and profile

  useEffect(() => {
    if (isEditingFirstName && firstNameInputRef.current) {
      firstNameInputRef.current.focus();
      firstNameInputRef.current.select();
    }
  }, [isEditingFirstName]);

  useEffect(() => {
    if (isEditingJoinCode && joinCodeInputRef.current) { // RENAMED
      joinCodeInputRef.current.focus();
      joinCodeInputRef.current.select();
    }
  }, [isEditingJoinCode]); // RENAMED

  // This useCallback now correctly compares current local states with the initial originalValues snapshot
  const checkForChanges = useCallback(() => {
    if (!originalValues) {
      setHasChanges(false); // No original values to compare against yet
      return;
    }

    const currentLinkedinUsername = linkedinUrlInput ? (linkedinUrlInput.startsWith("https://www.linkedin.com/in/")
                                    ? linkedinUrlInput.substring("https://www.linkedin.com/in/".length)
                                    : linkedinUrlInput) : "";

    const changed = firstNameInput !== originalValues.firstName ||
                   (bioInput || "") !== originalValues.bio ||
                   (intentionInput || "") !== originalValues.intention ||
                   (canHelpWithInput || "") !== originalValues.canHelpWith ||
                   (needHelpWithInput || "") !== originalValues.needHelpWith ||
                   focusPreferenceInput !== originalValues.focusPreference ||
                   (organizationInput || "") !== originalValues.organization ||
                   currentLinkedinUsername !== originalValues.linkedinUrl ||
                   (joinCodeInput || "") !== originalValues.joinCode || // RENAMED
                   JSON.stringify(bioVisibilityInput) !== JSON.stringify(originalValues.bioVisibility) ||
                   JSON.stringify(intentionVisibilityInput) !== JSON.stringify(originalValues.intentionVisibility) ||
                   JSON.stringify(linkedinVisibilityInput) !== JSON.stringify(originalValues.linkedinVisibility) ||
                   JSON.stringify(canHelpWithVisibilityInput) !== JSON.stringify(originalValues.canHelpWithVisibility) ||
                   JSON.stringify(needHelpWithVisibilityInput) !== JSON.stringify(originalValues.needHelpWithVisibility) ||
                   (pronounsInput || null) !== originalValues.pronouns ||
                   JSON.stringify(profileVisibilityInput) !== JSON.stringify(originalValues.profileVisibility);
    setHasChanges(changed);
  }, [
    originalValues, firstNameInput, bioInput, intentionInput, canHelpWithInput, needHelpWithInput, focusPreferenceInput, organizationInput, linkedinUrlInput, joinCodeInput, // RENAMED
    bioVisibilityInput, intentionVisibilityInput, linkedinVisibilityInput, canHelpWithVisibilityInput, needHelpWithVisibilityInput, pronounsInput, profileVisibilityInput
  ]);

  // This useEffect will now correctly trigger checkForChanges whenever any editable state changes
  useEffect(() => {
    checkForChanges();
  }, [checkForChanges]); // Dependency on checkForChanges ensures it runs when its internal dependencies changes

  const handleJoinCodeClick = () => { // RENAMED
    setIsEditingJoinCode(true); // RENAMED
  };

  const handleJoinCodeInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => { // RENAMED
    if (e.key === 'Enter') {
      setIsEditingJoinCode(false); // RENAMED
      e.currentTarget.blur();
      // No direct save here, will be handled by global save
    }
  };

  const handleJoinCodeInputBlur = async () => { // RENAMED
    setIsEditingJoinCode(false); // RENAMED
    // No direct save here, will be handled by global save
  };

  const handleFirstNameClick = () => {
    setIsEditingFirstName(true);
  };

  const handleFirstNameInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditingFirstName(false);
      e.currentTarget.blur();
    }
  };

  const handleFirstNameInputBlur = async () => {
    setIsEditingFirstName(false);
  };

  const handleSaveOrganization = async () => {
    const trimmedOrganization = organizationInput?.trim() || "";
    await updateProfile({ organization: trimmedOrganization === "" ? null : trimmedOrganization }, "Organization Saved!");
    setContextOrganization(trimmedOrganization === "" ? null : trimmedOrganization); // Update context
    setIsOrganizationDialogOpen(false);
  };

  const handleSave = async () => {
    const nameToSave = firstNameInput.trim() === "" ? "You" : firstNameInput.trim();

    const trimmedJoinCode = joinCodeInput?.trim() || ""; // RENAMED
    if (trimmedJoinCode.length < 4 || trimmedJoinCode.length > 20) {
      if (areToastsEnabled) {
        toast.error("Invalid Join Code", { // RENAMED
          description: "Join code must be between 4 and 20 characters. Please correct it before saving.", // RENAMED
        });
      }
      return;
    }

    const dataToUpdate: ProfileUpdate = {
      first_name: nameToSave,
      focus_preference: focusPreferenceInput,
      organization: organizationInput?.trim() === "" ? null : organizationInput?.trim(),
      join_code: trimmedJoinCode, // RENAMED
      visibility: profileVisibilityInput,
      // Update profile_data fields
      bio: { value: bioInput?.trim() === "" ? null : bioInput, visibility: bioVisibilityInput },
      intention: { value: intentionInput?.trim() === "" ? null : intentionInput, visibility: intentionVisibilityInput },
      linkedin_url: { value: (linkedinUrlInput === null || linkedinUrlInput.trim() === "") ? null : `https://www.linkedin.com/in/${linkedinUrlInput.trim()}`, visibility: linkedinVisibilityInput },
      can_help_with: { value: canHelpWithInput?.trim() === "" ? null : canHelpWithInput, visibility: canHelpWithVisibilityInput },
      need_help_with: { value: needHelpWithInput?.trim() === "" ? null : needHelpWithInput, visibility: needHelpWithVisibilityInput },
      pronouns: { value: pronounsInput?.trim() === "" ? null : pronounsInput, visibility: ['public'] }, // Assuming pronouns are always public
    };

    await updateProfile(dataToUpdate); // This updates the profile in context and local storage

    // The useEffect that depends on 'profile' will now handle updating originalValues and local states.
    // No need to manually set originalValues here.
    // setHasChanges(false); // This will be set by the useEffect
  };

  const handleCopyJoinCode = useCallback(async () => { // RENAMED
    try {
      await navigator.clipboard.writeText(joinCodeInput || ""); // RENAMED
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
      if (areToastsEnabled) {
        toast.success("Copied to clipboard!", {
          description: "Your join code has been copied.", // RENAMED
        });
      }
    } catch (err) {
      console.error('Failed to copy join code: ', err); // RENAMED
      if (areToastsEnabled) {
        toast.error("Copy Failed", {
          description: "Could not copy join code. Please try again.", // RENAMED
        });
    }
    }
  }, [joinCodeInput, areToastsEnabled]); // RENAMED

  const handleCancel = useCallback(() => {
    if (originalValues) {
      setFirstNameInput(originalValues.firstName);
      setBioInput(originalValues.bio === "" ? null : originalValues.bio);
      setIntentionInput(originalValues.intention === "" ? null : originalValues.intention);
      setCanHelpWithInput(originalValues.canHelpWith === "" ? null : originalValues.canHelpWith);
      setNeedHelpWithInput(originalValues.needHelpWith === "" ? null : originalValues.needHelpWith);
      setFocusPreferenceInput(originalValues.focusPreference);
      setOrganizationInput(originalValues.organization === "" ? null : originalValues.organization);
      setLinkedinUrlInput(originalValues.linkedinUrl === "" ? null : originalValues.linkedinUrl);
      setJoinCodeInput(originalValues.joinCode === "" ? null : originalValues.joinCode); // RENAMED
      setPronounsInput(originalValues.pronouns);
      setCurrentPronounIndex(PRONOUN_OPTIONS.indexOf(originalValues.pronouns || ""));

      setBioVisibilityInput(originalValues.bioVisibility);
      setIntentionVisibilityInput(originalValues.intentionVisibility);
      setLinkedinVisibilityInput(originalValues.linkedinVisibility);
      setCanHelpWithVisibilityInput(originalValues.canHelpWithVisibility);
      setNeedHelpWithVisibilityInput(originalValues.needHelpWithVisibility);
      setProfileVisibilityInput(originalValues.profileVisibility);
    }
    setHasChanges(false); // Explicitly set to false after cancelling
  }, [originalValues]);

  const friends = Object.entries(friendStatuses)
    .filter(([, status]) => status === 'friends')
    .map(([userId]) => userId);

  const handleBlockUser = (userName: string) => {
    blockUser(userName);
  };

  const handleUnblockUser = (userName: string) => {
    unblockUser(userName);
  };

  // NEW: Slider drag handlers
  const handleSliderDrag = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!sliderContainerRef.current) return;

    const rect = sliderContainerRef.current.getBoundingClientRect();
    const clientX = event.clientX;

    let relativeX = clientX - rect.left;
    relativeX = Math.max(0, Math.min(relativeX, rect.width));

    const newValue = Math.round((relativeX / rect.width) * 100);
    setFocusPreferenceInput(newValue);
  }, [setFocusPreferenceInput]);

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return; // Only respond to left-click
    setIsDraggingSlider(true);
    handleSliderDrag(event); // Set initial value on click
    event.currentTarget.setPointerCapture(event.pointerId); // Capture pointer for continuous drag
  }, [handleSliderDrag]);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingSlider) {
      handleSliderDrag(event);
    }
  }, [isDraggingSlider, handleSliderDrag]);

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    setIsDraggingSlider(false);
    event.currentTarget.releasePointerCapture(event.pointerId); // Release pointer capture
  }, []);

  // NEW: Effect for global 'Enter' keydown to save
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (hasChanges && !loading) {
        const activeElement = document.activeElement;
        const isTypingInInputOrTextarea = activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement;

        // Condition for Ctrl/Cmd + Enter
        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
          event.preventDefault(); // Prevent default Enter behavior (e.g., new line in textarea)
          handleSave();
        }
        // Existing condition for Enter without modifier keys (only for single-line inputs or when no input is focused)
        else if (event.key === 'Enter' && !event.metaKey && !event.ctrlKey) {
          if (isTypingInInputOrTextarea && activeElement instanceof HTMLTextAreaElement) {
            // If in a textarea, allow new line, don't save
            return;
          }
          // For single-line inputs or when no input is focused, save
          event.preventDefault();
          handleSave();
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [hasChanges, loading, handleSave]); // Dependencies for the effect

  // Helper to get the correct icon component based on visibility index
  const getPrivacyIcon = (index: number) => {
    switch (index) {
      case 0: return Globe; // Public
      case 1: return UserStar; // Friends
      case 2: return Building2; // Organisation
      case 3: return HeartHandshake; // Friends & Organisation
      case 4: return Lock; // Private
      default: return Globe;
    }
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
        {/* Top-right Save Profile button */}
        <div className="absolute right-0">
          <Button
            onClick={handleSave}
            disabled={loading || !hasChanges} /* Disabled when no changes */
            className="shadow-lg"
          >
            {loading ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="lg:col-span-2">
            <CardHeader className="relative">
              <CardTitle
                className="flex items-center gap-1 select-none"
              >
                <span onClick={handlePronounCycle}>About</span>
                {isEditingFirstName ? (
                  <Input
                    ref={firstNameInputRef}
                    value={firstNameInput}
                    onChange={(e) => { e.stopPropagation(); setFirstNameInput(e.target.value); }}
                    onKeyDown={handleFirstNameInputKeyDown}
                    onBlur={handleFirstNameInputBlur}
                    placeholder="your name"
                    className="text-lg font-semibold h-auto py-1 px-2 italic"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className={cn("select-none", pronounsInput ? "" : "flex-grow")}
                    onClick={(e) => { e.stopPropagation(); handleFirstNameClick(); }}
                  >
                    {firstNameInput || "You"}
                  </span>
                )}
                {pronounsInput && (
                  <span className="text-sm text-muted-foreground ml-1" onClick={handlePronounCycle}>
                    (
                    {pronounsInput}
                    )
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-4 relative">
              <div className="space-y-4">
                <span
                  onClick={() => handleLabelClick(bioVisibilityInput, setBioVisibilityInput, 'bio', setIsBioClickTooltipOpen)}
                  className={cn("cursor-pointer select-none flex items-center gap-2 w-full", getPrivacyColorClassFromIndex(getIndexFromVisibility(bioVisibilityInput)))}
                >
                  <Tooltip
                    open={isBioClickTooltipOpen || isBioIconHoverTooltipOpen}
                    onOpenChange={(isOpen) => handleIconHoverTooltip(isOpen, setIsBioIconHoverTooltipOpen, bioIconHoverTooltipRef)}
                    delayDuration={0}
                  >
                    <TooltipTrigger asChild>
                      <Label
                        htmlFor="bio"
                        className="flex items-center gap-2"
                      >
                        {React.createElement(getPrivacyIcon(getIndexFromVisibility(bioVisibilityInput)), { size: 16 })}
                        <span>Brief Bio</span>
                      </Label>
                    </TooltipTrigger>
                    <TooltipContent className="select-none" side="right" align="center" sideOffset={8}>
                      {getDisplayVisibilityStatus(bioVisibilityInput)}
                    </TooltipContent>
                  </Tooltip>
                </span>
                <Textarea
                  id="bio"
                  placeholder="Share a bit about yourself..."
                  value={bioInput || ""}
                  onChange={(e) => setBioInput(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div className="space-y-4">
                <span
                  onClick={() => handleLabelClick(intentionVisibilityInput, setIntentionVisibilityInput, 'intention', setIsIntentionClickTooltipOpen)}
                  className={cn("cursor-pointer select-none flex items-center gap-2 w-full", getPrivacyColorClassFromIndex(getIndexFromVisibility(intentionVisibilityInput)))}
                >
                  <Tooltip
                    open={isIntentionClickTooltipOpen || isIntentionIconHoverTooltipOpen}
                    onOpenChange={(isOpen) => handleIconHoverTooltip(isOpen, setIsIntentionIconHoverTooltipOpen, intentionIconHoverTooltipRef)}
                    delayDuration={0}
                  >
                    <TooltipTrigger asChild>
                      <Label
                        htmlFor="intention"
                        className="flex items-center gap-2"
                      >
                        {React.createElement(getPrivacyIcon(getIndexFromVisibility(intentionVisibilityInput)), { size: 16 })}
                        <span>Intention</span>
                      </Label>
                    </TooltipTrigger>
                    <TooltipContent className="select-none" side="right" align="center" sideOffset={8}>
                      {getDisplayVisibilityStatus(intentionVisibilityInput)}
                    </TooltipContent>
                  </Tooltip>
                </span>
                <Textarea
                  id="intention"
                  placeholder="What are you working on? Goals for upcoming sessions?"
                  value={intentionInput || ""}
                  onChange={(e) => setIntentionInput(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div className="space-y-4">
                <span
                  onClick={() => handleLabelClick(canHelpWithVisibilityInput, setCanHelpWithVisibilityInput, 'can_help_with', setIsCanHelpWithClickTooltipOpen)}
                  className={cn("cursor-pointer select-none flex items-center gap-2 w-full", getPrivacyColorClassFromIndex(getIndexFromVisibility(canHelpWithVisibilityInput)))}
                >
                  <Tooltip
                    open={isCanHelpWithClickTooltipOpen || isCanHelpWithIconHoverTooltipOpen}
                    onOpenChange={(isOpen) => handleIconHoverTooltip(isOpen, setIsCanHelpWithIconHoverTooltipOpen, canHelpWithIconHoverTooltipRef)}
                    delayDuration={0}
                  >
                    <TooltipTrigger asChild>
                      <Label
                        htmlFor="can-help-with"
                        className="flex items-center gap-2"
                      >
                        {React.createElement(getPrivacyIcon(getIndexFromVisibility(canHelpWithVisibilityInput)), { size: 16 })}
                        <span>I can help with</span>
                      </Label>
                    </TooltipTrigger>
                    <TooltipContent className="select-none" side="right" align="center" sideOffset={8}>
                      {getDisplayVisibilityStatus(canHelpWithVisibilityInput)}
                    </TooltipContent>
                  </Tooltip>
                </span>
                <Textarea
                  id="can-help-with"
                  placeholder="e.g., React, TypeScript, UI/UX Design, Project Management"
                  value={canHelpWithInput || ""}
                  onChange={(e) => setCanHelpWithInput(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div className="space-y-4">
                <span
                  onClick={() => handleLabelClick(needHelpWithVisibilityInput, setNeedHelpWithVisibilityInput, 'need_help_with', setIsNeedHelpWithClickTooltipOpen)}
                  className={cn("cursor-pointer select-none flex items-center gap-2 w-full", getPrivacyColorClassFromIndex(getIndexFromVisibility(needHelpWithVisibilityInput)))}
                >
                  <Tooltip
                    open={isNeedHelpWithClickTooltipOpen || isNeedHelpWithIconHoverTooltipOpen}
                    onOpenChange={(isOpen) => handleIconHoverTooltip(isOpen, setIsNeedHelpWithIconHoverTooltipOpen, needHelpWithIconHoverTooltipRef)}
                    delayDuration={0}
                  >
                    <TooltipTrigger asChild>
                      <Label
                        htmlFor="need-help-with"
                        className="flex items-center gap-2"
                      >
                        {React.createElement(getPrivacyIcon(getIndexFromVisibility(needHelpWithVisibilityInput)), { size: 16 })}
                        <span>I need help with</span>
                      </Label>
                    </TooltipTrigger>
                    <TooltipContent className="select-none" side="right" align="center" sideOffset={8}>
                      {getDisplayVisibilityStatus(needHelpWithVisibilityInput)}
                    </TooltipContent>
                  </Tooltip>
                </span>
                <Textarea
                  id="need-help-with"
                  placeholder="e.g., Backend integration, Advanced algorithms, Marketing strategy"
                  value={needHelpWithInput || ""}
                  onChange={(e) => setNeedHelpWithInput(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div className="space-y-4">
                <span
                  onClick={() => handleLabelClick(linkedinVisibilityInput, setLinkedinVisibilityInput, 'linkedin_url', setIsLinkedinClickTooltipOpen)}
                  className={cn("cursor-pointer select-none flex items-center gap-2 w-full", getPrivacyColorClassFromIndex(getIndexFromVisibility(linkedinVisibilityInput)))}
                >
                  <Tooltip
                    open={isLinkedinClickTooltipOpen || isLinkedinIconHoverTooltipOpen}
                    onOpenChange={(isOpen) => handleIconHoverTooltip(isOpen, setIsLinkedinIconHoverTooltipOpen, linkedinIconHoverTooltipRef)}
                    delayDuration={0}
                  >
                    <TooltipTrigger asChild>
                      <Label
                        htmlFor="linkedin-username"
                        className="flex items-center gap-2"
                      >
                        {React.createElement(getPrivacyIcon(getIndexFromVisibility(linkedinVisibilityInput)), { size: 16 })}
                        <span>LinkedIn Handle</span>
                      </Label>
                    </TooltipTrigger>
                    <TooltipContent className="select-none" side="right" align="center" sideOffset={8}>
                      {getDisplayVisibilityStatus(linkedinVisibilityInput)}
                    </TooltipContent>
                  </Tooltip>
                </span>
                <div className="flex items-center gap-0 mt-2 border rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                  <span className="pl-3 pr-1 text-muted-foreground bg-input rounded-l-md py-2 text-sm">
                    linkedin.com/in/
                  </span>
                  <Input
                    id="linkedin-username"
                    type="text"
                    placeholder="yourusername"
                    value={linkedinUrlInput ? (linkedinUrlInput.startsWith("https://www.linkedin.com/in/") ? linkedinUrlInput.substring("https://www.linkedin.com/in/".length) : linkedinUrlInput) : ""}
                    onChange={(e) => setLinkedinUrlInput(e.target.value)}
                    className="flex-1 border-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-l-none"
                  />
                  {linkedinUrlInput && (
                    <a
                      href={`https://www.linkedin.com/in/${linkedinUrlInput}`}
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

              {/* Join Code section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">Join Code</span>
                      </TooltipTrigger>
                      <TooltipContent className="select-none" side="right" align="center" sideOffset={8}>
                        <p>Others can use this code to join your sessions.</p>
                      </TooltipContent>
                    </Tooltip>
                </h3>
                <div className="flex items-center gap-2">
                  {isEditingJoinCode ? (
                    <Input
                      ref={joinCodeInputRef}
                      value={joinCodeInput || ""}
                      onChange={(e) => { e.stopPropagation(); setJoinCodeInput(e.target.value); }}
                      onKeyDown={handleJoinCodeInputKeyDown}
                      onBlur={handleJoinCodeInputBlur}
                      placeholder="yourjoincode"
                      className="text-lg font-semibold h-auto py-1 px-2 italic flex-grow"
                      minLength={4}
                      maxLength={20}
                    />
                  ) : (
                    <span
                      className={cn(
                        "text-lg font-semibold flex-grow select-none",
                        // Removed: "text-foreground cursor-pointer hover:text-primary"
                      )}
                      onClick={handleJoinCodeClick}
                    >
                      {joinCodeInput}
                    </span>
                  )}
                  {!isEditingJoinCode && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCopyJoinCode}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="Copy join code"
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
              <CardTitle id="social-preferences">Focus Preference</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-6">
                  How would you prefer to balance focus vs socialising?
                </p>
                {/* NEW: Wrapper div for expanded slider interaction */}
                <div
                  ref={sliderContainerRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                  className="space-y-4 cursor-ew-resize p-2 -m-2 rounded-md"
                >
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Banter</span>
                    <span>Deep Focus</span>
                  </div>
                  <div className="relative group">
                    <Slider
                      value={[focusPreferenceInput]}
                      onValueChange={(val) => setFocusPreferenceInput(val[0])}
                      max={100}
                      min={0}
                      step={1}
                      className="w-full"
                      rangeColor={getSociabilityGradientColor(focusPreferenceInput)}
                    />
                  </div>
                  <div
                    className="text-center mt-3 text-sm text-muted-foreground select-none"
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
                    {focusPreferenceInput <= 20 && "Looking to collaborate/brainstorm"}
                    {focusPreferenceInput > 20 && focusPreferenceInput <= 40 && "Happy to chat while we work"}
                    {focusPreferenceInput > 40 && focusPreferenceInput <= 60 && "I don't mind"}
                    {focusPreferenceInput > 60 && focusPreferenceInput <= 80 && "Socialise only during breaks"}
                    {focusPreferenceInput > 80 && "Minimal interaction even during breaks"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organisation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {organizationInput ? (
                <p className="text-sm text-muted-foreground">
                  Currently affiliated with: <span className="font-medium text-foreground">{organizationInput}</span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Not currently affiliated with an organisation.
                </p>
              )}
              <Button onClick={() => setIsOrganizationDialogOpen(true)}>
                {organizationInput ? "Edit Organisation" : "Add Organisation"}
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
                    onTouchStart={() => handleLongPressStart(() => handleFriendLongPressStart(friendId))}
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

        {/* Floating Save Profile button */}
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

        {/* Floating Cancel button */}
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
            <DialogTitle>{organizationInput ? "Edit Organisation Name" : "Add Organisation Name"}</DialogTitle>
            <DialogDescription>
              Enter the name of your organization. This will be visible to others.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="organization-name">Organisation Name</Label>
              <Input
                id="organization-name"
                value={organizationInput || ""}
                onChange={(e) => setOrganizationInput(e.target.value)}
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