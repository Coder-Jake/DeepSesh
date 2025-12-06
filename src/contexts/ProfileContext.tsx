import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback, useRef } from "react";
import { toast } from 'sonner';
import { useAuth } from "./AuthContext";
import { supabase } from '@/integrations/supabase/client'; // Import the existing supabase client
import { colors, animals } from '@/lib/constants';
import { MOCK_PROFILES } from '@/lib/mock-data';
import { Session } from '@supabase/supabase-js'; // Import Session

// Define the structure for a single field within profile_data
export type ProfileDataField = {
  value: string | string[] | null;
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
  organisation: ProfileDataField; // NEW: Organisation is now a ProfileDataField
};

// Define the main Profile type reflecting the database schema
export type Profile = {
  id: string; // ADDED THIS LINE
  avatar_url: string | null;
  first_name: string | null;
  last_name: string | null;
  // REMOVED: organisation: string[] | null; // Organisation is now inside profile_data
  focus_preference: number | null;
  updated_at: string | null;
  join_code: string | null;
  profile_data: ProfileDataJsonb; // This is a JSONB column
  visibility: ("public" | "friends" | "organisation" | "private")[]; // This is a direct column
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
  organisation?: ProfileDataField; // NEW: Organisation is now a ProfileDataField
};

// ProfileInsert type: for creating a new profile (used internally for default creation)
export type ProfileInsert = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  focus_preference: number | null;
  join_code: string | null;
  profile_data: ProfileDataJsonb;
  // REMOVED: organisation?: string[] | null; // Organisation is now inside profile_data
  avatar_url?: string | null;
  visibility: ("public" | "friends" | "organisation" | "private")[];
};

// Helper to generate a random host code (now handled by Supabase function)
export const generateRandomJoinCode = () => {
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
  const toTitleCase = (str: string) => str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  return `${toTitleCase(randomColor)}${toTitleCase(randomAnimal)}`;
};

// Helper to generate a default ProfileDataField
const getDefaultProfileDataField = (value: string | string[] | null = null, visibility: ("public" | "friends" | "organisation" | "private")[] = ['public']): ProfileDataField => ({
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
  organisation: getDefaultProfileDataField([], ['public']), // NEW: Default for organisation
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
  organisation: string[] | null; // NEW: Organisation is now a direct column (derived from profile_data)
  setOrganisation: React.Dispatch<React.SetStateAction<string[] | null>>; // NEW: Setter (will update profile_data)
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
  organisationVisibility: ("public" | "friends" | "organisation" | "private")[]; // NEW: Organisation visibility
  setOrganisationVisibility: React.Dispatch<React.SetStateAction<("public" | "friends" | "organisation" | "private")[]>>; // NEW: Setter
  friendStatuses: Record<string, 'friends' | 'pending' | 'none'>;
  blockedUsers: string[];
  recentCoworkers: string[];
  getPublicProfile: (userId: string, userName: string) => Promise<Profile | null>;
  blockUser: (userName: string) => void;
  unblockUser: (userName: string) => void;
  resetProfile: () => void;
  profileVisibility: ("public" | "friends" | "organisation" | "private")[];
  setProfileVisibility: React.Dispatch<React.SetStateAction<("public" | "friends" | "organisation" | "private")[]>>;
  unfriendUser: (userId: string) => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const LOCAL_STORAGE_PROFILE_KEY = 'deepsesh_user_profile';
const LOCAL_STORAGE_FRIEND_STATUSES_KEY = 'deepsesh_friend_statuses';
const LOCAL_STORAGE_BLOCKED_USERS_KEY = 'deepsesh_blocked_users';
const LOCAL_STORAGE_RECENT_COWORKERS_KEY = 'deepsesh_recent_coworkers';

interface ProfileProviderProps {
  children: ReactNode;
  areToastsEnabled: boolean;
  session: Session | null; // Add session here
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children, areToastsEnabled, session }) => {
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
  const [organisation, setOrganisation] = useState<string[] | null>(null); // NEW: Organisation is now a direct column (derived from profile_data)
  const [linkedinUrl, setLinkedinUrl] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [pronouns, setPronouns] = useState<string | null>(null);

  // Visibility settings
  const [bioVisibility, setBioVisibility] = useState<("public" | "friends" | "organisation" | "private")[]>(['public']);
  const [intentionVisibility, setIntentionVisibility] = useState<("public" | "friends" | "organisation" | "private")[]>(['public']);
  const [linkedinVisibility, setLinkedinVisibility] = useState<("public" | "friends" | "organisation" | "private")[]>(['public']);
  const [canHelpWithVisibility, setCanHelpWithVisibility] = useState<("public" | "friends" | "organisation" | "private")[]>(['public']);
  const [needHelpWithVisibility, setNeedHelpWithVisibility] = useState<("public" | "friends" | "organisation" | "private")[]>(['public']);
  const [pronounsVisibility, setPronounsVisibility] = useState<("public" | "friends" | "organisation" | "private")[]>(['public']); // NEW: Pronouns visibility
  const [organisationVisibility, setOrganisationVisibility] = useState<("public" | "friends" | "organisation" | "private")[]>(['public']); // NEW: Organisation visibility
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
    if (!user || !profile || !session) { // Ensure session is available
      console.log("syncProfileToSupabase: Skipping sync. User, local profile, or session not available.");
      return;
    }

    // Create a copy of the profile to send, ensuring 'onboarding_complete' is not included
    const profileDataToSend: any = {
      ...profile,
      profile_data: profile.profile_data || getDefaultProfileDataJsonb(),
      visibility: profile.visibility || ['public'],
      // REMOVED: organisation: profile.organisation || [], // Organisation is now inside profile_data
    };

    // Explicitly remove any 'onboarding_complete' property if it somehow exists
    if ('onboarding_complete' in profileDataToSend) {
      delete profileDataToSend.onboarding_complete;
    }

    if ('host_code' in profileDataToSend) {
      delete profileDataToSend.host_code;
    }
    // NEW: Explicitly remove 'organization' if it exists (due to potential old local storage data)
    if ('organization' in profileDataToSend) {
      delete profileDataToSend.organization;
    }

    try {
      // Use the existing supabase client directly
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
  }, [user, profile, areToastsEnabled, session]);

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
        // Explicitly remove onboarding_complete if it exists in local storage
        const { onboarding_complete, ...restOfParsedProfile } = parsedProfile as any;

        // Ensure profile_data and its sub-fields are defaulted
        const defaultedProfileData: ProfileDataJsonb = {
          ...getDefaultProfileDataJsonb(), // Start with all defaults
          ...(restOfParsedProfile.profile_data || {}), // Overlay existing profile_data
        };
        // Ensure each sub-field of profile_data has value and visibility
        for (const key in defaultedProfileData) {
          if (defaultedProfileData.hasOwnProperty(key)) {
            const field = defaultedProfileData[key as keyof ProfileDataJsonb];
            if (field && typeof field === 'object' && !Array.isArray(field)) { // Ensure it's a ProfileDataField
              defaultedProfileData[key as keyof ProfileDataJsonb] = {
                value: field.value !== undefined ? field.value : getDefaultProfileDataJsonb()[key as keyof ProfileDataJsonb].value,
                visibility: field.visibility || getDefaultProfileDataJsonb()[key as keyof ProfileDataJsonb].visibility,
              };
            }
          }
        }

        const defaultedProfile: Profile = {
          ...restOfParsedProfile, // Use restOfParsedProfile
          profile_data: defaultedProfileData,
          visibility: restOfParsedProfile.visibility || ['public'],
          // REMOVED: organisation: Array.isArray(restOfParsedProfile.organisation) ? restOfParsedProfile.organisation : [], // Organisation is now inside profile_data
        };
        if (isMounted) {
          setProfile(defaultedProfile);
        }
      } else {
        if (!authLoading && user) {
          const defaultProfileData: ProfileDataJsonb = getDefaultProfileDataJsonb();
          const defaultProfile: Profile = {
            id: user.id, // ADDED THIS LINE
            first_name: null,
            last_name: null, avatar_url: null, 
            focus_preference: 50, updated_at: new Date().toISOString(),
            join_code: generateRandomJoinCode(),
            profile_data: defaultProfileData,
            visibility: ['public'],
            // REMOVED: organisation: [], // Organisation is now inside profile_data
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
  }, [authLoading, user]);

  // --- Effect to sync individual states from the main 'profile' object ---
  useEffect(() => {
    if (profile) {
      // Prioritize profile.first_name if it's explicitly set, otherwise use join_code
      setLocalFirstName(profile.first_name || profile.join_code || "Coworker");
      setFocusPreference(profile.focus_preference || 50);
      setJoinCode(profile.join_code);
      setProfileVisibility(profile.visibility || ['public']);

      const pd = profile.profile_data;
      setBio(pd.bio?.value as string || null);
      setBioVisibility(pd.bio?.visibility || ['public']);
      setIntention(pd.intention?.value as string || null);
      setIntentionVisibility(pd.intention?.visibility || ['public']);
      setLinkedinUrl(pd.linkedin_url?.value as string || null);
      setLinkedinVisibility(pd.linkedin_url?.visibility || ['public']);
      setCanHelpWith(pd.can_help_with?.value as string || null);
      setCanHelpWithVisibility(pd.can_help_with?.visibility || ['public']);
      setNeedHelpWith(pd.need_help_with?.value as string || null);
      setNeedHelpWithVisibility(pd.need_help_with?.visibility || ['public']);
      setPronouns(pd.pronouns?.value as string || null);
      setPronounsVisibility(pd.pronouns?.visibility || ['public']); // NEW: Pronouns visibility
      setOrganisation(pd.organisation?.value as string[] || null); // NEW: Set organisation directly from profile_data
      setOrganisationVisibility(pd.organisation?.visibility || ['public']); // NEW: Set organisation visibility
    } else {
      setLocalFirstName("Loading...");
      setFocusPreference(50);
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
      setPronounsVisibility(['public']); // NEW: Pronouns visibility
      setOrganisation(null); // NEW: Reset organisation directly
      setOrganisationVisibility(['public']); // NEW: Reset organisation visibility
    }
  }, [profile]);

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
    if (!user || !profile || !session) return; // Ensure session is available

    const syncInterval = setInterval(() => {
      syncProfileToSupabase();
    }, 30000);

    return () => clearInterval(syncInterval);
  }, [user, profile, syncProfileToSupabase, session]); // Add session to dependencies


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

    const currentProfile = profile || { 
      id: user.id, // ADDED THIS LINE
      first_name: null, 
      last_name: null, // ADDED
      avatar_url: null, // ADDED
      focus_preference: 50, 
      updated_at: null, // ADDED
      join_code: generateRandomJoinCode(), 
      profile_data: getDefaultProfileDataJsonb(), 
      visibility: ['public'], 
      // REMOVED: organisation: [] 
    } as Profile;

    const updatedProfileData: ProfileDataJsonb = { ...currentProfile.profile_data };

    // Filter out onboarding_complete from updates before applying to profile_data
    const { onboarding_complete, ...restOfUpdates } = updates as any; // Cast to any to allow destructuring non-existent prop

    if (restOfUpdates.bio !== undefined) updatedProfileData.bio = restOfUpdates.bio;
    if (restOfUpdates.intention !== undefined) updatedProfileData.intention = restOfUpdates.intention;
    if (restOfUpdates.linkedin_url !== undefined) updatedProfileData.linkedin_url = restOfUpdates.linkedin_url;
    if (restOfUpdates.can_help_with !== undefined) updatedProfileData.can_help_with = restOfUpdates.can_help_with;
    if (restOfUpdates.need_help_with !== undefined) updatedProfileData.need_help_with = restOfUpdates.need_help_with;
    if (restOfUpdates.pronouns !== undefined) updatedProfileData.pronouns = restOfUpdates.pronouns;
    if (restOfUpdates.organisation !== undefined) updatedProfileData.organisation = restOfUpdates.organisation; // NEW: Handle organisation update

    const newProfile: Profile = {
      ...currentProfile,
      ...restOfUpdates, // Apply updates excluding onboarding_complete
      profile_data: updatedProfileData,
      updated_at: new Date().toISOString(),
      id: user.id,
      visibility: restOfUpdates.visibility || currentProfile.visibility || ['public'],
      // REMOVED: organisation: updatedOrganisation !== undefined ? updatedOrganisation : (Array.isArray(currentProfile.organisation) ? currentProfile.organisation : []), // Organisation is now a direct column
    };

    setProfile(newProfile);

    if (areToastsEnabled && successMessage) {
      toast.success("Profile Updated", {
        description: successMessage,
      });
    }

    await syncProfileToSupabase();

  }, [user, areToastsEnabled, profile, syncProfileToSupabase]);

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
          // REMOVED: organisation: Array.isArray(data.organisation) ? data.organisation : [], // Organisation is now inside profile_data
        };
        // NEW: Ensure profile_data.organisation is properly defaulted if missing
        if (!fetchedProfile.profile_data.organisation) {
          fetchedProfile.profile_data.organisation = getDefaultProfileDataJsonb().organisation;
        }
        return fetchedProfile;
      }
    } catch (error: any) {
      console.error("Unexpected error fetching public profile from Supabase:", error.message);
    }

    const defaultProfileData: ProfileDataJsonb = getDefaultProfileDataJsonb();
    return {
      id: userId, // ADDED THIS LINE
      first_name: userName,
      last_name: null,
      avatar_url: null,
      // REMOVED: organisation: [], // Organisation is now inside profile_data
      focus_preference: 50,
      updated_at: new Date().toISOString(),
      join_code: null,
      profile_data: defaultProfileData,
      visibility: ['private'],
    };
  }, [user?.id, profile]);

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
    organisation, // NEW: Organisation is now a direct column (derived from profile_data)
    setOrganisation, // NEW: Setter (will update profile_data)
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
    organisationVisibility, // NEW: Organisation visibility
    setOrganisationVisibility, // NEW: Setter
    friendStatuses,
    blockedUsers,
    recentCoworkers,
    getPublicProfile,
    blockUser,
    unblockUser,
    resetProfile,
    profileVisibility,
    setProfileVisibility,
    unfriendUser,
  }), [
    profile, loading, authLoading, updateProfile, localFirstName, setLocalFirstName, joinCode, setJoinCode,
    bio, setBio, intention, setIntention, canHelpWith, setCanHelpWith, needHelpWith, setNeedHelpWith,
    focusPreference, setFocusPreference, organisation, setOrganisation, // NEW: organisation
    linkedinUrl, setLinkedinUrl,
    bioVisibility, setBioVisibility, intentionVisibility, setIntentionVisibility, linkedinVisibility, setLinkedinVisibility,
    canHelpWithVisibility, setCanHelpWithVisibility, needHelpWithVisibility, setNeedHelpWithVisibility,
    pronouns, setPronouns, organisationVisibility, setOrganisationVisibility, // NEW: organisation visibility
    friendStatuses, blockedUsers, recentCoworkers, getPublicProfile, blockUser, unblockUser,
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