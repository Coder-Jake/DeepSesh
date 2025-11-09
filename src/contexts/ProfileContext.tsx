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

// ProfileInsert type: for creating a new profile
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

// Helper to generate a random host code
export const generateRandomHostCode = () => {
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
  return `${randomColor}${randomAnimal}`;
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

  // Function to fetch mock profiles (from Index.tsx)
  const fetchMockProfiles = useCallback(async () => {
    mockProfilesRef.current = [
      {
        id: "mock-user-id-bezos", first_name: "Sam Altman", last_name: null, avatar_url: null, focus_preference: 20, updated_at: new Date().toISOString(), organization: "OpenAI", host_code: "goldfish",
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
        id: "mock-user-id-musk", first_name: "Musk", last_name: null, avatar_url: null, focus_preference: 10, updated_at: new Date().toISOString(), organization: "SpaceX", host_code: "silverfalcon",
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
        id: "mock-user-id-freud", first_name: "Freud", last_name: null, avatar_url: null, focus_preference: 60, updated_at: new Date().toISOString(), organization: "Psychology Dept.", host_code: "tealshark",
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
        id: "mock-user-id-aristotle", first_name: "Aristotle", last_name: null, avatar_url: null, focus_preference: 50, updated_at: new Date().toISOString(), organization: "Ancient Philosophy Guild", host_code: "redphilosopher",
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

  // Load profile from local storage on initial mount
  useEffect(() => {
    const storedProfile = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
    const storedFriendStatuses = localStorage.getItem(LOCAL_STORAGE_FRIEND_STATUSES_KEY);
    const storedBlockedUsers = localStorage.getItem(LOCAL_STORAGE_BLOCKED_USERS_KEY);
    const storedRecentCoworkers = localStorage.getItem(LOCAL_STORAGE_RECENT_COWORKERS_KEY);

    if (storedProfile) {
      const parsedProfile: Profile = JSON.parse(storedProfile);
      setProfile(parsedProfile);
      setLocalFirstName(parsedProfile.first_name || "You");
      setFocusPreference(parsedProfile.focus_preference || 50);
      setOrganization(parsedProfile.organization);
      setHostCode(parsedProfile.host_code);

      // Deconstruct profile_data
      const pd = parsedProfile.profile_data;
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
  }, [getDefaultProfileDataField]);

  // Sync local states to profile object and save to local storage
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

    const currentProfile: Profile = {
      id: user.id,
      first_name: localFirstName,
      last_name: null,
      avatar_url: null,
      focus_preference: focusPreference,
      organization,
      host_code: hostCode,
      profile_data: currentProfileData,
      updated_at: new Date().toISOString(),
    };
    setProfile(currentProfile);
    localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(currentProfile));
  }, [
    user, loading, localFirstName, bio, intention, canHelpWith, needHelpWith, focusPreference,
    organization, linkedinUrl, hostCode, pronouns,
    bioVisibility, intentionVisibility, linkedinVisibility, canHelpWithVisibility, needHelpWithVisibility,
    getDefaultProfileDataField
  ]);

  // Fetch profile from Supabase or create if not exists
  useEffect(() => {
    let isMounted = true;
    const fetchOrCreateProfile = async () => {
      if (!user || authLoading) {
        setLoading(true);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code === 'PGRST116') { // No rows found
          console.log("No profile found, creating a new one.");
          const newHostCode = generateRandomHostCode();
          const defaultProfileData: ProfileDataJsonb = {
            bio: getDefaultProfileDataField(null, ['public']),
            intention: getDefaultProfileDataField(null, ['public']),
            linkedin_url: getDefaultProfileDataField(null, ['public']),
            can_help_with: getDefaultProfileDataField(null, ['public']),
            need_help_with: getDefaultProfileDataField(null, ['public']),
            pronouns: getDefaultProfileDataField(null, ['public']),
          };
          const newProfileData: ProfileInsert = {
            id: user.id,
            first_name: user.user_metadata.first_name || "You",
            host_code: newHostCode,
            focus_preference: 50,
            profile_data: defaultProfileData,
            last_name: null, avatar_url: null, organization: null,
          };
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert(newProfileData)
            .select('*')
            .single();

          if (insertError) throw insertError;
          if (isMounted) {
            setProfile(newProfile);
            setLocalFirstName(newProfile.first_name || "You");
            setHostCode(newProfile.host_code);
            setFocusPreference(newProfile.focus_preference || 50);
            // Deconstruct profile_data
            const pd = newProfile.profile_data;
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
            localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(newProfile));
          }
        } else if (error) {
          throw error;
        } else if (data) {
          if (isMounted) {
            setProfile(data);
            setLocalFirstName(data.first_name || "You");
            setOrganization(data.organization);
            setFocusPreference(data.focus_preference || 50);
            setHostCode(data.host_code);
            // Deconstruct profile_data
            const pd = data.profile_data;
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
            localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(data));
          }
        }
      } catch (error: any) {
        console.error("Error fetching or creating profile:", error.message);
        if (areToastsEnabled) {
          toast.error("Profile Error", {
            description: `Failed to load or create profile: ${error.message}`,
          });
        }
        // Fallback to local storage if Supabase fails
        const storedProfile = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
        if (storedProfile) {
          const parsedProfile: Profile = JSON.parse(storedProfile);
          setProfile(parsedProfile);
          setLocalFirstName(parsedProfile.first_name || "You");
          setOrganization(parsedProfile.organization);
          setFocusPreference(parsedProfile.focus_preference || 50);
          setHostCode(parsedProfile.host_code);
          // Deconstruct profile_data
          const pd = parsedProfile.profile_data;
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
          // If no Supabase and no local storage, create a minimal default
          const defaultHostCode = generateRandomHostCode();
          const defaultProfileData: ProfileDataJsonb = {
            bio: getDefaultProfileDataField(null, ['public']),
            intention: getDefaultProfileDataField(null, ['public']),
            linkedin_url: getDefaultProfileDataField(null, ['public']),
            can_help_with: getDefaultProfileDataField(null, ['public']),
            need_help_with: getDefaultProfileDataField(null, ['public']),
            pronouns: getDefaultProfileDataField(null, ['public']),
          };
          const defaultProfile: Profile = {
            id: user.id,
            first_name: user.user_metadata.first_name || "You",
            last_name: null, avatar_url: null, organization: null,
            focus_preference: 50, updated_at: new Date().toISOString(),
            host_code: defaultHostCode,
            profile_data: defaultProfileData,
          };
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
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchOrCreateProfile();

    return () => {
      isMounted = false;
    };
  }, [user, authLoading, areToastsEnabled, getDefaultProfileDataField]);

  const updateProfile = useCallback(async (updates: ProfileUpdate, successMessage?: string) => {
    if (!user) {
      if (areToastsEnabled) {
        toast.error("Authentication Required", {
          description: "You must be logged in to update your profile.",
        });
      }
      return;
    }

    setLoading(true);
    try {
      // Prepare the object to send to Supabase
      const supabaseUpdates: { [key: string]: any } = { updated_at: new Date().toISOString() };
      let newProfileData: ProfileDataJsonb = profile?.profile_data || {
        bio: getDefaultProfileDataField(),
        intention: getDefaultProfileDataField(),
        linkedin_url: getDefaultProfileDataField(),
        can_help_with: getDefaultProfileDataField(),
        need_help_with: getDefaultProfileDataField(),
        pronouns: getDefaultProfileDataField(),
      };

      // Iterate through updates to separate direct column updates from profile_data updates
      for (const key in updates) {
        if (key === 'first_name' || key === 'last_name' || key === 'avatar_url' ||
            key === 'organization' || key === 'focus_preference' || key === 'host_code') {
          supabaseUpdates[key] = updates[key as keyof Omit<Profile, 'id' | 'updated_at' | 'profile_data'>];
        } else if (key in newProfileData) { // If it's a field that belongs in profile_data
          newProfileData = {
            ...newProfileData,
            [key]: updates[key as keyof ProfileDataJsonb],
          };
        }
      }
      supabaseUpdates.profile_data = newProfileData; // Always send the full (merged) profile_data JSONB

      const { data, error } = await supabase
        .from('profiles')
        .update(supabaseUpdates)
        .eq('id', user.id)
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setLocalFirstName(data.first_name || "You");
        setOrganization(data.organization);
        setFocusPreference(data.focus_preference || 50);
        setHostCode(data.host_code);
        // Deconstruct profile_data back into individual states
        const pd = data.profile_data;
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
        localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(data));
        if (areToastsEnabled && successMessage) {
          toast.success("Profile Updated", {
            description: successMessage,
          });
        }
      }
    } catch (error: any) {
      console.error("Error updating profile:", error.message);
      if (areToastsEnabled) {
        toast.error("Profile Update Failed", {
          description: `Failed to update profile: ${error.message}`,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [user, areToastsEnabled, profile, getDefaultProfileDataField]);

  const getPublicProfile = useCallback((userId: string, userName: string): Profile | null => {
    const foundProfile = mockProfilesRef.current.find(p => p.id === userId);
    if (foundProfile) {
      return foundProfile;
    }
    // Fallback for users not in mock data
    const defaultProfileData: ProfileDataJsonb = {
      bio: getDefaultProfileDataField(null, ['public']),
      intention: getDefaultProfileDataField(null, ['public']),
      linkedin_url: getDefaultProfileDataField(null, ['public']),
      can_help_with: getDefaultProfileDataField(null, ['public']),
      need_help_with: getDefaultProfileDataField(null, ['public']),
      pronouns: getDefaultProfileDataField(null, ['public']),
    };
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
  }, [getDefaultProfileDataField]);

  const blockUser = useCallback((userName: string) => {
    setBlockedUsers(prev => {
      if (!prev.includes(userName)) {
        if (areToastsEnabled) {
          toast.info("User Blocked", {
            description: `${userName} has been blocked.`,
          });
        }
        return [...prev, userName];
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
        return prev.filter(name => name !== userName);
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
    window.location.reload();
  }, []);

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