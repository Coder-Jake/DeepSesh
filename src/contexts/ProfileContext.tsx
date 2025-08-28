import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid'; // Import uuid for generating local IDs

type Profile = Tables<'profiles'>;
type ProfileInsert = TablesInsert<'profiles'>;
type ProfileUpdate = TablesUpdate<'profiles'>;

interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (data: ProfileUpdate) => Promise<void>;
  fetchProfile: (userId?: string) => Promise<void>; // Allow passing userId for initial login
  loginUser: (name: string) => Promise<void>; // New function for simple login
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

interface ProfileProviderProps {
  children: ReactNode;
}

export const ProfileProvider = ({ children }: ProfileProviderProps) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const LOCAL_USER_ID_KEY = 'flowsesh_local_user_id';

  const fetchProfile = async (userId?: string) => {
    setLoading(true);
    setError(null);

    let currentUserId = userId || localStorage.getItem(LOCAL_USER_ID_KEY);

    if (!currentUserId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUserId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error("Error fetching profile:", error);
      setError(error.message);
      setProfile(null);
      toast({
        title: "Error fetching profile",
        description: error.message,
        variant: "destructive",
      });
    } else if (data) {
      setProfile(data);
    } else {
      // Profile not found for existing local ID, clear it
      localStorage.removeItem(LOCAL_USER_ID_KEY);
      setProfile(null);
    }
    setLoading(false);
  };

  const loginUser = async (name: string) => {
    setLoading(true);
    setError(null);

    let currentUserId = localStorage.getItem(LOCAL_USER_ID_KEY);

    if (!currentUserId) {
      currentUserId = uuidv4();
      localStorage.setItem(LOCAL_USER_ID_KEY, currentUserId);
    }

    // Try to fetch existing profile first
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUserId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error("Error checking for existing profile:", fetchError);
      setError(fetchError.message);
      toast({
        title: "Login Error",
        description: fetchError.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (existingProfile) {
      // If profile exists, update the name if it's different
      if (existingProfile.first_name !== name) {
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({ first_name: name, updated_at: new Date().toISOString() })
          .eq('id', currentUserId)
          .select()
          .single();
        if (updateError) {
          console.error("Error updating profile name:", updateError);
          setError(updateError.message);
          toast({
            title: "Login Error",
            description: updateError.message,
            variant: "destructive",
          });
        } else if (updatedProfile) {
          setProfile(updatedProfile);
          toast({
            title: "Welcome back!",
            description: `Logged in as ${name}.`,
          });
        }
      } else {
        setProfile(existingProfile);
        toast({
          title: "Welcome back!",
          description: `Logged in as ${name}.`,
        });
      }
    } else {
      // If no profile exists, create a new one
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({ id: currentUserId, first_name: name, sociability: 50 })
        .select()
        .single();
      
      if (insertError) {
        console.error("Error creating profile:", insertError);
        setError(insertError.message);
        toast({
          title: "Login Error",
          description: insertError.message,
          variant: "destructive",
        });
        localStorage.removeItem(LOCAL_USER_ID_KEY); // Clear invalid ID
      } else if (newProfile) {
        setProfile(newProfile);
        toast({
          title: "Welcome!",
          description: `Profile created for ${name}.`,
        });
      }
    }
    setLoading(false);
  };

  const updateProfile = async (data: ProfileUpdate) => {
    setLoading(true);
    setError(null);
    const currentUserId = localStorage.getItem(LOCAL_USER_ID_KEY);

    if (!currentUserId) {
      setError("No local user ID found. Please log in.");
      setLoading(false);
      toast({
        title: "Authentication required",
        description: "Please enter your name to create or load a profile.",
        variant: "destructive",
      });
      return;
    }

    const { data: updatedData, error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', currentUserId)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
      setError(error.message);
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } else if (updatedData) {
      setProfile(updatedData);
      toast({
        title: "Profile updated!",
        description: "Your profile has been successfully saved.",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
    // No need for auth.onAuthStateChange for this simple local login
  }, []);

  const value = {
    profile,
    loading,
    error,
    updateProfile,
    fetchProfile,
    loginUser,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};