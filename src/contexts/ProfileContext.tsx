import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback, useRef } from "react";
import { toast } from 'sonner';
import { useAuth } from "./AuthContext";
import { supabase } from '@/integrations/supabase/client';
import { useTimer } from "./TimerContext";
import { colors, animals } from '@/lib/constants';

// Define a simplified Profile type for local storage
export type Profile = {
  avatar_url: string | null
  bio: string | null
  first_name: string | null
  id: string
  intention: string | null
  last_name: string | null
  linkedin_url: string | null
  organization: string | null
  focus_preference: number | null
  updated_at: string | null
  host_code: string | null
  bio_visibility: ("public" | "friends" | "organisation" | "private")[] | null
  intention_visibility: ("public" | "friends" | "organisation" | "private")[] | null
  linkedin_visibility: ("public" | "friends" | "organisation" | "private")[] | null
  can_help_with: string | null
  can_help_with_visibility: ("public" | "friends" | "organisation" | "private")[] | null
  need_help_with: string | null
  need_help_with_visibility: ("public" | "friends" | "organisation" | "private")[] | null
  pronouns: string | null;
};

// Simplified ProfileUpdate type for local storage
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'updated_at'>>;

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
  const { resetSessionStates } = useTimer(); // Use resetSessionStates from TimerContext

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Local states for profile fields
  const [localFirstName, setLocalFirstName] = useState("You");
  const [bio, setBio] = useState<string | null>(null);
  const [intention, setIntention] = useState<string | null>(null);
  const [canHelpWith, setCanHelpWith] = useState<string | null>(null);
  const [needHelpWith, setNeedHelpWith] = useState<string | null>(null);
  const [focusPreference, setFocusPreference] = useState(50); // Default to 50
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

  const mockProfilesRef = useRef<Profile[]>([]); // Ref to store mock profiles

  // Function to fetch mock profiles (from Index.tsx)
  const fetchMockProfiles = useCallback(async () => {
    // Dynamically import Index.tsx to get mockProfiles
    // This is a workaround for circular dependencies if mockProfiles were directly in Index.tsx
    // In a real app, mockProfiles would be in a separate data file or fetched from an API.
    try {
      const { default: IndexModule } = await import('@/pages/Index');
      // Assuming mockProfiles is exported from Index.tsx or accessible
      // For now, I'll hardcode a few mock profiles here to avoid complex dynamic imports
      // and potential circular dependency issues with the current file structure.
      // In a real app, these would be fetched from a database or a dedicated mock data file.
      mockProfilesRef.current = [
        {
          id: "mock-user-id-bezos", first_name: "Sam Altman", last_name: null, avatar_url: null, bio: "Leading AI research.", intention: "Focusing on AGI.", focus_preference: 20, updated_at: new Date().toISOString(), organization: "OpenAI", linkedin_url: "https://www.linkedin.com/in/samaltman", bio_visibility: ['public'], intention_visibility: ['public'], linkedin_visibility: ['public'], can_help_with: "AI strategy", can_help_with_visibility: ['public'], need_help_with: "AI safety", need_help_with_visibility: ['private'], host_code: "goldfish", pronouns: "He/Him",
        },
        {
          id: "mock-user-id-musk", first_name: "Musk", last_name: null, avatar_url: null, bio: "Designing rockets.", intention: "Innovating space travel.", focus_preference: 10, updated_at: new Date().toISOString(), organization: "SpaceX", linkedin_url: "https://www.linkedin.com/in/elonmusk", bio_visibility: ['public'], intention_visibility: ['public'], linkedin_visibility: ['public'], can_help_with: "Rocket engineering", can_help_with_visibility: ['public'], need_help_with: "Mars colonization", need_help_with_visibility: ['private'], host_code: "silverfalcon", pronouns: "He/Him",
        },
        {
          id: "mock-user-id-freud", first_name: "Freud", last_name: null, avatar_url: null, bio: "Reviewing psychoanalytic theories.", intention: "Unraveling human behavior.", focus_preference: 60, updated_at: new Date().toISOString(), organization: "Psychology Dept.", linkedin_url: "https://www.linkedin.com/in/sigmundfreud", bio_visibility: ['public'], intention_visibility: ['public'], linkedin_visibility: ['public'], can_help_with: "Psychoanalysis", can_help_with_visibility: ['friends'], need_help_with: "Modern neuroscience", need_help_with_visibility: ['friends'], host_code: "tealshark", pronouns: "He/Him",
        },
        {
          id: "mock-user-id-aristotle", first_name: "Aristotle", last_name: null, avatar_url: null, bio: "Studying logic.", intention: "Deep work on theories.", focus_preference: 50, updated_at: new Date().toISOString(), organization: "Ancient Philosophy Guild", linkedin_url: null, bio_visibility: ['public'], intention_visibility: ['public'], linkedin_visibility: ['public'], can_help_with: "Logic", can_help_with_visibility: ['organisation'], need_help_with: "Modern science", need_help_with_visibility: ['organisation'], host_code: "redphilosopher", pronouns: "He/Him",
        },
        // Add more mock profiles as needed
      ];
    } catch (e) {
      console.error("Failed to load mock profiles:", e);
    }
  }, []);

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
      setBio(parsedProfile.bio);
      setIntention(parsedProfile.intention);
      setCanHelpWith(parsedProfile.can_help_with);
      setNeedHelpWith(parsedProfile.need_help_with);
      setFocusPreference(parsedProfile.focus_preference || 50);
      setOrganization(parsedProfile.organization);
      setLinkedinUrl(parsedProfile.linkedin_url);
      setHostCode(parsedProfile.host_code);
      setBioVisibility(parsedProfile.bio_visibility || ['public']);
      setIntentionVisibility(parsedProfile.intention_visibility || ['public']);
      setLinkedinVisibility(parsedProfile.linkedin_visibility || ['public']);
      setCanHelpWithVisibility(parsedProfile.can_help_with_visibility || ['public']);
      setNeedHelpWithVisibility(parsedProfile.need_help_with_visibility || ['public']);
      setPronouns(parsedProfile.pronouns);
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
  }, []);

  // Sync local states to profile object and save to local storage
  useEffect(() => {
    if (!user || loading) return; // Only sync if user is loaded and not initially loading

    const currentProfile: Profile = {
      id: user.id,
      first_name: localFirstName,
      last_name: null, // Not currently managed
      avatar_url: null, // Not currently managed
      bio,
      intention,
      can_help_with: canHelpWith,
      need_help_with: needHelpWith,
      focus_preference: focusPreference,
      organization,
      linkedin_url: linkedinUrl,
      host_code: hostCode,
      bio_visibility: bioVisibility,
      intention_visibility: intentionVisibility,
      linkedin_visibility: linkedinVisibility,
      can_help_with_visibility: canHelpWithVisibility,
      need_help_with_visibility: needHelpWithVisibility,
      pronouns,
      updated_at: new Date().toISOString(),
    };
    setProfile(currentProfile);
    localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(currentProfile));
  }, [
    user, loading, localFirstName, bio, intention, canHelpWith, needHelpWith, focusPreference,
    organization, linkedinUrl, hostCode, bioVisibility, intentionVisibility, linkedinVisibility,
    canHelpWithVisibility, needHelpWithVisibility, pronouns
  ]);

  // Save social states to local storage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_FRIEND_STATUSES_KEY, JSON.stringify(friendStatuses));
  }, [friendStatuses]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_BLOCKED_USERS_KEY, JSON.stringify(blockedUsers));
  }, [blockedUsers]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_RECENT_COWORKERS_KEY, JSON.stringify(recentCoworkers));
  }, [recentCoworkers]);

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
          const newProfileData: ProfileUpdate = {
            id: user.id,
            first_name: user.user_metadata.first_name || "You",
            host_code: newHostCode,
            updated_at: new Date().toISOString(),
            focus_preference: 50,
            bio_visibility: ['public'],
            intention_visibility: ['public'],
            linkedin_visibility: ['public'],
            can_help_with_visibility: ['public'],
            need_help_with_visibility: ['public'],
            pronouns: null,
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
            setBioVisibility(newProfile.bio_visibility || ['public']);
            setIntentionVisibility(newProfile.intention_visibility || ['public']);
            setLinkedinVisibility(newProfile.linkedin_visibility || ['public']);
            setCanHelpWithVisibility(newProfile.can_help_with_visibility || ['public']);
            setNeedHelpWithVisibility(newProfile.need_help_with_visibility || ['public']);
            setPronouns(newProfile.pronouns);
            localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(newProfile));
          }
        } else if (error) {
          throw error;
        } else if (data) {
          if (isMounted) {
            setProfile(data);
            setLocalFirstName(data.first_name || "You");
            setBio(data.bio);
            setIntention(data.intention);
            setCanHelpWith(data.can_help_with);
            setNeedHelpWith(data.need_help_with);
            setFocusPreference(data.focus_preference || 50);
            setOrganization(data.organization);
            setLinkedinUrl(data.linkedin_url);
            setHostCode(data.host_code);
            setBioVisibility(data.bio_visibility || ['public']);
            setIntentionVisibility(data.intention_visibility || ['public']);
            setLinkedinVisibility(data.linkedin_visibility || ['public']);
            setCanHelpWithVisibility(data.can_help_with_visibility || ['public']);
            setNeedHelpWithVisibility(data.need_help_with_visibility || ['public']);
            setPronouns(data.pronouns);
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
          setBio(parsedProfile.bio);
          setIntention(parsedProfile.intention);
          setCanHelpWith(parsedProfile.can_help_with);
          setNeedHelpWith(parsedProfile.need_help_with);
          setFocusPreference(parsedProfile.focus_preference || 50);
          setOrganization(parsedProfile.organization);
          setLinkedinUrl(parsedProfile.linkedin_url);
          setHostCode(parsedProfile.host_code);
          setBioVisibility(parsedProfile.bio_visibility || ['public']);
          setIntentionVisibility(parsedProfile.intention_visibility || ['public']);
          setLinkedinVisibility(parsedProfile.linkedin_visibility || ['public']);
          setCanHelpWithVisibility(parsedProfile.can_help_with_visibility || ['public']);
          setNeedHelpWithVisibility(parsedProfile.need_help_with_visibility || ['public']);
          setPronouns(parsedProfile.pronouns);
        } else {
          // If no Supabase and no local storage, create a minimal default
          const defaultHostCode = generateRandomHostCode();
          const defaultProfile: Profile = {
            id: user.id,
            first_name: user.user_metadata.first_name || "You",
            last_name: null, avatar_url: null, bio: null, intention: null,
            focus_preference: 50, updated_at: new Date().toISOString(), organization: null,
            linkedin_url: null, host_code: defaultHostCode, bio_visibility: ['public'],
            intention_visibility: ['public'], linkedin_visibility: ['public'],
            can_help_with: null, can_help_with_visibility: ['public'],
            need_help_with: null, need_help_with_visibility: ['public'],
            pronouns: null,
          };
          setProfile(defaultProfile);
          setLocalFirstName(defaultProfile.first_name);
          setHostCode(defaultHostCode);
          setFocusPreference(defaultProfile.focus_preference);
          setBioVisibility(defaultProfile.bio_visibility);
          setIntentionVisibility(defaultProfile.intention_visibility);
          setLinkedinVisibility(defaultProfile.linkedin_visibility);
          setCanHelpWithVisibility(defaultProfile.can_help_with_visibility);
          setNeedHelpWithVisibility(defaultProfile.need_help_with_visibility);
          setPronouns(defaultProfile.pronouns);
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
  }, [user, authLoading, areToastsEnabled]);

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
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setLocalFirstName(data.first_name || "You");
        setBio(data.bio);
        setIntention(data.intention);
        setCanHelpWith(data.can_help_with);
        setNeedHelpWith(data.need_help_with);
        setFocusPreference(data.focus_preference || 50);
        setOrganization(data.organization);
        setLinkedinUrl(data.linkedin_url);
        setHostCode(data.host_code);
        setBioVisibility(data.bio_visibility || ['public']);
        setIntentionVisibility(data.intention_visibility || ['public']);
        setLinkedinVisibility(data.linkedin_visibility || ['public']);
        setCanHelpWithVisibility(data.can_help_with_visibility || ['public']);
        setNeedHelpWithVisibility(data.need_help_with_visibility || ['public']);
        setPronouns(data.pronouns);
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
  }, [user, areToastsEnabled]);

  const getPublicProfile = useCallback((userId: string, userName: string): Profile | null => {
    // For now, this is a mock implementation. In a real app, this would query Supabase.
    const foundProfile = mockProfilesRef.current.find(p => p.id === userId);
    if (foundProfile) {
      return foundProfile;
    }
    // Fallback for users not in mock data
    return {
      id: userId,
      first_name: userName,
      last_name: null,
      avatar_url: null,
      bio: null,
      intention: null,
      focus_preference: 50,
      updated_at: new Date().toISOString(),
      organization: null,
      linkedin_url: null,
      host_code: null,
      bio_visibility: ['public'],
      intention_visibility: ['public'],
      linkedin_visibility: ['public'],
      can_help_with: null,
      can_help_with_visibility: ['public'],
      need_help_with: null,
      need_help_with_visibility: ['public'],
      pronouns: null,
    };
  }, []);

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
    setBioVisibility(['public']);
    setIntentionVisibility(['public']);
    setLinkedinVisibility(['public']);
    setCanHelpWithVisibility(['public']);
    setNeedHelpWithVisibility(['public']);
    setPronouns(null);
    setFriendStatuses({});
    setBlockedUsers([]);
    setRecentCoworkers([]);
    resetSessionStates(); // Reset timer states as well
    window.location.reload(); // Force a full reload to clear all states
  }, [resetSessionStates]);

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