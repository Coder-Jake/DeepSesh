"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CircularProgress } from "@/components/CircularProgress";
import { Globe, Lock, CalendarPlus, Share2, Square, ChevronDown, ChevronUp, Users, MapPin, Crown, Infinity as InfinityIcon, Building2 } from "lucide-react";
import { useTimer } from "@/contexts/TimerContext";
import { useProfile } from "@/contexts/ProfileContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import SessionCard from "@/components/SessionCard";
import { cn, getSociabilityGradientColor } from "@/lib/utils";
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
import { ScheduledTimerTemplate, ScheduledTimer, ParticipantSessionData, DemoSession } from '@/types/timer';
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
import { Slider } from "@/components/ui/slider";
import { Profile as ProfileType, ProfileUpdate } from '@/contexts/Profile/ProfileContext';
import { calculateDistance } from '@/utils/location-utils';
import { MOCK_PROFILES } from '@/lib/mock-data';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MarkdownEditor from "@/components/MarkdownEditor";
import { getEdgeFunctionErrorMessage } from '@/utils/error-utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // NEW: Import Select components

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
  schedule_id: string | null;
  schedule_data: ScheduledTimer[];
  current_schedule_index: number;
  visibility: 'public' | 'friends' | 'organisation' | 'private';
  participants_data: ParticipantSessionData[];
  join_code: string | null;
  organisation: string[] | null; // MODIFIED: Changed to string[] | null
  host_notes: string | null;
  is_mock: boolean;
}

// Function to fetch live sessions from Supabase
const fetchSupabaseSessions = async (
  userId: string | undefined,
  userLatitude: number | null,
  userLongitude: number | null,
  limitDiscoveryRadius: boolean,
  maxDistance: number,
  showDemoSessions: boolean // NEW: Pass showDemoSessions
): Promise<DemoSession[]> => {
  if (!userId) {
    console.log("fetchSupabaseSessions: User ID is not available, skipping fetch.");
    return [];
  }

  const { data, error } = await supabase
    .from('active_sessions')
    .select('*, profiles(organisation)'); // Removed .eq('is_active', true)

  if (error) {
    console.error("Error fetching active sessions from Supabase:", error);
    throw new Error(error.message);
  }

  console.log("fetchSupabaseSessions: Raw data from Supabase:", data); // Log raw data

  return data.map((session: SupabaseSessionData & { profiles: { organisation: string[] | null } | null }) => { // NEW: Type for profiles
    const rawParticipantsData = (session.participants_data || []) as ParticipantSessionData[];
    const participants: ParticipantSessionData[] = rawParticipantsData.map(p => ({
      userId: p.userId,
      userName: p.userName,
      joinTime: p.joinTime,
      role: p.role,
      focusPreference: p.focusPreference || 50,
      intention: p.intention || null,
      bio: p.bio || null,
    }));

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
      workspaceImage: "/api/placeholder/200/120",
      workspaceDescription: "Live session from Supabase",
      participants: participants,
      fullSchedule: fullSchedule,
      location_lat: session.location_lat,
      location_long: session.location_long,
      distance: distance,
      visibility: session.visibility,
      user_id: session.user_id,
      join_code: session.join_code,
      host_notes: session.host_notes,
      organisation: session.organisation,
      is_mock: session.is_mock, // NEW: Include is_mock
    };
  }).filter(session => {
    console.log(`fetchSupabaseSessions: Filtering session '${session.title}' (is_mock: ${session.is_mock}, showDemoSessions: ${showDemoSessions})`);
    // Filter by showDemoSessions: if false, hide mock sessions
    if (!showDemoSessions && session.is_mock) {
      return false;
    }
    // Apply distance filtering
    if (limitDiscoveryRadius && session.distance !== null) {
      return session.distance <= maxDistance;
    }
    return true;
  });
};

// Helper function to sort sessions
const sortSessions = (sessions: DemoSession[], currentUserId: string | undefined) => {
  return [...sessions].sort((a, b) => {
    const isUserInA = currentUserId ? a.participants.some(p => p.userId === currentUserId) : false;
    const isUserInB = currentUserId ? b.participants.some(p => p.userId === currentUserId) : false;

    // Primary sort: user in session comes first
    if (isUserInA && !isUserInB) return -1;
    if (!isUserInA && isUserInB) return 1;

    // Secondary sort: by distance (ascending)
    if (a.distance !== null && b.distance !== null) {
      return a.distance - b.distance;
    }
    if (a.distance !== null) return -1;
    if (b.distance !== null) return 1;

    return 0;
  });
};

// Local Storage Keys for section open states
const LOCAL_STORAGE_NEARBY_OPEN_KEY = 'deepsesh_nearby_sessions_open';
const LOCAL_STORAGE_FRIENDS_OPEN_KEY = 'deepsesh_friends_sessions_open';
const LOCAL_STORAGE_ORG_OPEN_KEY = 'deepsesh_organisation_sessions_open';


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
    timeLeft,
    setTimeLeft,
    timerType,
    setTimerType,
    isFlashing,
    setIsFlashing,
    notes,
    setNotes,
    hostNotes,
    setHostNotes,
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
    sessionVisibility,
    setSessionVisibility,
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

    // startStopNotifications, // Removed
    // playSound, // Removed
    // triggerVibration, // Removed
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
    remainingTimeAtPause,
    limitDiscoveryRadius,
    maxDistance,
    selectedHostingOrganisation, // NEW: Get selectedHostingOrganisation
    setSelectedHostingOrganisation, // NEW: Get setSelectedHostingOrganisation
  } = useTimer();

  const { profile, loading: profileLoading, localFirstName, getPublicProfile, joinCode, setLocalFirstName, focusPreference, setFocusPreference, updateProfile, profileVisibility, friendStatuses } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleProfilePopUp } = useProfilePopUp();
  const { isDarkMode } = useTheme();
  const { user, session } = useAuth();

  const longPressRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressDetected = useRef(false);
  const [activeJoinedSession, setActiveJoinedSession] = useState<DemoSession | null>(null);
  const [isHoveringTimer, setIsHoveringTimer] = useState(false);

  const currentUserId = profile?.id || "mock-user-id-123";
  const currentUserName = profile?.first_name || localFirstName || "You";

  const [isEditingSeshTitle, setIsEditingSeshTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [joinSessionCode, setJoinSessionCode] = useState("");

  const [openUpcomingScheduleAccordions, setOpenUpcomingScheduleAccordions] = useState<string[]>([]);

  const allSectionIds: ('nearby' | 'friends' | 'organisation')[] = ['nearby', 'friends', 'organisation'];
  const [sectionOrder, setSectionOrder] = useState<('nearby' | 'friends' | 'organisation')[]>(allSectionIds);

  const [openFocusPreferenceTooltipId, setOpenFocusPreferenceTooltipId] = useState<string | null>(null);
  const focusPreferenceTooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const linkCopiedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isDiscoverySetupOpen, setIsDiscoverySetupOpen] = useState(false);
  const [discoveryDisplayName, setDiscoveryDisplayName] = useState("");

  const [userLocation, setUserLocation] = useState<{ latitude: number | null; longitude: number | null }>({ latitude: null, longitude: null });

  const discoverySliderContainerRef = useRef<HTMLDivElement>(null);
  const [isDraggingDiscoverySlider, setIsDraggingDiscoverySlider] = useState(false);

  // MODIFIED: Initialize section open states from localStorage or default to false
  const [isNearbySessionsOpen, setIsNearbySessionsOpen] = useState(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_NEARBY_OPEN_KEY);
    return stored ? JSON.parse(stored) : false;
  });
  const [isFriendsSessionsOpen, setIsFriendsSessionsOpen] = useState(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_FRIENDS_OPEN_KEY);
    return stored ? JSON.parse(stored) : false;
  });
  const [isOrganisationSessionsOpen, setIsOrganisationSessionsOpen] = useState(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_ORG_OPEN_KEY);
    return stored ? JSON.parse(stored) : false;
  });

  // NEW: State to track if initial auto-minimization has run
  const [initialMinimizationRun, setInitialMinimizationRun] = useState(false);

  // NEW: Get user's organisations from profile
  const userOrganisations = useMemo(() => profile?.organisation || [], [profile?.organisation]);

  // NEW: Set default selected hosting organisation if user has organisations
  useEffect(() => {
    if (userOrganisations.length > 0 && !selectedHostingOrganisation) {
      setSelectedHostingOrganisation(userOrganisations[0]);
    } else if (!profile?.organisation || profile.organisation.length === 0) {
      setSelectedHostingOrganisation(null);
    }
  }, [userOrganisations, selectedHostingOrganisation, setSelectedHostingOrganisation, profile?.organisation]);

  useEffect(() => {
    if (isDiscoverySetupOpen) {
      setDiscoveryDisplayName(localFirstName === "You" ? (joinCode || "") : (localFirstName || joinCode || ""));
    }
  }, [isDiscoverySetupOpen, localFirstName, joinCode]);

  const handleSessionVisibilityToggle = useCallback(() => {
    const modes: ('public' | 'private' | 'organisation')[] = ['public', 'private'];
    if (userOrganisations.length > 0) { // MODIFIED: Check userOrganisations
      modes.push('organisation');
    }
    const currentIndex = modes.indexOf(sessionVisibility);
    const nextIndex = (currentIndex + 1) % modes.length;
    const newVisibility = modes[nextIndex];
    setSessionVisibility(newVisibility);
    if (areToastsEnabled) {
      toast.info("Session Visibility", {
        description: `Your sessions are now ${newVisibility}.`,
      });
    }
  }, [setSessionVisibility, sessionVisibility, areToastsEnabled, userOrganisations]); // MODIFIED: userOrganisations

  const mockProfiles = MOCK_PROFILES;
  const isLoadingMockProfiles = false;
  const mockProfilesError = null;

  // Define these memoized values *before* they are used in other memoized values' dependency arrays.
  const shouldShowNearbySessions = useMemo(() => {
    const result = isDiscoveryActivated && sessionVisibility !== 'private' && (showSessionsWhileActive === 'nearby' || showSessionsWhileActive === 'all');
    console.log("shouldShowNearbySessions (memo):", result, "isDiscoveryActivated:", isDiscoveryActivated, "sessionVisibility:", sessionVisibility, "showSessionsWhileActive:", showSessionsWhileActive);
    return result;
  }, [isDiscoveryActivated, sessionVisibility, showSessionsWhileActive]);

  const shouldShowFriendsSessions = useMemo(() => {
    const result = isDiscoveryActivated && (showSessionsWhileActive === 'friends' || showSessionsWhileActive === 'all');
    console.log("shouldShowFriendsSessions (memo):", result, "isDiscoveryActivated:", isDiscoveryActivated, "showSessionsWhileActive:", showSessionsWhileActive);
    return result;
  }, [isDiscoveryActivated, showSessionsWhileActive]);

  const shouldShowOrganisationSessions = useMemo(() => {
    const result = isDiscoveryActivated && userOrganisations.length > 0 && (sessionVisibility === 'organisation' || showSessionsWhileActive === 'all'); // MODIFIED: Check userOrganisations
    console.log("shouldShowOrganisationSessions (memo):", result, "isDiscoveryActivated:", isDiscoveryActivated, "userOrganisations:", userOrganisations, "sessionVisibility:", sessionVisibility); // MODIFIED: userOrganisations
    return result;
  }, [userOrganisations, isDiscoveryActivated, sessionVisibility, showSessionsWhileActive]);


  const { data: supabaseActiveSessions, isLoading: isLoadingSupabaseSessions, error: supabaseError } = useQuery<DemoSession[]>({
    queryKey: ['supabaseActiveSessions', user?.id, userLocation.latitude, userLocation.longitude, limitDiscoveryRadius, maxDistance, showDemoSessions], // NEW: Add showDemoSessions to queryKey
    queryFn: async () => {
      try {
        return await fetchSupabaseSessions(user?.id, userLocation.latitude, userLocation.longitude, limitDiscoveryRadius, maxDistance, showDemoSessions); // NEW: Pass showDemoSessions
      } catch (err: any) {
        console.error("Error fetching active sessions from Supabase:", err.message);
        if (areToastsEnabled) {
          toast.error("Failed to Load Sessions", {
            description: `Could not load live sessions: ${err.message}`,
          });
        }
        throw err;
      }
    },
    refetchInterval: 5000,
    enabled: isDiscoveryActivated && !!user?.id, // MODIFIED: Simplified enabled condition
  });

  const allSessions = useMemo(() => {
    return supabaseActiveSessions || [];
  }, [supabaseActiveSessions]);

  const nearbySessions = useMemo(() => {
    if (!shouldShowNearbySessions || !userLocation.latitude || !userLocation.longitude) return [];
    return allSessions.filter(session => {
      const isPublic = session.visibility === 'public';
      const isNearbyByDistance = (session.location_lat && session.location_long && session.distance !== null && session.distance <= maxDistance);
      return isPublic && (limitDiscoveryRadius ? isNearbyByDistance : true);
    });
  }, [allSessions, shouldShowNearbySessions, userLocation.latitude, userLocation.longitude, maxDistance, limitDiscoveryRadius]);

  const friendsSessions = useMemo(() => {
    if (!shouldShowFriendsSessions || !profile?.id) return [];
    return allSessions.filter(session => {
      const isFriendSession = session.participants.some(p => friendStatuses[p.userId] === 'friends');
      return isFriendSession;
    });
  }, [allSessions, shouldShowFriendsSessions, profile?.id, friendStatuses]);

  const organisationSessions = useMemo(() => {
    if (!shouldShowOrganisationSessions || userOrganisations.length === 0) return [];
    return allSessions.filter(session => {
      return session.organisation && userOrganisations.some(userOrg => session.organisation?.includes(userOrg));
    });
  }, [allSessions, shouldShowOrganisationSessions, userOrganisations]);


  useEffect(() => {
    const getUserLocation = async () => {
      const { latitude, longitude } = await getLocation();
      setUserLocation({ latitude, longitude });
      console.log("User location set:", { latitude, longitude });
    };

    if (isDiscoveryActivated && geolocationPermissionStatus === 'granted') {
      getUserLocation();
    }
  }, [isDiscoveryActivated, geolocationPermissionStatus, getLocation]);

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
        intention: p.intention || null, // MODIFIED: Allow null
        bio: p.bio || null, // MODIFIED: Allow null
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
    const isDefault = seshTitle === getDefaultSeshTitle() && !isSeshTitleCustomized;
  }, [seshTitle, isSeshTitleCustomized, getDefaultSeshTitle]);

  useEffect(() => {
    if (location.pathname !== '/' && isSchedulingMode) {
      setIsSchedulingMode(false);
    }
  }, [location.pathname, isSchedulingMode, setIsSchedulingMode]);

  const handlePressStart = (callback: () => void) => {
    isLongPressDetected.current = false;
    longPressRef.current = setTimeout(() => {
      isLongPressDetected.current = true;
      callback();
    }, 500);
  };

  const handlePressEnd = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
    }
    isLongPressDetected.current = false;
  };

  const handleIntentionLongPress = () => {
    if (isLongPressDetected.current) {
      navigate('/profile');
    }
  };

  const handleTitleClick = () => {
    if (!isLongPressDetected.current) {
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
    if (isLongPressDetected.current) {
      setIsEditingSeshTitle(true);
    }
  };

  const startNewManualTimer = useCallback(async () => {
    if (!user?.id) {
      if (areToastsEnabled) {
        toast.error("Authentication Required", {
          description: "You must be logged in to start a session.",
        });
      }
      return;
    }

    if (isRunning || isScheduleActive || isSchedulePrepared) { // Removed isPaused
      if (!confirm("A timer or schedule is already active. Do you want to override it and start a new manual timer?")) {
        return;
      }
      if (isScheduleActive || isSchedulePrepared) await resetSchedule();
      setIsRunning(false);
      setIsFlashing(false);
      setAccumulatedFocusSeconds(0);
      setAccumulatedBreakSeconds(0);
      setSeshTitle(getDefaultSeshTitle());
      setNotes("");
      setHostNotes("");
    }

    const currentFocusDuration = focusMinutes;
    const currentBreakDuration = breakMinutes;

    // playSound(); // Removed
    // triggerVibration(); // Removed
    setIsRunning(true);
    setIsFlashing(false);
    setSessionStartTime(Date.now());
    setCurrentPhaseStartTime(Date.now());
    setAccumulatedFocusSeconds(0);
    setAccumulatedBreakSeconds(0);
    const initialDurationSeconds = timerType === 'focus' ? currentFocusDuration * 60 : currentBreakDuration * 60;
    setCurrentPhaseDurationSeconds(initialDurationSeconds);
    setTimeLeft(initialDurationSeconds);
    setIsTimeLeftManagedBySession(true);

    const hostParticipant: ParticipantSessionData = {
      userId: user.id,
      userName: localFirstName,
      joinTime: Date.now(),
      role: 'host',
      focusPreference: focusPreference || 50,
      intention: profile?.profile_data?.intention?.value || null,
      bio: profile?.profile_data?.bio?.value || null,
    };

    setCurrentSessionRole('host');
    setCurrentSessionHostName(localFirstName);
    setCurrentSessionOtherParticipants([]);
    setActiveJoinedSessionCoworkerCount(0);
    setCurrentSessionParticipantsData([hostParticipant]);

    if (sessionVisibility !== 'private') {
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
            visibility: sessionVisibility,
            focus_duration: currentFocusDuration,
            break_duration: currentBreakDuration,
            current_phase_type: timerType,
            current_phase_end_time: currentPhaseEndTime,
            total_session_duration_seconds: currentPhaseDuration * 60,
            schedule_id: null,
            location_lat: latitude,
            location_long: longitude,
            participants_data: [hostParticipant],
            join_code: joinCode,
            organisation: selectedHostingOrganisation ? [selectedHostingOrganisation] : null, // MODIFIED: Use selectedHostingOrganisation as an array
            host_notes: hostNotes,
            is_mock: false, // NEW: Set is_mock to false for user-created sessions
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
    isRunning, isScheduleActive, isSchedulePrepared, resetSchedule, focusMinutes, breakMinutes, setSessionStartTime, setCurrentPhaseStartTime, setAccumulatedFocusSeconds, setAccumulatedBreakSeconds, setSeshTitle, setIsTimeLeftManagedBySession, user?.id, localFirstName, focusPreference, profile?.profile_data?.intention?.value, profile?.profile_data?.bio?.value, getLocation, joinCode, setCurrentSessionRole, setCurrentSessionHostName, setCurrentSessionOtherParticipants, setActiveJoinedSessionCoworkerCount, setCurrentSessionParticipantsData, setCurrentPhaseDurationSeconds, setTimeLeft, areToastsEnabled, timerType, seshTitle, getDefaultSeshTitle, sessionVisibility, selectedHostingOrganisation, hostNotes
  ]);

  const resumeTimer = () => {
    // This function is now effectively a 'start' for a pending schedule or a 'continue' for a manual transition
    // playSound(); // Removed
    // triggerVibration(); // Removed
    setIsRunning(true);
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
      setCurrentPhaseDurationSeconds(timeLeft);
    } else {
      // This branch is for when manualTransition is true and timer was stopped (not paused)
      // It effectively restarts the timer from the remainingTimeAtPause
      setCurrentPhaseStartTime(Date.now() - (currentPhaseDurationSeconds - remainingTimeAtPause) * 1000);
    }
    setIsTimeLeftManagedBySession(true);
  };

  const pauseTimer = () => {
    // This function is now a no-op as per user request to remove pause functionality.
    // All 'pause' actions should now lead to a 'stop'.
    console.log("pauseTimer called, but pause functionality is removed. Calling stopTimer instead.");
    stopTimer(true, false);
  };

  const resetTimer = async () => {
    stopTimer(true, false);
  };

  const switchToBreak = () => {
    if (currentPhaseStartTime !== null) {
      const elapsed = (Date.now() - currentPhaseStartTime) / 1000;
      setAccumulatedFocusSeconds((prev: number) => prev + elapsed);
    }
    setTimerType('break');
    const newBreakDurationSeconds = breakMinutes * 60;
    setCurrentPhaseDurationSeconds(newBreakDurationSeconds);
    setTimeLeft(newBreakDurationSeconds);
    setCurrentPhaseStartTime(Date.now());

    setIsFlashing(false);
    setIsRunning(true);
    // playSound(); // Removed
    // triggerVibration(); // Removed
    setIsTimeLeftManagedBySession(true);
  };

  const switchToFocus = () => {
    if (currentPhaseStartTime !== null) {
      const elapsed = (Date.now() - currentPhaseStartTime) / 1000;
      setAccumulatedBreakSeconds((prev: number) => prev + elapsed);
    }
    setTimerType('focus');
    const newFocusDurationSeconds = focusMinutes * 60;
    setCurrentPhaseDurationSeconds(newFocusDurationSeconds);
    setTimeLeft(newFocusDurationSeconds);
    setCurrentPhaseStartTime(Date.now());

    setIsFlashing(false);
    setIsRunning(true);
    // playSound(); // Removed
    // triggerVibration(); // Removed
    setIsTimeLeftManagedBySession(true);
  };

  const handleModeToggle = (mode: 'focus' | 'break') => {
    if (isRunning || isScheduleActive || isSchedulePrepared) return; // Removed isPaused

    if (mode === 'focus') {
      setTimerType('focus');
      const newFocusDurationSeconds = focusMinutes * 60;
      setCurrentPhaseDurationSeconds(newFocusDurationSeconds);
      setTimeLeft(newFocusDurationSeconds);
    } else {
      setTimerType('break');
      const newBreakDurationSeconds = breakMinutes * 60;
      setCurrentPhaseDurationSeconds(newBreakDurationSeconds);
      setTimeLeft(newBreakDurationSeconds);
    }
    setIsTimeLeftManagedBySession(false);
  };

  const handleJoinSession = async (session: DemoSession) => {
    try {
      const sessionId = session.id;
      const sessionTitle = session.title;
      const hostName = session.participants.find(p => p.role === 'host')?.userName || session.title;

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
        session,
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
          description: `An unexpected error occurred: ${await getEdgeFunctionErrorMessage(error)}.`,
        });
      }
      resetSessionStates();
    }
  };

  const handleJoinCodeSubmit = async () => {
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
            userId: user?.id, // Ensure user.id is passed
            userName: localFirstName,
            focusPreference: focusPreference || 50,
            intention: profile?.profile_data?.intention?.value || null,
            bio: profile?.profile_data?.bio?.value || null,
          },
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) throw response.error;
      if (response.data.error) throw new Error(response.data.error);

      const joinedSession = response.data.session;
      if (joinedSession) {
        const demoSession: DemoSession = {
          id: joinedSession.id,
          title: joinedSession.session_title,
          startTime: new Date(joinedSession.created_at).getTime(),
          location: joinedSession.location_long && joinedSession.location_lat ? `Lat: ${joinedSession.location_lat}, Long: ${joinedSession.location_lat}` : "Unknown Location",
          workspaceImage: "/api/placeholder/200/120",
          workspaceDescription: "Live session from Supabase",
          participants: (joinedSession.participants_data || []) as ParticipantSessionData[],
          fullSchedule: (joinedSession.schedule_data || []) as ScheduledTimer[],
          location_lat: joinedSession.location_lat,
          location_long: joinedSession.location_long,
          visibility: joinedSession.visibility,
          user_id: joinedSession.user_id,
          join_code: joinedSession.join_code,
          host_notes: joinedSession.host_notes,
          organisation: joinedSession.organisation,
          is_mock: joinedSession.is_mock, // NEW: Include is_mock
        };
        await handleJoinSession(demoSession);
        setShowJoinInput(false);
        setJoinSessionCode("");
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
          description: `An error occurred: ${await getEdgeFunctionErrorMessage(err)}.`,
        });
      }
      resetSessionStates();
    }
  };

  const isActiveTimer = isRunning || isFlashing || isScheduleActive || isSchedulePending; // Removed isPaused

  const currentItemDuration = useMemo(() => {
    if (isScheduleActive && activeSchedule[currentScheduleIndex]) {
      return activeSchedule[currentScheduleIndex].durationMinutes;
    }
    return timerType === 'focus' ? focusMinutes : breakMinutes;
  }, [isScheduleActive, activeSchedule, currentScheduleIndex, timerType, focusMinutes, breakMinutes]);

  const handleCountdownEnd = useCallback(() => {
    setIsSchedulePending(false);
    setIsScheduleActive(true);
    setIsRunning(true);
    setCurrentPhaseStartTime(Date.now());
    if (areToastsEnabled) {
      toast("Schedule Commenced!", {
        description: `Your scheduled sesh has now begun.`,
      });
    }

    setCurrentSessionRole('host');
    setCurrentSessionHostName(currentUserName);
    setCurrentSessionOtherParticipants([]);
  }, [setIsSchedulePending, setIsRunning, setCurrentPhaseStartTime, areToastsEnabled, currentUserName, setCurrentSessionRole, setCurrentSessionHostName, setCurrentSessionOtherParticipants]);

  const getEffectiveStartTime = useCallback((template: ScheduledTimerTemplate, now: Date): number => {
    if (template.scheduleStartOption === 'manual') {
      return Number.POSITIVE_INFINITY;
    }

    const [hours, minutes] = template.commenceTime.split(':').map(Number);
    let targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);

    const currentDay = now.getDay();
    const templateDay = template.commenceDay === null ? currentDay : currentDay; // Changed to currentDay if null
    
    let daysToAdd = (templateDay - currentDay + 7) % 7;
    targetDate.setDate(now.getDate() + daysToAdd);

    let totalScheduleDurationSeconds = 0;
    template.schedule.forEach(item => {
      totalScheduleDurationSeconds += item.durationMinutes * 60;
    });

    if (targetDate.getTime() < now.getTime()) {
      if (!template.isRecurring) {
        const elapsedSecondsSinceScheduledStart = Math.floor((now.getTime() - targetDate.getTime()) / 1000);
        if (elapsedSecondsSinceScheduledStart >= totalScheduleDurationSeconds) {
          return Number.POSITIVE_INFINITY;
        } else {
          return now.getTime();
        }
      } else {
        let nextCommenceDate = new Date(targetDate);
        while (nextCommenceDate.getTime() < now.getTime()) {
          if (template.recurrenceFrequency === 'daily') {
            nextCommenceDate.setDate(nextCommenceDate.getDate() + 1);
          } else if (template.recurrenceFrequency === 'weekly') {
            nextCommenceDate.setDate(nextCommenceDate.getDate() + 7);
          } else if (template.recurrenceFrequency === 'monthly') {
            nextCommenceDate.setMonth(nextCommenceDate.getMonth() + 1);
          } else {
            return Number.POSITIVE_INFINITY;
          }
        }
        return nextCommenceDate.getTime();
      }
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
    });
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

    const sourceIndexInExpanded = result.source.index;
    const destinationIndexInExpanded = result.destination.index;

    const draggedSectionId = expandedSections[sourceIndexInExpanded];
    const targetSectionId = expandedSections[destinationIndexInExpanded];

    const sourceIndexInFull = sectionOrder.indexOf(draggedSectionId);
    const destinationIndexInFull = sectionOrder.indexOf(targetSectionId);

    const newSectionOrder = Array.from(sectionOrder);
    const [reorderedItem] = newSectionOrder.splice(sourceIndexInFull, 1);
    newSectionOrder.splice(destinationIndexInFull, 0, reorderedItem);

    setSectionOrder(newSectionOrder);
  };

  const handleShareLink = useCallback(async () => {
    if (!joinCode) {
      if (areToastsEnabled) {
        toast.error("Join Code Missing", {
          description: "Your join code is not available. Please check your profile settings.",
        });
      }
      return;
    }

    const shareUrl = `${window.location.origin}/?joinCode=${joinCode}`;
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
  }, [joinCode, areToastsEnabled]);

  const handleActivateDiscovery = async () => {
    const trimmedDisplayName = discoveryDisplayName.trim();
    const currentFocusPreference = focusPreference;

    const updates: ProfileUpdate = {};
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
      await updateProfile(updates, "Display name and focus preference updated for discovery.");
    }

    console.log("handleActivateDiscovery: Before setIsDiscoveryActivated, isDiscoveryActivated:", isDiscoveryActivated);
    setIsDiscoveryActivated(true);
    console.log("handleActivateDiscovery: After setIsDiscoveryActivated, isDiscoveryActivated (should be true in next render):", true);

    await new Promise(resolve => setTimeout(resolve, 100));

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
    if (event.button !== 0) return;
    setIsDraggingDiscoverySlider(true);
    handleDiscoverySliderDrag(event);
    event.currentTarget.setPointerCapture(event.pointerId);
  }, [handleDiscoverySliderDrag]);

  const handleDiscoveryPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingDiscoverySlider) {
      handleDiscoverySliderDrag(event);
    }
  }, [isDraggingDiscoverySlider, handleDiscoverySliderDrag]);

  const handleDiscoveryPointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    setIsDraggingDiscoverySlider(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  useEffect(() => {
    console.group("Index.tsx Debugging Session Visibility");
    console.log("  showDemoSessions:", showDemoSessions);
    console.log("  isDiscoveryActivated:", isDiscoveryActivated);
    console.log("  geolocationPermissionStatus:", geolocationPermissionStatus);
    console.log("  userLocation:", userLocation);
    console.log("  sessionVisibility:", sessionVisibility);
    console.log("  showSessionsWhileActive:", showSessionsWhileActive);
    console.log("  profile?.id:", profile?.id);
    console.log("  userOrganisations:", userOrganisations); // MODIFIED: userOrganisations
    console.log("  allSessions (from Supabase):", allSessions);
    console.log("  nearbySessions (memo):", nearbySessions);
    console.log("  friendsSessions (memo):", friendsSessions);
    console.log("  organisationSessions (memo):", organisationSessions);
    console.groupEnd();
  }, [
    showDemoSessions, isDiscoveryActivated, geolocationPermissionStatus, userLocation,
    sessionVisibility, showSessionsWhileActive, profile?.id, userOrganisations, // MODIFIED: userOrganisations
    allSessions,
    shouldShowNearbySessions, nearbySessions.length,
    shouldShowFriendsSessions, friendsSessions.length,
    shouldShowOrganisationSessions, organisationSessions.length,
    limitDiscoveryRadius, maxDistance
  ]);

  const formatDistance = (distance: number | null) => {
    if (distance === null || distance === undefined) return null;
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  };

  const handleStopButtonAction = (event: React.MouseEvent | React.TouchEvent) => {
    if (isLongPressDetected.current) {
      isLongPressDetected.current = false;
      return;
    }
    stopTimer(true, false);
  };

  const handleLongPressStop = () => {
    stopTimer(false, true);
    isLongPressDetected.current = true;
  };

  // MODIFIED: getIsOpenState to use local state
  const getIsOpenState = useCallback((sectionId: 'nearby' | 'friends' | 'organisation') => {
    if (sectionId === 'nearby') return isNearbySessionsOpen;
    if (sectionId === 'friends') return isFriendsSessionsOpen;
    if (sectionId === 'organisation') return isOrganisationSessionsOpen;
    return false;
  }, [isNearbySessionsOpen, isFriendsSessionsOpen, isOrganisationSessionsOpen]);

  // MODIFIED: getSetIsOpenState to use local state and persist to localStorage
  const getSetIsOpenState = useCallback((sectionId: 'nearby' | 'friends' | 'organisation') => {
    if (sectionId === 'nearby') return (value: boolean) => { setIsNearbySessionsOpen(value); localStorage.setItem(LOCAL_STORAGE_NEARBY_OPEN_KEY, JSON.stringify(value)); };
    if (sectionId === 'friends') return (value: boolean) => { setIsFriendsSessionsOpen(value); localStorage.setItem(LOCAL_STORAGE_FRIENDS_OPEN_KEY, JSON.stringify(value)); };
    if (sectionId === 'organisation') return (value: boolean) => { setIsOrganisationSessionsOpen(value); localStorage.setItem(LOCAL_STORAGE_ORG_OPEN_KEY, JSON.stringify(value)); };
    return () => {};
  }, [setIsNearbySessionsOpen, setIsFriendsSessionsOpen, setIsOrganisationSessionsOpen]);

  // REMOVED: The useEffect that directly set isNearbySessionsOpen, etc. based on isDiscoveryActivated

  // NEW: Effect to handle initial auto-minimization on first load
  useEffect(() => {
    if (!initialMinimizationRun && !profileLoading) {
      const hasStoredNearby = localStorage.getItem(LOCAL_STORAGE_NEARBY_OPEN_KEY) !== null;
      const hasStoredFriends = localStorage.getItem(LOCAL_STORAGE_FRIENDS_OPEN_KEY) !== null;
      const hasStoredOrg = localStorage.getItem(LOCAL_STORAGE_ORG_OPEN_KEY) !== null;

      // Only apply initial minimization if no user preference is stored
      if (!hasStoredNearby) {
        setIsNearbySessionsOpen(isDiscoveryActivated && nearbySessions.length > 0);
        localStorage.setItem(LOCAL_STORAGE_NEARBY_OPEN_KEY, JSON.stringify(isDiscoveryActivated && nearbySessions.length > 0));
      }
      if (!hasStoredFriends) {
        setIsFriendsSessionsOpen(isDiscoveryActivated && friendsSessions.length > 0);
        localStorage.setItem(LOCAL_STORAGE_FRIENDS_OPEN_KEY, JSON.stringify(isDiscoveryActivated && friendsSessions.length > 0));
      }
      if (!hasStoredOrg) {
        setIsOrganisationSessionsOpen(isDiscoveryActivated && organisationSessions.length > 0);
        localStorage.setItem(LOCAL_STORAGE_ORG_OPEN_KEY, JSON.stringify(isDiscoveryActivated && organisationSessions.length > 0));
      }
      setInitialMinimizationRun(true);
    }
  }, [
    initialMinimizationRun, profileLoading, isDiscoveryActivated,
    nearbySessions.length, friendsSessions.length, organisationSessions.length
  ]);


  const expandedSections = useMemo(() => {
    return sectionOrder.filter(sectionId => getIsOpenState(sectionId));
  }, [sectionOrder, getIsOpenState]);

  const minimizedSections = useMemo(() => {
    return sectionOrder.filter(sectionId => !getIsOpenState(sectionId));
  }, [sectionOrder, getIsOpenState]);

  const renderMinimizedSectionButton = (sectionId: 'nearby' | 'friends' | 'organisation') => {
    const commonClasses = "flex items-center justify-center gap-1 px-3 py-1 rounded-full border border-border text-sm font-medium transition-colors hover:bg-accent-hover";
    const iconSize = 16;
    const setIsOpen = getSetIsOpenState(sectionId);

    const handleClick = () => {
      setIsOpen(true);
    };

    let icon;
    let text;
    let tooltipContent;
    let iconColorClass = "text-muted-foreground";

    switch (sectionId) {
      case 'nearby':
        icon = <MapPin size={iconSize} />;
        text = 'Nearby';
        tooltipContent = "Show Nearby Sessions";
        iconColorClass = cn(
          geolocationPermissionStatus === 'granted' && "text-success-foreground",
          geolocationPermissionStatus === 'denied' && "text-error-foreground"
        );
        break;
      case 'friends':
        icon = <Users size={iconSize} />;
        text = 'Friends';
        tooltipContent = "Show Friends' Sessions";
        iconColorClass = "text-blue-500";
        break;
      case 'organisation':
        icon = <Building2 size={iconSize} />;
        text = 'Organisations';
        tooltipContent = "Show Organisation Sessions";
        iconColorClass = "text-olive-foreground";
        break;
      default:
        return null;
    }

    return (
      <Tooltip key={`minimized-${sectionId}`}>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" className={commonClasses} onClick={handleClick}>
            {React.cloneElement(icon, { className: iconColorClass })}
            <span>{text}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="select-none">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    );
  };

  const renderSection = (sectionId: 'nearby' | 'friends' | 'organisation') => {
    const setIsOpen = getSetIsOpenState(sectionId);
    const isOpen = getIsOpenState(sectionId);

    switch (sectionId) {
      case 'nearby':
        const allNearbySessions = sortSessions(nearbySessions, currentUserId);
        const hasNearbySessions = allNearbySessions.length > 0;

        return (
          <div className="mb-6" data-name="Nearby Sessions Section">
            <button
              onClick={() => {
                if (!isLongPressDetected.current) {
                  setIsOpen(!isOpen);
                }
              }}
              onMouseDown={() => handlePressStart(() => {
                navigate('/settings', { state: { openAccordion: 'location' } });
              })}
              onMouseUp={handlePressEnd}
              onMouseLeave={handlePressEnd}
              onTouchStart={() => handlePressStart(() => {
                navigate('/settings', { state: { openAccordion: 'location' } });
              })}
              onTouchEnd={handlePressEnd}
              className="flex items-center justify-between w-full text-lg font-semibold text-foreground mb-3 transition-opacity"
            >
              <div className="flex items-center gap-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                      <MapPin
                        size={16}
                        className={cn(
                          "cursor-pointer",
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
                {limitDiscoveryRadius ? (
                  <span className="text-sm text-muted-foreground ml-1">
                    ({formatDistance(maxDistance)})
                  </span>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfinityIcon size={16} className="text-muted-foreground ml-1" />
                    </TooltipTrigger>
                    <TooltipContent className="select-none">
                      Discovery Radius: Unlimited
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>
            {isOpen && (
              <>
                {hasNearbySessions ? (
                  <div className="space-y-3">
                    {isLoadingSupabaseSessions && <p className="text-muted-foreground">Loading nearby sessions...</p>}
                    {supabaseError && <p className="text-destructive">Error: {supabaseError.message}</p>}
                    {allNearbySessions.map(session => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        onJoinSession={handleJoinSession}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    {isDiscoveryActivated && sessionVisibility === 'public' && geolocationPermissionStatus === 'granted' ? "No nearby sessions found." : "Switch to Public to see nearby sessions."}
                  </p>
                )}
                <p className="text-muted-foreground text-sm text-center py-4">
                  Invite cool people from real life to build the DeepSesh community
                </p>
              </>
            )}
          </div>
        );
      case 'friends':
        const allFriendsSessions = sortSessions(friendsSessions, currentUserId);
        const hasFriendsSessions = allFriendsSessions.length > 0;

        return (
          <div data-name="Friends Sessions Section">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center justify-between w-full text-lg font-semibold text-foreground mb-3 transition-opacity"
            >
              <div className="flex items-center gap-2">
                <Users size={16} className="text-blue-500" />
                <h3>Friends</h3>
              </div>
              <div className="flex items-center gap-2">
                {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>
            {isOpen && (
              hasFriendsSessions ? (
                <div className="space-y-3">
                  {allFriendsSessions.map(session => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      onJoinSession={handleJoinSession}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">Invite Friends to see their active sessions.</p>
              )
            )}
          </div>
        );
      case 'organisation':
        const allOrganisationSessions = sortSessions(organisationSessions, currentUserId);
        const hasOrganisationSessions = allOrganisationSessions.length > 0;

        return (
          <div data-name="Organisation Sessions Section">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center justify-between w-full text-lg font-semibold text-foreground mb-3 transition-opacity"
            >
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-olive-foreground" />
                <h3>Organisations</h3>
              </div>
              <div className="flex items-center gap-2">
                {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>
            {isOpen && (
              hasOrganisationSessions ? (
                <div className="space-y-3">
                  {allOrganisationSessions.map(session => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      onJoinSession={handleJoinSession}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">
                  {isDiscoveryActivated && userOrganisations.length > 0 ? "No organisation sessions found." : "Join an organisation to see Organisation sessions."}
                  </p>
              )
            )}
          </div>
        );
      default:
        return null;
    }
  };

  // NEW: Logic for Host as selector
  const shouldShowOrgSelector = sessionVisibility === 'organisation' && userOrganisations.length > 0 && !isActiveTimer;
  const useToggleButton = userOrganisations.length <= 4;

  const handleCycleOrganisation = useCallback(() => {
    if (!userOrganisations || userOrganisations.length === 0) return;

    const currentIndex = selectedHostingOrganisation
      ? userOrganisations.indexOf(selectedHostingOrganisation)
      : -1;

    const nextIndex = (currentIndex + 1) % userOrganisations.length;
    setSelectedHostingOrganisation(userOrganisations[nextIndex]);

    if (areToastsEnabled) {
      toast.info("Hosting Organisation", {
        description: `Now hosting as '${userOrganisations[nextIndex]}'.`,
      });
    }
  }, [userOrganisations, selectedHostingOrganisation, setSelectedHostingOrganisation, areToastsEnabled]);


  return (
    <TooltipProvider>
      <main className="max-w-4xl mx-auto pt-12 px-1 pb-4 lg:pt-15 lg:px-1 lg:pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className={cn(
              "relative rounded-lg border border-border pt-1 pb-4 px-1 text-center transition-colors mt-[5px]",
              sessionVisibility === 'public' && isDarkMode && "bg-gradient-to-r from-[hsl(var(--public-gradient-start-dark))] to-[hsl(var(--public-gradient-end-dark))]",
              sessionVisibility === 'public' && !isDarkMode && "bg-gradient-to-r from-[hsl(var(--public-gradient-start-light))] to-[hsl(var(--public-gradient-end-light))]",
              sessionVisibility === 'private' && isDarkMode && "bg-gradient-to-r from-[hsl(var(--private-gradient-start-dark))] to-[hsl(var(--private-gradient-end-dark))]",
              sessionVisibility === 'private' && !isDarkMode && "bg-gradient-to-r from-[hsl(var(--private-gradient-start-light))] to-[hsl(var(--private-gradient-end-light))]",
              sessionVisibility === 'organisation' && isDarkMode && "bg-gradient-to-r from-[hsl(var(--organisation-gradient-start-dark))] to-[hsl(var(--organisation-gradient-end-dark))]",
              sessionVisibility === 'organisation' && !isDarkMode && "bg-gradient-to-r from-[hsl(var(--organisation-gradient-start-light))] to-[hsl(var(--organisation-gradient-end-light))]"
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
                      className="flex items-center gap-2 px-3 py-1 rounded-full border border-border transition-colors hover:bg-accent-hover"
                      data-name="Schedule Button"
                    >
                      <CalendarPlus size={16} />
                      <span className="text-sm font-medium">Schedule</span>
                    </Button>
                    <div className="flex-grow self-center text-center transition-opacity duration-300 ease-in-out">
                      {isActiveTimer ? (
                        <h2
                          className={cn(
                            "text-xl font-bold text-foreground"
                          )}
                          onMouseDown={() => handlePressStart(handleTitleLongPress)}
                          onMouseUp={handlePressEnd}
                          onMouseLeave={handlePressEnd}
                          onTouchStart={() => handlePressStart(handleTitleLongPress)}
                          onTouchEnd={handlePressEnd}
                        >
                          {isEditingSeshTitle ? (
                            <Input
                              ref={titleInputRef}
                              id="sesh-title-input"
                              name="seshTitle"
                              value={seshTitle}
                              onChange={(e) => setSeshTitle(e.target.value)}
                              onKeyDown={handleTitleInputKeyDown}
                              onBlur={handleTitleInputBlur}
                              placeholder={getDefaultSeshTitle()}
                              className="text-xl font-bold h-auto py-1 px-2 italic text-center"
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <span onClick={handleTitleClick}>{seshTitle}</span>
                          )}
                        </h2>
                      ) : (
                        <p className="text-sm md:text-base font-bold text-muted-foreground hidden xs:block">
                          Sync focus with <span className="whitespace-nowrap">{sessionVisibility === 'private' ? "known coworkers" : (sessionVisibility === 'organisation' ? "organisation coworkers" : "nearby coworkers")}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button
                        onMouseDown={() => handlePressStart(handleSessionVisibilityToggle)}
                        onMouseUp={handlePressEnd}
                        onMouseLeave={handlePressEnd}
                        onTouchStart={() => handlePressStart(handleSessionVisibilityToggle)}
                        onTouchEnd={handlePressEnd}
                        onClick={handleSessionVisibilityToggle}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1 rounded-full border border-border transition-colors select-none",
                          sessionVisibility === 'public' && "bg-public-bg text-public-bg-foreground hover:bg-public-bg-hover",
                          sessionVisibility === 'private' && "bg-private-bg text-private-bg-foreground hover:bg-private-bg-hover",
                          sessionVisibility === 'organisation' && "bg-organisation-bg text-organisation-bg-foreground hover:bg-organisation-bg-hover"
                        )}
                        data-name="Session Visibility Toggle Button"
                      >
                        {sessionVisibility === 'public' && (
                            <>
                              <Globe size={16} />
                              <span className="text-sm font-medium">Public</span>
                            </>
                          )}
                        {sessionVisibility === 'private' && (
                            <>
                              <Lock size={16} />
                              <span className="text-sm font-medium">Private</span>
                            </>
                          )}
                        {sessionVisibility === 'organisation' && (
                            <>
                              <Building2 size={16} className="text-olive-foreground" />
                              <span className="text-sm font-medium">Organisation</span>
                            </>
                          )}
                      </button>

                      {/* NEW: Host as selector */}
                      {shouldShowOrgSelector && (
                        <div className="flex items-center gap-2">
                          {useToggleButton ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCycleOrganisation}
                              className="h-8 px-3 text-sm ml-auto"
                            >
                              {selectedHostingOrganisation || (userOrganisations.length > 0 ? userOrganisations[0] : "None")}
                            </Button>
                          ) : (
                            <Select
                              value={selectedHostingOrganisation || ""}
                              onValueChange={setSelectedHostingOrganisation}
                            >
                              <SelectTrigger 
                                className="w-[180px] h-8 text-sm ml-auto"
                                name="selectedHostingOrganisation"
                                id="select-hosting-org-index"
                              >
                                <SelectValue placeholder="Select Organisation" />
                              </SelectTrigger>
                              <SelectContent>
                                {userOrganisations.map(org => (
                                  <SelectItem key={org} value={org}>{org}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      )}

                      {isActiveTimer ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex items-center gap-2 px-3 py-1 rounded-full border border-border transition-colors hover:bg-accent-hover"
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
                          className="flex items-center gap-2 px-3 py-1 rounded-full border border-border transition-colors hover:bg-accent-hover"
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
                      isRunning ? (
                        <Button
                          size="lg"
                          variant="ghost" // Use ghost variant to remove background/border
                          className="w-28 invisible pointer-events-none" // Make it invisible and non-interactive
                          aria-hidden="true"
                        >
                          &nbsp; {/* Non-breaking space to ensure content exists for sizing */}
                        </Button>
                      ) : (
                        <Button
                          size="lg"
                          className="w-28"
                          onClick={() => {
                            if (isSchedulePrepared) {
                              startNewManualTimer();
                            } else { // Removed isPaused check
                              startNewManualTimer();
                            }
                          }}
                          data-name={`${isSchedulePrepared ? 'Start' : 'Start'} Timer Button`} // Simplified button text
                        >
                          Start
                        </Button>
                      )
                    )}
                  </div>

                  {(isRunning || isScheduleActive || isSchedulePending) && ( // Removed isPaused
                    <div className="flex items-end justify-between px-4 mt-4">
                      <div className={cn(
                        "shape-octagon w-10 h-10 bg-secondary text-secondary-foreground transition-colors flex items-center justify-center",
                        isRunning && "opacity-50",
                        "opacity-100"
                      )}>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleStopButtonAction}
                          onMouseDown={() => handlePressStart(handleLongPressStop)}
                          onMouseUp={handlePressEnd}
                          onMouseLeave={handlePressEnd}
                          onTouchStart={() => handlePressStart(handleLongPressStop)}
                          onTouchEnd={handlePressEnd}
                          className={cn(
                            "w-full h-full rounded-none bg-transparent",
                            "text-secondary-foreground",
                            "hover:bg-accent-hover"
                          )}
                          data-name="Stop Timer Button"
                        >
                          <Square size={16} fill="currentColor" />
                        </Button>
                      </div>
                      {/* AskMenu removed */}
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
                          id="homepage-focus-minutes"
                          name="homepageFocusMinutes"
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
                          id="homepage-break-minutes"
                          name="homepageBreakMinutes"
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

            {/* ActiveAskSection removed */}
          </div>

          <div className="space-y-6">
            {profile?.profile_data?.intention?.value && (
              <Card>
                <CardHeader>
                  <CardTitle className="lg">My Intention</CardTitle>
                </CardHeader>
                <CardContent>
                  <p
                    className="text-sm text-muted-foreground cursor-pointer transition-colors select-none"
                    onMouseDown={() => handlePressStart(handleIntentionLongPress)}
                    onMouseUp={handlePressEnd}
                    onMouseLeave={handlePressEnd}
                    onTouchStart={() => handlePressStart(handleIntentionLongPress)}
                    onTouchEnd={() => handlePressEnd()}
                    onClick={() => {
                      if (!isLongPressDetected.current) {
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
              <Tabs defaultValue="my-notes" className="w-full">
                <CardHeader className="p-0"> {/* Changed pb-2 to p-0 */}
                  <div className="flex items-center justify-between px-6 pt-6"> {/* Added px-6 pt-6 */}
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="my-notes">My Notes</TabsTrigger>
                      <TabsTrigger value="host-notes" disabled={currentSessionRole !== 'host' && currentSessionRole !== 'coworker' && isActiveTimer}>Host Notes</TabsTrigger>
                    </TabsList>
                  </div>
                </CardHeader>
                <CardContent>
                  <TabsContent value="my-notes">
                    <MarkdownEditor
                      value={notes}
                      onChange={setNotes}
                      placeholder="Thoughts, to-do items, or reflections..."
                      // rows={5} // Removed fixed rows
                      initialRows={3} // Set initial rows
                      maxRows={10} // Set max rows
                    />
                  </TabsContent>
                  <TabsContent value="host-notes">
                    {!(currentSessionRole === 'coworker' && !hostNotes.trim()) && (
                      <MarkdownEditor
                        value={hostNotes}
                        onChange={setHostNotes}
                        placeholder={
                          (currentSessionRole === 'host' || !isActiveTimer)
                            ? "Location details, plan, etc."
                            : "No host notes available."
                        }
                        // rows={5} // Removed fixed rows
                        initialRows={3} // Set initial rows
                        maxRows={10} // Set max rows
                        readOnly={isActiveTimer && currentSessionRole !== 'host'}
                        isCoworkerView={currentSessionRole === 'coworker'}
                      />
                    )}
                  </TabsContent>
                </CardContent>
              </Tabs>
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
                        person.role === 'self' ? (isDarkMode ? "bg-[hsl(var(--focus-background-solid-dark))]" : "bg-[hsl(var(--focus-background-solid-light))]") :
                        person.role === 'host' ? "bg-muted text-blue-700 font-medium" :
                        "cursor-pointer"
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

            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="sessions-list">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-6"
                  >
                    {expandedSections.map((sectionId, index) => (
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

            {minimizedSections.length > 0 && (
              <div className="flex justify-center gap-2 mt-6">
                {minimizedSections.map(sectionId => renderMinimizedSectionButton(sectionId))}
              </div>
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
          <div className="mt-8" data-name="Upcoming Schedules Section">
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
                name="sessionCode"
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
                  name="discoveryDisplayName"
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
                <div
                  ref={discoverySliderContainerRef}
                  onPointerDown={handleDiscoveryPointerDown}
                  onPointerMove={handleDiscoveryPointerMove}
                  onPointerUp={handleDiscoveryPointerUp}
                  onPointerLeave={handleDiscoveryPointerUp}
                  className="space-y-4 cursor-ew-resize p-2 -m-2 rounded-md"
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
                    geolocationPermissionStatus === 'granted' && "bg-success text-success-foreground border-success hover:bg-success-hover hover:text-success-foreground",
                    geolocationPermissionStatus === 'denied' && "bg-error text-error-foreground border-error hover:bg-error-hover",
                    geolocationPermissionStatus === 'prompt' && "bg-muted text-muted-foreground hover:bg-muted-hover"
                  )}
                  onClick={getLocation}
                >
                  <MapPin size={16} />
                  {geolocationPermissionStatus === 'granted' && "Enabled"}
                  {geolocationPermissionStatus === 'denied' && "Enable Location"}
                  {geolocationPermissionStatus === 'prompt' && "Enable Location"}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <p className="text-xs text-muted-foreground mr-auto">
                Add more details on your <Link to="/profile" className="text-blue-500 underline">profile page</Link>
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