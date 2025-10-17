"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  intention: string | null;
  sociability: number | null;
  organization: string | null;
  linkedin_url: string | null;
  host_code: string | null;
  bio_visibility: ('public' | 'friends' | 'organisation' | 'private')[] | null;
  intention_visibility: ('public' | 'friends' | 'organisation' | 'private')[] | null;
  linkedin_visibility: ('public' | 'friends' | 'organisation' | 'private')[] | null;
}

// Define FriendStatus type
type FriendStatus = 'pending' | 'accepted' | 'requested' | 'friends';

interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
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
  friendStatuses: { [userId: string]: FriendStatus }; // Now managed by context
  getPublicProfile: (userId: string, fallbackName?: string) => Promise<Profile | null>;
  removeFriend: (friendId: string) => Promise<void>; // New function
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [localFirstName, setLocalFirstName] = useState<string>("You");
  const [hostCode, setHostCode] = useState<string>("");
  const [bioVisibility, setBioVisibility] = useState<('public' | 'friends' | 'organisation' | 'private')[]>(['public']);
  const [intentionVisibility, setIntentionVisibility] = useState<('public' | 'friends' | 'organisation' | 'private')[]>(['public']);
  const [linkedinVisibility, setLinkedinVisibility] = useState<('public' | 'friends' | 'organisation' | 'private')[]>(['public']);
  const [friendStatuses, setFriendStatuses] = useState<{ [userId: string]: FriendStatus }>({}); // Initialize friendStatuses state

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    if (user) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Error fetching profile:', error);
        toast({
          title: "Profile Error",
          description: error.message,
          variant: "destructive",
        });
        setProfile(null);
      } else if (data) {
        setProfile(data);
        setLocalFirstName(data.first_name || "You");
        setHostCode(data.host_code || "");
        setBioVisibility(data.bio_visibility || ['public']);
        setIntentionVisibility(data.intention_visibility || ['public']);
        setLinkedinVisibility(data.linkedin_visibility || ['public']);
      } else {
        // No profile found, create a basic one
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({ id: user.id, first_name: user.user_metadata.first_name || null })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating profile:', insertError);
          toast({
            title: "Profile Creation Error",
            description: insertError.message,
            variant: "destructive",
          });
          setProfile(null);
        } else if (newProfile) {
          setProfile(newProfile);
          setLocalFirstName(newProfile.first_name || "You");
          setHostCode(newProfile.host_code || "");
          setBioVisibility(newProfile.bio_visibility || ['public']);
          setIntentionVisibility(newProfile.intention_visibility || ['public']);
          setLinkedinVisibility(newProfile.linkedin_visibility || ['public']);
        }
      }
    } else {
      // For unauthenticated users, load from local storage
      const storedFirstName = localStorage.getItem('deepsesh_first_name');
      if (storedFirstName) setLocalFirstName(storedFirstName);
      const storedHostCode = localStorage.getItem('deepsesh_host_code');
      if (storedHostCode) setHostCode(storedHostCode);
      const storedBioVisibility = localStorage.getItem('deepsesh_bio_visibility');
      if (storedBioVisibility) setBioVisibility(JSON.parse(storedBioVisibility));
      const storedIntentionVisibility = localStorage.getItem('deepsesh_intention_visibility');
      if (storedIntentionVisibility) setIntentionVisibility(JSON.parse(storedIntentionVisibility));
      const storedLinkedinVisibility = localStorage.getItem('deepsesh_linkedin_visibility');
      if (storedLinkedinVisibility) setLinkedinVisibility(JSON.parse(storedLinkedinVisibility));
      setProfile(null); // No profile for unauthenticated users
    }
    setLoading(false);
  }, [user]);

  const fetchFriendStatuses = useCallback(async () => {
    if (!user) {
      setFriendStatuses({});
      return;
    }

    const { data, error } = await supabase
      .from('friend_requests')
      .select('requester_id, receiver_id, status')
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

    if (error) {
      console.error('Error fetching friend requests:', error);
      toast({
        title: "Friend Status Error",
        description: error.message,
        variant: "destructive",
      });
      setFriendStatuses({});
      return;
    }

    const newFriendStatuses: { [userId: string]: FriendStatus } = {};
    data.forEach(request => {
      const otherUserId = request.requester_id === user.id ? request.receiver_id : request.requester_id;
      if (request.status === 'accepted') {
        newFriendStatuses[otherUserId] = 'friends';
      } else if (request.status === 'pending') {
        if (request.requester_id === user.id) {
          newFriendStatuses[otherUserId] = 'requested'; // Current user sent the request
        } else {
          newFriendStatuses[otherUserId] = 'pending'; // Current user received the request
        }
      }
    });
    setFriendStatuses(newFriendStatuses);
  }, [user]);

  useEffect(() => {
    fetchProfile();
    fetchFriendStatuses();
  }, [fetchProfile, fetchFriendStatuses]);

  const updateProfile = useCallback(async (data: Partial<Profile>) => {
    if (!user) {
      toast({
        title: "Not Logged In",
        description: "Please log in to save your profile.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id);

    if (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setProfile(prev => (prev ? { ...prev, ...data } : null));
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    }
    setLoading(false);
  }, [user]);

  const getPublicProfile = useCallback(async (userId: string, fallbackName?: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching public profile:', error);
      toast({
        title: "Profile Fetch Error",
        description: `Could not fetch profile for ${fallbackName || userId}.`,
        variant: "destructive",
      });
      return null;
    }
    return data || null;
  }, []);

  const removeFriend = useCallback(async (friendId: string) => {
    if (!user) {
      toast({
        title: "Not Logged In",
        description: "Please log in to remove friends.",
        variant: "destructive",
      });
      return;
    }

    // Delete accepted friend requests where current user is either requester or receiver
    const { error } = await supabase
      .from('friend_requests')
      .delete()
      .or(`(requester_id.eq.${user.id},receiver_id.eq.${friendId}),(requester_id.eq.${friendId},receiver_id.eq.${user.id})`)
      .eq('status', 'accepted');

    if (error) {
      console.error('Error removing friend:', error);
      toast({
        title: "Error Removing Friend",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setFriendStatuses(prev => {
        const newState = { ...prev };
        delete newState[friendId];
        return newState;
      });
      toast({
        title: "Friend Removed",
        description: "The friend has been successfully removed.",
      });
    }
  }, [user]);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        loading,
        updateProfile,
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
        friendStatuses,
        getPublicProfile,
        removeFriend, // Provide the new function
      }}
    >
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