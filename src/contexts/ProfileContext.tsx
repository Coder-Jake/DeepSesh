import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

// Define the structure of a user's profile
interface Profile {
  id: string;
  updated_at?: string;
  first_name?: string | null;
  bio?: string | null;
  intention?: string | null;
  can_help_with?: string | null; // NEW
  need_help_with?: string | null; // NEW
  pronouns?: string | null; // NEW
  sociability?: number | null;
  organization?: string | null;
  linkedin_url?: string | null;
  host_code?: string | null;
  bio_visibility?: ('public' | 'friends' | 'organisation' | 'private')[] | null;
  intention_visibility?: ('public' | 'friends' | 'organisation' | 'private')[] | null;
  linkedin_visibility?: ('public' | 'friends' | 'organisation' | 'private')[] | null;
  can_help_with_visibility?: ('public' | 'friends' | 'organisation' | 'private')[] | null; // NEW
  need_help_with_visibility?: ('public' | 'friends' | 'organisation' | 'private')[] | null; // NEW
  pronouns_visibility?: ('public' | 'friends' | 'organisation' | 'private')[] | null; // NEW
}

// Define the structure of the Profile Context
interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  localFirstName: string;
  setLocalFirstName: React.Dispatch<React.SetStateAction<string>>;
  hostCode: string;
  setHostCode: React.Dispatch<React.SetStateAction<string>>;
  bioVisibility: ('public' | 'friends' | 'organisation' | 'private')[];
  setBioVisibility: React.Dispatch<React.SetStateAction<('public' | 'friends' | 'organisation' | 'private')[]>>;
  intentionVisibility: ('public' | 'friends' | 'organisation' | 'private')[];
  setIntentionVisibility: React.Dispatch<React.SetStateAction<('public' | 'friends' | 'organisation' | 'private')[]>>;
  linkedinVisibility: ('public' | 'friends' | 'organisation' | 'private')[];
  setLinkedinVisibility: React.Dispatch<React.SetStateAction<('public' | 'friends' | 'organisation' | 'private')[]>>;
  canHelpWithVisibility: ('public' | 'friends' | 'organisation' | 'private')[]; // NEW
  setCanHelpWithVisibility: React.Dispatch<React.SetStateAction<('public' | 'friends' | 'organisation' | 'private')[]>>; // NEW
  needHelpWithVisibility: ('public' | 'friends' | 'organisation' | 'private')[]; // NEW
  setNeedHelpWithVisibility: React.Dispatch<React.SetStateAction<('public' | 'friends' | 'organisation' | 'private')[]>>; // NEW
  pronouns: string; // NEW
  setPronouns: React.Dispatch<React.SetStateAction<string>>; // NEW
  pronounsVisibility: ('public' | 'friends' | 'organisation' | 'private')[]; // NEW
  setPronounsVisibility: React.Dispatch<React.SetStateAction<('public' | 'friends' | 'organisation' | 'private')[]>>; // NEW
  friendStatuses: { [key: string]: 'friends' | 'pending' | 'requested' | 'none' };
  updateProfile: (updates: Partial<Profile>, successMessage?: string) => Promise<void>;
  getPublicProfile: (userId: string, userName: string) => Promise<Profile | null>;
  blockUser: (userName: string) => Promise<void>;
  unblockUser: (userName: string) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [localFirstName, setLocalFirstName] = useState<string>(localStorage.getItem('deepsesh_local_first_name') || "You");
  const [hostCode, setHostCode] = useState<string>(localStorage.getItem('deepsesh_host_code') || "");
  const [bioVisibility, setBioVisibility] = useState<('public' | 'friends' | 'organisation' | 'private')[]>(JSON.parse(localStorage.getItem('deepsesh_bio_visibility') || '["public"]'));
  const [intentionVisibility, setIntentionVisibility] = useState<('public' | 'friends' | 'organisation' | 'private')[]>(JSON.parse(localStorage.getItem('deepsesh_intention_visibility') || '["public"]'));
  const [linkedinVisibility, setLinkedinVisibility] = useState<('public' | 'friends' | 'organisation' | 'private')[]>(JSON.parse(localStorage.getItem('deepsesh_linkedin_visibility') || '["public"]'));
  const [canHelpWithVisibility, setCanHelpWithVisibility] = useState<('public' | 'friends' | 'organisation' | 'private')[]>(JSON.parse(localStorage.getItem('deepsesh_can_help_with_visibility') || '["public"]')); // NEW
  const [needHelpWithVisibility, setNeedHelpWithVisibility] = useState<('public' | 'friends' | 'organisation' | 'private')[]>(JSON.parse(localStorage.getItem('deepsesh_need_help_with_visibility') || '["public"]')); // NEW
  const [pronouns, setPronouns] = useState<string>(localStorage.getItem('deepsesh_pronouns') || ""); // NEW
  const [pronounsVisibility, setPronounsVisibility] = useState<('public' | 'friends' | 'organisation' | 'private')[]>(JSON.parse(localStorage.getItem('deepsesh_pronouns_visibility') || '["public"]')); // NEW
  const [friendStatuses, setFriendStatuses] = useState<{ [key: string]: 'friends' | 'pending' | 'requested' | 'none' }>({});

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, bio, intention, can_help_with, need_help_with, pronouns, sociability, organization, linkedin_url, host_code, bio_visibility, intention_visibility, linkedin_visibility, can_help_with_visibility, need_help_with_visibility, pronouns_visibility')
        .eq('id', user.id)
        .single();

      if (error && error.code === 'PGRST116') { // No rows found
        // Profile doesn't exist, create it
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({ id: user.id, first_name: localFirstName, host_code: hostCode })
          .select()
          .single();

        if (createError) throw createError;
        setProfile(newProfile);
        setLocalFirstName(newProfile.first_name || "You");
        setHostCode(newProfile.host_code || "");
        setPronouns(newProfile.pronouns || ""); // NEW
        setBioVisibility(newProfile.bio_visibility || ['public']);
        setIntentionVisibility(newProfile.intention_visibility || ['public']);
        setLinkedinVisibility(newProfile.linkedin_visibility || ['public']);
        setCanHelpWithVisibility(newProfile.can_help_with_visibility || ['public']); // NEW
        setNeedHelpWithVisibility(newProfile.need_help_with_visibility || ['public']); // NEW
        setPronounsVisibility(newProfile.pronouns_visibility || ['public']); // NEW
        localStorage.setItem('deepsesh_local_first_name', newProfile.first_name || "You");
        localStorage.setItem('deepsesh_host_code', newProfile.host_code || "");
        localStorage.setItem('deepsesh_pronouns', newProfile.pronouns || ""); // NEW
        localStorage.setItem('deepsesh_bio_visibility', JSON.stringify(newProfile.bio_visibility || ['public']));
        localStorage.setItem('deepsesh_intention_visibility', JSON.stringify(newProfile.intention_visibility || ['public']));
        localStorage.setItem('deepsesh_linkedin_visibility', JSON.stringify(newProfile.linkedin_visibility || ['public']));
        localStorage.setItem('deepsesh_can_help_with_visibility', JSON.stringify(newProfile.can_help_with_visibility || ['public'])); // NEW
        localStorage.setItem('deepsesh_need_help_with_visibility', JSON.stringify(newProfile.need_help_with_visibility || ['public'])); // NEW
        localStorage.setItem('deepsesh_pronouns_visibility', JSON.stringify(newProfile.pronouns_visibility || ['public'])); // NEW
      } else if (error) {
        throw error;
      } else if (data) {
        setProfile(data);
        setLocalFirstName(data.first_name || "You");
        setHostCode(data.host_code || "");
        setPronouns(data.pronouns || ""); // NEW
        setBioVisibility(data.bio_visibility || ['public']);
        setIntentionVisibility(data.intention_visibility || ['public']);
        setLinkedinVisibility(data.linkedin_visibility || ['public']);
        setCanHelpWithVisibility(data.can_help_with_visibility || ['public']); // NEW
        setNeedHelpWithVisibility(data.need_help_with_visibility || ['public']); // NEW
        setPronounsVisibility(data.pronouns_visibility || ['public']); // NEW
        localStorage.setItem('deepsesh_local_first_name', data.first_name || "You");
        localStorage.setItem('deepsesh_host_code', data.host_code || "");
        localStorage.setItem('deepsesh_pronouns', data.pronouns || ""); // NEW
        localStorage.setItem('deepsesh_bio_visibility', JSON.stringify(data.bio_visibility || ['public']));
        localStorage.setItem('deepsesh_intention_visibility', JSON.stringify(data.intention_visibility || ['public']));
        localStorage.setItem('deepsesh_linkedin_visibility', JSON.stringify(data.linkedin_visibility || ['public']));
        localStorage.setItem('deepsesh_can_help_with_visibility', JSON.stringify(data.can_help_with_visibility || ['public'])); // NEW
        localStorage.setItem('deepsesh_need_help_with_visibility', JSON.stringify(data.need_help_with_visibility || ['public'])); // NEW
        localStorage.setItem('deepsesh_pronouns_visibility', JSON.stringify(data.pronouns_visibility || ['public'])); // NEW
      }
    } catch (error: any) {
      console.error('Error fetching or creating profile:', error.message);
      toast.error("Profile Error", {
        description: `Failed to load profile: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  }, [user, localFirstName, hostCode, setLocalFirstName, setHostCode, setPronouns, setBioVisibility, setIntentionVisibility, setLinkedinVisibility, setCanHelpWithVisibility, setNeedHelpWithVisibility, setPronounsVisibility]); // NEW dependencies

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(async (updates: Partial<Profile>, successMessage?: string) => {
    if (!user) {
      toast.error("Authentication Required", {
        description: "You must be logged in to update your profile.",
      });
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      if (data.first_name !== undefined) {
        setLocalFirstName(data.first_name || "You");
        localStorage.setItem('deepsesh_local_first_name', data.first_name || "You");
      }
      if (data.host_code !== undefined) {
        setHostCode(data.host_code || "");
        localStorage.setItem('deepsesh_host_code', data.host_code || "");
      }
      if (data.pronouns !== undefined) { // NEW
        setPronouns(data.pronouns || "");
        localStorage.setItem('deepsesh_pronouns', data.pronouns || "");
      }
      if (data.bio_visibility !== undefined) {
        setBioVisibility(data.bio_visibility || ['public']);
        localStorage.setItem('deepsesh_bio_visibility', JSON.stringify(data.bio_visibility || ['public']));
      }
      if (data.intention_visibility !== undefined) {
        setIntentionVisibility(data.intention_visibility || ['public']);
        localStorage.setItem('deepsesh_intention_visibility', JSON.stringify(data.intention_visibility || ['public']));
      }
      if (data.linkedin_visibility !== undefined) {
        setLinkedinVisibility(data.linkedin_visibility || ['public']);
        localStorage.setItem('deepsesh_linkedin_visibility', JSON.stringify(data.linkedin_visibility || ['public']));
      }
      if (data.can_help_with_visibility !== undefined) { // NEW
        setCanHelpWithVisibility(data.can_help_with_visibility || ['public']);
        localStorage.setItem('deepsesh_can_help_with_visibility', JSON.stringify(data.can_help_with_visibility || ['public']));
      }
      if (data.need_help_with_visibility !== undefined) { // NEW
        setNeedHelpWithVisibility(data.need_help_with_visibility || ['public']);
        localStorage.setItem('deepsesh_need_help_with_visibility', JSON.stringify(data.need_help_with_visibility || ['public']));
      }
      if (data.pronouns_visibility !== undefined) { // NEW
        setPronounsVisibility(data.pronouns_visibility || ['public']);
        localStorage.setItem('deepsesh_pronouns_visibility', JSON.stringify(data.pronouns_visibility || ['public']));
      }

      if (successMessage) {
        toast.success("Profile Updated", {
          description: successMessage,
        });
      }
    } catch (error: any) {
      console.error('Error updating profile:', error.message);
      toast.error("Update Failed", {
        description: `Failed to update profile: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  }, [user, setLocalFirstName, setHostCode, setPronouns, setBioVisibility, setIntentionVisibility, setLinkedinVisibility, setCanHelpWithVisibility, setNeedHelpWithVisibility, setPronounsVisibility]); // NEW dependencies

  const getPublicProfile = useCallback(async (userId: string, userName: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, bio, intention, can_help_with, need_help_with, pronouns, sociability, organization, linkedin_url, bio_visibility, intention_visibility, linkedin_visibility, can_help_with_visibility, need_help_with_visibility, pronouns_visibility') // NEW: Added pronouns and its visibility
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error(`Error fetching public profile for ${userName}:`, error.message);
      toast.error("Profile Fetch Failed", {
        description: `Could not load public profile for ${userName}.`,
      });
      return null;
    }
  }, []);

  // Placeholder for friend status logic
  const fetchFriendStatuses = useCallback(async () => {
    if (!user) {
      setFriendStatuses({});
      return;
    }
    // In a real app, this would fetch actual friend data
    // For now, we'll simulate some friends
    setFriendStatuses({
      'user123': 'friends',
      'user456': 'pending',
      'user789': 'requested',
    });
  }, [user]);

  useEffect(() => {
    fetchFriendStatuses();
  }, [fetchFriendStatuses]);

  const blockUser = useCallback(async (userName: string) => {
    // Implement blocking logic here
    toast.info("User Blocked (Simulated)", {
      description: `${userName} has been blocked.`,
    });
  }, []);

  const unblockUser = useCallback(async (userName: string) => {
    // Implement unblocking logic here
    toast.info("User Unblocked (Simulated)", {
      description: `${userName} has been unblocked.`,
    });
  }, []);

  const contextValue: ProfileContextType = {
    profile,
    loading,
    localFirstName,
    setLocalFirstName,
    hostCode,
    setHostCode,
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
    pronouns, // NEW
    setPronouns, // NEW
    pronounsVisibility, // NEW
    setPronounsVisibility, // NEW
    friendStatuses,
    updateProfile,
    getPublicProfile,
    blockUser,
    unblockUser,
  };

  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};