import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback, useRef } from "react";
import { toast } from 'sonner';
import { useAuth } from "./AuthContext";
import { supabase } from '@/integrations/supabase/client';
import { colors, animals } from '@/lib/constants';
import { MOCK_PROFILES } from '@/lib/mock-data';

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
  onboarding_complete?: boolean; // NEW: Add onboarding_complete to profile_data
};

// Define the main Profile type reflecting the database schema
export type Profile = {
  avatar_url: string | null;
  first_name: string | null; // Can be null if user hasn't set a custom name
  id: string;
  last_name: string | null;
  organization: string | null;
  focus_preference: number | null;
  updated_at: string | null;
  join_code: string | null;
  profile_data: ProfileDataJsonb;
  visibility: ("public" | "friends" | "organisation" | "private")[];
  onboarding_complete: boolean; // NEW: Add onboarding_complete directly to Profile
};

// ProfileUpdate type: allows updating direct columns OR specific fields within profile_data
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'updated_at' | 'profile_data' | 'onboarding_complete'>> & {
  // Allow updating individual fields within profile_data
  bio?: ProfileDataField;
  intention?: ProfileDataField;
  linkedin_url?: ProfileDataField;
  can_help_with?: ProfileDataField;
  need_help_with?: ProfileDataField;
  pronouns?: ProfileDataField;
  onboarding_complete?: boolean; // NEW: Allow updating onboarding_complete
};

// ProfileInsert type: for creating a new profile (used internally for default creation)
export type ProfileInsert = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  focus_preference: number | null;
  join_code: string | null;
  profile_data: ProfileDataJsonb;
  organization?: string | null;
  avatar_url?: string | null;
  visibility: ("public" | "friends" | "organisation" | "private")[];
  onboarding_complete: boolean; // NEW: Add onboarding_complete
};

// Helper to generate a random host code (now handled by Supabase function)
export const generateRandomJoinCode = () => {
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
  const toTitleCase = (str: string) => str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  return `${toTitleCase(randomColor)}${toTitleCase(randomAnimal)}`;
};

// Helper to generate a default ProfileDataField
const getDefaultProfileDataField = (value: string | null = null, visibility: ("public" | "friends" | "organisation" | "private")[] = ['public']): ProfileDataField => ({
  value,
  visibility,
});

// Helper to generate a default ProfileDataJsonb
const getDefaultProfileDataJsonb = (): ProfileDataJsonb => ({
  bio: getDefaultProfileDataField(null, ['public']),
  intention: getDefaultProfileDataField(null, ['public']),
  linkedin_url: getDefaultProfileDataField(null, ['public']),
  can_help_with: getDefaultProfileDataField(null, ['public']),
  need_help_with: getDefaultProfileDataField(null, ['public']),
  pronouns: getDefaultProfileDataField(null, ['public']),
  onboarding_complete: false, // NEW: Default to false
});

interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  updateProfile: (updates: ProfileUpdate, successMessage?: string) => Promise<void>;
  localFirstName: string;
  setLocalFirstName: React.Dispatch<React.SetStateAction<string>>;
  joinCode: string | null;
  setJoinCode: React.Dispatch<React.SetStateAction<string | null>>;
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
  getPublicProfile: (userId: string, userName: string) => Promise<Profile | null>;
  blockUser: (userName: string) => void;
  unblockUser: (userName: string) => void;
  resetProfile: () => void;
  profileVisibility: ("public" | "friends" | "organisation" | "private")[];
  setProfileVisibility: React.Dispatch<React.SetStateAction<("public" | "friends" | "organisation" | "private")[]>>;
  unfriendUser: (userId: string) => void; // NEW: Add unfriendUser to context type
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
  const [localFirstName, setLocalFirstName] = useState("Loading...");
  const [bio, setBio] = useState<string | null>(null);
  const [intention, setIntention] = useState<string | null>(null);
  const [canHelpWith, setCanHelpWith] = useState<string | null>(null);
  const [needHelpWith, setNeedHelpWith] = useState<string | null>(null);
  const [focusPreference, setFocusPreference] = useState(50);
  const [organization, setOrganization] = useState<string | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [pronouns, setPronouns] = useState<string | null>(null);

  // Visibility settings
  const [bioVisibility, setBioVisibility] = useState<("public" | "friends" | "organisation" | "private")[]>(['public']);
  const [intentionVisibility, setIntentionVisibility] = useState<("public" | "friends" | "organisation" | "private")[]>(['public']);
  const [linkedinVisibility, setLinkedinVisibility] = useState<("public" | "friends" | "organisation" | "private")[]>(['public']);
  const [canHelpWithVisibility, setCanHelpWithVisibility] = useState<("public" | "friends" | "organisation" | "private")[]>(['public']);
  const [needHelpWithVisibility, setNeedHelpWithVisibility] = useState<("public" | "friends" | "organisation" | "private")[]>(['public']);
  const [profileVisibility, setProfileVisibility] = useState<("public" | "friends" | "organisation" | "private")[]>(['public']);

  // Social states
  const [friendStatuses, setFriendStatuses] = useState<Record<string, 'friends' | 'pending' | 'none'>>({});
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [recentCoworkers, setRecentCoworkers] = useState<string[]>([]);

  const mockProfilesRef = useRef<Profile[]>([]);

  useEffect(() => {
    mockProfilesRef.current = MOCK_PROFILES;
  }, []);

  const syncProfileToSupabase = useCallback(async (successMessage?: string) => {
    if (!user || !profile) {
      console.log("syncProfileToSupabase: Skipping sync. User or local profile not available.");
      return;
    }

    const profileDataToSend: any = {
      ...profile,
      profile_data: profile.profile_data || getDefaultProfileDataJsonb(),
      visibility: profile.visibility || ['public'],
      onboarding_complete: profile.onboarding_complete || false, // Ensure onboarding_complete is sent
    };

    if ('host_code' in profileDataToSend) {
      delete profileDataToSend.host_code;
    }

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
  }, [user, profile, areToastsEnabled]); // Removed getDefaultProfileDataJsonb from dependencies

  // --- Initial Load Effect (Local-First) ---
  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      setLoading(true);
      const storedProfile = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
      let currentFriendStatuses: Record<string, 'friends' | 'pending' | 'none'> = storedFriendStatuses ? JSON.parse(storedFriendStatuses) : {};
      let currentBlockedUsers: string[] = storedBlockedUsers ? JSON.parse(storedBlockedUsers) : [];
      let currentRecentCoworkers: string[] = storedRecentCoworkers ? JSON.parse(storedRecentCoworkers) : [];

      // NEW: Add Jake as a default demo friend
      const jakeProfile = MOCK_PROFILES.find(p => p.first_name === 'Jake');
      if (jakeProfile) {
        if (!currentFriendStatuses[jakeProfile.id]) {
          currentFriendStatuses[jakeProfile.id] = 'friends';
        }
        if (!currentRecentCoworkers.includes(jakeProfile.first_name || '')) {
          currentRecentCoworkers.unshift(jakeProfile.first_name || ''); // Add to front
          currentRecentCoworkers = currentRecentCoworkers.slice(0, 10); // Keep max 10
        }
      }

      if (storedProfile) {
        const parsedProfile: Profile = JSON.parse(storedProfile);
        if ((parsedProfile as any).host_code !== undefined) {
          (parsedProfile as any).join_code = (parsedProfile as any).host_code;
          delete (parsedProfile as any).host_code;
        }
        const defaultedProfile: Profile = {
          ...parsedProfile,
          profile_data: parsedProfile.profile_data || getDefaultProfileDataJsonb(),
          visibility: parsedProfile.visibility || ['public'],
          onboarding_complete: parsedProfile.onboarding_complete ?? false, // NEW: Default to false if not present
        };
        if (isMounted) {
          setProfile(defaultedProfile);
        }
      } else {
        if (!authLoading && user) {
          const defaultProfileData: ProfileDataJsonb = getDefaultProfileDataJsonb();
          const defaultProfile: Profile = {
            id: user.id,
            first_name: null, // Default to null so join_code can be used
            last_name: null, avatar_url: null, organization: null,
            focus_preference: 50, updated_at: new Date().toISOString(),
            join_code: generateRandomJoinCode(),
            profile_data: defaultProfileData,
            visibility: ['public'],
            onboarding_complete: false, // NEW: Default to false for new users
          };
          if (isMounted) {
            setProfile(defaultProfile);
            localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(defaultProfile));
          }
        }
      }

      setFriendStatuses(currentFriendStatuses);
      setBlockedUsers(currentBlockedUsers);
      setRecentCoworkers(currentRecentCoworkers);

      localStorage.setItem(LOCAL_STORAGE_FRIEND_STATUSES_KEY, JSON.stringify(currentFriendStatuses));
      localStorage.setItem(LOCAL_STORAGE_RECENT_COWORKERS_KEY, JSON.stringify(currentRecentCoworkers));

      setLoading(false);
    };

    const storedFriendStatuses = localStorage.getItem(LOCAL_STORAGE_FRIEND_STATUSES_KEY);
    const storedBlockedUsers = localStorage.getItem(LOCAL_STORAGE_BLOCKED_USERS_KEY);
    const storedRecentCoworkers = localStorage.getItem(LOCAL_STORAGE_RECENT_COWORKERS_KEY);

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [authLoading, user]); // Removed getDefaultProfileDataJsonb, getDefaultProfileDataField from dependencies

  // --- Effect to sync individual states from the main 'profile' object ---
  useEffect(() => {
    if (profile) {
      // Prioritize profile.first_name if it's explicitly set, otherwise use join_code
      setLocalFirstName(profile.first_name || profile.join_code || "Coworker");
      setFocusPreference(profile.focus_preference || 50);
      setOrganization(profile.organization);
      setJoinCode(profile.join_code);
      setProfileVisibility(profile.visibility || ['public']);

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
      setLocalFirstName("Loading...");
      setFocusPreference(50);
      setOrganization(null);
      setJoinCode(null);
      setProfileVisibility(['public']);
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
  }, [profile]); // Removed getDefaultProfileDataJsonb from dependencies

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

    const currentProfile = profile || { id: user.id, first_name: null, focus_preference: 50, join_code: generateRandomJoinCode(), profile_data: getDefaultProfileDataJsonb(), visibility: ['public'], onboarding_complete: false } as Profile;

    const updatedProfileData: ProfileDataJsonb = { ...currentProfile.profile_data };

    if (updates.bio !== undefined) updatedProfileData.bio = updates.bio;
    if (updates.intention !== undefined) updatedProfileData.intention = updates.intention;
    if (updates.linkedin_url !== undefined) updatedProfileData.linkedin_url = updates.linkedin_url;
    if (updates.can_help_with !== undefined) updatedProfileData.can_help_with = updates.can_help_with;
    if (updates.need_help_with !== undefined) updatedProfileData.need_help_with = updates.need_help_with;
    if (updates.pronouns !== undefined) updatedProfileData.pronouns = updates.pronouns;
    if (updates.onboarding_complete !== undefined) updatedProfileData.onboarding_complete = updates.onboarding_complete; // NEW: Update onboarding_complete

    const newProfile: Profile = {
      ...currentProfile,
      ...updates,
      profile_data: updatedProfileData,
      updated_at: new Date().toISOString(),
      id: user.id,
      visibility: updates.visibility || currentProfile.visibility || ['public'],
      onboarding_complete: updates.onboarding_complete ?? currentProfile.onboarding_complete ?? false, // NEW: Ensure onboarding_complete is set
    };

    setProfile(newProfile);

    if (areToastsEnabled && successMessage) {
      toast.success("Profile Updated", {
        description: successMessage,
      });
    }

    await syncProfileToSupabase();

  }, [user, areToastsEnabled, profile, syncProfileToSupabase]); // Removed getDefaultProfileDataJsonb from dependencies

  const getPublicProfile = useCallback(async (userId: string, userName: string): Promise<Profile | null> => {
    const foundMockProfile = mockProfilesRef.current.find(p => p.id === userId);
    if (foundMockProfile) {
      return foundMockProfile;
    }

    if (user?.id === userId && profile) {
      return profile;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching public profile from Supabase:", error.message);
      }

      if (data) {
        const fetchedProfile: Profile = {
          ...data,
          profile_data: data.profile_data || getDefaultProfileDataJsonb(),
          visibility: data.visibility || ['public'],
          onboarding_complete: data.onboarding_complete ?? false, // NEW: Default to false
        };
        return fetchedProfile;
      }
    } catch (error: any) {
      console.error("Unexpected error fetching public profile from Supabase:", error.message);
    }

    const defaultProfileData: ProfileDataJsonb = getDefaultProfileDataJsonb();
    return {
      id: userId,
      first_name: userName,
      last_name: null,
      avatar_url: null,
      organization: null,
      focus_preference: 50,
      updated_at: new Date().toISOString(),
      join_code: null,
      profile_data: defaultProfileData,
      visibility: ['private'],
      onboarding_complete: false, // NEW: Default to false
    };
  }, [user?.id, profile]); // Removed getDefaultProfileDataJsonb from dependencies

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

  // NEW: unfriendUser function
  const unfriendUser = useCallback((userId: string) => {
    setFriendStatuses(prev => {
      if (prev[userId] === 'friends') {
        if (areToastsEnabled) {
          toast.info("Friend Removed", {
            description: `You are no longer friends with this user.`,
          });
        }
        const newFriendStatuses = { ...prev, [userId]: 'none' as 'none' };
        localStorage.setItem(LOCAL_STORAGE_FRIEND_STATUSES_KEY, JSON.stringify(newFriendStatuses));
        return newFriendStatuses;
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
    syncProfileToSupabase("Profile reset and synced to cloud.");
    window.location.reload();
  }, [syncProfileToSupabase]);

  const value = useMemo(() => ({
    profile,
    loading: loading || authLoading,
    updateProfile,
    localFirstName,
    setLocalFirstName,
    joinCode,
    setJoinCode,
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
    profileVisibility,
    setProfileVisibility,
    unfriendUser, // NEW: Provide unfriendUser
  }), [
    profile, loading, authLoading, updateProfile, localFirstName, setLocalFirstName, joinCode, setJoinCode,
    bio, setBio, intention, setIntention, canHelpWith, setCanHelpWith, needHelpWith, setNeedHelpWith,
    focusPreference, setFocusPreference, organization, setOrganization, linkedinUrl, setLinkedinUrl,
    bioVisibility, setBioVisibility, intentionVisibility, setIntentionVisibility, linkedinVisibility, setLinkedinVisibility,
    canHelpWithVisibility, setCanHelpWithVisibility, needHelpWithVisibility, setNeedHelpWithVisibility,
    pronouns, setPronouns, friendStatuses, blockedUsers, recentCoworkers, getPublicProfile, blockUser, unblockUser,
    resetProfile, profileVisibility, setProfileVisibility, unfriendUser
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