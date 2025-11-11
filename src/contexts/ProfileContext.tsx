import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback, useRef } from "react";
import { toast } from 'sonner';
import { useAuth } from "./AuthContext";
import { supabase } from '@/integrations/supabase/client';
import { colors, animals } from '@/lib/constants';

// Define the structure for a single field within profile_data
export type ProfileDataField = {
  value: string | null;
  visibility: ("public" | "friends" | "organisation" | "private")[];
};

// Define the structure for the profile_data JSONB column
export type ProfileDataJsonb = {
  bio: ProfileDataField;
  intention: ProfileDataField;
  linkedin_url: ProfileDataField;
  can_help_with: ProfileDataField;
  need_help_with: ProfileDataField;
  pronouns: ProfileDataField;
};

// Define the main Profile type reflecting the database schema
export type Profile = {
  avatar_url: string | null;
  first_name: string | null;
  id: string;
  last_name: string | null;
  organization: string | null;
  focus_preference: number | null;
  updated_at: string | null;
  host_code: string | null;
  profile_data: ProfileDataJsonb; // The new JSONB column
};

// ProfileUpdate type: allows updating direct columns OR specific fields within profile_data
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'updated_at' | 'profile_data'>> & {
  // Allow updating individual fields within profile_data
  bio?: ProfileDataField;
  intention?: ProfileDataField;
  linkedin_url?: ProfileDataField;
  can_help_with?: ProfileDataField;
  need_help_with?: ProfileDataField;
  pronouns?: ProfileDataField;
};

// ProfileInsert type: for creating a new profile (used internally for default creation)
export type ProfileInsert = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  focus_preference: number | null;
  host_code: string | null;
  profile_data: ProfileDataJsonb;
  organization?: string | null;
  avatar_url?: string | null;
};

// Helper to generate a random host code (now handled by Supabase function)
// This function is no longer used client-side for new profile creation,
// as the Supabase trigger `handle_new_user` calls `public.generate_random_host_code()`.
// Keeping it here as a placeholder or for potential future client-side use cases.
export const generateRandomHostCode = () => {
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
  // Client-side generation, if ever needed, would also apply TitleCase
  const toTitleCase = (str: string) => str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  return `${toTitleCase(randomColor)}${toTitleCase(randomAnimal)}`;
};

interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  updateProfile: (updates: ProfileUpdate, successMessage?: string) => Promise<void>;
  localFirstName: string;
  setLocalFirstName: React.Dispatch<React.SetStateAction<string>>;
  hostCode: string | null;
  setHostCode: React.Dispatch<React.SetStateAction<string | null>>;
  bio: string | null;
  setBio: React.Dispatch<React.SetStateAction<string | null>>;
  intention: string | null;
  setIntention: React.Dispatch<React.SetStateAction<string | null>>;
  canHelpWith: string | null;
  setCanHelpWith: React.Dispatch<React.SetStateAction<string | null>>;
  needHelpWith: string | null;
  setNeedHelpWith: React.Dispatch<React.SetStateAction<string | null>>;
  focusPreference: number;
  setFocusPreference: React.Dispatch<React.SetStateAction<number>>;
  organization: string | null;
  setOrganization: React.Dispatch<React.SetStateAction<string | null>>;
  linkedinUrl: string | null;
  setLinkedinUrl: React.Dispatch<React.SetStateAction<string | null>>;
  bioVisibility: ("public" | "friends" | "organisation" | "private")[];
  setBioVisibility: React.Dispatch<React.SetStateAction<("public" | "friends" | "organisation" | "private")[]>>;
  intentionVisibility: ("public" | "friends" | "organisation" | "private")[];
  setIntentionVisibility: React.Dispatch<React.SetStateAction<("public" | "friends" | "organisation" | "private")[]>>;
  linkedinVisibility: ("public" | "friends" | "organisation" | "private")[];
  setLinkedinVisibility: React.Dispatch<React.SetStateAction<("public" | "friends" | "organisation" | "private")[]>>;
  canHelpWithVisibility: ("public" | "friends" | "organisation" | "private")[];
  setCanHelpWithVisibility: React.Dispatch<React.SetStateAction<("public" | "friends" | "organisation" | "private")[]>>;
  needHelpWithVisibility: ("public" | "friends" | "organisation" | "private")[];
  setNeedHelpWithVisibility: React.Dispatch<React.SetStateAction<("public" | "friends" | "organisation" | "private")[]>>;
  pronouns: string | null;
  setPronouns: React.Dispatch<React.SetStateAction<string | null>>;
  friendStatuses: Record<string, 'friends' | 'pending' | 'none'>;
  blockedUsers: string[];
  recentCoworkers: string[];
  getPublicProfile: (userId: string, userName: string) => Profile | null;
  blockUser: (userName: string) => void;
  unblockUser: (userName: string) => void;
  resetProfile: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const LOCAL_STORAGE_PROFILE_KEY = 'deepsesh_user_profile';
const LOCAL_STORAGE_FRIEND_STATUSES_KEY = 'deepsesh_friend_statuses';
const LOCAL_STORAGE_BLOCKED_USERS_KEY = 'deepsesh_blocked_users';
const LOCAL_STORAGE_RECENT_COWORKERS_KEY = 'deepsesh_recent_coworkers';

interface ProfileProviderProps {
  children: ReactNode;
  areToastsEnabled: boolean;
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children, areToastsEnabled }) => {
  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Local states for profile fields
  const [localFirstName, setLocalFirstName] = useState("You");
  const [bio, setBio] = useState<string | null>(null);
  const [intention, setIntention] = useState<string | null>(null);
  const [canHelpWith, setCanHelpWith] = useState<string | null>(null);
  const [needHelpWith, setNeedHelpWith] = useState<string | null>(null);
  const [focusPreference, setFocusPreference] = useState(50);
  const [organization, setOrganization] = useState<string | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState<string | null>(null);
  const [hostCode, setHostCode] = useState<string | null>(null);
  const [pronouns, setPronouns] = useState<string | null>(null);

  // Visibility settings
  const [bioVisibility, setBioVisibility] = useState<("public" | "friends" | "organisation" | "private")[]>(['public']);
  const [intentionVisibility, setIntentionVisibility] = useState<("public" | "friends" | "organisation" | "private")[]>(['public']);
  const [linkedinVisibility, setLinkedinVisibility] = useState<("public" | "friends" | "organisation" | "private")[]>(['public']);
  const [canHelpWithVisibility, setCanHelpWithVisibility] = useState<("public" | "friends" | "organisation" | "private")[]>(['public']);
  const [needHelpWithVisibility, setNeedHelpWithVisibility] = useState<("public" | "friends" | "organisation" | "private")[]>(['public']);

  // Social states
  const [friendStatuses, setFriendStatuses] = useState<Record<string, 'friends' | 'pending' | 'none'>>({});
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [recentCoworkers, setRecentCoworkers] = useState<string[]>([]);

  const mockProfilesRef = useRef<Profile[]>([]);

  // Helper to get default ProfileDataField
  const getDefaultProfileDataField = useCallback((value: string | null = null, visibility: ("public" | "friends" | "organisation" | "private")[] = ['public']): ProfileDataField => ({
    value,
    visibility,
  }), []);

  // Helper to get default ProfileDataJsonb
  const getDefaultProfileDataJsonb = useCallback((): ProfileDataJsonb => ({
    bio: getDefaultProfileDataField(null, ['public']),
    intention: getDefaultProfileDataField(null, ['public']),
    linkedin_url: getDefaultProfileDataField(null, ['public']),
    can_help_with: getDefaultProfileDataField(null, ['public']),
    need_help_with: getDefaultProfileDataField(null, ['public']),
    pronouns: getDefaultProfileDataField(null, ['public']),
  }), [getDefaultProfileDataField]);

  // Function to fetch mock profiles (from Index.tsx)
  const fetchMockProfiles = useCallback(async () => {
    mockProfilesRef.current = [
      {
        id: "mock-user-id-bezos", first_name: "Sam Altman", last_name: null, avatar_url: null, focus_preference: 20, updated_at: new Date().toISOString(), organization: "OpenAI", host_code: "Goldfish",
        profile_data: {
          bio: getDefaultProfileDataField("Leading AI research.", ['public']),
          intention: getDefaultProfileDataField("Focusing on AGI.", ['public']),
          linkedin_url: getDefaultProfileDataField("https://www.linkedin.com/in/samaltman", ['public']),
          can_help_with: getDefaultProfileDataField("AI strategy", ['public']),
          need_help_with: getDefaultProfileDataField("AI safety", ['private']),
          pronouns: getDefaultProfileDataField("He/Him", ['public']),
        }
      },
      {
        id: "mock-user-id-musk", first_name: "Musk", last_name: null, avatar_url: null, focus_preference: 10, updated_at: new Date().toISOString(), organization: "SpaceX", host_code: "Silverfalcon",
        profile_data: {
          bio: getDefaultProfileDataField("Designing rockets.", ['public']),
          intention: getDefaultProfileDataField("Innovating space travel.", ['public']),
          linkedin_url: getDefaultProfileDataField("https://www.linkedin.com/in/elonmusk", ['public']),
          can_help_with: getDefaultProfileDataField("Rocket engineering", ['public']),
          need_help_with: getDefaultProfileDataField("Mars colonization", ['private']),
          pronouns: getDefaultProfileDataField("He/Him", ['public']),
        }
      },
      {
        id: "mock-user-id-freud", first_name: "Freud", last_name: null, avatar_url: null, focus_preference: 60, updated_at: new Date().toISOString(), organization: "Psychology Dept.", host_code: "Tealshark",
        profile_data: {
          bio: getDefaultProfileDataField("Reviewing psychoanalytic theories.", ['public']),
          intention: getDefaultProfileDataField("Unraveling human behavior.", ['public']),
          linkedin_url: getDefaultProfileDataField("https://www.linkedin.com/in/sigmundfreud", ['public']),
          can_help_with: getDefaultProfileDataField("Psychoanalysis", ['friends']),
          need_help_with: getDefaultProfileDataField("Modern neuroscience", ['friends']),
          pronouns: getDefaultProfileDataField("He/Him", ['public']),
        }
      },
      {
        id: "mock-user-id-aristotle", first_name: "Aristotle", last_name: null, avatar_url: null, focus_preference: 50, updated_at: new Date().toISOString(), organization: "Ancient Philosophy Guild", host_code: "Redphilosopher",
        profile_data: {
          bio: getDefaultProfileDataField("Studying logic.", ['public']),
          intention: getDefaultProfileDataField("Deep work on theories.", ['public']),
          linkedin_url: getDefaultProfileDataField(null, ['public']),
          can_help_with: getDefaultProfileDataField("Logic", ['organisation']),
          need_help_with: getDefaultProfileDataField("Modern science", ['organisation']),
          pronouns: getDefaultProfileDataField("He/Him", ['public']),
        }
      },
    ];
  }, [getDefaultProfileDataField]);

  useEffect(() => {
    fetchMockProfiles();
  }, [fetchMockProfiles]);

  // --- NEW: Supabase Synchronization Function ---
  const syncProfileToSupabase = useCallback(async (successMessage?: string) => {
    if (!user || !profile) {
      console.log("syncProfileToSupabase: Skipping sync. User or local profile not available.");
      return;
    }

    // Ensure profile_data is always a valid object before sending
    const profileDataToSend = {
      ...profile,
      profile_data: profile.profile_data || getDefaultProfileDataJsonb(),
      updated_at: new Date().toISOString(), // Always update timestamp on sync attempt
    };

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert(profileDataToSend, { onConflict: 'id' }); // Use upsert to handle both insert and update

      if (error) {
        console.error("Error syncing profile to Supabase:", error.message);
        if (areToastsEnabled) {
          toast.error("Offline Sync Failed", {
            description: `Failed to sync profile to cloud: ${error.message}. Changes saved locally.`,
          });
        }
      } else {
        console.log("Profile synced to Supabase successfully.");
        if (areToastsEnabled && successMessage) {
          toast.success("Profile Synced", {
            description: successMessage,
          });
        }
      }
    } catch (error: any) {
      console.error("Unexpected error during Supabase sync:", error.message);
      if (areToastsEnabled) {
        toast.error("Offline Sync Error", {
          description: `An unexpected error occurred during sync: ${error.message}. Changes saved locally.`,
        });
      }
    }
  }, [user, profile, areToastsEnabled, getDefaultProfileDataJsonb]);

  // --- NEW: Initial Load Effect (Local-First) ---
  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates on unmounted component
    const loadProfile = async () => {
      setLoading(true);
      const storedProfile = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
      const storedFriendStatuses = localStorage.getItem(LOCAL_STORAGE_FRIEND_STATUSES_KEY);
      const storedBlockedUsers = localStorage.getItem(LOCAL_STORAGE_BLOCKED_USERS_KEY);
      const storedRecentCoworkers = localStorage.getItem(LOCAL_STORAGE_RECENT_COWORKERS_KEY);

      if (storedProfile) {
        const parsedProfile: Profile = JSON.parse(storedProfile);
        // Ensure profile_data is always a valid object
        const defaultedProfile: Profile = {
          ...parsedProfile,
          profile_data: parsedProfile.profile_data || getDefaultProfileDataJsonb(),
        };
        if (isMounted) {
          setProfile(defaultedProfile);
          setLocalFirstName(defaultedProfile.first_name || "You");
          setFocusPreference(defaultedProfile.focus_preference || 50);
          setOrganization(defaultedProfile.organization);
          setHostCode(defaultedProfile.host_code);

          // Deconstruct profile_data with safe access and fallbacks
          const pd = defaultedProfile.profile_data;
          setBio(pd.bio?.value || null);
          setBioVisibility(pd.bio?.visibility || ['public']);
          setIntention(pd.intention?.value || null);
          setIntentionVisibility(pd.intention?.visibility || ['public']);
          setLinkedinUrl(pd.linkedin_url?.value || null);
          setLinkedinVisibility(pd.linkedin_url?.visibility || ['public']);
          setCanHelpWith(pd.can_help_with?.value || null);
          setCanHelpWithVisibility(pd.can_help_with?.visibility || ['public']);
          setNeedHelpWith(pd.need_help_with?.value || null);
          setNeedHelpWithVisibility(pd.need_help_with?.visibility || ['public']);
          setPronouns(pd.pronouns?.value || null);
        }
      } else {
        // If no local profile, create a default one once user is available
        if (!authLoading && user) {
          const defaultProfileData: ProfileDataJsonb = getDefaultProfileDataJsonb();
          const defaultProfile: Profile = {
            id: user.id,
            first_name: user.user_metadata.first_name || "You",
            last_name: null, avatar_url: null, organization: null,
            focus_preference: 50, updated_at: new Date().toISOString(),
            host_code: generateRandomHostCode(), // Client-side fallback for host code
            profile_data: defaultProfileData,
          };
          if (isMounted) {
            setProfile(defaultProfile);
            setLocalFirstName(defaultProfile.first_name);
            setHostCode(defaultProfile.host_code);
            setFocusPreference(defaultProfile.focus_preference);
            setBio(defaultProfile.profile_data.bio.value);
            setBioVisibility(defaultProfile.profile_data.bio.visibility);
            setIntention(defaultProfile.profile_data.intention.value);
            setIntentionVisibility(defaultProfile.profile_data.intention.visibility);
            setLinkedinUrl(defaultProfile.profile_data.linkedin_url.value);
            setLinkedinVisibility(defaultProfile.profile_data.linkedin_url.visibility);
            setCanHelpWith(defaultProfile.profile_data.can_help_with.value);
            setCanHelpWithVisibility(defaultProfile.profile_data.can_help_with.visibility);
            setNeedHelpWith(defaultProfile.profile_data.need_help_with.value);
            setNeedHelpWithVisibility(defaultProfile.profile_data.need_help_with.visibility);
            setPronouns(defaultProfile.profile_data.pronouns.value);
            localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(defaultProfile));
          }
        }
      }

      if (storedFriendStatuses) {
        setFriendStatuses(JSON.parse(storedFriendStatuses));
      }
      if (storedBlockedUsers) {
        setBlockedUsers(JSON.parse(storedBlockedUsers));
      }
      if (storedRecentCoworkers) {
        setRecentCoworkers(JSON.parse(storedRecentCoworkers));
      }
      setLoading(false);
      // After loading (or creating) local profile, trigger an immediate sync
      if (user && isMounted) { // Only sync if user is available
        syncProfileToSupabase("Profile loaded and synced.");
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [authLoading, user, getDefaultProfileDataJsonb, getDefaultProfileDataField, syncProfileToSupabase]);

  // --- NEW: Periodic Sync Effect ---
  useEffect(() => {
    if (!user || !profile) return; // Only sync if user and profile are loaded

    const syncInterval = setInterval(() => {
      syncProfileToSupabase();
    }, 30000); // Sync every 30 seconds

    return () => clearInterval(syncInterval);
  }, [user, profile, syncProfileToSupabase]);


  // Sync local states to profile object and save to local storage
  // This useEffect now acts as the "local save" mechanism, but with an optimization
  useEffect(() => {
    if (!user || loading) return;

    const currentProfileData: ProfileDataJsonb = {
      bio: getDefaultProfileDataField(bio, bioVisibility),
      intention: getDefaultProfileDataField(intention, intentionVisibility),
      linkedin_url: getDefaultProfileDataField(linkedinUrl, linkedinVisibility),
      can_help_with: getDefaultProfileDataField(canHelpWith, canHelpWithVisibility),
      need_help_with: getDefaultProfileDataField(needHelpWith, needHelpWithVisibility),
      pronouns: getDefaultProfileDataField(pronouns, ['public']),
    };

    const newProfileContent: Omit<Profile, 'updated_at'> = {
      id: user.id,
      first_name: localFirstName,
      last_name: null,
      avatar_url: null,
      focus_preference: focusPreference,
      organization,
      host_code: hostCode,
      profile_data: currentProfileData,
    };

    // Create a comparable version of the existing profile (without updated_at)
    const existingProfileContentComparable: Omit<Profile, 'updated_at'> | null = profile ? {
      id: profile.id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      avatar_url: profile.avatar_url,
      focus_preference: profile.focus_preference,
      organization: profile.organization,
      host_code: profile.host_code,
      profile_data: profile.profile_data,
    } : null;

    // Only update if the content of the profile has actually changed
    if (JSON.stringify(newProfileContent) !== JSON.stringify(existingProfileContentComparable)) {
      const updatedProfile: Profile = {
        ...newProfileContent,
        updated_at: new Date().toISOString(), // Set updated_at only when content changes
      };
      setProfile(updatedProfile);
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updatedProfile));
    } else if (profile) {
      // If content hasn't changed, but profile exists, ensure localStorage has the latest profile object
      // (which might have a different `updated_at` from the last `setProfile` call, e.g., from initial load or Supabase sync)
      // This is crucial for `syncProfileToSupabase` to always send the most recent `updated_at` to Supabase.
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(profile));
    }
  }, [
    user, loading, localFirstName, bio, intention, canHelpWith, needHelpWith, focusPreference,
    organization, linkedinUrl, hostCode, pronouns,
    bioVisibility, intentionVisibility, linkedinVisibility, canHelpWithVisibility, needHelpWithVisibility,
    getDefaultProfileDataField, profile // `profile` is a dependency because we compare against it
  ]);

  // --- MODIFIED: updateProfile function (now local-first) ---
  const updateProfile = useCallback(async (updates: ProfileUpdate, successMessage?: string) => {
    if (!user) {
      if (areToastsEnabled) {
        toast.error("Authentication Required", {
          description: "You must be logged in to update your profile.",
        });
      }
      return;
    }

    // Immediately update local states
    if (updates.first_name !== undefined) setLocalFirstName(updates.first_name);
    if (updates.focus_preference !== undefined) setFocusPreference(updates.focus_preference);
    if (updates.organization !== undefined) setOrganization(updates.organization);
    if (updates.host_code !== undefined) setHostCode(updates.host_code);

    // Handle profile_data fields
    const currentProfileData = profile?.profile_data || getDefaultProfileDataJsonb();
    let newProfileData: ProfileDataJsonb = { ...currentProfileData };

    if (updates.bio !== undefined) { setBio(updates.bio.value); setBioVisibility(updates.bio.visibility); newProfileData.bio = updates.bio; }
    if (updates.intention !== undefined) { setIntention(updates.intention.value); setIntentionVisibility(updates.intention.visibility); newProfileData.intention = updates.intention; }
    if (updates.linkedin_url !== undefined) { setLinkedinUrl(updates.linkedin_url.value); setLinkedinVisibility(updates.linkedin_url.visibility); newProfileData.linkedin_url = updates.linkedin_url; }
    if (updates.can_help_with !== undefined) { setCanHelpWith(updates.can_help_with.value); setCanHelpWithVisibility(updates.can_help_with.visibility); newProfileData.can_help_with = updates.can_help_with; }
    if (updates.need_help_with !== undefined) { setNeedHelpWith(updates.need_help_with.value); setNeedHelpWithVisibility(updates.need_help_with.visibility); newProfileData.need_help_with = updates.need_help_with; }
    if (updates.pronouns !== undefined) { setPronouns(updates.pronouns.value); newProfileData.pronouns = updates.pronouns; }

    // Update the main profile state object
    const updatedProfile: Profile = {
      ...(profile || {} as Profile), // Use existing profile or an empty object as base
      id: user.id, // Ensure ID is always set
      first_name: updates.first_name !== undefined ? updates.first_name : localFirstName,
      focus_preference: updates.focus_preference !== undefined ? updates.focus_preference : focusPreference,
      organization: updates.organization !== undefined ? updates.organization : organization,
      host_code: updates.host_code !== undefined ? updates.host_code : hostCode,
      profile_data: newProfileData,
      updated_at: new Date().toISOString(),
    };
    setProfile(updatedProfile);
    localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updatedProfile));

    if (areToastsEnabled && successMessage) {
      toast.success("Profile Updated", {
        description: successMessage,
      });
    }

    // Trigger immediate sync to Supabase
    await syncProfileToSupabase();

  }, [
    user, areToastsEnabled, profile, localFirstName, focusPreference, organization, hostCode,
    bio, bioVisibility, intention, intentionVisibility, linkedinUrl, linkedinVisibility,
    canHelpWith, canHelpWithVisibility, needHelpWith, needHelpWithVisibility, pronouns,
    setLocalFirstName, setFocusPreference, setOrganization, setHostCode,
    setBio, setBioVisibility, setIntention, setIntentionVisibility, setLinkedinUrl, setLinkedinVisibility,
    setCanHelpWith, setCanHelpWithVisibility, setNeedHelpWith, setNeedHelpWithVisibility, setPronouns,
    getDefaultProfileDataJsonb, syncProfileToSupabase
  ]);

  const getPublicProfile = useCallback((userId: string, userName: string): Profile | null => {
    const foundProfile = mockProfilesRef.current.find(p => p.id === userId);
    if (foundProfile) {
      return foundProfile;
    }
    // Fallback for users not in mock data
    const defaultProfileData: ProfileDataJsonb = getDefaultProfileDataJsonb();
    return {
      id: userId,
      first_name: userName,
      last_name: null,
      avatar_url: null,
      organization: null,
      focus_preference: 50,
      updated_at: new Date().toISOString(),
      host_code: null,
      profile_data: defaultProfileData,
    };
  }, [getDefaultProfileDataJsonb]);

  const blockUser = useCallback((userName: string) => {
    setBlockedUsers(prev => {
      if (!prev.includes(userName)) {
        if (areToastsEnabled) {
          toast.info("User Blocked", {
            description: `${userName} has been blocked.`,
          });
        }
        const newBlockedUsers = [...prev, userName];
        localStorage.setItem(LOCAL_STORAGE_BLOCKED_USERS_KEY, JSON.stringify(newBlockedUsers));
        return newBlockedUsers;
      }
      return prev;
    });
  }, [areToastsEnabled]);

  const unblockUser = useCallback((userName: string) => {
    setBlockedUsers(prev => {
      if (prev.includes(userName)) {
        if (areToastsEnabled) {
          toast.info("User Unblocked", {
            description: `${userName} has been unblocked.`,
          });
        }
        const newBlockedUsers = prev.filter(name => name !== userName);
        localStorage.setItem(LOCAL_STORAGE_BLOCKED_USERS_KEY, JSON.stringify(newBlockedUsers));
        return newBlockedUsers;
      }
      return prev;
    });
  }, [areToastsEnabled]);

  const resetProfile = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_PROFILE_KEY);
    localStorage.removeItem(LOCAL_STORAGE_FRIEND_STATUSES_KEY);
    localStorage.removeItem(LOCAL_STORAGE_BLOCKED_USERS_KEY);
    localStorage.removeItem(LOCAL_STORAGE_RECENT_COWORKERS_KEY);
    setProfile(null);
    setLocalFirstName("You");
    setBio(null);
    setIntention(null);
    setCanHelpWith(null);
    setNeedHelpWith(null);
    setFocusPreference(50);
    setOrganization(null);
    setLinkedinUrl(null);
    setHostCode(null);
    setPronouns(null);
    // Reset profile_data related states
    setBioVisibility(['public']);
    setIntentionVisibility(['public']);
    setLinkedinVisibility(['public']);
    setCanHelpWithVisibility(['public']);
    setNeedHelpWithVisibility(['public']);
    setFriendStatuses({});
    setBlockedUsers([]);
    setRecentCoworkers([]);
    // After local reset, trigger a sync to potentially clear Supabase entry
    syncProfileToSupabase("Profile reset and synced to cloud.");
    window.location.reload(); // Reload to ensure full state reset
  }, [syncProfileToSupabase]);

  const value = useMemo(() => ({
    profile,
    loading: loading || authLoading,
    updateProfile,
    localFirstName,
    setLocalFirstName,
    hostCode,
    setHostCode,
    bio,
    setBio,
    intention,
    setIntention,
    canHelpWith,
    setCanHelpWith,
    needHelpWith,
    setNeedHelpWith,
    focusPreference,
    setFocusPreference,
    organization,
    setOrganization,
    linkedinUrl,
    setLinkedinUrl,
    bioVisibility,
    setBioVisibility,
    intentionVisibility,
    setIntentionVisibility,
    linkedinVisibility,
    setLinkedinVisibility,
    canHelpWithVisibility,
    setCanHelpWithVisibility,
    needHelpWithVisibility,
    setNeedHelpWithVisibility,
    pronouns,
    setPronouns,
    friendStatuses,
    blockedUsers,
    recentCoworkers,
    getPublicProfile,
    blockUser,
    unblockUser,
    resetProfile,
  }), [
    profile, loading, authLoading, updateProfile, localFirstName, setLocalFirstName, hostCode, setHostCode,
    bio, setBio, intention, setIntention, canHelpWith, setCanHelpWith, needHelpWith, setNeedHelpWith,
    focusPreference, setFocusPreference, organization, setOrganization, linkedinUrl, setLinkedinUrl,
    bioVisibility, setBioVisibility, intentionVisibility, setIntentionVisibility, linkedinVisibility, setLinkedinVisibility,
    canHelpWithVisibility, setCanHelpWithVisibility, needHelpWithVisibility, setNeedHelpWithVisibility,
    pronouns, setPronouns, friendStatuses, blockedUsers, recentCoworkers, getPublicProfile, blockUser, unblockUser,
    resetProfile
  ]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};