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
import { useNavigate, Link } from "react-router-dom";
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
import { ScheduledTimerTemplate, ScheduledTimer, ParticipantSessionData } from "@/types/timer";
import { DAYS_OF_WEEK } from "@/lib/constants";
import { Accordion
 } from "@/components/ui/accordion";
import UpcomingScheduleAccordionItem from "@/components/UpcomingScheduleAccordionItem";
import { useProfilePopUp } from "@/contexts/ProfilePopUpContext";
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useTheme } from '@/contexts/ThemeContext';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; 
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface ExtendSuggestion {
  id: string;
  minutes: number;
  creator: string;
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
  options: PollOption[];
  status: 'active' | 'closed';
  allowCustomResponses: boolean;
}

type ActiveAskItem = ExtendSuggestion | Poll;
type PollType = 'closed' | 'choice' | 'selection';

interface DemoSession {
  id: string;
  title: string;
  startTime: number;
  location: string;
  workspaceImage: "/api/placeholder/200/120";
  workspaceDescription: string;
  participants: { id: string; name: string; focusPreference: number; intention?: string; bio?: string }[]; // Changed from sociability
  fullSchedule: { type: 'focus' | 'break'; durationMinutes: number; }[];
}

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
  participants_data: ParticipantSessionData[]; // Ensure this is typed correctly
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
      { id: "mock-user-id-bezos", name: "Altman", focusPreference: 15, intention: "Optimizing cloud infrastructure." }, // Changed from sociability
      { id: "mock-user-id-musk", name: "Musk", focusPreference: 10, intention: "Designing reusable rocket components." }, // Changed from sociability
      { id: "mock-user-id-zuckerberg", name: "Zuckerberg", focusPreference: 20, intention: "Developing new social algorithms." }, // Changed from sociability
      { id: "mock-user-id-gates", name: "Amodei", focusPreference: 20, intention: "Refining operating system architecture." }, // Changed from sociability
      { id: "mock-user-id-jobs", name: "Huang", focusPreference: 30, intention: "Innovating user interface design." }, // Changed from sociability
    ],
    fullSchedule: [
      { type: "focus", durationMinutes: 55 },
      { type: "break", durationMinutes: 5 },
    ],
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
      { id: "mock-user-id-freud", name: "Freud", focusPreference: 70, intention: "Reviewing psychoanalytic theories." }, // Changed from sociability
      { id: "mock-user-id-skinner", name: "Skinner", focusPreference: 70, intention: "Memorizing behavioral principles." }, // Changed from sociability
      { id: "mock-user-id-piaget", name: "Piaget", focusPreference: 80, intention: "Practicing cognitive development questions." }, // Changed from sociability
      { id: "mock-user-id-jung", name: "Jung", focusPreference: 70, intention: "Summarizing archetypal concepts." }, // Changed from sociability
      { id: "mock-user-id-maslow", name: "Maslow", focusPreference: 90, intention: "Creating hierarchy of needs flashcards." }, // Changed from sociability
      { id: "mock-user-id-rogers", name: "Rogers", focusPreference: 95, intention: "Discussing humanistic approaches." }, // Changed from sociability
      { id: "mock-user-id-bandura", name: "Bandura", focusPreference: 75, intention: "Collaborating on social learning theory guide." }, // Changed from sociability
      { id: "mock-user-id-pavlov", name: "Pavlov", focusPreference: 80, intention: "Peer teaching classical conditioning." }, // Changed from sociability
    ],
    fullSchedule: [
      { type: "focus", durationMinutes: 25 },
      { type: "break", durationMinutes: 5 },
    ],
  },
];

// NEW: Function to fetch active sessions from Supabase
const fetchSupabaseSessions = async (): Promise<DemoSession[]> => {
  const { data, error } = await supabase
    .from('active_sessions')
    .select('*')
    .eq('visibility', 'public')
    .eq('is_active', true);

  if (error) {
    console.error("Error fetching active sessions from Supabase:", error);
    throw new Error(error.message);
  }

  return data.map((session: SupabaseSessionData) => {
    // Use participants_data from Supabase directly
    const participants: { id: string; name: string; focusPreference: number; intention?: string; bio?: string }[] = // Changed from sociability
      (session.participants_data || []).map(p => ({
        id: p.userId,
        name: p.userName,
        focusPreference: p.focusPreference || 50, // Changed from sociability
        intention: p.intention || undefined,
        bio: p.bio || undefined,
      }));

    let fullSchedule: ScheduledTimer[];
    if (session.schedule_data && Array.isArray(session.schedule_data) && session.schedule_data.length > 0) {
      fullSchedule = session.schedule_data.map((item: any) => ({
        id: item.id || crypto.randomUUID(),
        title: item.title || item.type,
        type: item.type,
        durationMinutes: item.durationMinutes,
      }));
    } else {
      fullSchedule = [{
        id: crypto.randomUUID(),
        title: session.current_phase_type,
        type: session.current_phase_type,
        durationMinutes: session.current_phase_type === 'focus' ? session.focus_duration : session.break_duration,
      }];
    }

    return {
      id: session.id,
      title: session.session_title,
      startTime: new Date(session.created_at).getTime(),
      location: session.location_long && session.location_lat ? `Lat: ${session.location_lat}, Long: ${session.location_lat}` : "Unknown Location",
      workspaceImage: "/api/placeholder/200/120",
      workspaceDescription: "Live session from Supabase",
      participants: participants,
      fullSchedule: fullSchedule,
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
    setCurrentSessionHostName,
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
  } = useTimer();
  
  const { profile, loading: profileLoading, localFirstName, getPublicProfile, hostCode, setLocalFirstName, focusPreference, setFocusPreference } = useProfile(); // Changed from sociability
  const navigate = useNavigate();
  const { toggleProfilePopUp } = useProfilePopUp();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();

  const longPressRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);
  const [activeJoinedSession, setActiveJoinedSession] = useState<DemoSession | null>(null);
  const [isHoveringTimer, setIsHoveringTimer] = useState(false);

  const currentUserId = profile?.id || "mock-user-id-123"; 
  const currentUserName = profile?.first_name || localFirstName || "You";

  const [isEditingSeshTitle, setIsEditingSeshTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);

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

  const [openFocusPreferenceTooltipId, setOpenFocusPreferenceTooltipId] = useState<string | null>(null); // Changed from sociability
  const focusPreferenceTooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Changed from sociability

  const [isDefaultTitleAnimating, setIsDefaultTitleAnimating] = useState(false);

  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const linkCopiedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isDiscoverySetupOpen, setIsDiscoverySetupOpen] = useState(false);
  const [discoveryDisplayName, setDiscoveryDisplayName] = useState(localFirstName || hostCode || "You");

  // NEW: Fetch Supabase sessions
  const { data: supabaseNearbySessions, isLoading: isLoadingSupabaseSessions, error: supabaseError } = useQuery<DemoSession[]>({
    queryKey: ['supabaseActiveSessions'],
    queryFn: fetchSupabaseSessions,
    refetchInterval: 5000,
    enabled: isDiscoveryActivated && !isGlobalPrivate && (showSessionsWhileActive === 'nearby' || showSessionsWhileActive === 'all'),
  });

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
        id: p.userId,
        name: p.userName,
        focusPreference: p.focusPreference || 50, // Changed from sociability
        role: role, // The returned object has a 'role' that can be 'self'
      };
    }).sort((a, b) => {
      // Sort 'self' first, then 'host', then alphabetically by name for 'coworker'
      if (a.role === 'self') return -1;
      if (b.role === 'self') return 1;
      // At this point, neither a.role nor b.role can be 'self'.
      // Their types are effectively narrowed to 'host' | 'coworker'.
      if (a.role === 'host') return -1; 
      if (b.role === 'host') return 1;
      // At this point, if neither a nor b is 'self' or 'host', they must both be 'coworker'.
      return a.name.localeCompare(b.name);
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
  
  const handlePublicPrivateToggle = async () => {
    if (isGlobalPrivate && !isLongPress.current) {
      if (geolocationPermissionStatus === 'denied' || geolocationPermissionStatus === 'prompt') {
        setIsDiscoverySetupOpen(true);
        return;
      }
    }
    setIsGlobalPrivate((prev: boolean) => !prev);
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
  
  const startNewManualTimer = async () => {
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

    playSound();
    triggerVibration();
    setIsRunning(true);
    setIsPaused(false);
    setIsFlashing(false);
    setSessionStartTime(Date.now());
    setCurrentPhaseStartTime(Date.now());
    setAccumulatedFocusSeconds(0);
    setAccumulatedBreakSeconds(0);
    setTimeLeft(timerType === 'focus' ? focusMinutes * 60 : breakMinutes * 60);
    setIsTimeLeftManagedBySession(true);

    const hostParticipant: ParticipantSessionData = {
      userId: user?.id || `anon-${crypto.randomUUID()}`,
      userName: localFirstName,
      joinTime: Date.now(),
      role: 'host',
      focusPreference: focusPreference || 50, // Changed from sociability
      intention: profile?.intention || undefined,
      bio: profile?.bio || undefined,
    };

    setCurrentSessionRole('host');
    setCurrentSessionHostName(localFirstName);
    setCurrentSessionOtherParticipants([]);
    setActiveJoinedSessionCoworkerCount(0);
    setCurrentSessionParticipantsData([hostParticipant]);

    if (!isGlobalPrivate) {
      const { latitude, longitude } = await getLocation();
      const currentPhaseDuration = timerType === 'focus' ? focusMinutes : breakMinutes;
      const currentPhaseEndTime = new Date(Date.now() + currentPhaseDuration * 60 * 1000).toISOString();
      try {
        const { data, error } = await supabase
          .from('active_sessions')
          .insert({
            user_id: hostParticipant.userId,
            host_name: hostParticipant.userName,
            session_title: seshTitle,
            visibility: 'public',
            focus_duration: focusMinutes,
            break_duration: breakMinutes,
            current_phase_type: timerType,
            current_phase_end_time: currentPhaseEndTime,
            total_session_duration_seconds: currentPhaseDuration * 60,
            is_active: true,
            is_paused: false,
            location_lat: latitude,
            location_long: longitude,
            participants_data: [hostParticipant],
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
  };

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
      setCurrentPhaseStartTime(Date.now());
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
      setCurrentPhaseStartTime(null);
    }
    setIsPaused(true);
    setIsRunning(false);
    playSound();
    triggerVibration();
    setIsTimeLeftManagedBySession(true);
  };
  
  const resetTimer = async () => {
    if (longPressRef.current) {
      resetSessionStates();
    } else {
      if (confirm('Are you sure you want to reset the timer?')) {
        resetSessionStates();
      }
    }
    playSound();
    triggerVibration();
  };

  const switchToBreak = () => {
    if (currentPhaseStartTime !== null) {
      const elapsed = (Date.now() - currentPhaseStartTime) / 1000;
      setAccumulatedFocusSeconds((prev: number) => prev + elapsed);
    }
    setTimerType('break');
    setTimeLeft(breakMinutes * 60);
    setIsFlashing(false);
    setIsRunning(true);
    playSound();
    triggerVibration();
    setCurrentPhaseStartTime(Date.now());
    setIsTimeLeftManagedBySession(true);
  };

  const switchToFocus = () => {
    if (currentPhaseStartTime !== null) {
      const elapsed = (Date.now() - currentPhaseStartTime) / 1000;
      setAccumulatedBreakSeconds((prev: number) => prev + elapsed);
    }
    setTimerType('focus');
    setTimeLeft(focusMinutes * 60);
    setIsFlashing(false);
    setIsRunning(true);
    playSound();
    triggerVibration();
    setCurrentPhaseStartTime(Date.now());
    setIsTimeLeftManagedBySession(true);
  };

  const handleModeToggle = (mode: 'focus' | 'break') => {
    if (isRunning || isPaused || isScheduleActive || isSchedulePrepared) return;

    if (mode === 'focus') {
      setTimerType('focus');
      setTimeLeft(focusMinutes * 60);
    } else {
      setTimerType('break');
      setTimeLeft(breakMinutes * 60);
    }
    setIsTimeLeftManagedBySession(false);
  };

  const handleJoinSession = async (session: DemoSession) => {
    const sessionId = session.id;
    const sessionTitle = session.title;
    const hostName = session.participants[0]?.name || session.title;
    
    const participants: ParticipantSessionData[] = session.participants.map(p => ({
      userId: p.id,
      userName: p.name,
      joinTime: Date.now(),
      role: p.id === session.participants[0]?.id ? 'host' : 'coworker',
      focusPreference: p.focusPreference, // Changed from sociability
      intention: p.intention,
      bio: p.bio,
    }));

    const fullSchedule = session.fullSchedule.map(item => ({
      id: crypto.randomUUID(),
      title: item.type === 'focus' ? 'Focus' : 'Break',
      ...item,
    }));

    const now = Date.now();
    const elapsedSecondsSinceSessionStart = Math.floor((now - session.startTime) / 1000);
    
    const totalScheduleDurationSeconds = session.fullSchedule.reduce(
      (sum, phase) => sum + phase.durationMinutes * 60,
      0
    );

    let currentPhaseType: 'focus' | 'break' = 'focus';
    let remainingSecondsInPhase = 0;
    let currentPhaseDurationMinutes = 0;

    const cycleDurationSeconds = session.fullSchedule.reduce((sum, phase) => sum + phase.durationMinutes * 60, 0);
    const effectiveElapsedSeconds = cycleDurationSeconds > 0 ? elapsedSecondsSinceSessionStart % cycleDurationSeconds : 0;


    if (totalScheduleDurationSeconds === 0) {
      currentPhaseType = 'focus';
      remainingSecondsInPhase = 0;
      currentPhaseDurationMinutes = 0;
    } else if (elapsedSecondsSinceSessionStart < 0) {
      currentPhaseType = session.fullSchedule[0]?.type || 'focus';
      currentPhaseDurationMinutes = session.fullSchedule[0]?.durationMinutes || 0;
      remainingSecondsInPhase = -elapsedSecondsSinceSessionStart;
    } else {
      let accumulatedDurationSecondsInCycle = 0;
      for (let i = 0; i < session.fullSchedule.length; i++) {
        const phase = session.fullSchedule[i];
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
  };

  const handleJoinCodeSubmit = () => {
    if (joinSessionCode.trim()) {
      if (areToastsEnabled) {
        toast.info("Joining Sesh", {
          description: `Attempting to join sesh with code: ${joinSessionCode.trim()}`,
        });
      }
      setJoinSessionCode("");
      setShowJoinInput(false);
    }
  };

  const isActiveTimer = isRunning || isPaused || isFlashing || isScheduleActive || isSchedulePending;

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
    if (!profile?.organization) return [];

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

      const participantNames: { id: string; name: string; focusPreference: number; intention?: string; bio?: string }[] = []; // Changed from sociability
      const usedIndices = new Set<number>();

      for (let i = 0; i < 3; i++) {
        let randomIndex = (hashValue + i) % famousNamesWithIds.length;
        while (usedIndices.has(randomIndex)) {
          randomIndex = (randomIndex + 1) % famousNamesWithIds.length;
        }
        usedIndices.add(randomIndex);
        const { id, name } = famousNamesWithIds[randomIndex];
        
        const focusPreferenceOffset = Math.floor(Math.random() * 15) - 7; // Changed from sociability
        const variedFocusPreference = Math.max(0, Math.min(100, (focusPreference || 50) + focusPreferenceOffset)); // Changed from sociability

        participantNames.push({ 
          id: id,
          name: name, 
          focusPreference: variedFocusPreference, // Changed from sociability
          intention: `Deep work on ${name}'s theories.` 
        });
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
          { type: "focus", durationMinutes: 50 },
          { type: "break", durationMinutes: 10 },
        ],
      });
    });

    return sessions;
  }, [profile, currentUserId, currentUserName, focusPreference]); // Changed from sociability


  const handleExtendSubmit = (minutes: number) => {
    const newSuggestion: ExtendSuggestion = {
      id: `extend-${Date.now()}`,
      minutes,
      creator: currentUserName,
      votes: [],
      status: 'pending',
    };
    addAsk(newSuggestion);
  };

  const handlePollSubmit = (question: string, pollType: PollType, options: string[], allowCustomResponses: boolean) => {
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
      options: pollOptions,
      status: 'active',
      allowCustomResponses,
    };
    addAsk(newPoll);
  };

  const handleVoteExtend = (id: string, newVote: 'yes' | 'no' | 'neutral' | null) => {
    const currentAsk = activeAsks.find(ask => ask.id === id);
    if (!currentAsk || !('minutes' in currentAsk)) return;

    let updatedVotes = currentAsk.votes.filter(v => v.userId !== currentUserId);

    if (newVote !== null) {
      updatedVotes.push({ userId: currentUserId, vote: newVote });
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

    updateAsk({
      ...currentAsk,
      votes: updatedVotes,
      status: newStatus,
    });
  };

  // NEW: Function to handle voting on an existing poll
  const handleVoteOnExistingPoll = (pollId: string, optionIds: string[], customOptionText?: string, isCustomOptionSelected?: boolean) => {
    const currentAsk = activeAsks.find(ask => ask.id === pollId);
    if (!currentAsk || !('options' in currentAsk)) return;

    let currentPoll = currentAsk as Poll;
    let finalOptionIdsToVote: string[] = [...optionIds];

    const trimmedCustomText = customOptionText?.trim();
    let userCustomOptionId: string | null = null;

    const existingUserCustomOption = currentPoll.options.find(
      opt => opt.id.startsWith('custom-') && opt.votes.some(vote => vote.userId === currentUserId)
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
      let newVotes = option.votes.filter(v => v.userId !== currentUserId);

      if (finalOptionIdsToVote.includes(option.id)) {
        newVotes.push({ userId: currentUserId });
      }
      return { ...option, votes: newVotes };
    });

    // Filter out custom options that no longer have votes and are not the current user's active custom response
    updatedOptions = updatedOptions.filter(option =>
      !option.id.startsWith('custom-') || option.votes.length > 0 || (option.id === userCustomOptionId && isCustomOptionSelected)
    );

    updateAsk({ ...currentPoll, options: updatedOptions });
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
    setCurrentSessionHostName(currentUserName);
    setCurrentSessionOtherParticipants([]);
  }, [setIsSchedulePending, setIsRunning, setIsPaused, setCurrentPhaseStartTime, areToastsEnabled, currentUserName]);

  const currentItemDuration = isScheduleActive && activeSchedule[currentScheduleIndex]
    ? activeSchedule[currentScheduleIndex].durationMinutes
    : (timerType === 'focus' ? focusMinutes : breakMinutes);

  const getEffectiveStartTime = useCallback((template: ScheduledTimerTemplate, now: Date): number => {
    if (template.scheduleStartOption === 'manual') {
      return Infinity;
    }

    const [hours, minutes] = template.commenceTime.split(':').map(Number);
    let targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);

    const currentDay = now.getDay();
    const templateDay = template.commenceDay === null ? currentDay : template.commenceDay;
    const daysToAdd = (templateDay - currentDay + 7) % 7;
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
  }, []); // Removed getEffectiveStartTime from its own dependency array

  const sortedPreparedSchedules = useMemo(() => {
    const now = new Date();
    return [...preparedSchedules].sort((a, b) => {
      const timeA = getEffectiveStartTime(a, now);
      const timeB = getEffectiveStartTime(b, now);

      if (timeA === timeB) {
        return a.title.localeCompare(b.title);
      }
      return timeA - timeB;
    });
  }, [preparedSchedules, getEffectiveStartTime]);

  const handleNameClick = useCallback(async (userId: string, userName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const targetProfileData = getPublicProfile(userId, userName);
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
    if (!hostCode) {
      if (areToastsEnabled) {
        toast.error("Host Code Missing", {
          description: "Your host code is not available. Please check your profile settings.",
        });
      }
      return;
    }

    const shareUrl = `${window.location.origin}/?joinCode=${hostCode}`;
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
  }, [hostCode, areToastsEnabled]);

  const handleActivateDiscovery = async () => {
    if (discoveryDisplayName.trim() !== "" && discoveryDisplayName !== localFirstName) {
      setLocalFirstName(discoveryDisplayName.trim());
    }

    setIsDiscoveryActivated(true);
    setIsDiscoverySetupOpen(false);

    await getLocation(); 

    if (areToastsEnabled) {
      toast.success("Discovery Activated!", {
        description: "Discovery is now active. Check your settings to adjust session visibility.",
      });
    }
  };

  const renderSection = (sectionId: 'nearby' | 'friends' | 'organization') => {
    switch (sectionId) {
      case 'nearby':
        return shouldShowNearbySessions && (
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
                          geolocationPermissionStatus === 'granted' && "text-green-600",
                          geolocationPermissionStatus === 'denied' && "text-destructive"
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
                {mockNearbySessions.map(session => (
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
        return shouldShowFriendsSessions && (
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
                {mockFriendsSessions.map(session => (
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
        return shouldShowOrganizationSessions && mockOrganizationSessions.length > 0 && (
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
      <main className="max-w-4xl mx-auto pt-16 px-1 pb-4 lg:pt-20 lg:px-1 lg:pb-6">
        <div className="mb-6">
          <p className="text-muted-foreground">Sync your focus with nearby coworkers</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className={cn(
              "relative rounded-lg border border-border pt-1 pb-8 px-1 text-center transition-colors",
              !isGlobalPrivate && isDarkMode && "bg-gradient-to-r from-[hsl(var(--public-gradient-start-dark))] to-[hsl(var(--public-gradient-end-dark))]",
              !isGlobalPrivate && !isDarkMode && "bg-[hsl(var(--public-bg))]",
              isGlobalPrivate && "bg-[hsl(var(--private-bg))]"
            )}>
              {isSchedulingMode ? (
                <ScheduleForm />
              ) : (
                <>
                  <div className="flex justify-between items-start mb-6"> {/* Changed items-center to items-start */}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsSchedulingMode(true)}
                      className="flex items-center gap-2 px-3 py-1 rounded-full border border-border hover:bg-muted transition-colors"
                      data-name="Schedule Button"
                    >
                      <CalendarPlus size={16} />
                      <span className="text-sm font-medium">Schedule</span>
                    </Button>
                    {/* NEW: seshTitle H2 */}
                    {isActiveTimer && (
                      <h2 
                        className="text-xl font-bold text-foreground text-center flex-grow self-center" 
                        onMouseDown={() => handleLongPressStart(handleTitleLongPress)}
                        onMouseUp={handleLongPressEnd}
                        onMouseLeave={handleLongPressEnd}
                        onTouchStart={() => handleLongPressStart(handleTitleLongPress)}
                        onTouchEnd={handleLongPressEnd}
                      >
                        {seshTitle}
                      </h2>
                    )}
                    <div className="flex flex-col items-end gap-2">
                      <button 
                        onMouseDown={() => handleLongPressStart(handlePublicPrivateToggle)}
                        onMouseUp={handleLongPressEnd}
                        onMouseLeave={handleLongPressEnd}
                        onTouchStart={() => handleLongPressStart(handlePublicPrivateToggle)}
                        onTouchEnd={handleLongPressEnd}
                        onClick={handlePublicPrivateToggle}
                        className="flex items-center gap-2 px-3 py-1 rounded-full border border-border hover:bg-muted transition-colors select-none"
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
                              className="flex items-center gap-2 px-3 py-1 rounded-full border border-border hover:bg-muted transition-colors"
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
                          className="flex items-center gap-2 px-3 py-1 rounded-full border border-border hover:bg-muted transition-colors"
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
                  
                  <div className="flex gap-3 justify-center mb-6">
                    {isFlashing ? (
                      <Button 
                        size="lg" 
                        className="px-8" 
                        onClick={timerType === 'focus' ? switchToBreak : switchToFocus}
                        data-name={`Start ${timerType === 'focus' ? 'Break' : 'Focus'} Button`}
                      >
                        Start {timerType === 'focus' ? 'Break' : 'Focus'}
                      </Button>
                    ) : (
                      <Button 
                        size="lg" 
                        className="px-8" 
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

                  {(isPaused || isRunning || isScheduleActive || isSchedulePending) && (
                    <div className="absolute bottom-4 left-4 flex flex-col gap-1">
                      <div className={cn(
                        "shape-octagon w-10 h-10 bg-secondary text-secondary-foreground transition-colors flex items-center justify-center",
                        isRunning && "opacity-50",
                        "hover:opacity-100", 
                        isPaused && "text-red-500" 
                      )}>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onMouseDown={() => handleLongPressStart(() => stopTimer(false, true))}
                          onMouseUp={handleLongPressEnd}
                          onMouseLeave={handleLongPressEnd}
                          onTouchStart={() => handleLongPressStart(() => stopTimer(false, true))}
                          onTouchEnd={handleLongPressEnd}
                          onClick={() => stopTimer(true, false)}
                          className={cn(
                            "w-full h-full rounded-none bg-transparent hover:bg-transparent",
                            isPaused ? "text-red-500" : "text-secondary-foreground"
                          )}
                          data-name="Stop Timer Button"
                        >
                          <Square size={16} fill="currentColor" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {!isScheduleActive && !isSchedulePrepared && !isTimeLeftManagedBySession && (
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
                          className="w-16 h-8 text-center pr-0" 
                          min={timerIncrement} 
                          max={69 * 60}
                          step={timerIncrement}
                          onFocus={(e) => e.target.select()}
                          data-name="Focus Duration Input"
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
                          className="w-16 h-8 text-center pr-0" 
                          min={timerIncrement} 
                          max={420}
                          step={timerIncrement}
                          onFocus={(e) => e.target.select()}
                          data-name="Break Duration Input"
                        />
                      </div>
                    </div>
                  )}
                  {(isRunning || isPaused || isScheduleActive || isSchedulePending) && <AskMenu onExtendSubmit={handleExtendSubmit} onPollSubmit={handlePollSubmit} />}
                </>
              )}
            </div>

            <ActiveAskSection 
              activeAsks={activeAsks} 
              onVoteExtend={handleVoteExtend} 
              onVotePoll={handleVoteOnExistingPoll} 
              currentUserId={currentUserId} 
            />
          </div>

          <div className="space-y-6">
            {profile?.intention && (
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
                    {profile.intention}
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
                      key={person.id}
                      className={cn(
                        "flex items-center justify-between p-2 rounded-md select-none",
                        person.role === 'self' ? "bg-[hsl(var(--focus-background))] text-foreground font-medium" :
                        person.role === 'host' ? "bg-muted text-blue-700 font-medium" :
                        "hover:bg-muted cursor-pointer"
                      )} 
                      data-name={`Coworker: ${person.name}`}
                      onClick={(e) => handleNameClick(person.id, person.name, e)}
                    >
                      <span className="font-medium text-foreground flex items-center gap-1">
                        {person.role === 'self' ? localFirstName || "You" : person.name}
                        {person.role === 'host' && <Crown size={16} className="text-yellow-500" />} {/* Crown icon for host */}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        <Popover
                          open={openFocusPreferenceTooltipId === person.id} // Changed from sociability
                          onOpenChange={(isOpen) => {
                            if (isOpen) {
                              setOpenFocusPreferenceTooltipId(person.id); // Changed from sociability
                              if (focusPreferenceTooltipTimeoutRef.current) { // Changed from sociability
                                clearTimeout(focusPreferenceTooltipTimeoutRef.current); // Changed from sociability
                              }
                              focusPreferenceTooltipTimeoutRef.current = setTimeout(() => { // Changed from sociability
                                setOpenFocusPreferenceTooltipId(null); // Changed from sociability
                                focusPreferenceTooltipTimeoutRef.current = null; // Changed from sociability
                              }, 1000);
                            } else {
                              if (openFocusPreferenceTooltipId === person.id) { // Changed from sociability
                                setOpenFocusPreferenceTooltipId(null); // Changed from sociability
                                if (focusPreferenceTooltipTimeoutRef.current) { // Changed from sociability
                                  clearTimeout(focusPreferenceTooltipTimeoutRef.current); // Changed from sociability
                                  focusPreferenceTooltipTimeoutRef.current = null; // Changed from sociability
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
                              {person.focusPreference}% {/* Changed from sociability */}
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
                    <Users className="mr-2 h-4 w-4" /> Activate Discovery
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
          <DialogContent className="sm:max-w-[425px]">
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="discovery-display-name">Name</Label>
                <Input
                  id="discovery-display-name"
                  placeholder={hostCode || "Your Host Code"}
                  value={discoveryDisplayName}
                  onChange={(e) => setDiscoveryDisplayName(e.target.value)}
                  onFocus={(e) => e.target.select()}
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
                <div className="space-y-4">
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
                    geolocationPermissionStatus === 'granted' && "bg-green-100 text-green-700 border-green-200",
                    geolocationPermissionStatus === 'denied' && "bg-red-100 text-red-700 border-red-200"
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

const mockProfiles: Profile[] = [
  // NEW: Mock profiles for participants in mockNearbySessions
  {
    id: "mock-user-id-bezos",
    first_name: "Sam Altman",
    last_name: null,
    avatar_url: null,
    bio: "Leading AI research and development for beneficial general intelligence.",
    intention: "Focusing on safe and broadly distributed AGI.",
    focus_preference: 20,
    updated_at: new Date().toISOString(),
    organization: "OpenAI",
    linkedin_url: "https://www.linkedin.com/in/samaltman",
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "AI strategy, Startup scaling, Venture capital",
    can_help_with_visibility: ['public'],
    need_help_with: "AI safety research, Regulatory frameworks for AGI",
    need_help_with_visibility: ['private'],
    host_code: "goldfish",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-musk",
    first_name: "Musk",
    last_name: null,
    avatar_url: null,
    bio: "Designing reusable rocket components and electric vehicles.",
    intention: "Innovating space travel and sustainable energy.",
    focus_preference: 10,
    updated_at: new Date().toISOString(),
    organization: "SpaceX",
    linkedin_url: "https://www.linkedin.com/in/elonmusk",
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Rocket engineering, EV design, AI ethics",
    can_help_with_visibility: ['public'],
    need_help_with: "Neuralink research, Mars colonization logistics",
    need_help_with_visibility: ['private'],
    host_code: "silverfalcon",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-zuckerberg",
    first_name: "Zuckerberg",
    last_name: null,
    avatar_url: null,
    bio: "Developing new social algorithms and metaverse experiences.",
    intention: "Connecting the world through virtual reality.",
    focus_preference: 20,
    updated_at: new Date().toISOString(),
    organization: "Meta",
    linkedin_url: "https://www.linkedin.com/in/zuck",
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Social network architecture, VR/AR development",
    can_help_with_visibility: ['public'],
    need_help_with: "Privacy regulations, Content moderation strategies",
    need_help_with_visibility: ['private'],
    host_code: "bronzeowl",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-gates",
    first_name: "Daniela Amodei",
    last_name: null,
    avatar_url: null,
    bio: "Co-founder of Anthropic, focusing on AI safety and responsible development.",
    intention: "Building reliable, interpretable, and steerable AI systems.",
    focus_preference: 20,
    updated_at: new Date().toISOString(),
    organization: "Anthropic",
    linkedin_url: "https://www.linkedin.com/in/daniela-amodei-0b1b3b1b",
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "AI ethics, Machine learning research, Startup leadership",
    can_help_with_visibility: ['public'],
    need_help_with: "Large-scale AI model training, Human-AI collaboration",
    need_help_with_visibility: ['private'],
    host_code: "indigoduck",
    pronouns: "She/Her",
  },
  {
    id: "mock-user-id-jobs",
    first_name: "Jensen Huang",
    last_name: null,
    avatar_url: null,
    bio: "CEO of NVIDIA, pioneering accelerated computing and AI.",
    intention: "Driving innovation in graphics processing and artificial intelligence.",
    focus_preference: 30,
    updated_at: new Date().toISOString(),
    organization: "NVIDIA",
    linkedin_url: "https://www.linkedin.com/in/jensenhuang",
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "GPU technology, AI hardware, Semiconductor industry",
    can_help_with_visibility: ['public'],
    need_help_with: "Quantum computing integration, Advanced robotics",
    need_help_with_visibility: ['private'],
    host_code: "violetswan",
    pronouns: "He/Him",
  },
  // NEW: Mock profiles for participants in mockFriendsSessions
  {
    id: "mock-user-id-freud",
    first_name: "Freud",
    last_name: null,
    avatar_url: null,
    bio: "Reviewing psychoanalytic theories and the unconscious mind.",
    intention: "Unraveling the complexities of human behavior.",
    focus_preference: 60,
    updated_at: new Date().toISOString(),
    organization: "Psychology Dept.",
    linkedin_url: "https://www.linkedin.com/in/sigmundfreud",
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Psychoanalysis, Dream interpretation",
    can_help_with_visibility: ['friends'],
    need_help_with: "Modern neuroscience, Cognitive psychology",
    need_help_with_visibility: ['friends'],
    host_code: "tealshark",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-skinner",
    first_name: "Skinner",
    last_name: null,
    avatar_url: null,
    bio: "Memorizing behavioral principles and operant conditioning.",
    intention: "Understanding learned responses and reinforcement.",
    focus_preference: 60,
    updated_at: new Date().toISOString(),
    organization: "Behavioral Science Institute",
    linkedin_url: "https://www.linkedin.com/in/bfskinner",
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Behavioral analysis, Operant conditioning",
    can_help_with_visibility: ['friends'],
    need_help_with: "Humanistic psychology, Free will debates",
    need_help_with_visibility: ['friends'],
    host_code: "cyanwhale",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-piaget",
    first_name: "Piaget",
    last_name: null,
    avatar_url: null,
    bio: "Practicing cognitive development questions and child psychology.",
    intention: "Exploring the stages of intellectual growth.",
    focus_preference: 70,
    updated_at: new Date().toISOString(),
    organization: "Child Development Center",
    linkedin_url: "https://www.linkedin.com/in/jeanpiaget",
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Child development, Cognitive stages",
    can_help_with_visibility: ['friends'],
    need_help_with: "Adolescent psychology, Educational technology",
    need_help_with_visibility: ['friends'],
    host_code: "magentadolphin",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-jung",
    first_name: "Jung",
    last_name: null,
    avatar_url: null,
    bio: "Summarizing archetypal concepts and analytical psychology.",
    intention: "Delving into the collective unconscious.",
    focus_preference: 60,
    updated_at: new Date().toISOString(),
    organization: "Analytical Psychology Group",
    linkedin_url: "https://www.linkedin.com/in/carljung",
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Archetypes, Collective unconscious, Dream analysis",
    can_help_with_visibility: ['friends'],
    need_help_with: "Behavioral economics, Social psychology",
    need_help_with_visibility: ['friends'],
    host_code: "limeoctopus",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-maslow",
    first_name: "Maslow",
    last_name: null,
    avatar_url: null,
    bio: "Creating hierarchy of needs flashcards and humanistic psychology.",
    intention: "Promoting self-actualization and personal growth.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Human Potential Institute",
    linkedin_url: "https://www.linkedin.com/in/abrahammaslow",
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Hierarchy of needs, Self-actualization",
    can_help_with_visibility: ['friends'],
    need_help_with: "Positive psychology interventions, Organizational behavior",
    need_help_with_visibility: ['friends'],
    host_code: "marooncrab",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-rogers",
    first_name: "Rogers",
    last_name: null,
    avatar_url: null,
    bio: "Discussing humanistic approaches and client-centered therapy.",
    intention: "Fostering empathy and unconditional positive regard.",
    focus_preference: 55,
    updated_at: new Date().toISOString(),
    organization: "Person-Centered Therapy Clinic",
    linkedin_url: "https://www.linkedin.com/in/carlrogers",
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Client-centered therapy, Empathy training",
    can_help_with_visibility: ['friends'],
    need_help_with: "Group therapy dynamics, Cross-cultural counseling",
    need_help_with_visibility: ['friends'],
    host_code: "navysquid",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-bandura",
    first_name: "Bandura",
    last_name: null,
    avatar_url: null,
    bio: "Collaborating on social learning theory guide and observational learning.",
    intention: "Exploring the power of modeling and self-efficacy.",
    focus_preference: 65,
    updated_at: new Date().toISOString(),
    organization: "Social Cognitive Research",
    linkedin_url: "https://www.linkedin.com/in/albertbandura",
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Social learning theory, Self-efficacy",
    can_help_with_visibility: ['friends'],
    need_help_with: "Cognitive neuroscience, Developmental psychology",
    need_help_with_visibility: ['friends'],
    host_code: "olivejellyfish",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-pavlov",
    first_name: "Pavlov",
    last_name: null,
    avatar_url: null,
    bio: "Peer teaching classical conditioning and behavioral responses.",
    intention: "Investigating conditioned reflexes.",
    focus_preference: 70,
    updated_at: new Date().toISOString(),
    organization: "Physiology Lab",
    linkedin_url: "https://www.linkedin.com/in/ivanpavlov",
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Classical conditioning, Reflexology",
    can_help_with_visibility: ['friends'],
    need_help_with: "Neurophysiology, Animal behavior studies",
    need_help_with_visibility: ['friends'],
    host_code: "aquastarfish",
    pronouns: "He/Him",
  },
  // NEW: Mock profiles for organization members (famous philosophers/scientists)
  {
    id: "mock-user-id-aristotle",
    first_name: "Aristotle",
    last_name: null,
    avatar_url: null,
    bio: "Studying logic, metaphysics, ethics, and politics.",
    intention: "Deep work on Aristotle's theories.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Ancient Philosophy Guild",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Logic, Ethics, Political theory",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Modern science, Empirical research methods",
    need_help_with_visibility: ['organisation'],
    host_code: "redphilosopher",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-plato",
    first_name: "Plato",
    last_name: null,
    avatar_url: null,
    bio: "Exploring the theory of Forms and ideal states.",
    intention: "Deep work on Plato's theories.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Ancient Philosophy Guild",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Metaphysics, Epistemology, Political philosophy",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Practical applications, Democratic theory",
    need_help_with_visibility: ['organisation'],
    host_code: "bluephilosopher",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-socrates",
    first_name: "Socrates",
    last_name: null,
    avatar_url: null,
    bio: "Engaging in dialectic and ethical inquiry.",
    intention: "Deep work on Socrates' theories.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Ancient Philosophy Guild",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Socratic method, Ethical reasoning",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Formal logic, Scientific method",
    need_help_with_visibility: ['organisation'],
    host_code: "greensocrates",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-descartes",
    first_name: "Descartes",
    last_name: null,
    avatar_url: null,
    bio: "Meditating on first philosophy and rationalism.",
    intention: "Deep work on Descartes' theories.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Rationalist Thinkers",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Rationalism, Metaphysics, Analytic geometry",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Empiricism, Modern physics",
    need_help_with_visibility: ['organisation'],
    host_code: "yellowdescartes",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-kant",
    first_name: "Kant",
    last_name: null,
    avatar_url: null,
    bio: "Developing critical philosophy and transcendental idealism.",
    intention: "Deep work on Kant's theories.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Critical Philosophy Society",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Categorical imperative, Epistemology",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Post-Kantian philosophy, Existentialism",
    need_help_with_visibility: ['organisation'],
    host_code: "purplekant",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-locke",
    first_name: "Locke",
    last_name: null,
    avatar_url: null,
    bio: "Advocating for empiricism and natural rights.",
    intention: "Deep work on Locke's theories.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Empiricist Collective",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Empiricism, Political philosophy, Natural rights",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Rationalism, Modern constitutional law",
    need_help_with_visibility: ['organisation'],
    host_code: "orangelocke",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-hume",
    first_name: "Hume",
    last_name: null,
    avatar_url: null,
    bio: "Questioning causality and human understanding.",
    intention: "Deep work on Hume's theories.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Skeptical Inquiry Group",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Skepticism, Empiricism, Philosophy of mind",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Moral philosophy, Metaphysics",
    need_help_with_visibility: ['organisation'],
    host_code: "pinkhume",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-rousseau",
    first_name: "Rousseau",
    last_name: null,
    avatar_url: null,
    bio: "Contemplating the social contract and human nature.",
    intention: "Deep work on Rousseau's theories.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Social Contract Thinkers",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Social contract theory, Education philosophy",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Modern political science, Environmental ethics",
    need_help_with_visibility: ['organisation'],
    host_code: "brownrousseau",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-newton",
    first_name: "Newton",
    last_name: null,
    avatar_url: null,
    bio: "Formulating laws of motion and universal gravitation.",
    intention: "Deep work on Newton's theories.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Physics Pioneers",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Classical mechanics, Optics, Calculus",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Quantum physics, Relativity",
    need_help_with_visibility: ['organisation'],
    host_code: "greynewton",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-einstein",
    first_name: "Einstein",
    last_name: null,
    avatar_url: null,
    bio: "Developing theories of relativity and quantum mechanics.",
    intention: "Deep work on Einstein's theories.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Physics Pioneers",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Relativity, Quantum theory, Theoretical physics",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Unified field theory, Cosmology",
    need_help_with_visibility: ['organisation'],
    host_code: "blackeinstein",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-curie",
    first_name: "Curie",
    last_name: null,
    avatar_url: null,
    bio: "Pioneering research on radioactivity and discovering new elements.",
    intention: "Deep work on Curie's discoveries.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Chemistry Innovators",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Radioactivity, Analytical chemistry",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Nuclear physics, Medical applications of isotopes",
    need_help_with_visibility: ['organisation'],
    host_code: "whitecurie",
    pronouns: "She/Her",
  },
  {
    id: "mock-user-id-darwin",
    first_name: "Darwin",
    last_name: null,
    avatar_url: null,
    bio: "Proposing the theory of evolution by natural selection.",
    intention: "Deep work on Darwin's theories.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Biology Explorers",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Evolutionary biology, Natural selection",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Genetics, Molecular biology",
    need_help_with_visibility: ['organisation'],
    host_code: "golddarwin",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-galileo",
    first_name: "Galileo",
    last_name: null,
    avatar_url: null,
    bio: "Making astronomical observations and advocating for heliocentrism.",
    intention: "Deep work on Galileo's observations.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Astronomy Guild",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Astronomy, Physics, Scientific method",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Quantum physics, Astrophysics",
    need_help_with_visibility: ['organisation'],
    host_code: "silvergalileo",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-hawking",
    first_name: "Hawking",
    last_name: null,
    avatar_url: null,
    bio: "Advancing theories of black holes and cosmology.",
    intention: "Deep work on Hawking's theories.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Cosmology Research",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Black holes, Cosmology, Quantum gravity",
    can_help_with_visibility: ['organisation'],
    need_help_with: "String theory, Observational astronomy",
    need_help_with_visibility: ['organisation'],
    host_code: "bronzehawking",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-turing",
    first_name: "Turing",
    last_name: null,
    avatar_url: null,
    bio: "Pioneering theoretical computer science and artificial intelligence.",
    intention: "Deep work on Turing's concepts.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "AI Innovators",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Theoretical computer science, AI, Cryptography",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Machine learning, Quantum computing",
    need_help_with_visibility: ['organisation'],
    host_code: "indigoturing",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-hypatia",
    first_name: "Hypatia",
    last_name: null,
    avatar_url: null,
    bio: "Teaching philosophy, mathematics, and astronomy in ancient Alexandria.",
    intention: "Deep work on Hypatia's teachings.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Alexandrian Scholars",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Ancient philosophy, Mathematics, Astronomy",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Modern scientific notation, Telescope technology",
    need_help_with_visibility: ['organisation'],
    host_code: "violethypatia",
    pronouns: "She/Her",
  },
  {
    id: "mock-user-id-copernicus",
    first_name: "Copernicus",
    last_name: null,
    avatar_url: null,
    bio: "Proposing the heliocentric model of the universe.",
    intention: "Deep work on Copernicus' model.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Astronomy Guild",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Heliocentric model, Observational astronomy",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Orbital mechanics, Gravitational theory",
    need_help_with_visibility: ['organisation'],
    host_code: "tealcopernicus",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-kepler",
    first_name: "Kepler",
    last_name: null,
    avatar_url: null,
    bio: "Formulating laws of planetary motion.",
    intention: "Deep work on Kepler's laws.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Astronomy Guild",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Planetary motion, Celestial mechanics",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Spacecraft trajectory, Exoplanet detection",
    need_help_with_visibility: ['organisation'],
    host_code: "cyankepler",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-bohr",
    first_name: "Bohr",
    last_name: null,
    avatar_url: null,
    bio: "Developing the atomic model and quantum theory.",
    intention: "Deep work on Bohr's model.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Quantum Physics Group",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Atomic structure, Quantum mechanics",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Particle physics, Quantum field theory",
    need_help_with_visibility: ['organisation'],
    host_code: "magentabohr",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-heisenberg",
    first_name: "Heisenberg",
    last_name: null,
    avatar_url: null,
    bio: "Formulating the uncertainty principle in quantum mechanics.",
    intention: "Deep work on Heisenberg's principle.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Quantum Physics Group",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Uncertainty principle, Matrix mechanics",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Quantum entanglement, Quantum computing",
    need_help_with_visibility: ['organisation'],
    host_code: "limeheisenberg",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-schrodinger",
    first_name: "Schrödinger",
    last_name: null,
    avatar_url: null,
    bio: "Developing wave mechanics and the Schrödinger equation.",
    intention: "Deep work on Schrödinger's equation.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Quantum Physics Group",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Wave mechanics, Quantum states",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Quantum measurement problem, Decoherence",
    need_help_with_visibility: ['organisation'],
    host_code: "maroonschrodinger",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-maxwell",
    first_name: "Maxwell",
    last_name: null,
    avatar_url: null,
    bio: "Formulating classical theory of electromagnetic radiation.",
    intention: "Deep work on Maxwell's equations.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Electromagnetism Research",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Electromagnetism, Classical field theory",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Quantum electrodynamics, Plasma physics",
    need_help_with_visibility: ['organisation'],
    host_code: "navymaxwell",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-faraday",
    first_name: "Faraday",
    last_name: null,
    avatar_url: null,
    bio: "Discovering electromagnetic induction and diamagnetism.",
    intention: "Deep work on Faraday's experiments.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Electromagnetism Research",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Electromagnetic induction, Electrochemistry",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Superconductivity, Magnetohydrodynamics",
    need_help_with_visibility: ['organisation'],
    host_code: "olivefaraday",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-pascal",
    first_name: "Pascal",
    last_name: null,
    avatar_url: null,
    bio: "Contributing to probability theory and fluid mechanics.",
    intention: "Deep work on Pascal's principles.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Mathematics & Physics Society",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Probability, Fluid mechanics, Number theory",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Stochastic processes, Quantum field theory",
    need_help_with_visibility: ['organisation'],
    host_code: "aquapascal",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-leibniz",
    first_name: "Leibniz",
    last_name: null,
    avatar_url: null,
    bio: "Developing calculus and philosophical optimism.",
    intention: "Deep work on Leibniz's philosophy.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Mathematics & Philosophy Society",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Calculus, Metaphysics, Logic",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Modern logic, Philosophy of language",
    need_help_with_visibility: ['organisation'],
    host_code: "fuchsialeibniz",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-pythagoras",
    first_name: "Pythagoras",
    last_name: null,
    avatar_url: null,
    bio: "Exploring mathematics, music, and philosophy.",
    intention: "Deep work on Pythagorean theorem.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Ancient Mathematics Guild",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Geometry, Number theory, Music theory",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Modern algebra, Abstract mathematics",
    need_help_with_visibility: ['organisation'],
    host_code: "azurepythagoras",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-euclid",
    first_name: "Euclid",
    last_name: null,
    avatar_url: null,
    bio: "Systematizing geometry in 'Elements'.",
    intention: "Deep work on Euclidean geometry.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Ancient Mathematics Guild",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Euclidean geometry, Axiomatic systems",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Non-Euclidean geometry, Topology",
    need_help_with_visibility: ['organisation'],
    host_code: "beigeuclid",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-archimedes",
    first_name: "Archimedes",
    last_name: null,
    avatar_url: null,
    bio: "Innovating in mathematics, physics, and engineering.",
    intention: "Deep work on Archimedes' principles.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Ancient Engineering Guild",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Mechanics, Hydrostatics, Geometry",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Modern engineering, Materials science",
    need_help_with_visibility: ['organisation'],
    host_code: "coralarchimedes",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-davinci",
    first_name: "Da Vinci",
    last_name: null,
    avatar_url: null,
    bio: "Mastering art, science, and invention.",
    intention: "Deep work on Da Vinci's inventions.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Renaissance Innovators",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Art, Anatomy, Engineering design",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Modern art techniques, Digital fabrication",
    need_help_with_visibility: ['organisation'],
    host_code: "crimsondavinci",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-franklin",
    first_name: "Franklin",
    last_name: null,
    avatar_url: null,
    bio: "Experimenting with electricity and civic engagement.",
    intention: "Deep work on Franklin's experiments.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Enlightenment Thinkers",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Electricity, Political science, Journalism",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Modern energy systems, Digital media",
    need_help_with_visibility: ['organisation'],
    host_code: "lavenderfranklin",
    pronouns: "He/Him",
  },
];