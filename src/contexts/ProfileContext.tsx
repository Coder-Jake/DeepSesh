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
  join_code: string | null; // RENAMED: host_code to join_code
  profile_data: ProfileDataJsonb; // The new JSONB column
  visibility: ("public" | "friends" | "organisation" | "private")[]; // NEW: Add visibility column
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
  join_code: string | null; // RENAMED: host_code to join_code
  profile_data: ProfileDataJsonb;
  organization?: string | null;
  avatar_url?: string | null;
  visibility: ("public" | "friends" | "organisation" | "private")[]; // NEW: Add visibility
};

// Helper to generate a random host code (now handled by Supabase function)
// This function is no longer used client-side for new profile creation,
// as the Supabase trigger `handle_new_user` calls `public.generate_random_host_code()`.
// Keeping it here as a placeholder or for potential future client-side use cases.
export const generateRandomJoinCode = () => { // RENAMED: generateRandomHostCode to generateRandomJoinCode
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
  joinCode: string | null; // RENAMED: hostCode to joinCode
  setJoinCode: React.Dispatch<React.SetStateAction<string | null>>; // RENAMED: setHostCode to setJoinCode
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
  getPublicProfile: (userId: string, userName: string) => Promise<Profile | null>; // Change return type to Promise
  blockUser: (userName: string) => void;
  unblockUser: (userName: string) => void;
  resetProfile: () => void;
  profileVisibility: ("public" | "friends" | "organisation" | "private")[]; // NEW: Add profileVisibility
  setProfileVisibility: React.Dispatch<React.SetStateAction<("public" | "friends" | "organisation" | "private")[]>>; // NEW: Add setter
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

  // Individual states for profile fields - these will be derived from 'profile'
  const [localFirstName, setLocalFirstName] = useState("You");
  const [bio, setBio] = useState<string | null>(null);
  const [intention, setIntention] = useState<string | null>(null);
  const [canHelpWith, setCanHelpWith] = useState<string | null>(null);
  const [needHelpWith, setNeedHelpWith] = useState<string | null>(null);
  const [focusPreference, setFocusPreference] = useState(50);
  const [organization, setOrganization] = useState<string | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState<string | null>(null); // RENAMED: hostCode to joinCode
  const [pronouns, setPronouns] = useState<string | null>(null);

  // Visibility settings
  const [bioVisibility, setBioVisibility] = useState<("public" | "friends" | "organisation" | "private")[]>(['public']);
  const [intentionVisibility, setIntentionVisibility] = useState<("public" | "friends" | "organisation" | "private")[]>(['public']);
  const [linkedinVisibility, setLinkedinVisibility] = useState<("public" | "friends" | "organisation" | "private")[]>(['public']);
  const [canHelpWithVisibility, setCanHelpWithVisibility] = useState<("public" | "friends" | "organisation" | "private")[]>(['public']);
  const [needHelpWithVisibility, setNeedHelpWithVisibility] = useState<("public" | "friends" | "organisation" | "private")[]>(['public']);
  const [profileVisibility, setProfileVisibility] = useState<("public" | "friends" | "organisation" | "private")[]>(['public']); // NEW: Add profileVisibility state

  // Social states
  const [friendStatuses, setFriendStatuses] = useState<Record<string, 'friends' | 'pending' | 'none'>>({});
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [recentCoworkers, setRecentCoworkers] = useState<string[]>([]);

  const mockProfilesRef = useRef<Profile[]>([]);

  const getDefaultProfileDataField = useCallback((value: string | null = null, visibility: ("public" | "friends" | "organisation" | "private")[] = ['public']): ProfileDataField => ({
    value,
    visibility,
  }), []);

  const getDefaultProfileDataJsonb = useCallback((): ProfileDataJsonb => ({
    bio: getDefaultProfileDataField(null, ['public']),
    intention: getDefaultProfileDataField(null, ['public']),
    linkedin_url: getDefaultProfileDataField(null, ['public']),
    can_help_with: getDefaultProfileDataField(null, ['public']),
    need_help_with: getDefaultProfileDataField(null, ['public']),
    pronouns: getDefaultProfileDataField(null, ['public']),
  }), [getDefaultProfileDataField]);

  const fetchMockProfiles = useCallback(async () => {
    mockProfilesRef.current = [
      {
        id: "mock-user-id-bezos", first_name: "Sam Altman", last_name: null, avatar_url: null, focus_preference: 20, updated_at: new Date().toISOString(), organization: "OpenAI", join_code: "Goldfish", visibility: ['public'], // RENAMED
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
        id: "mock-user-id-musk", first_name: "Musk", last_name: null, avatar_url: null, focus_preference: 10, updated_at: new Date().toISOString(), organization: "SpaceX", join_code: "Silverfalcon", visibility: ['public'], // RENAMED
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
        id: "mock-user-id-freud", first_name: "Freud", last_name: null, avatar_url: null, focus_preference: 60, updated_at: new Date().toISOString(), organization: "Psychology Dept.", join_code: "Tealshark", visibility: ['public'], // RENAMED
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
        id: "mock-user-id-aristotle", first_name: "Aristotle", last_name: null, avatar_url: null, focus_preference: 50, updated_at: new Date().toISOString(), organization: "Ancient Philosophy Guild", join_code: "Redphilosopher", visibility: ['organisation'], // RENAMED
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

  const syncProfileToSupabase = useCallback(async (successMessage?: string) => {
    if (!user || !profile) {
      console.log("syncProfileToSupabase: Skipping sync. User or local profile not available.");
      return;
    }

    const profileDataToSend = {
      ...profile,
      profile_data: profile.profile_data || getDefaultProfileDataJsonb(),
      visibility: profile.visibility || ['public'], // Ensure visibility is sent
    };

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert(profileDataToSend, { onConflict: 'id' });

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

  // --- Initial Load Effect (Local-First) ---
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
        const defaultedProfile: Profile = {
          ...parsedProfile,
          profile_data: parsedProfile.profile_data || getDefaultProfileDataJsonb(),
          visibility: parsedProfile.visibility || ['public'], // Default visibility if missing
        };
        if (isMounted) {
          setProfile(defaultedProfile); // Set the main profile object
        }
      } else {
        if (!authLoading && user) {
          const defaultProfileData: ProfileDataJsonb = getDefaultProfileDataJsonb();
          const defaultProfile: Profile = {
            id: user.id,
            first_name: user.user_metadata.first_name || "You",
            last_name: null, avatar_url: null, organization: null,
            focus_preference: 50, updated_at: new Date().toISOString(),
            join_code: generateRandomJoinCode(), // RENAMED: host_code to join_code
            profile_data: defaultProfileData,
            visibility: ['public'], // Default visibility for new profiles
          };
          if (isMounted) {
            setProfile(defaultProfile);
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
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [authLoading, user, getDefaultProfileDataJsonb, getDefaultProfileDataField]); // Removed syncProfileToSupabase from dependencies here

  // --- Effect to sync individual states from the main 'profile' object ---
  useEffect(() => {
    if (profile) {
      setLocalFirstName(profile.first_name || "You");
      setFocusPreference(profile.focus_preference || 50);
      setOrganization(profile.organization);
      setJoinCode(profile.join_code); // RENAMED: setHostCode to setJoinCode
      setProfileVisibility(profile.visibility || ['public']); // NEW: Sync profileVisibility

      const pd = profile.profile_data;
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
    } else {
      // Reset individual states if profile becomes null
      setLocalFirstName("You");
      setFocusPreference(50);
      setOrganization(null);
      setJoinCode(null); // RENAMED: setHostCode to setJoinCode
      setProfileVisibility(['public']); // NEW: Reset profileVisibility
      setBio(null);
      setBioVisibility(['public']);
      setIntention(null);
      setIntentionVisibility(['public']);
      setLinkedinUrl(null);
      setLinkedinVisibility(['public']);
      setCanHelpWith(null);
      setCanHelpWithVisibility(['public']);
      setNeedHelpWith(null);
      setNeedHelpWithVisibility(['public']);
      setPronouns(null);
    }
  }, [profile, getDefaultProfileDataJsonb]); // Depend on profile

  // Effect to save the entire profile object to local storage whenever it changes
  useEffect(() => {
    if (profile) {
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_PROFILE_KEY);
    }
  }, [profile]);

  // --- Periodic Sync Effect ---
  useEffect(() => {
    if (!user || !profile) return;

    const syncInterval = setInterval(() => {
      syncProfileToSupabase();
    }, 30000);

    return () => clearInterval(syncInterval);
  }, [user, profile, syncProfileToSupabase]);


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

    // Create a new profile object based on current 'profile' and 'updates'
    const currentProfile = profile || { id: user.id, first_name: "You", focus_preference: 50, join_code: generateRandomJoinCode(), profile_data: getDefaultProfileDataJsonb(), visibility: ['public'] } as Profile; // RENAMED: host_code to join_code

    const updatedProfileData: ProfileDataJsonb = { ...currentProfile.profile_data };

    if (updates.bio !== undefined) updatedProfileData.bio = updates.bio;
    if (updates.intention !== undefined) updatedProfileData.intention = updates.intention;
    if (updates.linkedin_url !== undefined) updatedProfileData.linkedin_url = updates.linkedin_url;
    if (updates.can_help_with !== undefined) updatedProfileData.can_help_with = updates.can_help_with;
    if (updates.need_help_with !== undefined) updatedProfileData.need_help_with = updates.need_help_with;
    if (updates.pronouns !== undefined) updatedProfileData.pronouns = updates.pronouns;

    const newProfile: Profile = {
      ...currentProfile,
      ...updates, // Apply direct updates (first_name, focus_preference, etc.)
      profile_data: updatedProfileData,
      updated_at: new Date().toISOString(), // Always update timestamp on explicit update
      id: user.id, // Ensure ID is always set
      visibility: updates.visibility || currentProfile.visibility || ['public'], // NEW: Ensure visibility is updated
    };

    setProfile(newProfile); // <-- This is the single source of truth update

    if (areToastsEnabled && successMessage) {
      toast.success("Profile Updated", {
        description: successMessage,
      });
    }

    // Trigger immediate sync to Supabase
    await syncProfileToSupabase();

  }, [user, areToastsEnabled, profile, getDefaultProfileDataJsonb, syncProfileToSupabase]);

  const getPublicProfile = useCallback(async (userId: string, userName: string): Promise<Profile | null> => { // Make it async
    // 1. Check mock profiles
    const foundMockProfile = mockProfilesRef.current.find(p => p.id === userId);
    if (foundMockProfile) {
      return foundMockProfile;
    }

    // 2. Check if it's the current user's profile
    if (user?.id === userId && profile) {
      return profile; // Return the current user's full profile from context
    }

    // 3. Fetch from Supabase
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means "no rows found"
        console.error("Error fetching public profile from Supabase:", error.message);
        // Don't throw, just log and proceed to default
      }

      if (data) {
        // Ensure profile_data and visibility are properly defaulted if missing from DB
        const fetchedProfile: Profile = {
          ...data,
          profile_data: data.profile_data || getDefaultProfileDataJsonb(),
          visibility: data.visibility || ['public'], // Default visibility if missing
        };
        return fetchedProfile;
      }
    } catch (error: any) {
      console.error("Unexpected error fetching public profile from Supabase:", error.message);
    }

    // 4. If not found anywhere, return a default minimal profile
    const defaultProfileData: ProfileDataJsonb = getDefaultProfileDataJsonb();
    return {
      id: userId,
      first_name: userName,
      last_name: null,
      avatar_url: null,
      organization: null,
      focus_preference: 50,
      updated_at: new Date().toISOString(),
      join_code: null, // RENAMED: host_code to join_code
      profile_data: defaultProfileData,
      visibility: ['private'], // Default to private for unknown public profiles
    };
  }, [user?.id, profile, getDefaultProfileDataJsonb]); // Add user and profile to dependencies

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
    setProfile(null); // This will trigger the useEffect to reset individual states
    // After local reset, trigger a sync to potentially clear Supabase entry
    syncProfileToSupabase("Profile reset and synced to cloud.");
    window.location.reload();
  }, [syncProfileToSupabase]);

  const value = useMemo(() => ({
    profile,
    loading: loading || authLoading,
    updateProfile,
    localFirstName,
    setLocalFirstName,
    joinCode, // RENAMED: hostCode to joinCode
    setJoinCode, // RENAMED: setHostCode to setJoinCode
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
    profileVisibility, // NEW: Provide profileVisibility
    setProfileVisibility, // NEW: Provide setProfileVisibility
  }), [
    profile, loading, authLoading, updateProfile, localFirstName, setLocalFirstName, joinCode, setJoinCode, // RENAMED
    bio, setBio, intention, setIntention, canHelpWith, setCanHelpWith, needHelpWith, setNeedHelpWith,
    focusPreference, setFocusPreference, organization, setOrganization, linkedinUrl, setLinkedinUrl,
    bioVisibility, setBioVisibility, intentionVisibility, setIntentionVisibility, linkedinVisibility, setLinkedinVisibility,
    canHelpWithVisibility, setCanHelpWithVisibility, needHelpWithVisibility, setNeedHelpWithVisibility,
    pronouns, setPronouns, friendStatuses, blockedUsers, recentCoworkers, getPublicProfile, blockUser, unblockUser,
    resetProfile, profileVisibility, setProfileVisibility
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