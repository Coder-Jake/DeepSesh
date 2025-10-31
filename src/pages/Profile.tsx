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
import { cn, VISIBILITY_OPTIONS_MAP, getIndexFromVisibility, getPrivacyColorClassFromIndex } from "@/lib/utils";
import { useTimer } from "@/contexts/TimerContext";
import { useProfilePopUp } from "@/contexts/ProfilePopUpContext";

const PRONOUN_OPTIONS = ["", "They/Them", "She/Her", "He/Him"]; // Blank, They/Them, She/Her, He/Him

const Profile = () => {
  const { 
    profile, loading, updateProfile, localFirstName, setLocalFirstName, hostCode, setHostCode,
    bioVisibility, setBioVisibility, intentionVisibility, setIntentionVisibility, linkedinVisibility, setLinkedinVisibility,
    canHelpWithVisibility, setCanHelpWithVisibility, needHelpWithVisibility, setNeedHelpWithVisibility,
    pronouns, setPronouns,
    friendStatuses, getPublicProfile, blockedUsers, blockUser, unblockUser
  } = useProfile();
  const { user } = useAuth(); // Keep user for ID, but not for login/logout UI
  const navigate = useNavigate();
  const { isRunning, isPaused, isScheduleActive, isSchedulePrepared, isSchedulePending, areToastsEnabled } = useTimer();
  const { openProfilePopUp } = useProfilePopUp();

  // Use context state directly for inputs
  const [bio, setBio] = useState(profile?.bio || "");
  const [intention, setIntention] = useState(profile?.intention || "");
  const [canHelpWith, setCanHelpWith] = useState(profile?.can_help_with || "");
  const [needHelpWith, setNeedHelpWith] = useState(profile?.need_help_with || "");
  const [sociability, setSociability] = useState([profile?.sociability || 50]);
  const [organization, setOrganization] = useState(profile?.organization || "");
  const [linkedinUrl, setLinkedinUrl] = useState(() => {
    const fullLinkedinUrl = profile?.linkedin_url || "";
    return fullLinkedinUrl.startsWith("https://www.linkedin.com/in/") 
           ? fullLinkedinUrl.substring("https://www.linkedin.com/in/".length) 
           : "";
  });
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
    sociability: [30],
    organization: "",
    linkedinUrl: "",
    hostCode: "",
    bioVisibility: ['public'] as ('public' | 'friends' | 'organisation' | 'private')[],
    intentionVisibility: ['public'] as ('public' | 'friends' | 'organisation' | 'private')[],
    linkedinVisibility: ['public'] as ('public' | 'friends' | 'organisation' | 'private')[],
    canHelpWithVisibility: ['public'] as ('public' | 'friends' | 'organisation' | 'private')[],
    needHelpWithVisibility: ['public'] as ('public' | 'friends' | 'organisation' | 'private')[],
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

  // State and ref for the Key icon tooltip
  const [isKeyTooltipOpen, setIsKeyTooltipOpen] = useState(false);
  const keyTooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getDisplayVisibilityStatus = useCallback((visibility: ('public' | 'friends' | 'organisation' | 'private')[] | null): string => {
    if (!visibility || visibility.length === 0) return 'public';
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
    currentIndex: number, 
    setter: React.Dispatch<React.SetStateAction<number>>,
    visibilitySetter: React.Dispatch<React.SetStateAction<('public' | 'friends' | 'organisation' | 'private')[]>>,
    fieldName: 'bio_visibility' | 'intention_visibility' | 'linkedin_visibility' | 'can_help_with_visibility' | 'need_help_with_visibility'
  ) => {
    const nextIndex = (currentIndex + 1) % VISIBILITY_OPTIONS_MAP.length;
    const newVisibility = VISIBILITY_OPTIONS_MAP[nextIndex] as ('public' | 'friends' | 'organisation' | 'private')[];
    
    setter(nextIndex);
    visibilitySetter(newVisibility);

    if (areToastsEnabled) {
      const successMessage = `${getDisplayFieldName(fieldName)} is now ${getDisplayVisibilityStatus(newVisibility)}.`;
      toast.success("Privacy Setting Changed", {
        description: successMessage,
      });
    }

    // Update profile context immediately
    await updateProfile({ [fieldName]: newVisibility });
  }, [areToastsEnabled, getDisplayFieldName, getDisplayVisibilityStatus, updateProfile]);

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

  const handleSociabilityLongPress = () => {
    if (isLongPress.current) {
      navigate('/profile#social-preferences');
    }
  };

  const handleNameClick = useCallback(async (userId: string, userName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const targetProfileData = await getPublicProfile(userId, userName);
    if (targetProfileData) {
      openProfilePopUp(targetProfileData.id, targetProfileData.first_name || userName, event.clientX, event.clientY);
    } else {
      openProfilePopUp(userId, userName, event.clientX, event.clientY);
    }
  }, [openProfilePopUp, getPublicProfile]);

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

  // NEW: Handle pronoun cycling
  const handlePronounCycle = useCallback(async () => {
    const nextIndex = (currentPronounIndex + 1) % PRONOUN_OPTIONS.length;
    const newPronoun = PRONOUN_OPTIONS[nextIndex];
    setCurrentPronounIndex(nextIndex);
    setPronouns(newPronoun === "" ? null : newPronoun); // Set to null if blank

    if (areToastsEnabled) {
      toast.info("Pronouns Updated", {
        description: newPronoun === "" ? "Your pronouns are now hidden." : `Your pronouns are set to '${newPronoun}'.`,
      });
    }
    await updateProfile({ pronouns: newPronoun === "" ? null : newPronoun });
  }, [currentPronounIndex, setPronouns, areToastsEnabled, updateProfile]);

  // Effect to initialize and update local states from profile context
  useEffect(() => {
    if (profile) {
      setBio(profile.bio || "");
      setIntention(profile.intention || "");
      setCanHelpWith(profile.can_help_with || "");
      setNeedHelpWith(profile.need_help_with || "");
      setSociability([profile.sociability || 50]);
      setOrganization(profile.organization || "");
      const fullLinkedinUrl = profile.linkedin_url || "";
      setLinkedinUrl(fullLinkedinUrl.startsWith("https://www.linkedin.com/in/") 
                               ? fullLinkedinUrl.substring("https://www.linkedin.com/in/".length) 
                               : "");
      setHostCode(profile.host_code || ""); // Ensure hostCode is updated from profile
      setLocalFirstName(profile.first_name || "You"); // Ensure localFirstName is updated from profile
      setPronouns(profile.pronouns || null);
      setCurrentPronounIndex(PRONOUN_OPTIONS.indexOf(profile.pronouns || ""));

      setBioVisibility(profile.bio_visibility || ['public']);
      setIntentionVisibility(profile.intention_visibility || ['public']);
      setLinkedinVisibility(profile.linkedin_visibility || ['public']);
      setCanHelpWithVisibility(profile.can_help_with_visibility || ['public']);
      setNeedHelpWithVisibility(profile.need_help_with_visibility || ['public']);

      setBioLabelColorIndex(getIndexFromVisibility(profile.bio_visibility || ['public']));
      setIntentionLabelColorIndex(getIndexFromVisibility(profile.intention_visibility || ['public']));
      setLinkedinLabelColorIndex(getIndexFromVisibility(profile.linkedin_visibility || ['public']));
      setCanHelpWithLabelColorIndex(getIndexFromVisibility(profile.can_help_with_visibility || ['public']));
      setNeedHelpWithLabelColorIndex(getIndexFromVisibility(profile.need_help_with_visibility || ['public']));

      setOriginalValues({
        firstName: profile.first_name || "You",
        bio: profile.bio || "",
        intention: profile.intention || "",
        canHelpWith: profile.can_help_with || "",
        needHelpWith: profile.need_help_with || "",
        sociability: [profile.sociability || 50],
        organization: profile.organization || "",
        linkedinUrl: fullLinkedinUrl.startsWith("https://www.linkedin.com/in/") 
                     ? fullLinkedinUrl.substring("https://www.linkedin.com/in/".length) 
                     : "",
        hostCode: profile.host_code || "",
        bioVisibility: (profile.bio_visibility || ['public']) as ('public' | 'friends' | 'organisation' | 'private')[],
        intentionVisibility: (profile.intention_visibility || ['public']) as ('public' | 'friends' | 'organisation' | 'private')[],
        linkedinVisibility: (profile.linkedin_visibility || ['public']) as ('public' | 'friends' | 'organisation' | 'private')[],
        canHelpWithVisibility: (profile.can_help_with_visibility || ['public']) as ('public' | 'friends' | 'organisation' | 'private')[],
        needHelpWithVisibility: (profile.need_help_with_visibility || ['public']) as ('public' | 'friends' | 'organisation' | 'private')[],
        pronouns: profile.pronouns || null,
      });
      setHasChanges(false);
    } else {
      // Reset to default if profile is null (e.g., after logout)
      setBio("");
      setIntention("");
      setCanHelpWith("");
      setNeedHelpWith("");
      setSociability([50]);
      setOrganization("");
      setLinkedinUrl("");
      setHostCode(localStorage.getItem('deepsesh_host_code') || "");
      setLocalFirstName(localStorage.getItem('deepsesh_local_first_name') || "You");
      setPronouns(localStorage.getItem('deepsesh_pronouns') || null);
      setCurrentPronounIndex(PRONOUN_OPTIONS.indexOf(localStorage.getItem('deepsesh_pronouns') || ""));

      const defaultBioVis = (JSON.parse(localStorage.getItem('deepsesh_bio_visibility') || '["public"]') as ('public' | 'friends' | 'organisation' | 'private')[]);
      const defaultIntentionVis = (JSON.parse(localStorage.getItem('deepsesh_intention_visibility') || '["public"]') as ('public' | 'friends' | 'organisation' | 'private')[]);
      const defaultLinkedinVis = (JSON.parse(localStorage.getItem('deepsesh_linkedin_visibility') || '["public"]') as ('public' | 'friends' | 'organisation' | 'private')[]);
      const defaultCanHelpVis = (JSON.parse(localStorage.getItem('deepsesh_can_help_with_visibility') || '["public"]') as ('public' | 'friends' | 'organisation' | 'private')[]);
      const defaultNeedHelpVis = (JSON.parse(localStorage.getItem('deepsesh_need_help_with_visibility') || '["public"]') as ('public' | 'friends' | 'organisation' | 'private')[]);

      setBioVisibility(defaultBioVis);
      setIntentionVisibility(defaultIntentionVis);
      setLinkedinVisibility(defaultLinkedinVis);
      setCanHelpWithVisibility(defaultCanHelpVis);
      setNeedHelpWithVisibility(defaultNeedHelpVis);

      setBioLabelColorIndex(getIndexFromVisibility(defaultBioVis));
      setIntentionLabelColorIndex(getIndexFromVisibility(defaultIntentionVis));
      setLinkedinLabelColorIndex(getIndexFromVisibility(defaultLinkedinVis));
      setCanHelpWithLabelColorIndex(getIndexFromVisibility(defaultCanHelpVis));
      setNeedHelpWithLabelColorIndex(getIndexFromVisibility(defaultNeedHelpVis));

      setOriginalValues({
        firstName: localStorage.getItem('deepsesh_local_first_name') || "You",
        bio: "", intention: "", canHelpWith: "", needHelpWith: "", sociability: [50], organization: "", linkedinUrl: "",
        hostCode: localStorage.getItem('deepsesh_host_code') || "",
        bioVisibility: defaultBioVis,
        intentionVisibility: defaultIntentionVis,
        linkedinVisibility: defaultLinkedinVis,
        canHelpWithVisibility: defaultCanHelpVis,
        needHelpWithVisibility: defaultNeedHelpVis,
        pronouns: localStorage.getItem('deepsesh_pronouns') || null,
      });
      setHasChanges(false);
    }
  }, [profile, setHostCode, setLocalFirstName, setBioVisibility, setIntentionVisibility, setLinkedinVisibility, setCanHelpWithVisibility, setNeedHelpWithVisibility, setPronouns]);


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
    const currentLinkedinUsername = linkedinUrl.startsWith("https://www.linkedin.com/in/") 
                                    ? linkedinUrl.substring("https://www.linkedin.com/in/".length) 
                                    : linkedinUrl;

    const changed = localFirstName !== originalValues.firstName ||
                   bio !== originalValues.bio || 
                   intention !== originalValues.intention || 
                   canHelpWith !== originalValues.canHelpWith ||
                   needHelpWith !== originalValues.needHelpWith ||
                   sociability[0] !== originalValues.sociability[0] ||
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
    localFirstName, bio, intention, canHelpWith, needHelpWith, sociability, organization, linkedinUrl, hostCode,
    bioVisibility, intentionVisibility, linkedinVisibility, canHelpWithVisibility, needHelpWithVisibility,
    pronouns,
    originalValues
  ]);

  useEffect(() => {
    checkForChanges();
  }, [
    localFirstName, bio, intention, canHelpWith, needHelpWith, sociability, organization, linkedinUrl, hostCode,
    bioVisibility, intentionVisibility, linkedinVisibility, canHelpWithVisibility, needHelpWithVisibility,
    pronouns,
    checkForChanges
  ]);

  const handleFirstNameChange = (value: string) => {
    setLocalFirstName(value);
  };

  const handleBioChange = (value: string) => {
    setBio(value);
  };

  const handleIntentionChange = (value: string) => {
    setIntention(value);
  };

  const handleCanHelpWithChange = (value: string) => {
    setCanHelpWith(value);
  };

  const handleNeedHelpWithChange = (value: string) => {
    setNeedHelpWith(value);
  };

  const handleSociabilityChange = (value: number[]) => {
    setSociability(value);
  };

  const handleOrganizationChange = (value: string) => {
    setOrganization(value);
  };

  const handleLinkedinUrlChange = (value: string) => {
    setLinkedinUrl(value);
  };

  const handleHostCodeChange = (value: string) => {
    setHostCode(value);
  };

  const handleHostCodeClick = () => {
    setIsEditingHostCode(true);
  };

  const handleHostCodeInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditingHostCode(false);
      e.currentTarget.blur();
      await validateAndSaveHostCode(hostCode);
    }
  };

  const handleHostCodeInputBlur = async () => {
    setIsEditingHostCode(false);
    await validateAndSaveHostCode(hostCode);
  };

  const validateAndSaveHostCode = async (code: string) => {
    const trimmedCode = code.trim();
    if (trimmedCode.length < 4 || trimmedCode.length > 20) {
      if (areToastsEnabled) {
        toast.error("Invalid Host Code", {
          description: "Host code must be between 4 and 20 characters.",
        });
      }
      setHostCode(originalValues.hostCode); // Revert to original
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
    const trimmedOrganization = organization.trim();
    await updateProfile({ organization: trimmedOrganization === "" ? null : trimmedOrganization }, "Organization Saved!");
    setIsOrganizationDialogOpen(false);
  };

  const handleSave = async () => {
    const nameToSave = localFirstName.trim() === "" ? "You" : localFirstName.trim();
    
    const trimmedHostCode = hostCode.trim();
    if (trimmedHostCode.length < 4 || trimmedHostCode.length > 20) {
      if (areToastsEnabled) {
        toast.error("Invalid Host Code", {
          description: "Host code must be between 4 and 20 characters. Please correct it before saving.",
        });
      }
      return;
    }

    const dataToUpdate = {
      first_name: nameToSave,
      bio,
      intention,
      can_help_with: canHelpWith,
      need_help_with: needHelpWith,
      sociability: sociability[0],
      organization: organization.trim() === "" ? null : organization.trim(),
      linkedin_url: linkedinUrl.trim() === "" ? null : `https://www.linkedin.com/in/${linkedinUrl.trim()}`,
      host_code: trimmedHostCode,
      bio_visibility: bioVisibility,
      intention_visibility: intentionVisibility,
      linkedin_visibility: linkedinVisibility,
      can_help_with_visibility: canHelpWithVisibility,
      need_help_with_visibility: needHelpWithVisibility,
      pronouns: pronouns,
      updated_at: new Date().toISOString(),
    };

    await updateProfile(dataToUpdate);
    setHasChanges(false);
  };

  // Removed handleLogout as there's no explicit logout anymore
  // const handleLogout = async () => {
  //   logout();
  //   if (areToastsEnabled) {
  //     toast.success("Logged Out", {
  //       description: "You have been successfully logged out.",
  //     });
  //   }
  //   navigate('/');
  // };

  const handleCopyHostCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(hostCode);
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
    if (profile) {
      setLocalFirstName(profile.first_name || "You");
      setBio(profile.bio || "");
      setIntention(profile.intention || "");
      setCanHelpWith(profile.can_help_with || "");
      setNeedHelpWith(profile.need_help_with || "");
      setSociability([profile.sociability || 50]);
      setOrganization(profile.organization || "");
      const fullLinkedinUrl = profile.linkedin_url || "";
      setLinkedinUrl(fullLinkedinUrl.startsWith("https://www.linkedin.com/in/") 
                               ? fullLinkedinUrl.substring("https://www.linkedin.com/in/".length) 
                               : "");
      setHostCode(profile.host_code || "");
      setPronouns(profile.pronouns || null);
      setCurrentPronounIndex(PRONOUN_OPTIONS.indexOf(profile.pronouns || ""));

      setBioVisibility(profile.bio_visibility || ['public']);
      setIntentionVisibility(profile.intention_visibility || ['public']);
      setLinkedinVisibility(profile.linkedin_visibility || ['public']);
      setCanHelpWithVisibility(profile.can_help_with_visibility || ['public']);
      setNeedHelpWithVisibility(profile.need_help_with_visibility || ['public']);

      setBioLabelColorIndex(getIndexFromVisibility(profile.bio_visibility || ['public']));
      setIntentionLabelColorIndex(getIndexFromVisibility(profile.intention_visibility || ['public']));
      setLinkedinLabelColorIndex(getIndexFromVisibility(profile.linkedin_visibility || ['public']));
      setCanHelpWithLabelColorIndex(getIndexFromVisibility(profile.can_help_with_visibility || ['public']));
      setNeedHelpWithLabelColorIndex(getIndexFromVisibility(profile.need_help_with_visibility || ['public']));
    } else {
      // Revert to local storage defaults if no profile
      setLocalFirstName(localStorage.getItem('deepsesh_local_first_name') || "You");
      setBio(localStorage.getItem('deepsesh_bio') || "");
      setIntention(localStorage.getItem('deepsesh_intention') || "");
      setCanHelpWith(localStorage.getItem('deepsesh_can_help_with') || "");
      setNeedHelpWith(localStorage.getItem('deepsesh_need_help_with') || "");
      setSociability([parseInt(localStorage.getItem('deepsesh_sociability') || '50', 10)]);
      setOrganization(localStorage.getItem('deepsesh_organization') || "");
      const fullLinkedinUrl = localStorage.getItem('deepsesh_linkedin_url') || "";
      setLinkedinUrl(fullLinkedinUrl.startsWith("https://www.linkedin.com/in/") 
                               ? fullLinkedinUrl.substring("https://www.linkedin.com/in/".length) 
                               : "");
      setHostCode(localStorage.getItem('deepsesh_host_code') || "");
      setPronouns(localStorage.getItem('deepsesh_pronouns') || null);
      setCurrentPronounIndex(PRONOUN_OPTIONS.indexOf(localStorage.getItem('deepsesh_pronouns') || ""));

      const defaultBioVis = (JSON.parse(localStorage.getItem('deepsesh_bio_visibility') || '["public"]') as ('public' | 'friends' | 'organisation' | 'private')[]);
      const defaultIntentionVis = (JSON.parse(localStorage.getItem('deepsesh_intention_visibility') || '["public"]') as ('public' | 'friends' | 'organisation' | 'private')[]);
      const defaultLinkedinVis = (JSON.parse(localStorage.getItem('deepsesh_linkedin_visibility') || '["public"]') as ('public' | 'friends' | 'organisation' | 'private')[]);
      const defaultCanHelpVis = (JSON.parse(localStorage.getItem('deepsesh_can_help_with_visibility') || '["public"]') as ('public' | 'friends' | 'organisation' | 'private')[]);
      const defaultNeedHelpVis = (JSON.parse(localStorage.getItem('deepsesh_need_help_with_visibility') || '["public"]') as ('public' | 'friends' | 'organisation' | 'private')[]);

      setBioVisibility(defaultBioVis);
      setIntentionVisibility(defaultIntentionVis);
      setLinkedinVisibility(defaultLinkedinVis);
      setCanHelpWithVisibility(defaultCanHelpVis);
      setNeedHelpWithVisibility(defaultNeedHelpVis);

      setBioLabelColorIndex(getIndexFromVisibility(defaultBioVis));
      setIntentionLabelColorIndex(getIndexFromVisibility(defaultIntentionVis));
      setLinkedinLabelColorIndex(getIndexFromVisibility(defaultLinkedinVis));
      setCanHelpWithLabelColorIndex(getIndexFromVisibility(defaultCanHelpVis));
      setNeedHelpWithLabelColorIndex(getIndexFromVisibility(defaultNeedHelpVis));
    }

    setIsEditingFirstName(false);
    setIsEditingHostCode(false);
    setIsCopied(false);
    setHasChanges(false);
    setLongPressedFriendId(null);
  }, [profile, setLocalFirstName, setBioVisibility, setIntentionVisibility, setLinkedinVisibility, setCanHelpWithVisibility, setNeedHelpWithVisibility, setHostCode, setPronouns]);

  const friends = Object.entries(friendStatuses)
    .filter(([, status]) => status === 'friends')
    .map(([userId]) => userId);

  const handleBlockUser = (userName: string) => {
    blockUser(userName);
  };

  const handleUnblockUser = (userName: string) => {
    unblockUser(userName);
  };

  // Handler for the Key icon tooltip click
  const handleKeyTooltipClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent parent clicks
    setIsKeyTooltipOpen(true);
    if (keyTooltipTimeoutRef.current) {
      clearTimeout(keyTooltipTimeoutRef.current);
    }
    keyTooltipTimeoutRef.current = setTimeout(() => {
      setIsKeyTooltipOpen(false);
      keyTooltipTimeoutRef.current = null; // Clear the ref after closing
    }, 2000); // 2 seconds
  };

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto pt-16 px-4 pb-4 lg:pt-20 lg:px-6 lg:pb-6 text-center text-muted-foreground">
        Loading profile...
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto pt-16 px-4 pb-4 lg:pt-20 lg:px-6 lg:pb-6">
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
                onClick={handlePronounCycle} // Trigger pronoun cycle on About click
              >
                <span>About</span>
                {isEditingFirstName ? (
                  <Input
                    ref={firstNameInputRef}
                    value={localFirstName}
                    onChange={(e) => handleFirstNameChange(e.target.value)}
                    onKeyDown={handleFirstNameInputKeyDown}
                    onBlur={handleFirstNameInputBlur}
                    placeholder="your name"
                    className="text-lg font-semibold h-auto py-1 px-2 italic"
                  />
                ) : (
                  <span
                    className="cursor-pointer select-none"
                    onClick={(e) => { e.stopPropagation(); handleFirstNameClick(); }} // Prevent pronoun cycle when editing name
                  >
                    {localFirstName || "You"}
                  </span>
                )}
                {pronouns && ( // Display pronouns if not blank
                  <span className="text-sm text-muted-foreground ml-1">({pronouns})</span>
                )}
              </CardTitle>
              {/* Removed the dedicated pronoun selector div */}
                <Tooltip
                  open={isKeyTooltipOpen}
                  onOpenChange={(openState) => {
                    // Only allow closing if our click-timer is not active
                    if (!openState && keyTooltipTimeoutRef.current) {
                      return;
                    }
                    setIsKeyTooltipOpen(openState);
                  }}
                  delayDuration={0} // No delay on hover
                >
                  <TooltipTrigger asChild>
                    <Key 
                      className="absolute top-4 right-4 h-4 w-4 text-muted-foreground cursor-help" 
                      onClick={handleKeyTooltipClick} // Attach click handler
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
                  onClick={() => handleLabelClick(bioLabelColorIndex, setBioLabelColorIndex, setBioVisibility, 'bio_visibility')} 
                  className={cn("cursor-pointer select-none", getPrivacyColorClassFromIndex(bioLabelColorIndex))}
                >
                  Brief Bio
                </Label>
                <Textarea
                  id="bio"
                  placeholder="Share a bit about yourself..."
                  value={bio}
                  onChange={(e) => handleBioChange(e.target.value)}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label 
                  htmlFor="intention" 
                  onClick={() => handleLabelClick(intentionLabelColorIndex, setIntentionLabelColorIndex, setIntentionVisibility, 'intention_visibility')} 
                  className={cn("cursor-pointer select-none", getPrivacyColorClassFromIndex(intentionLabelColorIndex))}
                >
                  Statement of Intention
                </Label>
                <Textarea
                  id="intention"
                  placeholder="What are you working on? Goals and intentions for upcoming sessions?"
                  value={intention}
                  onChange={(e) => handleIntentionChange(e.target.value)}
                  className="mt-2"
                />
              </div>

              {/* NEW: I can help with */}
              <div>
                <Label 
                  htmlFor="can-help-with" 
                  onClick={() => handleLabelClick(canHelpWithLabelColorIndex, setCanHelpWithLabelColorIndex, setCanHelpWithVisibility, 'can_help_with_visibility')} 
                  className={cn("cursor-pointer select-none", getPrivacyColorClassFromIndex(canHelpWithLabelColorIndex))}
                >
                  <Handshake size={16} className="inline-block mr-1" /> I can help with
                </Label>
                <Textarea
                  id="can-help-with"
                  placeholder="e.g., React, TypeScript, UI/UX Design, Project Management"
                  value={canHelpWith}
                  onChange={(e) => handleCanHelpWithChange(e.target.value)}
                  className="mt-2"
                />
              </div>

              {/* NEW: I need help with */}
              <div>
                <Label 
                  htmlFor="need-help-with" 
                  onClick={() => handleLabelClick(needHelpWithLabelColorIndex, setNeedHelpWithLabelColorIndex, setNeedHelpWithVisibility, 'need_help_with_visibility')} 
                  className={cn("cursor-pointer select-none", getPrivacyColorClassFromIndex(needHelpWithLabelColorIndex))}
                >
                  <HelpCircle size={16} className="inline-block mr-1" /> I need help with
                </Label>
                <Textarea
                  id="need-help-with"
                  placeholder="e.g., Backend integration, Advanced algorithms, Marketing strategy"
                  value={needHelpWith}
                  onChange={(e) => handleNeedHelpWithChange(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label 
                  htmlFor="linkedin-username" 
                  onClick={() => handleLabelClick(linkedinLabelColorIndex, setLinkedinLabelColorIndex, setLinkedinVisibility, 'linkedin_visibility')} 
                  className={cn("cursor-pointer select-none", getPrivacyColorClassFromIndex(linkedinLabelColorIndex))}
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
                    value={linkedinUrl}
                    onChange={(e) => handleLinkedinUrlChange(e.target.value)}
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
              <CardTitle id="social-preferences">Focus Preferences</CardTitle>
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
                      value={sociability}
                      onValueChange={handleSociabilityChange}
                      max={100}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  <div 
                    className="text-center mt-3 text-sm text-muted-foreground cursor-pointer select-none"
                    onMouseDown={() => handleLongPressStart(handleSociabilityLongPress)}
                    onMouseUp={handleLongPressEnd}
                    onMouseLeave={handleLongPressEnd}
                    onTouchStart={() => handleLongPressStart(handleSociabilityLongPress)}
                    onTouchEnd={handleLongPressEnd}
                  >
                    {sociability[0] <= 20 && "Looking to collaborate/brainstorm"}
                    {sociability[0] > 20 && sociability[0] <= 40 && "Happy to chat while we work"}
                    {sociability[0] > 40 && sociability[0] <= 60 && "I don't mind"}
                    {sociability[0] > 60 && sociability[0] <= 80 && "Socialise only during breaks"}
                    {sociability[0] > 80 && "Minimal interaction even during breaks"}
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-6 mt-6">
                <h3 className="text-lg font-semibold mb-2">
                  {/* Removed TooltipProvider here */}
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
                      value={hostCode}
                      onChange={(e) => handleHostCodeChange(e.target.value)}
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
              {profile?.organization || localStorage.getItem('deepsesh_organization') ? (
                <p className="text-sm text-muted-foreground">
                  Currently affiliated with: <span className="font-medium text-foreground">{profile?.organization || localStorage.getItem('deepsesh_organization')}</span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Not currently affiliated with an organisation.
                </p>
              )}
              <Button onClick={() => setIsOrganizationDialogOpen(true)}>
                {profile?.organization || localStorage.getItem('deepsesh_organization') ? "Edit Organisation" : "Add Organisation"}
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
                    onTouchStart={() => handleFriendLongPressStart(friendId)}
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
        <div className="fixed bottom-4 left-4 z-50 transition-opacity duration-300 opacity-100 pointer-events-auto">
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
            <DialogTitle>{profile?.organization || localStorage.getItem('deepsesh_organization') ? "Edit Organisation Name" : "Add Organisation Name"}</DialogTitle>
            <DialogDescription>
              Enter the name of your organization. This will be visible to others.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="organization-name">Organisation Name</Label>
              <Input
                id="organization-name"
                value={organization}
                onChange={(e) => handleOrganizationChange(e.target.value)}
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