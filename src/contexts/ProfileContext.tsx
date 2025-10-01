import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from 'sonner'; // Using sonner for notifications

type Profile = Tables<'profiles'>;
type ProfileInsert = TablesInsert<'profiles'>;
type ProfileUpdate = TablesUpdate<'profiles'>;

type TimePeriod = 'week' | 'month' | 'all'; // Define TimePeriod type

// New types for session history and stats data
export interface SessionHistory {
  id: number;
  title: string;
  date: string;
  duration: string;
  participants: number;
  type: 'focus' | 'break';
  notes: string;
}

export interface StatsPeriodData {
  totalFocusTime: string;
  sessionsCompleted: number;
  uniqueCoworkers: number;
  focusRank: string;
  coworkerRank: string;
}

export interface StatsData {
  week: StatsPeriodData;
  month: StatsPeriodData;
  all: StatsPeriodData;
}

// Initial data for sessions
const initialSessions: SessionHistory[] = [
  {
    id: 1,
    title: "Deep Work Sprint",
    date: "2025-09-15",
    duration: "45 mins",
    participants: 3,
    type: "focus",
    notes: "Great session focusing on project documentation. Made significant progress on the API specs."
  },
  {
    id: 2,
    title: "Study Group Alpha",
    date: "2025-09-14",
    duration: "90 mins",
    participants: 5,
    type: "focus",
    notes: "Collaborative study session for the upcoming presentation. Everyone stayed focused and productive."
  },
  {
    id: 3,
    title: "Solo Focus",
    date: "2025-09-13",
    duration: "30 mins",
    participants: 1,
    type: "focus",
    notes: "Quick focused session to review quarterly goals and plan next steps."
  },
  {
    id: 4,
    title: "Coding Session",
    date: "2025-09-12",
    duration: "120 mins",
    participants: 2,
    type: "focus",
    notes: "Pair programming session working on the new user interface components. Fixed several bugs."
  },
  {
    id: 5,
    title: "Research Deep Dive",
    date: "2025-09-11",
    duration: "60 mins",
    participants: 4,
    type: "focus",
    notes: "Market research session for the new product launch. Gathered valuable competitive intelligence."
  }
];

// Initial data for stats
const initialStatsData: StatsData = {
  week: {
    totalFocusTime: "22h 0m",
    sessionsCompleted: 5,
    uniqueCoworkers: 5,
    focusRank: "3rd",
    coworkerRank: "4th",
  },
  month: {
    totalFocusTime: "70h 0m",
    sessionsCompleted: 22,
    uniqueCoworkers: 18,
    focusRank: "5th",
    coworkerRank: "3rd",
  },
  all: {
    totalFocusTime: "380h 0m",
    sessionsCompleted: 80,
    uniqueCoworkers: 65,
    focusRank: "4th",
    coworkerRank: "5th",
  },
};

interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (data: ProfileUpdate) => Promise<void>;
  fetchProfile: () => Promise<void>;
  
  // Session history and stats data
  sessions: SessionHistory[];
  setSessions: React.Dispatch<React.SetStateAction<SessionHistory[]>>;
  statsData: StatsData;
  setStatsData: React.Dispatch<React.SetStateAction<StatsData>>;

  // Persistent states for History and Leaderboard time filters
  historyTimePeriod: TimePeriod;
  setHistoryTimePeriod: React.Dispatch<React.SetStateAction<TimePeriod>>;
  leaderboardFocusTimePeriod: TimePeriod;
  setLeaderboardFocusTimePeriod: React.Dispatch<React.SetStateAction<TimePeriod>>;
  leaderboardCollaborationTimePeriod: TimePeriod;
  setLeaderboardCollaborationTimePeriod: React.Dispatch<React.SetStateAction<TimePeriod>>;

  // Function to save session
  saveSession: (
    seshTitle: string,
    notes: string,
    finalAccumulatedFocusSeconds: number,
    finalAccumulatedBreakSeconds: number,
    totalSessionSeconds: number,
    activeJoinedSessionCoworkerCount: number,
    sessionStartTime: number,
  ) => Promise<void>;
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

const LOCAL_STORAGE_KEY = 'flowsesh_profile_data'; // New local storage key for profile data

export const ProfileProvider = ({ children }: ProfileProviderProps) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Session history and stats data states
  const [sessions, setSessions] = useState<SessionHistory[]>(initialSessions);
  const [statsData, setStatsData] = useState<StatsData>(initialStatsData);

  // Persistent states for History and Leaderboard time filters
  const [historyTimePeriod, setHistoryTimePeriod] = useState<TimePeriod>('week');
  const [leaderboardFocusTimePeriod, setLeaderboardFocusTimePeriod] = useState<TimePeriod>('week');
  const [leaderboardCollaborationTimePeriod, setLeaderboardCollaborationTimePeriod] = useState<TimePeriod>('week');

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
      toast.error("Error fetching profile", {
        description: error.message,
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
        toast.error("Error creating profile", {
          description: insertError.message,
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
      toast.error("Authentication required", {
        description: "Please log in to update your profile.",
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
      toast.error("Error updating profile", {
        description: error.message,
      });
    } else if (updatedData) {
      setProfile(updatedData);
      toast.success("Profile updated!", {
        description: "Your profile has been successfully saved.",
      });
    }
    setLoading(false);
  };

  // Function to save session to Supabase and update local state
  const saveSession = async (
    seshTitle: string,
    notes: string,
    finalAccumulatedFocusSeconds: number,
    finalAccumulatedBreakSeconds: number,
    totalSessionSeconds: number,
    activeJoinedSessionCoworkerCount: number,
    sessionStartTime: number,
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || null; // Get user ID if logged in, otherwise null

    if (sessionStartTime === null) {
      toast.error("Failed to save session", {
        description: "Session start time was not recorded.",
      });
      return;
    }

    if (totalSessionSeconds <= 0) {
      toast.info("Session too short", {
        description: "Session was too short to be saved.",
      });
      return;
    }

    const sessionData: TablesInsert<'sessions'> = {
      user_id: userId, // Use userId (can be null)
      title: seshTitle,
      notes: notes,
      focus_duration_seconds: Math.round(finalAccumulatedFocusSeconds),
      break_duration_seconds: Math.round(finalAccumulatedBreakSeconds),
      total_session_seconds: Math.round(totalSessionSeconds),
      coworker_count: activeJoinedSessionCoworkerCount,
      session_start_time: new Date(sessionStartTime).toISOString(),
      session_end_time: new Date().toISOString(),
    };

    const { error } = await supabase.from('sessions').insert(sessionData);

    if (error) {
      console.error("Error saving session:", error);
      toast.error("Failed to save session", {
        description: error.message,
      });
    } else {
      const newSessionEntry: SessionHistory = {
        id: Date.now(), // Mock ID for local state, actual ID from DB would be better
        title: seshTitle,
        date: new Date().toISOString(),
        duration: `${Math.round(totalSessionSeconds / 60)} mins`,
        participants: activeJoinedSessionCoworkerCount,
        type: finalAccumulatedFocusSeconds > finalAccumulatedBreakSeconds ? 'focus' : 'break', // Determine type based on longer duration
        notes: notes,
      };
      setSessions(prev => [newSessionEntry, ...prev]); // Add to local sessions state

      // Update stats data (simplified for demo)
      setStatsData(prev => {
        const updated = { ...prev };
        // Example: Increment sessions completed for 'all' time
        updated.all.sessionsCompleted += 1;
        // More complex logic would be needed to update focus time, unique coworkers, and ranks
        return updated;
      });

      if (userId) {
        toast.success("Session saved!", {
          description: `Your session "${seshTitle}" has been added to your history.`,
        });
      } else {
        toast.success("Anonymous session saved!", {
          description: `Your session "${seshTitle}" has been saved anonymously. Log in to see it in your history.`,
        });
      }
    }
  };

  // Load profile and related data from local storage on initial mount
  useEffect(() => {
    const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedData) {
      const data = JSON.parse(storedData);
      setProfile(data.profile ?? null);
      setSessions(data.sessions ?? initialSessions);
      setStatsData(data.statsData ?? initialStatsData);
      setHistoryTimePeriod(data.historyTimePeriod ?? 'week');
      setLeaderboardFocusTimePeriod(data.leaderboardFocusTimePeriod ?? 'week');
      setLeaderboardCollaborationTimePeriod(data.leaderboardCollaborationTimePeriod ?? 'week');
    }
    fetchProfile(); // Always try to fetch the latest profile from Supabase
    
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

  // Save profile and related data to local storage whenever they change
  useEffect(() => {
    const dataToSave = {
      profile,
      sessions,
      statsData,
      historyTimePeriod,
      leaderboardFocusTimePeriod,
      leaderboardCollaborationTimePeriod,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
  }, [
    profile, sessions, statsData,
    historyTimePeriod, leaderboardFocusTimePeriod, leaderboardCollaborationTimePeriod,
  ]);

  const value = {
    profile,
    loading,
    error,
    updateProfile,
    fetchProfile,
    sessions,
    setSessions,
    statsData,
    setStatsData,
    historyTimePeriod,
    setHistoryTimePeriod,
    leaderboardFocusTimePeriod,
    setLeaderboardFocusTimePeriod,
    leaderboardCollaborationTimePeriod,
    setLeaderboardCollaborationTimePeriod,
    saveSession,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};