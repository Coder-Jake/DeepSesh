import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type Profile = Tables<'profiles'>;
type ProfileInsert = TablesInsert<'profiles'>;
type ProfileUpdate = TablesUpdate<'profiles'>;

interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (data: ProfileUpdate) => Promise<void>;
  fetchProfile: () => Promise<void>;
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

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
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
      // If no profile exists, create a basic one (this should ideally be handled by the trigger)
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({ id: user.id, first_name: user.user_metadata.first_name, last_name: user.user_metadata.last_name })
        .select()
        .single();
      
      if (insertError) {
        console.error("Error creating profile:", insertError);
        setError(insertError.message);
        toast({
          title: "Error creating profile",
          description: insertError.message,
          variant: "destructive",
        });
      } else if (newProfile) {
        setProfile(newProfile);
      }
    }
    setLoading(false);
  };

  const updateProfile = async (data: ProfileUpdate) => {
    setLoading(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("User not authenticated.");
      setLoading(false);
      toast({
        title: "Authentication required",
        description: "Please log in to update your profile.",
        variant: "destructive",
      });
      return;
    }

    const { data: updatedData, error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id)
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

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile();
      } else {
        setProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = {
    profile,
    loading,
    error,
    updateProfile,
    fetchProfile,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};