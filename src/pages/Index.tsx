"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CircularProgress } from "@/components/CircularProgress";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Globe, Lock, CalendarPlus, Share2, Square, ChevronDown, ChevronUp, Users, MapPin, Crown } from "lucide-react";
import { useTimer } from "@/contexts/TimerContext";
import { useProfile } from "@/contexts/ProfileContext";
import { useNavigate, Link, useLocation } from "react-router-dom"; // MODIFIED: Import useLocation
import SessionCard from "@/components/SessionCard";
import { cn, getSociabilityGradientColor } from "@/lib/utils";
import AskMenu from "@/components/AskMenu";
import ActiveAskSection from "@/components/ActiveAskSection";
import ScheduleForm from "@/components/ScheduleForm";
import Timeline from "@/components/Timeline";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ScheduledTimerTemplate, ScheduledTimer, ParticipantSessionData, DemoSession } from "@/types/timer";
import { Accordion
 } from "@/components/ui/accordion";
import UpcomingScheduleAccordionItem from "@/components/UpcomingScheduleAccordionItem";
import { useProfilePopUp } from "@/contexts/ProfilePopUpContext";
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Profile as ProfileType, ProfileUpdate } from '@/contexts/ProfileContext'; // Import ProfileUpdate
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // NEW: Import Popover components
import { calculateDistance } from '@/utils/location-utils'; // NEW: Import calculateDistance

interface ExtendSuggestion {
  id: string;
  minutes: number;
  creator: string;
  creatorId: string; // NEW: Add creatorId
  votes: { userId: string; vote: 'yes' | 'no' | 'neutral' }[];
  status: 'pending' | 'accepted' | 'rejected';
}

interface PollOption {
  id: string;
  text: string;
  votes: { userId: string }[];
}

interface Poll {
  id: string;
  question: string;
  type: 'closed' | 'choice' | 'selection';
  creator: string;
  creatorId: string; // NEW: Add creatorId
  options: PollOption[];
  status: 'active' | 'closed';
  allowCustomResponses: boolean;
}

type ActiveAskItem = ExtendSuggestion | Poll;
type PollType = 'closed' | 'choice' | 'selection';

// NEW: Define a type for Supabase fetched sessions
interface SupabaseSessionData {
  id: string;
  session_title: string;
  created_at: string;
  location_long: number | null;
  location_lat: number | null;
  focus_duration: number;
  break_duration: number;
  user_id: string | null;
  host_name: string;
  current_phase_type: 'focus' | 'break';
  current_phase_end_time: string;
  total_session_duration_seconds: number;
  schedule_data: any;
  is_active: boolean;
  is_paused: boolean;
  current_schedule_index: number;
  visibility: 'public' | 'friends' | 'organisation' | 'private';
  participants_data: ParticipantSessionData[];
  join_code: string | null; // NEW: Add join_code
  active_asks: ActiveAskItem[]; // ADDED: active_asks property
}

const now = new Date();
const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0, 0);
const pomodoroStartTime = nextHour.getTime();

const beginningOfMostRecentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0).getTime();

const mockNearbySessions: DemoSession[] = [
  {
    id: "102",
    title: "Silicon Syndicate Study Sesh",
    startTime: Date.now() - (76.8 * 60 * 1000),
    location: "Science Building - Computer Lab 2B",
    workspaceImage: "/api/placeholder/200/120",
    workspaceDescription: "Modern lab with dual monitors",
    participants: [
      { userId: "mock-user-id-bezos", userName: "Altman", role: 'host', joinTime: Date.now(), focusPreference: 15, intention: "Optimizing cloud infrastructure." },
      { userId: "mock-user-id-musk", userName: "Musk", role: 'coworker', joinTime: Date.now(), focusPreference: 10, intention: "Designing reusable rocket components." },
      { userId: "mock-user-id-zuckerberg", userName: "Zuckerberg", role: 'coworker', joinTime: Date.now(), focusPreference: 20, intention: "Developing new social algorithms." },
      { userId: "mock-user-id-gates", userName: "Amodei", role: 'coworker', joinTime: Date.now(), focusPreference: 20, intention: "Refining operating system architecture." },
      { userId: "mock-user-id-jobs", userName: "Huang", role: 'coworker', joinTime: Date.now(), focusPreference: 30, intention: "Innovating user interface design." },
    ],
    fullSchedule: [
      { id: crypto.randomUUID(), type: "focus", title: "Focus", durationMinutes: 55 },
      { id: crypto.randomUUID(), type: "break", title: "Break", durationMinutes: 5 },
    ],
    location_lat: -33.8688, // Example latitude for Sydney
    location_long: 151.2093, // Example longitude for Sydney
  },
];

const mockFriendsSessions: DemoSession[] = [
  {
    id: "201",
    title: "Psychology 101 Final Review",
    startTime: beginningOfMostRecentHour,
    location: "Main Library - Study Room 12",
    workspaceImage: "/api/placeholder/200/120",
    workspaceDescription: "Private group study room",
    participants: [
      { userId: "mock-user-id-freud", userName: "Freud", role: 'host', joinTime: Date.now(), focusPreference: 70, intention: "Reviewing psychoanalytic theories." },
      { userId: "mock-user-id-skinner", userName: "Skinner", role: 'coworker', joinTime: Date.now(), focusPreference: 70, intention: "Memorizing behavioral principles." },
      { userId: "mock-user-id-piaget", userName: "Piaget", role: 'coworker', joinTime: Date.now(), focusPreference: 80, intention: "Practicing cognitive development questions." },
      { userId: "mock-user-id-jung", userName: "Jung", role: 'coworker', joinTime: Date.now(), focusPreference: 70, intention: "Summarizing archetypal concepts." },
      { userId: "mock-user-id-maslow", userName: "Maslow", role: 'coworker', joinTime: Date.now(), focusPreference: 90, intention: "Creating hierarchy of needs flashcards." },
      { userId: "mock-user-id-rogers", userName: "Rogers", role: 'coworker', joinTime: Date.now(), focusPreference: 95, intention: "Discussing humanistic approaches." },
      { userId: "mock-user-id-pavlov", userName: "Pavlov", role: 'coworker', joinTime: Date.now(), focusPreference: 80, intention: "Peer teaching classical conditioning." },
    ],
    fullSchedule: [
      { id: crypto.randomUUID(), type: "focus", title: "Focus", durationMinutes: 25 },
      { id: crypto.randomUUID(), type: "break", title: "Break", durationMinutes: 5 },
    ],
    location_lat: -33.8688, // Example latitude for Sydney
    location_long: 151.2093, // Example longitude for Sydney
  },
];

// NEW: Function to fetch active sessions from Supabase, now including distance calculation
const fetchSupabaseSessions = async (
  userId: string | undefined,
  userLatitude: number | null,
  userLongitude: number | null
): Promise<DemoSession[]> => {
  let query = supabase
    .from('active_sessions')
    .select('*')
    .eq('is_active', true);

  // Apply RLS logic on the client side for filtering, as RLS policies are already in place on the DB
  // The RLS policy "View own, public, or joined sessions" handles the actual database access.
  // This client-side filter is for display purposes based on the user's context.
  if (userId) {
    query = query.or(`visibility.eq.public,user_id.eq.${userId},participants_data.cs.{{"userId": "${userId}"}}`);
  } else {
    query = query.eq('visibility', 'public'); // Only show public sessions for anonymous users
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching active sessions from Supabase:", error);
    throw new Error(error.message);
  }

  return data.map((session: SupabaseSessionData) => {
    // Ensure participants_data is an array, even if null/undefined
    const rawParticipantsData = (session.participants_data || []) as ParticipantSessionData[];
    const participants: ParticipantSessionData[] = rawParticipantsData.map(p => ({
      userId: p.userId,
      userName: p.userName,
      joinTime: p.joinTime,
      role: p.role,
      focusPreference: p.focusPreference || 50,
      intention: p.intention || undefined,
      bio: p.bio || undefined,
    }));

    // Ensure schedule_data is an array, even if null/undefined
    const rawScheduleData = (session.schedule_data || []) as ScheduledTimer[];
    let fullSchedule: ScheduledTimer[];
    if (rawScheduleData.length > 0) {
      fullSchedule = rawScheduleData.map((item: any) => ({
        id: item.id || crypto.randomUUID(),
        title: item.title || item.type,
        type: item.type,
        durationMinutes: item.durationMinutes,
        isCustom: item.isCustom || false,
        customTitle: item.customTitle || undefined,
      }));
    } else {
      // Fallback to a single timer based on current_phase_type if schedule_data is empty
      fullSchedule = [{
        id: crypto.randomUUID(),
        title: session.current_phase_type === 'focus' ? 'Focus' : 'Break',
        type: session.current_phase_type,
        durationMinutes: session.current_phase_type === 'focus' ? session.focus_duration : session.break_duration,
        isCustom: false,
      }];
    }

    let distance: number | null = null;
    if (userLatitude !== null && userLongitude !== null && session.location_lat !== null && session.location_long !== null) {
      distance = calculateDistance(userLatitude, userLongitude, session.location_lat, session.location_long);
    }

    return {
      id: session.id,
      title: session.session_title,
      startTime: new Date(session.created_at).getTime(),
      location: session.location_long && session.location_lat ? `Lat: ${session.location_lat}, Long: ${session.location_lat}` : "Unknown Location",
      workspaceImage: "/api/placeholder/200/120", // Placeholder
      workspaceDescription: "Live session from Supabase",
      participants: participants,
      fullSchedule: fullSchedule,
      location_lat: session.location_lat,
      location_long: session.location_long,
      distance: distance,
    };
  });
};

const Index = () => {
  const {
    focusMinutes,
    setHomepageFocusMinutes,
    breakMinutes,
    setHomepageBreakMinutes,
    defaultFocusMinutes,
    defaultBreakMinutes,

    isRunning,
    setIsRunning,
    isPaused,
    setIsPaused,
    timeLeft,
    setTimeLeft,
    timerType,
    setTimerType,
    isFlashing,
    setIsFlashing,
    notes,
    setNotes,
    seshTitle,
    setSeshTitle,
    isSeshTitleCustomized,
    formatTime,
    showSessionsWhileActive,
    setShowSessionsWhileActive,
    timerIncrement,
    getDefaultSeshTitle,

    schedule,
    activeSchedule,
    activeTimerColors,
    currentScheduleIndex,
    isSchedulingMode,
    setIsSchedulingMode,
    isScheduleActive,
    setIsScheduleActive,
    isSchedulePrepared,
    startSchedule,
    commenceSpecificPreparedSchedule,
    discardPreparedSchedule,
    resetSchedule,
    scheduleTitle,
    commenceTime,
    commenceDay,
    isGlobalPrivate,
    setIsGlobalPrivate,
    activeScheduleDisplayTitle,

    sessionStartTime,
    setSessionStartTime,
    currentPhaseStartTime,
    setCurrentPhaseStartTime,
    accumulatedFocusSeconds,
    setAccumulatedFocusSeconds,
    accumulatedBreakSeconds,
    setAccumulatedBreakSeconds,
    activeJoinedSessionCoworkerCount,
    setActiveJoinedSessionCoworkerCount,

    activeAsks,
    addAsk,
    updateAsk,
    setActiveAsks,

    isSchedulePending,
    setIsSchedulePending,
    isTimeLeftManagedBySession,
    setIsTimeLeftManagedBySession,
    scheduleStartOption,
    is24HourFormat,

    preparedSchedules,

    currentSessionRole,
    setCurrentSessionRole,
    currentSessionHostName,
    setCurrentSessionHostName, // Destructure setCurrentSessionHostName
    currentSessionOtherParticipants,
    setCurrentSessionOtherParticipants,
    currentSessionParticipantsData,
    setCurrentSessionParticipantsData,

    startStopNotifications,
    playSound,
    triggerVibration,
    areToastsEnabled,
    getLocation,
    geolocationPermissionStatus,
    isDiscoveryActivated,
    setIsDiscoveryActivated,
    activeSessionRecordId,
    setActiveSessionRecordId,
    joinSessionAsCoworker,
    leaveSession,
    transferHostRole,
    stopTimer,
    resetSessionStates,
    showDemoSessions,
    currentPhaseDurationSeconds,
    setCurrentPhaseDurationSeconds,
    remainingTimeAtPause, // ADDED: Destructure remainingTimeAtPause
  } = useTimer();

  const { profile, loading: profileLoading, localFirstName, getPublicProfile, joinCode, setLocalFirstName, focusPreference, setFocusPreference, updateProfile, profileVisibility } = useProfile(); // RENAMED: hostCode to joinCode, NEW: Get profileVisibility from useProfile
  const navigate = useNavigate();
  const location = useLocation(); // MODIFIED: Use useLocation hook
  const { toggleProfilePopUp } = useProfilePopUp();
  const { isDarkMode } = useTheme();
  const { user, session } = useAuth(); // MODIFIED: Destructure session from useAuth

  const longPressRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);
  const [activeJoinedSession, setActiveJoinedSession] = useState<DemoSession | null>(null);
  const [isHoveringTimer, setIsHoveringTimer] = useState(false);

  const currentUserId = profile?.id || "mock-user-id-123";
  const currentUserName = profile?.first_name || localFirstName || "You";

  const [isEditingSeshTitle, setIsEditingSeshTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null); // Corrected typo
  
  const [hiddenNearbyCount, setHiddenNearbyCount] = useState(0);
  const [hiddenFriendsCount, setHiddenFriendsCount] = useState(0);

  const [showJoinInput, setShowJoinInput] = useState(false);
  const [joinSessionCode, setJoinSessionCode] = useState("");

  const [isNearbySessionsOpen, setIsNearbySessionsOpen] = useState(true);
  const [isFriendsSessionsOpen, setIsFriendsSessionsOpen] = useState(true);
  const [isOrganizationSessionsOpen, setIsOrganizationSessionsOpen] = useState(true);
  const [openUpcomingScheduleAccordions, setOpenUpcomingScheduleAccordions] = useState<string[]>([]);

  const [sectionOrder, setSectionOrder] = useState<('nearby' | 'friends' | 'organization')[]>(
    ['nearby', 'friends', 'organization']
  );

  const [openFocusPreferenceTooltipId, setOpenFocusPreferenceTooltipId] = useState<string | null>(null);
  const focusPreferenceTooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isDefaultTitleAnimating, setIsDefaultTitleAnimating] = useState(false);

  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const linkCopiedTimeoutRef = useRef<NodeJS.Timeout | null>(null); // FIXED: Initialize with null

  const [isDiscoverySetupOpen, setIsDiscoverySetupOpen] = useState(false);
  const [discoveryDisplayName, setDiscoveryDisplayName] = useState(""); // Initialize empty

  // NEW: State for user's current location
  const [userLocation, setUserLocation] = useState<{ latitude: number | null; longitude: number | null }>({ latitude: null, longitude: null });

  // NEW: Slider drag state and refs for Discovery Setup dialog
  const discoverySliderContainerRef = useRef<HTMLDivElement>(null);
  const [isDraggingDiscoverySlider, setIsDraggingDiscoverySlider] = useState(false);

  // NEW: Effect to sync discoveryDisplayName with localFirstName when dialog opens
  useEffect(() => {
    if (isDiscoverySetupOpen) {
      setDiscoveryDisplayName(localFirstName === "You" ? (joinCode || "") : (localFirstName || joinCode || "")); // RENAMED: hostCode to joinCode
    }
  }, [isDiscoverySetupOpen, localFirstName, joinCode]); // RENAMED: hostCode to joinCode

  // NEW: Function to toggle global private/public status
  const handlePublicPrivateToggle = useCallback(() => {
    setIsGlobalPrivate(prev => !prev);
    if (areToastsEnabled) {
      toast.info("Session Visibility", {
        description: `Your sessions are now ${isGlobalPrivate ? 'Public' : 'Private'}.`,
      });
    }
  }, [setIsGlobalPrivate, isGlobalPrivate, areToastsEnabled]);

  // NEW: Fetch Supabase sessions
  const { data: supabaseNearbySessions, isLoading: isLoadingSupabaseSessions, error: supabaseError } = useQuery<DemoSession[]>({
    queryKey: ['supabaseActiveSessions', user?.id, userLocation.latitude, userLocation.longitude], // Add user.id and userLocation to query key for re-fetching on auth/location change
    queryFn: async () => { // Made async to allow for error logging
      try {
        return await fetchSupabaseSessions(user?.id, userLocation.latitude, userLocation.longitude);
      } catch (err: any) {
        console.error("Error fetching active sessions from Supabase:", err.message); // Explicit error logging
        if (areToastsEnabled) {
          toast.error("Failed to Load Sessions", {
            description: `Could not load live sessions: ${err.message}`,
          });
        }
        throw err; // Re-throw to let TanStack Query handle the error state
      }
    },
    refetchInterval: 5000,
    enabled: isDiscoveryActivated && !isGlobalPrivate && (showSessionsWhileActive === 'nearby' || showSessionsWhileActive === 'all'),
  });

  // NEW: Effect to get user's location when discovery is activated or on mount
  useEffect(() => {
    const getUserLocation = async () => {
      const { latitude, longitude } = await getLocation();
      setUserLocation({ latitude, longitude });
    };

    if (isDiscoveryActivated && geolocationPermissionStatus === 'granted') {
      getUserLocation();
    }
  }, [isDiscoveryActivated, geolocationPermissionStatus, getLocation]);

  // NEW: Define allParticipantsToDisplayInCard
  const allParticipantsToDisplayInCard = useMemo(() => {
    if (!currentSessionParticipantsData || currentSessionParticipantsData.length === 0) {
      return [];
    }

    return currentSessionParticipantsData.map(p => {
      let role: 'host' | 'coworker' | 'self' = p.role;
      if (p.userId === user?.id) {
        role = 'self';
      }
      return {
        userId: p.userId,
        userName: p.userName,
        focusPreference: p.focusPreference || 50,
        role: role,
      };
    }).sort((a, b) => {
      if (a.role === 'self') return -1;
      if (b.role === 'self') return 1;
      if (a.role === 'host') return -1;
      if (b.role === 'host') return 1;
      return a.userName.localeCompare(b.userName);
    });
  }, [currentSessionParticipantsData, user?.id]);

  useEffect(() => {
    if (isEditingSeshTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingSeshTitle]);

  useEffect(() => {
    if (notesTextareaRef.current) {
      notesTextareaRef.current.style.height = 'auto';
      notesTextareaRef.current.style.height = notesTextareaRef.current.scrollHeight + 'px';
    }
  }, [notes]);

  useEffect(() => {
    console.log("Index: Current activeAsks on homepage:", activeAsks);
  }, [activeAsks]);

  useEffect(() => {
    const isDefault = seshTitle === getDefaultSeshTitle() && !isSeshTitleCustomized;
    setIsDefaultTitleAnimating(isDefault);
  }, [seshTitle, isSeshTitleCustomized, getDefaultSeshTitle]);

  // MODIFIED: Effect to minimize ScheduleForm when navigating away from Index page
  useEffect(() => {
    if (location.pathname !== '/' && isSchedulingMode) {
      setIsSchedulingMode(false);
    }
  }, [location.pathname, isSchedulingMode, setIsSchedulingMode]);

  const handleLongPressStart = (callback: () => void) => {
    isLongPress.current = false;
    longPressRef.current = setTimeout(() => {
      isLongPress.current = true;
      callback();
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
    }
    isLongPress.current = false;
  };

  const handleIntentionLongPress = () => {
    if (isLongPress.current) {
      navigate('/profile');
    }
  };

  const handleTitleClick = () => {
    if (!isLongPress.current) {
      setIsEditingSeshTitle(true);
    }
  };

  const handleTitleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditingSeshTitle(false);
      e.currentTarget.blur();
      if (seshTitle.trim() === "") {
        setSeshTitle(getDefaultSeshTitle());
      }
    }
  };

  const handleTitleInputBlur = () => {
    setIsEditingSeshTitle(false);
    if (seshTitle.trim() === "") {
      setSeshTitle(getDefaultSeshTitle());
      }
  };

  const handleTitleLongPress = () => {
    if (isLongPress.current) {
      setIsEditingSeshTitle(true);
    }
  };

  const startNewManualTimer = useCallback(async () => {
    if (isRunning || isPaused || isScheduleActive || isSchedulePrepared) {
      if (!confirm("A timer or schedule is already active. Do you want to override it and start a new manual timer?")) {
        return;
      }
      if (isScheduleActive || isSchedulePrepared) await resetSchedule();
      setIsRunning(false);
      setIsPaused(false);
      setIsFlashing(false);
      setAccumulatedFocusSeconds(0);
      setAccumulatedBreakSeconds(0);
      setSeshTitle(getDefaultSeshTitle());
      setActiveAsks([]);
    }

    // Use the current values of focusMinutes and breakMinutes, which are managed by setHomepageFocusMinutes/setHomepageBreakMinutes
    // and initialized from defaults or loaded state.
    const currentFocusDuration = focusMinutes;
    const currentBreakDuration = breakMinutes;

    playSound();
    triggerVibration();
    setIsRunning(true);
    setIsPaused(false);
    setIsFlashing(false);
    setSessionStartTime(Date.now());
    setCurrentPhaseStartTime(Date.now());
    setAccumulatedFocusSeconds(0);
    setAccumulatedBreakSeconds(0);
    // NEW: Set currentPhaseDurationSeconds for manual timer
    const initialDurationSeconds = timerType === 'focus' ? currentFocusDuration * 60 : currentBreakDuration * 60;
    setCurrentPhaseDurationSeconds(initialDurationSeconds);
    setTimeLeft(initialDurationSeconds); // Initialize timeLeft to full duration
    setIsTimeLeftManagedBySession(true);

    const hostParticipant: ParticipantSessionData = {
      userId: user?.id || `anon-${crypto.randomUUID()}`,
      userName: localFirstName,
      joinTime: Date.now(),
      role: 'host',
      focusPreference: focusPreference || 50,
      intention: profile?.profile_data?.intention?.value || null, // Changed undefined to null
      bio: profile?.profile_data?.bio?.value || null, // Changed undefined to null
    };

    setCurrentSessionRole('host');
    setCurrentSessionHostName(localFirstName); // This uses setCurrentSessionHostName
    setCurrentSessionOtherParticipants([]);
    setActiveJoinedSessionCoworkerCount(0);
    setCurrentSessionParticipantsData([hostParticipant]);

    if (!isGlobalPrivate) {
      const { latitude, longitude } = await getLocation();
      const currentPhaseDuration = timerType === 'focus' ? currentFocusDuration : currentBreakDuration;
      const currentPhaseEndTime = new Date(Date.now() + currentPhaseDuration * 60 * 1000).toISOString();
      try {
        const { data, error } = await supabase
          .from('active_sessions')
          .insert({
            user_id: hostParticipant.userId,
            host_name: hostParticipant.userName,
            session_title: seshTitle,
            visibility: 'public',
            focus_duration: currentFocusDuration,
            break_duration: currentBreakDuration,
            current_phase_type: timerType,
            current_phase_end_time: currentPhaseEndTime,
            total_session_duration_seconds: currentPhaseDuration * 60,
            is_active: true,
            is_paused: false,
            location_lat: latitude,
            location_long: longitude,
            participants_data: [hostParticipant],
            join_code: joinCode, // RENAMED: host_code to join_code
          })
          .select('id')
          .single();

        if (error) throw error;
        setActiveSessionRecordId(data.id);
        console.log("Manual session inserted into Supabase:", data.id);
      } catch (error: any) {
        console.error("Error inserting manual session into Supabase:", error.message);
        if (areToastsEnabled) {
          toast.error("Supabase Error", {
            description: `Failed to publish session: ${error.message}`,
          });
        }
      }
    }
  }, [
    isRunning, isPaused, isScheduleActive, isSchedulePrepared, resetSchedule, focusMinutes, breakMinutes, playSound, triggerVibration, setSessionStartTime, setCurrentPhaseStartTime, setAccumulatedFocusSeconds, setAccumulatedBreakSeconds, setSeshTitle, setActiveAsks, setIsTimeLeftManagedBySession, user?.id, localFirstName, focusPreference, profile?.profile_data?.intention?.value, profile?.profile_data?.bio?.value, isGlobalPrivate, getLocation, joinCode, setCurrentSessionRole, setCurrentSessionHostName, setCurrentSessionOtherParticipants, setActiveJoinedSessionCoworkerCount, setCurrentSessionParticipantsData, setCurrentPhaseDurationSeconds, setTimeLeft, areToastsEnabled, timerType, seshTitle, getDefaultSeshTitle
  ]);

  const resumeTimer = () => {
    playSound();
    triggerVibration();
    setIsRunning(true);
    setIsPaused(false);
    if (isScheduleActive && isSchedulePending) {
      setIsSchedulePending(false);
      setCurrentPhaseStartTime(Date.now());
      if (areToastsEnabled) {
        toast.success("Schedule Resumed!", {
          description: `"${activeScheduleDisplayTitle}" has resumed.`,
        });
      }
    } else if (currentPhaseStartTime === null) {
      // This case should ideally not happen if remainingTimeAtPause is correctly set
      setCurrentPhaseStartTime(Date.now());
      setCurrentPhaseDurationSeconds(timeLeft); // NEW: Set duration to current timeLeft
    } else {
      // NEW: When resuming, set currentPhaseStartTime based on remainingTimeAtPause
      setCurrentPhaseStartTime(Date.now() - (currentPhaseDurationSeconds - remainingTimeAtPause) * 1000);
    }
    setIsTimeLeftManagedBySession(true);
  };

  const pauseTimer = () => {
    if (currentPhaseStartTime !== null) {
      const elapsed = (Date.now() - currentPhaseStartTime) / 1000;
      if (timerType === 'focus') {
        setAccumulatedFocusSeconds((prev: number) => prev + elapsed);
      } else {
        setAccumulatedBreakSeconds((prev: number) => prev + elapsed);
      }
      // NEW: Store remaining time at pause
      // setRemainingTimeAtPause(timeLeft); // This is now handled in TimerContext
      setCurrentPhaseStartTime(null);
    }
    setIsPaused(true);
    setIsRunning(false);
    playSound();
    triggerVibration();
    setIsTimeLeftManagedBySession(true);
  };

  const resetTimer = async () => {
    // For solo timers, always stop without confirmation
    // The `stopTimer` function now handles the confirmation logic based on its `confirmPrompt` argument.
    stopTimer(false, false); // MODIFIED: Added second argument
  };

  const switchToBreak = () => {
    if (currentPhaseStartTime !== null) {
      const elapsed = (Date.now() - currentPhaseStartTime) / 1000;
      setAccumulatedFocusSeconds((prev: number) => prev + elapsed);
    }
    setTimerType('break');
    // NEW: Set new phase duration and start time
    const newBreakDurationSeconds = breakMinutes * 60;
    setCurrentPhaseDurationSeconds(newBreakDurationSeconds);
    setTimeLeft(newBreakDurationSeconds);
    setCurrentPhaseStartTime(Date.now());

    setIsFlashing(false);
    setIsRunning(true);
    playSound();
    triggerVibration();
    setIsTimeLeftManagedBySession(true);
  };

  const switchToFocus = () => {
    if (currentPhaseStartTime !== null) {
      const elapsed = (Date.now() - currentPhaseStartTime) / 1000;
      setAccumulatedBreakSeconds((prev: number) => prev + elapsed);
    }
    setTimerType('focus');
    // NEW: Set new phase duration and start time
    const newFocusDurationSeconds = focusMinutes * 60;
    setCurrentPhaseDurationSeconds(newFocusDurationSeconds);
    setTimeLeft(newFocusDurationSeconds);
    setCurrentPhaseStartTime(Date.now());

    setIsFlashing(false);
    setIsRunning(true);
    playSound();
    triggerVibration();
    setIsTimeLeftManagedBySession(true);
  };

  const handleModeToggle = (mode: 'focus' | 'break') => {
    if (isRunning || isPaused || isScheduleActive || isSchedulePrepared) return;

    if (mode === 'focus') {
      setTimerType('focus');
      const newFocusDurationSeconds = focusMinutes * 60;
      setCurrentPhaseDurationSeconds(newFocusDurationSeconds); // NEW: Update duration
      setTimeLeft(newFocusDurationSeconds);
    } else {
      setTimerType('break');
      const newBreakDurationSeconds = breakMinutes * 60;
      setCurrentPhaseDurationSeconds(newBreakDurationSeconds); // NEW: Update duration
      setTimeLeft(newBreakDurationSeconds);
    }
    setIsTimeLeftManagedBySession(false);
  };

  const handleJoinSession = async (session: DemoSession) => {
    try {
      const sessionId = session.id;
      const sessionTitle = session.title;
      // Find the host from the participants array, or fallback to session title
      const hostName = session.participants.find(p => p.role === 'host')?.userName || session.title;

      // Participants and fullSchedule are already robustly constructed by fetchSupabaseSessions
      const participants = session.participants;
      const fullSchedule = session.fullSchedule;

      const now = Date.now();
      const elapsedSecondsSinceSessionStart = Math.floor((now - session.startTime) / 1000);

      const totalScheduleDurationSeconds = fullSchedule.reduce(
        (sum, phase) => sum + phase.durationMinutes * 60,
        0
      );

      let currentPhaseType: 'focus' | 'break' = 'focus';
      let remainingSecondsInPhase = 0;
      let currentPhaseDurationMinutes = 0;

      const cycleDurationSeconds = fullSchedule.reduce((sum, phase) => sum + phase.durationMinutes * 60, 0);
      const effectiveElapsedSeconds = cycleDurationSeconds > 0 ? elapsedSecondsSinceSessionStart % cycleDurationSeconds : 0;

      if (totalScheduleDurationSeconds === 0) {
        currentPhaseType = 'focus';
        remainingSecondsInPhase = 0;
        currentPhaseDurationMinutes = 0;
      } else if (elapsedSecondsSinceSessionStart < 0) {
        currentPhaseType = fullSchedule[0]?.type || 'focus';
        currentPhaseDurationMinutes = fullSchedule[0]?.durationMinutes || 0;
        remainingSecondsInPhase = -elapsedSecondsSinceSessionStart;
      } else {
        let accumulatedDurationSecondsInCycle = 0;
        for (let i = 0; i < fullSchedule.length; i++) {
          const phase = fullSchedule[i];
          const phaseDurationSeconds = phase.durationMinutes * 60;

          if (effectiveElapsedSeconds < accumulatedDurationSecondsInCycle + phaseDurationSeconds) {
            const timeIntoPhase = effectiveElapsedSeconds - accumulatedDurationSecondsInCycle;
            remainingSecondsInPhase = phaseDurationSeconds - timeIntoPhase;
            currentPhaseDurationMinutes = phase.durationMinutes;
            currentPhaseType = phase.type;
            break;
          }
          accumulatedDurationSecondsInCycle += phaseDurationSeconds;
        }
      }

      await joinSessionAsCoworker(
        sessionId,
        sessionTitle,
        hostName,
        participants,
        fullSchedule,
        currentPhaseType,
        currentPhaseDurationMinutes,
        remainingSecondsInPhase
      );
    } catch (error: any) {
      console.error("Error in handleJoinSession:", error);
      if (areToastsEnabled) {
        toast.error("Failed to Join Session", {
          description: `An unexpected error occurred: ${error.message || String(error)}.`,
        });
      }
      resetSessionStates(); // Ensure states are reset on error
    }
  };

  const handleJoinCodeSubmit = async () => { // MODIFIED: Made async
    const trimmedCode = joinSessionCode.trim();
    if (!trimmedCode) {
      if (areToastsEnabled) {
        toast.error("Missing Code", {
          description: "Please enter a session code.",
        });
      }
      return;
    }

    if (areToastsEnabled) {
      toast.info("Searching for session...", {
        description: `Looking for session with code: ${trimmedCode}`,
      });
    }

    try {
      const response = await supabase.functions.invoke('join-session', {
        body: JSON.stringify({
          sessionCode: trimmedCode,
          participantData: {
            userId: user?.id || `anon-${crypto.randomUUID()}`,
            userName: localFirstName,
            focusPreference: focusPreference || 50,
            intention: profile?.profile_data?.intention?.value || null, // Changed undefined to null
            bio: profile?.profile_data?.bio?.value || null, // Changed undefined to null
          },
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`, // MODIFIED: Use session.access_token
        },
      });

      if (response.error) throw response.error;
      if (response.data.error) throw new Error(response.data.error);

      const joinedSession = response.data.session;
      if (joinedSession) {
        // Map SupabaseSessionData to DemoSession for handleJoinSession
        const demoSession: DemoSession = {
          id: joinedSession.id,
          title: joinedSession.session_title,
          startTime: new Date(joinedSession.created_at).getTime(),
          location: joinedSession.location_long && joinedSession.location_lat ? `Lat: ${joinedSession.location_lat}, Long: ${joinedSession.location_lat}` : "Unknown Location",
          workspaceImage: "/api/placeholder/200/120", // Placeholder
          workspaceDescription: "Live session from Supabase",
          participants: (joinedSession.participants_data || []) as ParticipantSessionData[],
          fullSchedule: (joinedSession.schedule_data || []) as ScheduledTimer[],
          location_lat: joinedSession.location_lat, // NEW: Pass location data
          location_long: joinedSession.location_long, // NEW: Pass location data
        };
        await handleJoinSession(demoSession);
      } else {
        if (areToastsEnabled) {
          toast.error("Session Not Found", {
            description: `No active session found with code: ${trimmedCode}`,
          });
        }
      }
    } catch (err: any) {
      console.error("Error joining session by code:", err);
      if (areToastsEnabled) {
        toast.error("Join Failed", {
          description: `An error occurred: ${err.message || String(err)}`,
        });
      }
    } finally {
      setJoinSessionCode("");
      setShowJoinInput(false);
    }
  };

  const isActiveTimer = isRunning || isPaused || isFlashing || isScheduleActive || isSchedulePending;

  // Define currentItemDuration based on context
  const currentItemDuration = useMemo(() => {
    if (isScheduleActive && activeSchedule[currentScheduleIndex]) {
      return activeSchedule[currentScheduleIndex].durationMinutes;
    }
    return timerType === 'focus' ? focusMinutes : breakMinutes;
  }, [isScheduleActive, activeSchedule, currentScheduleIndex, timerType, focusMinutes, breakMinutes]);

  const shouldShowNearbySessions = useMemo(() => {
    if (!isDiscoveryActivated) return false;
    if (!isActiveTimer) {
      return !isGlobalPrivate;
    }

    if (showSessionsWhileActive === 'hidden') {
      return false;
    }
    if (showSessionsWhileActive === 'nearby' || showSessionsWhileActive === 'all') {
      return !isGlobalPrivate;
    }
    return false;
  }, [isActiveTimer, isGlobalPrivate, showSessionsWhileActive, isDiscoveryActivated]);

  const shouldShowFriendsSessions = useMemo(() => {
    if (!isDiscoveryActivated) return false;
    if (!isActiveTimer) {
      return true;
    }

    if (showSessionsWhileActive === 'hidden') {
      return false;
    }
    if (showSessionsWhileActive === 'friends' || showSessionsWhileActive === 'all') {
      return true;
    }
    return false;
  }, [isActiveTimer, showSessionsWhileActive, isDiscoveryActivated]);

  const shouldShowOrganizationSessions = useMemo(() => {
    if (!isDiscoveryActivated) return false;
    return !!profile?.organization;
  }, [profile?.organization, isDiscoveryActivated]);

  const mockOrganizationSessions: DemoSession[] = useMemo(() => {
    if (!profile?.organization || !showDemoSessions) return [];

    const organizationNames = profile.organization.split(';').map(name => name.trim()).filter(name => name.length > 0);
    const sessions: DemoSession[] = [];

    const famousNamesWithIds = [
      { id: "mock-user-id-aristotle", name: "Aristotle" },
      { id: "mock-user-id-plato", name: "Plato" },
      { id: "mock-user-id-socrates", name: "Socrates" },
      { id: "mock-user-id-descartes", name: "Descartes" },
      { id: "mock-user-id-kant", name: "Kant" },
      { id: "mock-user-id-locke", name: "Locke" },
      { id: "mock-user-id-hume", name: "Hume" },
      { id: "mock-user-id-rousseau", name: "Rousseau" },
      { id: "mock-user-id-newton", name: "Newton" },
      { id: "mock-user-id-einstein", name: "Einstein" },
      { id: "mock-user-id-curie", name: "Curie" },
      { id: "mock-user-id-darwin", name: "Darwin" },
      { id: "mock-user-id-galileo", name: "Galileo" },
      { id: "mock-user-id-hawking", name: "Hawking" },
      { id: "mock-user-id-turing", name: "Turing" },
      { id: "mock-user-id-hypatia", name: "Hypatia" },
      { id: "mock-user-id-copernicus", name: "Copernicus" },
      { id: "mock-user-id-kepler", name: "Kepler" },
      { id: "mock-user-id-bohr", name: "Bohr" },
      { id: "mock-user-id-heisenberg", name: "Heisenberg" },
      { id: "mock-user-id-schrodinger", name: "Schrödinger" },
      { id: "mock-user-id-maxwell", name: "Maxwell" },
      { id: "mock-user-id-faraday", name: "Faraday" },
      { id: "mock-user-id-pascal", name: "Pascal" },
      { id: "mock-user-id-leibniz", name: "Leibniz" },
      { id: "mock-user-id-pythagoras", name: "Pythagoras" },
      { id: "mock-user-id-euclid", name: "Euclid" },
      { id: "mock-user-id-archimedes", name: "Archimedes" },
      { id: "mock-user-id-davinci", name: "Da Vinci" },
      { id: "mock-user-id-franklin", name: "Franklin" }
    ];

    organizationNames.forEach((orgName) => {
      const getDeterministicOffset = (name: string) => {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
          const char = name.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash |= 0;
        }
        return Math.abs(hash);
      };

      const hashValue = getDeterministicOffset(orgName);
      const minuteOffset = (hashValue % 12) * 5;

      const now = new Date();
      const currentHourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0).getTime();

      const staggeredStartTime = currentHourStart + minuteOffset * 60 * 1000;

      const participantNames: ParticipantSessionData[] = [];
      const usedIndices = new Set<number>();

      for (let i = 0; i < 3; i++) {
        let randomIndex = (hashValue + i) % famousNamesWithIds.length;
        while (usedIndices.has(randomIndex)) {
          randomIndex = (randomIndex + 1) % famousNamesWithIds.length;
        }
        usedIndices.add(randomIndex);
        const { id, name } = famousNamesWithIds[randomIndex];

        const focusPreferenceOffset = Math.floor(Math.random() * 15) - 7;
        const variedFocusPreference = Math.max(0, Math.min(100, (focusPreference || 50) + focusPreferenceOffset));

        participantNames.push({
          userId: id,
          userName: name,
          joinTime: Date.now(),
          role: i === 0 ? 'host' : 'coworker', // Assign first participant as host
          focusPreference: variedFocusPreference,
          intention: `Deep work on ${name}'s theories.`,
          bio: `A dedicated member of ${orgName}.`,
        });
      }

      // NEW: Add mock location data for organization sessions
      const mockLat = -33.8688 + (Math.random() - 0.5) * 0.05; // Slightly varied from Sydney
      const mockLong = 151.2093 + (Math.random() - 0.5) * 0.05;

      let distance: number | null = null;
      if (userLocation.latitude !== null && userLocation.longitude !== null) {
        distance = calculateDistance(userLocation.latitude, userLocation.longitude, mockLat, mockLong);
      }

      sessions.push({
        id: `org-session-${orgName.replace(/\s/g, '-')}`,
        title: `${orgName} DeepSesh`,
        startTime: staggeredStartTime,
        location: `${orgName} HQ - Study Room`,
        workspaceImage: "/api/placeholder/200/120",
        workspaceDescription: "Dedicated study space for organization members",
        participants: participantNames,
        fullSchedule: [
          { id: crypto.randomUUID(), type: "focus", title: "Focus", durationMinutes: 50 },
          { id: crypto.randomUUID(), type: "break", title: "Break", durationMinutes: 10 },
        ],
        location_lat: mockLat,
        location_long: mockLong,
        distance: distance,
      });
    });

    return sessions;
  }, [profile, currentUserId, currentUserName, focusPreference, showDemoSessions, userLocation]);


  const handleExtendSubmit = async (minutes: number) => {
    if (!user?.id || !activeSessionRecordId) {
      if (areToastsEnabled) {
        toast.error("Not in a session", {
          description: "You must be in an active session to suggest an extension.",
        });
      }
      return;
    }

    const newSuggestion: ExtendSuggestion = {
      id: `extend-${Date.now()}`,
      minutes,
      creator: currentUserName,
      creatorId: user.id, // Add creatorId for server-side validation
      votes: [],
      status: 'pending',
    };
    await addAsk(newSuggestion);
  };

  const handlePollSubmit = async (question: string, pollType: PollType, options: string[], allowCustomResponses: boolean) => {
    if (!user?.id || !activeSessionRecordId) {
      if (areToastsEnabled) {
        toast.error("Not in a session", {
          description: "You must be in an active session to create a poll.",
        });
      }
      return;
    }

    const pollOptions: PollOption[] = options.map((text, index) => ({
      id: `option-${index}-${Date.now()}`,
      text: text,
      votes: [],
    }));

    if (pollType === 'closed') {
      pollOptions.push(
        { id: 'closed-yes', text: 'Yes', votes: [] },
        { id: 'closed-no', text: 'No', votes: [] },
        { id: 'closed-dont-mind', text: "Don't Mind", votes: [] }
      );
    }

    const newPoll: Poll = {
      id: `poll-${Date.now()}`,
      question,
      type: pollType,
      creator: currentUserName,
      creatorId: user.id, // Add creatorId for server-side validation
      options: pollOptions,
      status: 'active',
      allowCustomResponses,
    };
    await addAsk(newPoll);
  };

  const handleVoteExtend = async (id: string, newVote: 'yes' | 'no' | 'neutral' | null) => {
    if (!user?.id || !activeSessionRecordId) {
      if (areToastsEnabled) {
        toast.error("Not in a session", {
          description: "You must be in an active session to vote.",
        });
      }
      return;
    }

    const currentAsk = activeAsks.find(ask => ask.id === id);
    if (!currentAsk || !('minutes' in currentAsk)) return;

    let updatedVotes = currentAsk.votes.filter(v => v.userId !== user.id);

    if (newVote !== null) {
      updatedVotes.push({ userId: user.id, vote: newVote });
    }

    const yesVotes = updatedVotes.filter(v => v.vote === 'yes').length;
    const noVotes = updatedVotes.filter(v => v.vote === 'no').length;

    const totalParticipants = (activeJoinedSessionCoworkerCount || 0) + (currentSessionRole === 'host' ? 1 : 0);
    const threshold = Math.ceil(totalParticipants / 2);

    let newStatus = currentAsk.status;
    if (yesVotes >= threshold) {
      newStatus = 'accepted';
    } else if (noVotes >= threshold) {
      newStatus = 'rejected';
    } else {
      if (currentAsk.status !== 'pending' && yesVotes < threshold && noVotes < threshold) {
        newStatus = 'pending';
      }
    }

    await updateAsk({
      ...currentAsk,
      votes: updatedVotes,
      status: newStatus,
    });
  };

  const handleVoteOnExistingPoll = async (pollId: string, optionIds: string[], customOptionText?: string, isCustomOptionSelected?: boolean) => {
    if (!user?.id || !activeSessionRecordId) {
      if (areToastsEnabled) {
        toast.error("Not in a session", {
          description: "You must be in an active session to vote.",
        });
      }
      return;
    }

    const currentAsk = activeAsks.find(ask => ask.id === pollId);
    if (!currentAsk || !('options' in currentAsk)) return;

    let currentPoll = currentAsk as Poll;
    let finalOptionIdsToVote: string[] = [...optionIds];

    const trimmedCustomText = customOptionText?.trim();
    let userCustomOptionId: string | null = null;

    const existingUserCustomOption = currentPoll.options.find(
      opt => opt.id.startsWith('custom-') && opt.votes.some(vote => vote.userId === user.id)
    );

    if (trimmedCustomText && isCustomOptionSelected) {
      if (existingUserCustomOption) {
        if (existingUserCustomOption.text !== trimmedCustomText) {
          currentPoll = {
            ...currentPoll,
            options: currentPoll.options.map(opt =>
              opt.id === existingUserCustomOption.id ? { ...opt, text: trimmedCustomText } : opt
            )
          };
        }
        userCustomOptionId = existingUserCustomOption.id;
      } else {
        const newCustomOption: PollOption = {
          id: `custom-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          text: trimmedCustomText,
          votes: [],
        };
        currentPoll = { ...currentPoll, options: [...currentPoll.options, newCustomOption] };
        userCustomOptionId = newCustomOption.id;
      }
      if (userCustomOptionId && !finalOptionIdsToVote.includes(userCustomOptionId)) {
        finalOptionIdsToVote.push(userCustomOptionId);
      }
    } else {
      if (existingUserCustomOption) {
        finalOptionIdsToVote = finalOptionIdsToVote.filter(id => id !== existingUserCustomOption.id);
      }
    }

    let updatedOptions = currentPoll.options.map(option => {
      let newVotes = option.votes.filter(v => v.userId !== user.id);

      if (finalOptionIdsToVote.includes(option.id)) {
        newVotes.push({ userId: user.id });
      }
      return { ...option, votes: newVotes };
    });

    updatedOptions = updatedOptions.filter(option =>
      !option.id.startsWith('custom-') || option.votes.length > 0 || (option.id === userCustomOptionId && isCustomOptionSelected)
    );

    await updateAsk({ ...currentPoll, options: updatedOptions });
  };

  const handleCountdownEnd = useCallback(() => {
    setIsSchedulePending(false);
    setIsScheduleActive(true);
    setIsRunning(true);
    setIsPaused(false);
    setCurrentPhaseStartTime(Date.now());
    if (areToastsEnabled) {
      toast("Schedule Commenced!", {
        description: `Your scheduled sesh has now begun.`,
      });
    }

    setCurrentSessionRole('host');
    setCurrentSessionHostName(currentUserName); // This uses setCurrentSessionHostName
    setCurrentSessionOtherParticipants([]);
  }, [setIsSchedulePending, setIsRunning, setIsPaused, setCurrentPhaseStartTime, areToastsEnabled, currentUserName, setCurrentSessionRole, setCurrentSessionHostName, setCurrentSessionOtherParticipants]);

  const getEffectiveStartTime = useCallback((template: ScheduledTimerTemplate, now: Date): number => {
    if (template.scheduleStartOption === 'manual') {
      return Infinity;
    }

    const [hours, minutes] = template.commenceTime.split(':').map(Number);
    let targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);

    const currentDay = now.getDay(); // 0 for Sunday, 1 for Monday, etc.
    const templateDay = template.commenceDay === null ? currentDay : template.commenceDay;
    
    let daysToAdd = (templateDay - currentDay + 7) % 7;
    targetDate.setDate(now.getDate() + daysToAdd);

    if (targetDate.getTime() < now.getTime() && !template.isRecurring) {
      return Infinity;
    }

    if (targetDate.getTime() < now.getTime() && template.isRecurring) {
      let nextCommenceDate = new Date(targetDate);
      while (nextCommenceDate.getTime() < now.getTime()) {
        if (template.recurrenceFrequency === 'daily') {
          nextCommenceDate.setDate(nextCommenceDate.getDate() + 1);
        } else if (template.recurrenceFrequency === 'weekly') {
          nextCommenceDate.setDate(nextCommenceDate.getDate() + 7);
        } else if (template.recurrenceFrequency === 'monthly') {
          nextCommenceDate.setMonth(nextCommenceDate.getMonth() + 1);
        } else {
          return Infinity;
        }
      }
      return nextCommenceDate.getTime();
    }

    return targetDate.getTime();
  }, []);

  const sortedPreparedSchedules = useMemo(() => {
    const now = new Date();
    return [...preparedSchedules].sort((a, b) => {
      const timeA = getEffectiveStartTime(a, now);
      const timeB = getEffectiveStartTime(b, now);

      if (timeA === timeB) {
        return a.title.localeCompare(b.title);
      }
      return timeA - timeB;
    }); // Corrected line
  }, [preparedSchedules, getEffectiveStartTime]);

  const handleNameClick = useCallback(async (userId: string, userName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const targetProfileData = await getPublicProfile(userId, userName);
    if (targetProfileData) {
      toggleProfilePopUp(targetProfileData.id, targetProfileData.first_name || userName, event.clientX, event.clientY);
    } else {
      toggleProfilePopUp(userId, userName, event.clientX, event.clientY);
    }
  }, [toggleProfilePopUp, getPublicProfile]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const items = Array.from(sectionOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSectionOrder(items as ('nearby' | 'friends' | 'organization')[]);
  };

  const handleShareLink = useCallback(async () => {
    if (!joinCode) { // RENAMED: hostCode to joinCode
      if (areToastsEnabled) {
        toast.error("Join Code Missing", { // RENAMED
          description: "Your join code is not available. Please check your profile settings.", // RENAMED
        });
      }
      return;
    }

    const shareUrl = `${window.location.origin}/?joinCode=${joinCode}`; // RENAMED: hostCode to joinCode
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsLinkCopied(true);
      if (linkCopiedTimeoutRef.current) {
        clearTimeout(linkCopiedTimeoutRef.current);
      }
      linkCopiedTimeoutRef.current = setTimeout(() => {
        setIsLinkCopied(false);
        linkCopiedTimeoutRef.current = null;
      }, 3000);
    } catch (err) {
      console.error("Failed to copy link:", err);
      if (areToastsEnabled) {
        toast.error("Failed to Copy Link", {
          description: "Please try again or copy manually.",
        });
      }
    }
  }, [joinCode, areToastsEnabled]); // RENAMED: hostCode to joinCode

  const handleActivateDiscovery = async () => {
    const trimmedDisplayName = discoveryDisplayName.trim();
    const currentFocusPreference = focusPreference; // Get current state from context

    const updates: ProfileUpdate = {}; // Corrected type to ProfileUpdate
    let hasChangesToSave = false;

    if (trimmedDisplayName !== "" && trimmedDisplayName !== localFirstName) {
      updates.first_name = trimmedDisplayName;
      hasChangesToSave = true;
    }

    if (currentFocusPreference !== profile?.focus_preference) {
        updates.focus_preference = currentFocusPreference;
        hasChangesToSave = true;
    }

    if (hasChangesToSave) {
      console.log("handleActivateDiscovery: Updating profile with changes:", updates);
      await updateProfile(updates, "Profile updated for discovery.");
    }

    console.log("handleActivateDiscovery: Before setIsDiscoveryActivated, isDiscoveryActivated:", isDiscoveryActivated);
    setIsDiscoveryActivated(true);
    console.log("handleActivateDiscovery: After setIsDiscoveryActivated, isDiscoveryActivated (should be true in next render):", true);

    // Add a small delay to allow React to process state updates and useEffects to run,
    // ensuring localStorage is updated before the dialog potentially unmounts.
    await new Promise(resolve => setTimeout(resolve, 100)); // Increased delay slightly for robustness

    setIsDiscoverySetupOpen(false);

    await getLocation();

    if (areToastsEnabled) {
      toast.success("Discovery Activated!", {
        description: "Discovery is now active. Check your settings to adjust session visibility.",
      });
    }
  };

  const handleDiscoveryDisplayNameBlur = async () => {
    const trimmedDisplayName = discoveryDisplayName.trim();
    if (trimmedDisplayName !== "" && trimmedDisplayName !== localFirstName) {
      await updateProfile({ first_name: trimmedDisplayName }, "Display name updated.");
    }
  };

  // NEW: Slider drag handlers for Discovery Setup dialog
  const handleDiscoverySliderDrag = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!discoverySliderContainerRef.current) return;

    const rect = discoverySliderContainerRef.current.getBoundingClientRect();
    const clientX = event.clientX;

    let relativeX = clientX - rect.left;
    relativeX = Math.max(0, Math.min(relativeX, rect.width));

    const newValue = Math.round((relativeX / rect.width) * 100);
    setFocusPreference(newValue);
  }, [setFocusPreference]);

  const handleDiscoveryPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return; // Only respond to left-click
    setIsDraggingDiscoverySlider(true);
    handleDiscoverySliderDrag(event); // Set initial value on click
    event.currentTarget.setPointerCapture(event.pointerId); // Capture pointer for continuous drag
  }, [handleDiscoverySliderDrag]);

  const handleDiscoveryPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingDiscoverySlider) {
      handleDiscoverySliderDrag(event);
    }
  }, [isDraggingDiscoverySlider, handleDiscoverySliderDrag]);

  const handleDiscoveryPointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    setIsDraggingDiscoverySlider(false);
    event.currentTarget.releasePointerCapture(event.pointerId); // Release pointer capture
  }, []);

  const renderSection = (sectionId: 'nearby' | 'friends' | 'organization') => {
    switch (sectionId) {
      case 'nearby':
        const hasNearbySessions = (supabaseNearbySessions && supabaseNearbySessions.length > 0) || (showDemoSessions && mockNearbySessions.length > 0);
        if (!shouldShowNearbySessions || !hasNearbySessions) {
          return null;
        }
        return (
          <div className="mb-6" data-name="Nearby Sessions Section">
            <button
              onClick={() => setIsNearbySessionsOpen(prev => !prev)}
              className="flex items-center justify-between w-full text-lg font-semibold text-foreground mb-3 hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                      <MapPin
                        size={16}
                        className={cn(
                          "cursor-pointer hover:text-primary",
                          geolocationPermissionStatus === 'granted' && "text-success-foreground",
                          geolocationPermissionStatus === 'denied' && "text-error-foreground"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          getLocation();
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent className="select-none">
                      {geolocationPermissionStatus === 'granted' && "Location access granted."}
                      {geolocationPermissionStatus === 'denied' && "Location access denied. Click to re-enable in browser settings."}
                      {geolocationPermissionStatus === 'prompt' && "Click to enable location for nearby sessions."}
                    </TooltipContent>
                  </Tooltip>
                <h3>Nearby</h3>
              </div>
              <div className="flex items-center gap-2">
                {hiddenNearbyCount > 0 && (
                  <span className="text-sm text-muted-foreground">({hiddenNearbyCount})</span>
                )}
                {isNearbySessionsOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>
            {isNearbySessionsOpen && (
              <div className="space-y-3">
                {isLoadingSupabaseSessions && <p className="text-muted-foreground">Loading nearby sessions...</p>}
                {supabaseError && <p className="text-destructive">Error: {supabaseError.message}</p>}
                {supabaseNearbySessions?.map(session => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onJoinSession={handleJoinSession}
                  />
                ))}
                {showDemoSessions && mockNearbySessions.map(session => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onJoinSession={handleJoinSession}
                  />
                ))}
              </div>
            )}
          </div>
        );
      case 'friends':
        const hasFriendsSessions = showDemoSessions && mockFriendsSessions.length > 0;
        if (!shouldShowFriendsSessions || !hasFriendsSessions) {
          return null;
        }
        return (
          <div data-name="Friends Sessions Section">
            <button
              onClick={() => setIsFriendsSessionsOpen(prev => !prev)}
              className="flex items-center justify-between w-full text-lg font-semibold text-foreground mb-3 hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-2">
                <Users size={16} className="text-blue-500" />
                <h3>Friends</h3>
              </div>
              <div className="flex items-center gap-2">
                {hiddenFriendsCount > 0 && (
                  <span className="text-sm text-muted-foreground">({hiddenFriendsCount})</span>
                )}
                {isFriendsSessionsOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>
            {isFriendsSessionsOpen && (
              <div className="space-y-3">
                {showDemoSessions && mockFriendsSessions.map(session => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onJoinSession={handleJoinSession}
                  />
                ))}
              </div>
            )}
          </div>
        );
      case 'organization':
        const hasOrganizationSessions = mockOrganizationSessions.length > 0;
        if (!shouldShowOrganizationSessions || !hasOrganizationSessions) {
          return null;
        }
        return (
          <div data-name="Organization Sessions Section">
            <button
              onClick={() => setIsOrganizationSessionsOpen(prev => !prev)}
              className="flex items-center justify-between w-full text-lg font-semibold text-foreground mb-3 hover:opacity-80 transition-opacity"
            >
              <h3>Organisations</h3>
              <div className="flex items-center gap-2">
                {isOrganizationSessionsOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>
            {isOrganizationSessionsOpen && (
              <div className="space-y-3">
                {mockOrganizationSessions.map(session => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onJoinSession={handleJoinSession}
                  />
                ))}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <TooltipProvider>
      <main className="max-w-4xl mx-auto pt-12 px-1 pb-4 lg:pt-15 lg:px-1 lg:pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className={cn(
              "relative rounded-lg border border-border pt-1 pb-4 px-1 text-center transition-colors mt-[5px]",
              !isGlobalPrivate && isDarkMode && "bg-gradient-to-r from-[hsl(var(--public-gradient-start-dark))] to-[hsl(var(--public-gradient-end-dark))]",
              !isGlobalPrivate && !isDarkMode && "bg-gradient-to-r from-[hsl(var(--public-gradient-start-light))] to-[hsl(var(--public-gradient-end-light))]",
              isGlobalPrivate && isDarkMode && "bg-gradient-to-r from-[hsl(var(--private-gradient-start-dark))] to-[hsl(var(--private-gradient-end-dark))]",
              isGlobalPrivate && !isDarkMode && "bg-gradient-to-r from-[hsl(var(--private-gradient-start-light))] to-[hsl(var(--private-gradient-end-light))]"
            )}>
              {isSchedulingMode ? (
                <ScheduleForm />
              ) : (
                <>
                  <div className="flex justify-between items-start mb-6" data-nosnippet>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsSchedulingMode(true)}
                      className="flex items-center gap-2 px-3 py-1 rounded-full border border-border hover:bg-secondary-hover transition-colors"
                      data-name="Schedule Button"
                    >
                      <CalendarPlus size={16} />
                      <span className="text-sm font-medium">Schedule</span>
                    </Button>
                    <div className="flex-grow self-center text-center transition-opacity duration-300 ease-in-out">
                      {isActiveTimer ? (
                        <h2
                          className="text-xl font-bold text-foreground"
                          onMouseDown={() => handleLongPressStart(handleTitleLongPress)}
                          onMouseUp={handleLongPressEnd}
                          onMouseLeave={handleLongPressEnd}
                          onTouchStart={() => handleLongPressStart(handleTitleLongPress)}
                          onTouchEnd={handleLongPressEnd}
                        >
                          {seshTitle}
                        </h2>
                      ) : (
                        <p className="text-sm md:text-base font-bold text-muted-foreground">
                          Sync focus with <span className="whitespace-nowrap">{isGlobalPrivate ? "known coworkers" : "nearby coworkers"}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button
                        onMouseDown={() => handleLongPressStart(handlePublicPrivateToggle)}
                        onMouseUp={handleLongPressEnd}
                        onMouseLeave={handleLongPressEnd}
                        onTouchStart={() => handleLongPressStart(handlePublicPrivateToggle)}
                        onTouchEnd={handleLongPressEnd}
                        onClick={handlePublicPrivateToggle}
                        className="flex items-center gap-2 px-3 py-1 rounded-full border border-border hover:bg-secondary-hover transition-colors select-none"
                        data-name="Public/Private Toggle Button"
                      >
                        {!isGlobalPrivate ? (
                            <>
                              <Globe size={16} />
                              <span className="text-sm font-medium">Public</span>
                            </>
                          ) : (
                            <>
                              <Lock size={16} />
                              <span className="text-sm font-medium">Private</span>
                            </>
                          )}
                      </button>

                      {isActiveTimer ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex items-center gap-2 px-3 py-1 rounded-full border border-border hover:bg-secondary-hover transition-colors"
                              data-name="Share Options Button"
                            >
                              <Share2 size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="select-none">
                            <DropdownMenuItem className="text-muted-foreground" onClick={() => console.log('Share QR')} data-name="Share QR Option">QR</DropdownMenuItem>
                            <DropdownMenuItem onClick={handleShareLink} className={cn(isLinkCopied && "text-green-500")} data-name="Share Link Option">Link</DropdownMenuItem>
                            <DropdownMenuItem className="text-muted-foreground" onClick={() => console.log('Share NFC')} data-name="Share NFC Option">NFC</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowJoinInput(true)}
                          className="flex items-center gap-2 px-3 py-1 rounded-full border border-border hover:bg-secondary-hover transition-colors"
                          data-name="Join Sesh Button"
                        >
                          <Users size={16} />
                          <span className="text-sm font-medium">Join</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  <div
                    className="relative flex flex-col items-center mb-4"
                    onClick={(e) => {
                      if (!isActiveTimer) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        const middle = rect.width / 2;

                        if (clickX < middle) {
                          if (timerType === 'focus') {
                            setHomepageFocusMinutes(prev => Math.max(timerIncrement, prev - timerIncrement));
                          } else {
                            setHomepageBreakMinutes(prev => Math.max(timerIncrement, prev - timerIncrement));
                          }
                        } else {
                          if (timerType === 'focus') {
                            setHomepageFocusMinutes(prev => prev + timerIncrement);
                          } else {
                            setHomepageBreakMinutes(prev => prev + timerIncrement);
                          }
                        }
                      }
                    }}
                    style={{ cursor: !isActiveTimer ? 'ew-resize' : 'default' }}
                  >
                    <CircularProgress
                      size={280}
                      strokeWidth={12}
                      progress={(timeLeft / (currentItemDuration * 60)) * 100}
                      className={isFlashing ? 'animate-pulse' : ''}
                      timerType={timerType}
                      isActiveTimer={isActiveTimer}
                      data-name="Main Circular Timer Progress"
                    >
                      <div
                        className={`relative flex flex-col items-center text-4xl font-mono font-bold text-foreground transition-all duration-300 ${isFlashing ? 'scale-110' : ''} select-none`}
                        onMouseEnter={() => setIsHoveringTimer(true)}
                        onMouseLeave={() => setIsHoveringTimer(false)}
                      >
                        <div className="h-10 flex items-center" data-name="Time Left Display">
                          {formatTime(timeLeft)}
                        </div>
                        {isHoveringTimer && isActiveTimer && (
                          <p className="absolute top-full mt-1 text-xs text-muted-foreground whitespace-nowrap select-none" data-name="Estimated End Time">
                            End: {format(new Date(Date.now() + timeLeft * 1000), is24HourFormat ? 'HH:mm' : 'hh:mm a')}
                          </p>
                        )}
                      </div>
                    </CircularProgress>
                  </div>

                  <div className="flex gap-3 justify-center mb-4">
                    {isFlashing ? (
                      <Button
                        size="lg"
                        className="w-28"
                        onClick={timerType === 'focus' ? switchToBreak : switchToFocus}
                        data-name={`Start ${timerType === 'focus' ? 'Break' : 'Focus'} Button`}
                      >
                        Start {timerType === 'focus' ? 'Break' : 'Focus'}
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        className="w-28"
                        onClick={() => {
                          if (isSchedulePrepared) {
                            startNewManualTimer();
                          } else if (isRunning) {
                            pauseTimer();
                          } else if (isPaused) {
                            resumeTimer();
                          } else {
                            startNewManualTimer();
                          }
                        }}
                        data-name={`${isRunning ? 'Pause' : (isPaused ? 'Resume' : 'Start')} Timer Button`}
                      >
                        {isRunning ? 'Pause' : (isPaused ? 'Resume' : 'Start')}
                      </Button>
                    )}
                  </div>

                  {/* NEW: Container for Stop and Ask buttons */}
                  {(isRunning || isPaused || isScheduleActive || isSchedulePending) && (
                    <div className="flex items-end justify-between px-4 mt-4">
                      {/* Stop button container */}
                      <div className={cn(
                        "shape-octagon w-10 h-10 bg-secondary text-secondary-foreground transition-colors flex items-center justify-center",
                        isRunning && "opacity-50",
                        "hover:opacity-100",
                        isPaused && "text-error-foreground" // Changed to error-foreground
                      )}>
                        <Button
                          variant="ghost"
                          size="icon"
                          // Removed onMouseDown, onMouseUp, onMouseLeave, onTouchStart, onTouchEnd
                          onClick={() => stopTimer(true, false)} // MODIFIED: Added second argument
                          className={cn(
                            "w-full h-full rounded-none bg-transparent hover:bg-primary/5 dark:hover:bg-primary/10",
                            isPaused ? "text-error-foreground" : "text-secondary-foreground" // Changed to error-foreground
                          )}
                          data-name="Stop Timer Button"
                        >
                          <Square size={16} fill="currentColor" />
                        </Button>
                      </div>
                      {/* AskMenu component */}
                      <AskMenu onExtendSubmit={handleExtendSubmit} onPollSubmit={handlePollSubmit} />
                    </div>
                  )}

                  {!isScheduleActive && !isTimeLeftManagedBySession && (
                    <div className="flex justify-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-muted-foreground cursor-pointer select-none",
                            timerType === 'focus' && "font-bold text-foreground"
                          )}
                          onClick={() => handleModeToggle('focus')}
                          data-name="Focus Mode Toggle"
                        >
                          Focus:
                        </span>
                        <Input
                          type="number"
                          value={focusMinutes === 0 ? "" : focusMinutes}
                          onChange={e => {
                            const value = e.target.value;
                            if (value === "") {
                              setHomepageFocusMinutes(0);
                            } else {
                              setHomepageFocusMinutes(parseFloat(value) || 0);
                            }
                          }}
                          onBlur={() => {
                            if (focusMinutes === 0) {
                              setHomepageFocusMinutes(defaultFocusMinutes);
                            }
                          }}
                          min={timerIncrement}
                          max={69 * 60}
                          step={timerIncrement}
                          onFocus={(e) => e.target.select()}
                          data-name="Focus Duration Input"
                          className={cn(
                            "w-16 text-center pr-0",
                            isDarkMode ? "bg-[hsl(var(--focus-background-solid-dark))]" : "bg-[hsl(var(--focus-background-solid-light))]"
                          )}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-muted-foreground cursor-pointer select-none",
                            timerType === 'break' && "font-bold text-foreground"
                          )}
                          onClick={() => handleModeToggle('break')}
                          data-name="Break Mode Toggle"
                        >
                          Break:
                        </span>
                        <Input
                          type="number"
                          value={breakMinutes === 0 ? "" : breakMinutes}
                          onChange={e => {
                            const value = e.target.value;
                            if (value === "") {
                              setHomepageBreakMinutes(0);
                            } else {
                              setHomepageBreakMinutes(parseFloat(value) || 0);
                            }
                          }}
                          onBlur={() => {
                            if (breakMinutes === 0) {
                              setHomepageBreakMinutes(defaultBreakMinutes);
                            }
                          }}
                          min={timerIncrement}
                          max={420}
                          step={timerIncrement}
                          onFocus={(e) => e.target.select()}
                          data-name="Break Duration Input"
                          className={cn(
                            "w-16 text-center pr-0",
                            isDarkMode ? "bg-[hsl(var(--break-background-solid-dark))]" : "bg-[hsl(var(--break-background-solid-light))]"
                          )}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <ActiveAskSection
              activeAsks={activeAsks}
              onVoteExtend={handleVoteExtend} // Corrected: Use handleVoteExtend for voting on existing asks
              onVotePoll={handleVoteOnExistingPoll}
              currentUserId={currentUserId}
            />
          </div>

          <div className="space-y-6">
            {profile?.profile_data?.intention?.value && (
              <Card>
                <CardHeader>
                  <CardTitle className="lg">My Intention</CardTitle>
                </CardHeader>
                <CardContent>
                  <p
                    className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                    onMouseDown={() => handleLongPressStart(handleIntentionLongPress)}
                    onMouseUp={handleLongPressEnd}
                    onMouseLeave={handleLongPressEnd}
                    onTouchStart={() => handleLongPressStart(handleIntentionLongPress)}
                    onTouchEnd={() => handleLongPressEnd()}
                    onClick={() => {
                      if (!isLongPress.current) {
                      }
                    }}
                    data-name="My Intention Text"
                  >
                    {profile.profile_data.intention.value}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  {isEditingSeshTitle ? (
                    <Input
                      ref={titleInputRef}
                      value={seshTitle}
                      onChange={(e) => setSeshTitle(e.target.value)}
                      onKeyDown={handleTitleInputKeyDown}
                      onBlur={handleTitleInputBlur}
                      placeholder={getDefaultSeshTitle()}
                      className="text-lg font-semibold h-auto py-1 px-2"
                      onFocus={(e) => e.target.select()}
                      data-name="Sesh Title Input"
                    />
                  ) : (
                    <CardTitle
                      className={cn(
                        "text-lg cursor-pointer select-none",
                        isDefaultTitleAnimating && "animate-fade-in-out"
                      )}
                      onClick={handleTitleClick}
                      onMouseDown={() => handleLongPressStart(handleTitleLongPress)}
                      onMouseUp={handleLongPressEnd}
                      onMouseLeave={handleLongPressEnd}
                      onTouchStart={() => handleLongPressStart(handleTitleLongPress)}
                      onTouchEnd={handleLongPressEnd}
                      data-name="Sesh Title Display"
                    >
                      {seshTitle}
                    </CardTitle>
                  )}
                  <span className="text-lg font-semibold text-black">Notes</span>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  ref={notesTextareaRef}
                  placeholder="Jot down your thoughts, to-do items, or reflections..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="resize-none overflow-hidden"
                  onFocus={(e) => e.target.select()}
                  data-name="Notes Textarea"
                />
              </CardContent>
            </Card>

            {isActiveTimer && allParticipantsToDisplayInCard.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Coworkers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {allParticipantsToDisplayInCard.map(person => (
                    <div
                      key={person.userId}
                      className={cn(
                        "flex items-center justify-between p-2 rounded-md select-none",
                        // NEW: Use the solid focus background color based on theme
                        person.role === 'self' ? (isDarkMode ? "bg-[hsl(var(--focus-background-solid-dark))]" : "bg-[hsl(var(--focus-background-solid-light))]") :
                        person.role === 'host' ? "bg-muted text-blue-700 font-medium" :
                        "hover:bg-muted cursor-pointer"
                      )}
                      data-name={`Coworker: ${person.userName}`}
                      onClick={(e) => handleNameClick(person.userId, person.userName, e)}
                    >
                      <span className="font-medium text-foreground flex items-center gap-1">
                        {person.role === 'self' ? localFirstName || "You" : person.userName}
                        {person.role === 'host' && <Crown size={16} className="text-yellow-500" />}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        <Popover
                          open={openFocusPreferenceTooltipId === person.userId}
                          onOpenChange={(isOpen) => {
                            if (isOpen) {
                              setOpenFocusPreferenceTooltipId(person.userId);
                              if (focusPreferenceTooltipTimeoutRef.current) {
                                clearTimeout(focusPreferenceTooltipTimeoutRef.current);
                              }
                              focusPreferenceTooltipTimeoutRef.current = setTimeout(() => {
                                setOpenFocusPreferenceTooltipId(null);
                                focusPreferenceTooltipTimeoutRef.current = null;
                              }, 1000);
                            } else {
                              if (openFocusPreferenceTooltipId === person.userId) {
                                setOpenFocusPreferenceTooltipId(null);
                                if (focusPreferenceTooltipTimeoutRef.current) {
                                  clearTimeout(focusPreferenceTooltipTimeoutRef.current);
                                  focusPreferenceTooltipTimeoutRef.current = null;
                                }
                              }
                            }
                          }}
                        >
                          <PopoverTrigger asChild>
                            <span
                              className="cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {person.focusPreference}%
                            </span>
                          </PopoverTrigger>
                          <PopoverContent className="select-none p-1 text-xs w-fit">
                            Focus preference
                          </PopoverContent>
                        </Popover>
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {!isDiscoveryActivated ? (
              <Card className="p-6 text-center">
                <CardContent className="flex flex-col items-center justify-center p-0">
                  <p className="text-muted-foreground mb-4">Discover nearby sessions and connect with friends!</p>
                  <Button onClick={() => setIsDiscoverySetupOpen(true)} variant="default">
                    <Users className="mr-2 h-4 w-4" /> Activate
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="sessions-list">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-6"
                    >
                      {sectionOrder.map((sectionId, index) => (
                        <Draggable key={sectionId} draggableId={sectionId} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.dragHandleProps}
                              {...provided.draggableProps}
                            >
                              {renderSection(sectionId)}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
        </div>
        {isScheduleActive && (
          <div className="mt-8" data-name="Timeline Section">
            <Timeline
              schedule={activeSchedule}
              currentScheduleIndex={currentScheduleIndex}
              timeLeft={timeLeft}
              commenceTime={commenceTime}
              commenceDay={commenceDay === null ? new Date().getDay() : commenceDay}
              isSchedulePending={isSchedulePending}
              onCountdownEnd={handleCountdownEnd}
              timerColors={activeTimerColors}
            />
          </div>
        )}

        {sortedPreparedSchedules.length > 0 && (
          <div className="mt-8" data-name="Upcoming Section">
            <h3 className="text-xl font-bold text-foreground mb-4">Upcoming Schedules</h3>
            <Accordion
              type="multiple"
              className="w-full space-y-4"
              value={openUpcomingScheduleAccordions}
              onValueChange={setOpenUpcomingScheduleAccordions}
            >
              {sortedPreparedSchedules.map((template) => (
                <UpcomingScheduleAccordionItem
                  key={template.id}
                  template={template}
                  commencePreparedSchedule={() => commenceSpecificPreparedSchedule(template.id)}
                  discardPreparedSchedule={() => discardPreparedSchedule(template.id)}
                  showCommenceButton={!isActiveTimer}
                />
              ))}
            </Accordion>
          </div>
        )}

        <Dialog open={showJoinInput} onOpenChange={setShowJoinInput}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Join Sesh</DialogTitle>
              <DialogDescription>
                Enter the sesh code to join an active sesh.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input
                id="session-code"
                placeholder="Enter code"
                value={joinSessionCode}
                onChange={(e) => setJoinSessionCode(e.target.value)}
                className="col-span-3"
                onFocus={(e) => e.target.select()}
                onKeyDown={(e) => { if (e.key === 'Enter') handleJoinCodeSubmit(); }}
              />
            </div>
            <DialogFooter>
              <Button
                onClick={handleJoinCodeSubmit}
                disabled={!joinSessionCode.trim()}
              >
                Join
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isDiscoverySetupOpen} onOpenChange={setIsDiscoverySetupOpen}>
          <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto top-[5%] translate-y-0 md:top-1/2 md:-translate-y-1/2">
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="discovery-display-name">Name</Label>
                <Input
                  id="discovery-display-name"
                  value={discoveryDisplayName}
                  onChange={(e) => setDiscoveryDisplayName(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  // Removed onBlur={handleDiscoveryDisplayNameBlur}
                />
              </div>

              <div className="space-y-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label>Focus Preference</Label>
                  </TooltipTrigger>
                  <TooltipContent className="select-none">
                    How would you prefer to balance focus vs socialising?
                  </TooltipContent>
                </Tooltip>
                {/* NEW: Wrapper div for expanded slider interaction */}
                <div
                  ref={discoverySliderContainerRef}
                  onPointerDown={handleDiscoveryPointerDown}
                  onPointerMove={handleDiscoveryPointerMove}
                  onPointerUp={handleDiscoveryPointerUp}
                  onPointerLeave={handleDiscoveryPointerUp} // Handle pointer leaving the element
                  className="space-y-4 cursor-ew-resize p-2 -m-2 rounded-md" // Added padding and negative margin to expand touch area
                >
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Banter</span>
                    <span>Deep Focus</span>
                  </div>
                  <div className="relative group">
                    <Slider
                      value={[focusPreference]}
                      onValueChange={(val) => setFocusPreference(val[0])}
                      max={100}
                      min={0}
                      step={1}
                      className="w-full"
                      rangeColor={getSociabilityGradientColor(focusPreference)}
                    />
                  </div>
                  <div className="text-center mt-3 text-sm text-muted-foreground select-none">
                    {focusPreference <= 20 && "Looking to collaborate/brainstorm"}
                    {focusPreference > 20 && focusPreference <= 40 && "Happy to chat while we work"}
                    {focusPreference > 40 && focusPreference <= 60 && "I don't mind"}
                    {focusPreference > 60 && focusPreference <= 80 && "Socialise only during breaks"}
                    {focusPreference > 80 && "Minimal interaction even during breaks"}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label>Location</Label>
                  </TooltipTrigger>
                  <TooltipContent className="select-none">
                    Enabling location allows you to see nearby sessions.
                  </TooltipContent>
                </Tooltip>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full flex items-center gap-2",
                    geolocationPermissionStatus === 'granted' && "bg-success text-success-foreground border-success hover:bg-success-hover",
                    geolocationPermissionStatus === 'denied' && "bg-error text-error-foreground border-error hover:bg-error-hover"
                  )}
                  onClick={getLocation}
                >
                  <MapPin size={16} />
                  {geolocationPermissionStatus === 'granted' && "Location Enabled"}
                  {geolocationPermissionStatus === 'denied' && "Enable Location"}
                  {geolocationPermissionStatus === 'prompt' && "Enable Location"}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <p className="text-xs text-muted-foreground mr-auto">
                Add more details on your <Link to="/profile" className="text-blue-500 hover:underline">profile page</Link>
              </p>
              <Button onClick={handleActivateDiscovery}>Continue</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </TooltipProvider>
  );
};
export default Index;