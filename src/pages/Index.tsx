import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CircularProgress } from "@/components/CircularProgress";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Globe, Lock, CalendarPlus, Share2, Square, ChevronDown, ChevronUp, Users } from "lucide-react";
import { useTimer } from "@/contexts/TimerContext";
import { useProfile } from "@/contexts/ProfileContext";
import { useNavigate } from "react-router-dom";
import SessionCard from "@/components/SessionCard";
import { cn } from "@/lib/utils";
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
import { toast } from 'sonner'; // Changed to sonner toast
import { format } from 'date-fns';
import { ScheduledTimerTemplate } from "@/types/timer";
import { DAYS_OF_WEEK } from "@/lib/constants";
import { Accordion } from "@/components/ui/accordion";
import UpcomingScheduleAccordionItem from "@/components/UpcomingScheduleAccordionItem";
import { useProfilePopUp } from "@/contexts/ProfilePopUpContext";
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useTheme } from '@/contexts/ThemeContext'; // NEW: Import useTheme

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
  participants: { id: string; name: string; sociability: number; intention?: string; bio?: string }[];
  fullSchedule: { type: 'focus' | 'break'; durationMinutes: number; }[];
}

const now = new Date();
const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0, 0);
const pomodoroStartTime = nextHour.getTime();

const beginningOfMostRecentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0).getTime();

const mockNearbySessions: DemoSession[] = [
  {
    id: "102",
    title: "Computer Science Lab",
    startTime: Date.now() - (76.8 * 60 * 1000),
    location: "Science Building - Computer Lab 2B",
    workspaceImage: "/api/placeholder/200/120",
    workspaceDescription: "Modern lab with dual monitors",
    participants: [
      { id: "mock-user-id-bezos", name: "Bezos", sociability: 20, intention: "Optimizing cloud infrastructure." },
      { id: "mock-user-id-musk", name: "Musk", sociability: 10, intention: "Designing reusable rocket components." },
      { id: "mock-user-id-zuckerberg", name: "Zuckerberg", sociability: 20, intention: "Developing new social algorithms." },
      { id: "mock-user-id-gates", name: "Gates", sociability: 20, intention: "Refining operating system architecture." },
      { id: "mock-user-id-jobs", name: "Jobs", sociability: 30, intention: "Innovating user interface design." },
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
      { id: "mock-user-id-freud", name: "Freud", sociability: 60, intention: "Reviewing psychoanalytic theories." },
      { id: "mock-user-id-skinner", name: "Skinner", sociability: 60, intention: "Memorizing behavioral principles." },
      { id: "mock-user-id-piaget", name: "Piaget", sociability: 70, intention: "Practicing cognitive development questions." },
      { id: "mock-user-id-jung", name: "Jung", sociability: 60, intention: "Summarizing archetypal concepts." },
      { id: "mock-user-id-maslow", name: "Maslow", sociability: 50, intention: "Creating hierarchy of needs flashcards." },
      { id: "mock-user-id-rogers", name: "Rogers", sociability: 55, intention: "Discussing humanistic approaches." },
      { id: "mock-user-id-bandura", name: "Bandura", sociability: 65, intention: "Collaborating on social learning theory guide." },
      { id: "mock-user-id-pavlov", name: "Pavlov", sociability: 70, intention: "Peer teaching classical conditioning." },
    ],
    fullSchedule: [
      { type: "focus", durationMinutes: 25 },
      { type: "break", durationMinutes: 5 },
    ],
  },
];

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
    allParticipantsToDisplay,

    startStopNotifications,
    playSound,
    triggerVibration,
    areToastsEnabled, // NEW: Get areToastsEnabled
  } = useTimer();
  
  console.log("Index.tsx: Value from useTimer hook:", {
    focusMinutes, setHomepageFocusMinutes, breakMinutes, setHomepageBreakMinutes,
    defaultFocusMinutes, defaultBreakMinutes, isRunning, setIsRunning, isPaused, setIsPaused,
    timeLeft, setTimeLeft, timerType, setTimerType, isFlashing, setIsFlashing, notes, setNotes,
    seshTitle, setSeshTitle, isSeshTitleCustomized, formatTime, showSessionsWhileActive, timerIncrement,
    schedule, activeSchedule, activeTimerColors, currentScheduleIndex, isSchedulingMode, setIsSchedulingMode,
    isScheduleActive, setIsScheduleActive, isSchedulePrepared, startSchedule, commenceSpecificPreparedSchedule,
    discardPreparedSchedule, resetSchedule, scheduleTitle, commenceTime, commenceDay, isGlobalPrivate,
    activeScheduleDisplayTitle, sessionStartTime, setSessionStartTime, currentPhaseStartTime, setCurrentPhaseStartTime,
    accumulatedFocusSeconds, setAccumulatedFocusSeconds, accumulatedBreakSeconds, setAccumulatedBreakSeconds,
    activeJoinedSessionCoworkerCount, setActiveJoinedSessionCoworkerCount, activeAsks, addAsk, updateAsk, setActiveAsks,
    isSchedulePending, setIsSchedulePending, isTimeLeftManagedBySession, scheduleStartOption, is24HourFormat, preparedSchedules,
    currentSessionRole, setCurrentSessionRole, currentSessionHostName, setCurrentSessionHostName,
    currentSessionOtherParticipants, setCurrentSessionOtherParticipants, allParticipantsToDisplay,
    startStopNotifications, playSound, triggerVibration, areToastsEnabled
  });

  const { profile, loading: profileLoading, localFirstName, getPublicProfile } = useProfile(); // Removed saveSession from here
  const navigate = useNavigate();
  const { openProfilePopUp } = useProfilePopUp();
  const { isDarkMode } = useTheme(); // NEW: Get isDarkMode from ThemeContext

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
  
  const handlePublicPrivateToggle = () => {
    if (isLongPress.current) {
      setIsGlobalPrivate((prev: boolean) => !prev);
    } else {
      setIsGlobalPrivate((prev: boolean) => !prev);
    }
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
        setSeshTitle("Notes");
      }
    }
  };

  const handleTitleInputBlur = () => {
    setIsEditingSeshTitle(false);
    if (seshTitle.trim() === "") {
      setSeshTitle("Notes");
      }
  };

  const handleTitleLongPress = () => {
    if (isLongPress.current) {
      setIsEditingSeshTitle(true);
    }
  };
  
  const startNewManualTimer = () => {
    if (isRunning || isPaused || isScheduleActive || isSchedulePrepared) {
      if (!confirm("A timer or schedule is already active. Do you want to override it and start a new manual timer?")) {
        return;
      }
      if (isScheduleActive || isSchedulePrepared) resetSchedule();
      setIsRunning(false);
      setIsPaused(false);
      setIsFlashing(false);
      setAccumulatedFocusSeconds(0);
      setAccumulatedBreakSeconds(0);
      setSeshTitle("Notes");
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
    setTimeLeft(focusMinutes * 60);
    setIsTimeLeftManagedBySession(true);

    setCurrentSessionRole('host');
    setCurrentSessionHostName(currentUserName);
    setCurrentSessionOtherParticipants([]);
    setActiveJoinedSessionCoworkerCount(0);
  };

  const resumeTimer = () => {
    playSound();
    triggerVibration();
    setIsRunning(true);
    setIsPaused(false);
    if (isScheduleActive && isSchedulePending) {
      setIsSchedulePending(false);
      setCurrentPhaseStartTime(Date.now());
      if (areToastsEnabled) { // NEW: Conditional toast
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
  
  const stopTimer = async () => {
    let finalAccumulatedFocus = accumulatedFocusSeconds;
    let finalAccumulatedBreak = accumulatedBreakSeconds;

    if (isRunning && currentPhaseStartTime !== null) {
      const elapsed = (Date.now() - currentPhaseStartTime) / 1000;
      if (timerType === 'focus') {
        finalAccumulatedFocus += elapsed;
      } else {
        finalAccumulatedBreak += elapsed;
      }
    }
    const totalSessionSeconds = finalAccumulatedFocus + finalAccumulatedBreak;

    const performStopActions = async () => {
      setIsRunning(false);
      setIsPaused(false);
      setIsFlashing(false);
      setTimerType('focus');
      setTimeLeft(defaultFocusMinutes * 60);
      setActiveJoinedSession(null);
      if (isScheduleActive || isSchedulePrepared) resetSchedule();
      setSessionStartTime(null);
      setCurrentPhaseStartTime(null);
      setAccumulatedFocusSeconds(0);
      setAccumulatedBreakSeconds(0);
      setSeshTitle("Notes");
      console.log("Index: Calling setActiveAsks. Current value of setActiveAsks:", setActiveAsks);
      setActiveAsks([]);

      setCurrentSessionRole(null);
      setCurrentSessionHostName(null);
      setCurrentSessionOtherParticipants([]);
      setIsTimeLeftManagedBySession(false);

      setHomepageFocusMinutes(defaultFocusMinutes);
      setHomepageBreakMinutes(defaultBreakMinutes);
    };

    const handleSaveAndStop = async () => {
      console.log("Index: Calling saveSession with activeAsks:", activeAsks);
      // Removed saveSession from here, it's now handled by TimerContext's useEffect
      await performStopActions();
      playSound();
      triggerVibration();
    };

    if (longPressRef.current) {
      await handleSaveAndStop();
    } else {
      if (confirm('Are you sure you want to stop the timer?')) {
        await handleSaveAndStop();
      }
    }
  };
  
  const resetTimer = () => {
    if (longPressRef.current) {
      setIsRunning(false);
      setIsPaused(false);
      setIsFlashing(false);
      const initialTime = timerType === 'focus' ? defaultFocusMinutes * 60 : defaultBreakMinutes * 60;
      setTimeLeft(initialTime);
      setActiveJoinedSession(null);
      if (isScheduleActive || isSchedulePrepared) resetSchedule();
      setSessionStartTime(null);
      setCurrentPhaseStartTime(null);
      setAccumulatedFocusSeconds(0);
      setAccumulatedBreakSeconds(0);
      setSeshTitle("Notes");
      setActiveAsks([]);

      setCurrentSessionRole(null);
      setCurrentSessionHostName(null);
      setCurrentSessionOtherParticipants([]);
      setIsTimeLeftManagedBySession(false);
    } else {
      if (confirm('Are you sure you want to reset the timer?')) {
        setIsRunning(false);
        setIsPaused(false);
        setIsFlashing(false);
        const initialTime = timerType === 'focus' ? defaultFocusMinutes * 60 : defaultBreakMinutes * 60;
        setTimeLeft(initialTime);
        setActiveJoinedSession(null);
        if (isScheduleActive || isSchedulePrepared) resetSchedule();
        setSessionStartTime(null);
        setCurrentPhaseStartTime(null);
        setAccumulatedFocusSeconds(0);
        setAccumulatedBreakSeconds(0);
      setSeshTitle("Notes");
      setActiveAsks([]);

      setCurrentSessionRole(null);
      setCurrentSessionHostName(null);
      setCurrentSessionOtherParticipants([]);
      setIsTimeLeftManagedBySession(false);
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

  const handleJoinSession = (session: DemoSession) => {
    if (isRunning || isPaused || isScheduleActive || isSchedulePrepared) {
      if (!confirm("A timer or schedule is already active. Do you want to override it and join this sesh?")) {
        return;
      }
      if (isScheduleActive || isSchedulePrepared) resetSchedule();
      setIsRunning(false);
      setIsPaused(false);
      setIsFlashing(false);
      setAccumulatedFocusSeconds(0);
      setAccumulatedBreakSeconds(0);
      setSeshTitle("Notes");
      setActiveAsks([]);
    }

    setActiveJoinedSession(session);
    setActiveJoinedSessionCoworkerCount(session.participants.length);
    
    const now = Date.now();
    const elapsedSecondsSinceSessionStart = Math.floor((now - session.startTime) / 1000);
    
    const totalScheduleDurationSeconds = session.fullSchedule.reduce(
      (sum, phase) => sum + phase.durationMinutes * 60,
      0
    );

    let currentPhaseType: 'focus' | 'break' = 'focus';
    let remainingSecondsInPhase = 0;
    let currentPhaseDurationMinutes = 0;

    if (totalScheduleDurationSeconds === 0) {
      currentPhaseType = 'focus';
      remainingSecondsInPhase = 0;
      currentPhaseDurationMinutes = 0;
    } else if (elapsedSecondsSinceSessionStart < 0) {
      currentPhaseType = session.fullSchedule[0]?.type || 'focus';
      currentPhaseDurationMinutes = session.fullSchedule[0]?.durationMinutes || 0;
      remainingSecondsInPhase = -elapsedSecondsSinceSessionStart;
    } else {
      const effectiveElapsedSeconds = elapsedSecondsSinceSessionStart % totalScheduleDurationSeconds;

      let accumulatedDurationSecondsInCycle = 0;
      for (let i = 0; i < session.fullSchedule.length; i++) {
        const phase = session.fullSchedule[i];
        const phaseDurationSeconds = phase.durationMinutes * 60;

        if (effectiveElapsedSeconds < accumulatedDurationSecondsInCycle + phaseDurationSeconds) {
          currentPhaseType = phase.type;
          const timeIntoPhase = effectiveElapsedSeconds - accumulatedDurationSecondsInCycle; // Declare timeIntoPhase
          remainingSecondsInPhase = phaseDurationSeconds - timeIntoPhase;
          currentPhaseDurationMinutes = phase.durationMinutes;
          break;
        }
        accumulatedDurationSecondsInCycle += phaseDurationSeconds;
      }
    }

    setTimerType(currentPhaseType);
    setIsTimeLeftManagedBySession(true);
    setTimeLeft(Math.max(0, remainingSecondsInPhase));
    
    if (currentPhaseType === 'focus') {
      setHomepageFocusMinutes(currentPhaseDurationMinutes);
      setHomepageBreakMinutes(defaultBreakMinutes);
    } else {
      setHomepageBreakMinutes(currentPhaseDurationMinutes);
      setHomepageFocusMinutes(defaultFocusMinutes);
    }

    setIsRunning(true);
    setIsPaused(false);
    setIsFlashing(false);
    setSessionStartTime(Date.now());
    setCurrentPhaseStartTime(Date.now());
    setAccumulatedFocusSeconds(0);
    setAccumulatedBreakSeconds(0);
    if (areToastsEnabled) { // NEW: Conditional toast
      toast.success("Sesh Joined!", {
        description: `You've joined "${session.title}".`,
      });
    }
    playSound();
    triggerVibration();

    setCurrentSessionRole('coworker');
    setCurrentSessionHostName(session.participants[0]?.name || session.title);
    setCurrentSessionOtherParticipants(session.participants.filter(p => p.id !== currentUserId));
  };

  const handleJoinCodeSubmit = () => {
    if (joinSessionCode.trim()) {
      if (areToastsEnabled) { // NEW: Conditional toast
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
  }, [isActiveTimer, isGlobalPrivate, showSessionsWhileActive]);

  const shouldShowFriendsSessions = useMemo(() => {
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
  }, [isActiveTimer, showSessionsWhileActive]);

  const shouldShowOrganizationSessions = useMemo(() => {
    return !!profile?.organization;
  }, [profile?.organization]);

  const mockOrganizationSessions: DemoSession[] = useMemo(() => {
    if (!profile?.organization) return [];

    const organizationNames = profile.organization.split(';').map(name => name.trim()).filter(name => name.length > 0);
    const sessions: DemoSession[] = [];

    // List of famous philosophers/scientists (using IDs from ProfileContext mockProfiles)
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
      // Simple hash function for deterministic staggering
      const getDeterministicOffset = (name: string) => {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
          const char = name.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash |= 0; // Convert to 32bit integer
        }
        return Math.abs(hash);
      };

      const hashValue = getDeterministicOffset(orgName);
      const minuteOffset = (hashValue % 12) * 5; // 12 slots of 5 minutes in an hour

      const now = new Date();
      const currentHourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0).getTime();
      
      const staggeredStartTime = currentHourStart + minuteOffset * 60 * 1000;

      const participantNames: { id: string; name: string; sociability: number; intention?: string; bio?: string }[] = [];
      const usedIndices = new Set<number>();

      // Add 2-3 other mock participants from the famousNamesWithIds list
      const hostSociability = profile.sociability || 50; // Use current user's sociability as a base for host
      for (let i = 0; i < 3; i++) {
        let randomIndex = (hashValue + i) % famousNamesWithIds.length;
        while (usedIndices.has(randomIndex)) {
          randomIndex = (randomIndex + 1) % famousNamesWithIds.length;
        }
        usedIndices.add(randomIndex);
        const { id, name } = famousNamesWithIds[randomIndex];
        
        // Vary sociability by up to 7 points from the host's sociability
        const sociabilityOffset = Math.floor(Math.random() * 15) - 7; // -7 to +7
        const variedSociability = Math.max(0, Math.min(100, hostSociability + sociabilityOffset));

        participantNames.push({ 
          id: id, // Use the ID from the mock profile
          name: name, 
          sociability: variedSociability,
          intention: `Deep work on ${name}'s theories.` 
        });
      }

      sessions.push({
        id: `org-session-${orgName.replace(/\s/g, '-')}`,
        title: `${orgName} Focus Sesh`,
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
  }, [profile, currentUserId, currentUserName]);


  const allParticipantsToDisplayInCard = useMemo(() => {
    const participants: Array<{ id: string; name: string; sociability: number; role: 'host' | 'coworker'; intention?: string; bio?: string }> = [];

    participants.push({
      id: currentUserId,
      name: currentUserName,
      sociability: profile?.sociability || 50,
      role: currentSessionRole === 'host' ? 'host' : 'coworker',
      intention: profile?.intention || undefined,
      bio: profile?.bio || undefined,
    });

    if (currentSessionRole === 'coworker' && currentSessionHostName && currentSessionHostName !== currentUserName) {
      // Fetch host profile details using getPublicProfile
      const hostProfile = getPublicProfile(currentSessionHostName, currentSessionHostName); // Assuming name can be used as ID for mock profiles
      const hostSociability = hostProfile ? hostProfile.sociability || 50 : 50;
      const hostIntention = hostProfile ? hostProfile.intention || undefined : undefined;
      const hostBio = hostProfile ? hostProfile.bio || undefined : undefined;

      participants.push({
        id: "host-id", // This ID is generic, but the name and other details are from the hostProfile
        name: currentSessionHostName,
        sociability: hostSociability,
        role: 'host',
        intention: hostIntention,
        bio: hostBio,
      });
    }

    currentSessionOtherParticipants.forEach(p => {
      if (p.id !== currentUserId && p.name !== currentSessionHostName) {
        participants.push({ ...p, sociability: p.sociability || 50, role: 'coworker' });
      }
    });

    return participants.sort((a, b) => {
      if (a.id === currentUserId) return -1;
      if (b.id === currentUserId) return 1;
      if (a.role === 'host' && b.role !== 'host') return -1;
      if (a.role !== 'host' && b.role === 'host') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [currentSessionRole, currentSessionHostName, currentSessionOtherParticipants, currentUserId, currentUserName, profile?.sociability, profile?.intention, profile?.bio, getPublicProfile]);


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

  const handleVotePoll = (pollId: string, selectedOptionIdsFromCard: string[], customOptionText?: string, isCustomOptionSelected?: boolean) => {
    const currentAsk = activeAsks.find(ask => ask.id === pollId);
    if (!currentAsk || !('options' in currentAsk)) return;

    let currentPoll = currentAsk as Poll;
    let finalOptionIdsToVote: string[] = [...selectedOptionIdsFromCard];

    // --- Handle custom response text and its corresponding option ---
    const trimmedCustomText = customOptionText?.trim();
    let userCustomOptionId: string | null = null;

    // Find the custom option previously created by this user, if any
    const existingUserCustomOption = currentPoll.options.find(
      opt => opt.id.startsWith('custom-') && opt.votes.some(vote => vote.userId === currentUserId)
    );

    if (trimmedCustomText && isCustomOptionSelected) {
      // User has provided a custom response AND it's selected
      if (existingUserCustomOption) {
        // Update existing custom option's text if it changed
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
        // Create a new custom option
        const newCustomOption: PollOption = {
          id: `custom-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          text: trimmedCustomText,
          votes: [],
        };
        currentPoll = { ...currentPoll, options: [...currentPoll.options, newCustomOption] };
        userCustomOptionId = newCustomOption.id;
      }
      // Ensure the custom option is in the list of options to be voted for
      if (userCustomOptionId && !finalOptionIdsToVote.includes(userCustomOptionId)) {
        finalOptionIdsToVote.push(userCustomOptionId);
      }
    } else {
      // User cleared the custom response input OR unchecked the custom option.
      // If there was an existing custom option by this user, ensure its vote is removed.
      if (existingUserCustomOption) {
        finalOptionIdsToVote = finalOptionIdsToVote.filter(id => id !== existingUserCustomOption.id);
      }
    }

    // --- Update votes for all options ---
    let updatedOptions = currentPoll.options.map(option => {
      let newVotes = option.votes.filter(v => v.userId !== currentUserId); // Remove current user's previous vote

      if (finalOptionIdsToVote.includes(option.id)) {
        newVotes.push({ userId: currentUserId }); // Add vote if it's in the final list
      }
      return { ...option, votes: newVotes };
    });

    // --- Clean up voteless custom options ---
    // Filter out custom options that now have no votes from any user
    updatedOptions = updatedOptions.filter(option =>
      !option.id.startsWith('custom-') || option.votes.length > 0
    );

    updateAsk({ ...currentPoll, options: updatedOptions });
  };

  const handleCountdownEnd = useCallback(() => {
    setIsSchedulePending(false);
    setIsScheduleActive(true);
    setIsRunning(true);
    setIsPaused(false);
    setCurrentPhaseStartTime(Date.now());
    if (areToastsEnabled) { // NEW: Conditional toast
      toast.success("Schedule Commenced!", {
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
      return -Infinity; 
    } else if (template.scheduleStartOption === 'custom_time') {
      const [hours, minutes] = template.commenceTime.split(':').map(Number);
      let targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);

      const currentDay = now.getDay();
      const templateDay = template.commenceDay === null ? currentDay : template.commenceDay;
      const daysToAdd = (templateDay - currentDay + 7) % 7;
      targetDate.setDate(now.getDate() + daysToAdd);

      if (targetDate.getTime() < now.getTime()) {
        if (!template.isRecurring) {
          discardPreparedSchedule(template.id);
          continue;
        } else {
          if (template.recurrenceFrequency === 'daily') {
            targetDate.setDate(targetDate.getDate() + 1);
          } else if (template.recurrenceFrequency === 'weekly') {
            targetDate.setDate(targetDate.getDate() + 7);
          } else if (template.recurrenceFrequency === 'monthly') {
            targetDate.setMonth(targetDate.getMonth() + 1);
          }
          while (targetDate.getTime() < now.getTime()) {
            if (template.recurrenceFrequency === 'daily') {
              targetDate.setDate(targetDate.getDate() + 1);
            } else if (template.recurrenceFrequency === 'weekly') {
              targetDate.setDate(targetDate.getDate() + 7);
            } else if (template.recurrenceFrequency === 'monthly') {
              targetDate.setMonth(targetDate.getMonth() + 1);
            }
          }
        }
      }

      const timeDifference = targetDate.getTime() - now.getTime();
      if (timeDifference <= 60 * 1000 && timeDifference >= -1000) {
        if (!isScheduleActive && !isSchedulePending) {
          commenceSpecificPreparedSchedule(template.id);
          if (template.isRecurring) {
            const nextCommenceDate = new Date(targetDate);
            if (template.recurrenceFrequency === 'daily') {
              nextCommenceDate.setDate(nextCommenceDate.getDate() + 1);
            } else if (template.recurrenceFrequency === 'weekly') {
              nextCommenceDate.setDate(nextCommenceDate.getDate() + 7);
            } else if (template.recurrenceFrequency === 'monthly') {
              nextCommenceDate.setMonth(nextCommenceDate.getMonth() + 1);
            }
            setPreparedSchedules(prev => prev.map(p => 
              p.id === template.id ? { 
                ...p, 
                commenceTime: nextCommenceDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }),
                commenceDay: nextCommenceDate.getDay()
              } : p
            ));
          }
          return;
        }
      }
    }
    return Infinity;
  }, [isScheduleActive, isSchedulePending, commenceSpecificPreparedSchedule, discardPreparedSchedule, setPreparedSchedules]);

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
    const targetProfileData = getPublicProfile(userId, userName); // MODIFIED: Removed await
    if (targetProfileData) {
      openProfilePopUp(targetProfileData.id, targetProfileData.first_name || userName, event.clientX, event.clientY);
    } else {
      openProfilePopUp(userId, userName, event.clientX, event.clientY);
    }
  }, [openProfilePopUp, getPublicProfile]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const items = Array.from(sectionOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSectionOrder(items as ('nearby' | 'friends' | 'organization')[]);
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
              <h3>Nearby</h3>
              <div className="flex items-center gap-2">
                {hiddenNearbyCount > 0 && (
                  <span className="text-sm text-muted-foreground">({hiddenNearbyCount})</span>
                )}
                {isNearbySessionsOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>
            {isNearbySessionsOpen && (
              <div className="space-y-3">
                {mockNearbySessions.map(session => (
                  <SessionCard 
                    key={session.id} 
                    session={session} 
                    onJoinSession={handleJoinSession} 
                    onNameClick={handleNameClick}
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
              <h3>Friends</h3>
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
                    onNameClick={handleNameClick}
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
                    onNameClick={handleNameClick}
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
    <>
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
                  <div className="flex justify-between items-start mb-6">
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
                            <DropdownMenuItem className="text-muted-foreground" onClick={() => console.log('Share Link')} data-name="Share Link Option">Link</DropdownMenuItem>
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
                        const clickX = e.clientX - rect.left; // X position relative to the element
                        const middle = rect.width / 2;

                        if (clickX < middle) {
                          // Left side clicked - decrease time
                          if (timerType === 'focus') {
                            setHomepageFocusMinutes(prev => Math.max(timerIncrement, prev - timerIncrement));
                          } else {
                            setHomepageBreakMinutes(prev => Math.max(timerIncrement, prev - timerIncrement));
                          }
                        } else {
                          // Right side clicked - increase time
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

                  {(isPaused || isRunning || isScheduleActive || isSchedulePrepared || isSchedulePending) && (
                    <div className="absolute bottom-4 left-4 flex flex-col gap-1">
                      <div className={cn(
                        "shape-octagon w-10 h-10 bg-secondary text-secondary-foreground transition-colors flex items-center justify-center",
                        isRunning && "opacity-50", // Changed to opacity-50
                        "hover:opacity-100", 
                        isPaused && "text-red-500" 
                      )}>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onMouseDown={() => handleLongPressStart(stopTimer)}
                          onMouseUp={handleLongPressEnd}
                          onMouseLeave={handleLongPressEnd}
                          onTouchStart={() => handleLongPressStart(stopTimer)}
                          onTouchEnd={handleLongPressEnd}
                          onClick={stopTimer}
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
                          max={69 * 60} // 69 hours in minutes
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
                          max={420} // 420 minutes
                          step={timerIncrement}
                          onFocus={(e) => e.target.select()}
                          data-name="Break Duration Input"
                        />
                      </div>
                    </div>
                  )}
                  {(isRunning || isPaused || isScheduleActive || isSchedulePrepared || isSchedulePending) && <AskMenu onExtendSubmit={handleExtendSubmit} onPollSubmit={handlePollSubmit} />}
                </>
              )}
            </div>

            <ActiveAskSection 
              activeAsks={activeAsks} 
              onVoteExtend={handleVoteExtend} 
              onVotePoll={handleVotePoll}
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
                {isEditingSeshTitle ? (
                  <Input
                    ref={titleInputRef}
                    value={seshTitle}
                    onChange={(e) => setSeshTitle(e.target.value)}
                    onKeyDown={handleTitleInputKeyDown}
                    onBlur={handleTitleInputBlur}
                    placeholder="Sesh Title"
                    className="text-lg font-semibold h-auto py-1 px-2"
                    onFocus={(e) => e.target.select()}
                    data-name="Sesh Title Input"
                  />
                ) : (
                  <CardTitle 
                    className="text-lg cursor-pointer select-none"
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

            {allParticipantsToDisplayInCard.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Coworkers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {allParticipantsToDisplayInCard.map(person => (
                    <Tooltip key={person.id}>
                      <TooltipTrigger asChild>
                        <div 
                          className={cn(
                            "flex items-center justify-between p-2 rounded-md select-none",
                            person.id === currentUserId ? "bg-[hsl(var(--focus-background))] text-foreground font-medium" :
                            person.role === 'host' ? "bg-muted text-blue-700 font-medium" :
                            "hover:bg-muted cursor-pointer"
                          )} 
                          data-name={`Coworker: ${person.name}`}
                          onClick={(e) => handleNameClick(person.id, person.name, e)}
                        >
                          <span className="font-medium text-foreground">
                            {person.id === currentUserId ? "You" : person.name}
                          </span>
                          <span className="text-sm text-muted-foreground">Sociability: {person.sociability}%</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="select-none">
                        <div className="text-center max-w-xs">
                          <p className="font-medium mb-1">
                            {person.id === currentUserId ? "You" : person.name}
                          </p>
                          <p className="text-sm text-muted-foreground">Sociability: {person.sociability}%</p>
                          {person.role === 'host' && <p className="text-xs text-muted-foreground mt-1">Host</p>}
                          {person.intention && (
                            <p className="text-xs text-muted-foreground mt-1">Intention: {person.intention}</p>
                          )}
                          {timerType === 'break' && person.bio && (
                            <>
                              <p className="text-xs text-muted-foreground mt-2">Bio: {person.bio}</p>
                            </>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </CardContent>
              </Card>
            )}

            <TooltipProvider>
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
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
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
            </TooltipProvider>
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
      </main>
    </>
  );
};
export default Index;