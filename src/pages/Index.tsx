import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CircularProgress } from "@/components/CircularProgress";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Globe, Lock, CalendarPlus, Share2, Square, ChevronDown, ChevronUp, Users, GripVertical } from "lucide-react"; // Added GripVertical
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
import { toast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from 'date-fns';
import { ScheduledTimerTemplate } from "@/types/timer";
import { DAYS_OF_WEEK } from "@/contexts/TimerContext";
import { Accordion } from "@/components/ui/accordion";
import UpcomingScheduleAccordionItem from "@/components/UpcomingScheduleAccordionItem";
import UpcomingScheduleCardContent from "@/components/UpcomingScheduleCard";
import { useProfilePopUp } from "@/contexts/ProfilePopUpContext";

// DND Kit imports
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  type: 'focus' | 'break';
  totalDurationMinutes: number;
  currentPhase: 'focus' | 'break';
  currentPhaseDurationMinutes: number;
  startTime: number;
  location: string;
  workspaceImage: "/api/placeholder/200/120";
  workspaceDescription: string;
  participants: { id: string; name: string; sociability: number; intention?: string; bio?: string }[];
}

const mockNearbySessions: DemoSession[] = [
  {
    id: "101",
    title: "Advanced Calculus Study Group",
    type: "focus",
    totalDurationMinutes: 90,
    currentPhase: "focus",
    currentPhaseDurationMinutes: 59,
    startTime: Date.now() - (5.52 * 60 * 1000),
    location: "Engineering Library - Room 304",
    workspaceImage: "/api/placeholder/200/120",
    workspaceDescription: "Quiet study space with whiteboards",
    participants: [
      { id: "mock-user-id-1", name: "Alice", sociability: 90, intention: "Reviewing differential equations." },
      { id: "mock-user-id-2", name: "Bob", sociability: 80, intention: "Working on problem set 3." },
      { id: "mock-user-id-3", name: "Charlie", sociability: 90, intention: "Preparing for the midterm exam." },
    ],
  },
  {
    id: "102",
    title: "Computer Science Lab",
    type: "focus",
    totalDurationMinutes: 120,
    currentPhase: "focus",
    currentPhaseDurationMinutes: 100,
    startTime: Date.now() - (76.8 * 60 * 1000),
    location: "Science Building - Computer Lab 2B",
    workspaceImage: "/api/placeholder/200/120",
    workspaceDescription: "Modern lab with dual monitors",
    participants: [
      { id: "mock-user-id-4", name: "Diana", sociability: 20, intention: "Debugging a Python script." },
      { id: "mock-user-id-5", name: "Eve", sociability: 10, intention: "Writing documentation for API." },
      { id: "mock-user-id-6", name: "Frank", sociability: 20, intention: "Learning new framework." },
      { id: "7", name: "Riley", sociability: 20, intention: "Code refactoring." },
      { id: "8", name: "Avery", sociability: 30, intention: "Designing database schema." },
    ],
  },
];

const mockFriendsSessions: DemoSession[] = [
  {
    id: "201",
    title: "Psychology 101 Final Review",
    type: "focus",
    currentPhase: "break",
    totalDurationMinutes: 90,
    currentPhaseDurationMinutes: 15,
    startTime: Date.now() - (10.66 * 60 * 1000),
    location: "Main Library - Study Room 12",
    workspaceImage: "/api/placeholder/200/120",
    workspaceDescription: "Private group study room",
    participants: [
      { id: "mock-user-id-7", name: "Grace", sociability: 60, intention: "Reviewing cognitive psychology." },
      { id: "mock-user-id-8", name: "Heidi", sociability: 60, intention: "Memorizing key terms." },
      { id: "mock-user-id-9", name: "Ivan", sociability: 70, intention: "Practicing essay questions." },
      { id: "12", name: "Drew", sociability: 60, intention: "Summarizing research papers." },
      { id: "13", name: "Chris", sociability: 50, intention: "Creating flashcards." },
      { id: "14", name: "Pat", sociability: 55, intention: "Discussing theories." },
      { id: "15", name: "Taylor", sociability: 65, intention: "Collaborating on study guide." },
      { id: "16", name: "Jess", sociability: 70, intention: "Peer teaching." },
    ],
  },
];

// NEW: Mock data for inactive friends
const initialInactiveFriends = [ // Renamed to initialInactiveFriends
  { id: "mock-user-id-11", name: "Liam", lastActive: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }, // 5 days ago
  { id: "mock-user-id-12", name: "Mia", lastActive: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },  // 2 days ago
  { id: "mock-user-id-13", name: "Noah", lastActive: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() }, // 10 days ago
  { id: "mock-user-id-14", name: "Olivia", lastActive: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }, // 1 day ago
  { id: "mock-user-id-15", name: "Ethan", lastActive: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() }, // 7 days ago
];

// Define a type for the draggable item
interface DraggableFriend {
  id: string;
  name: string;
  lastActive: string;
}

// Component for a sortable item
const SortableFriendItem: React.FC<{ friend: DraggableFriend; onNameClick: (userId: string, userName: string, event: React.MouseEvent) => void; }> = ({ friend, onNameClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: friend.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0, // Bring dragged item to front
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 rounded-lg bg-muted cursor-pointer hover:bg-muted/80"
      onClick={(e) => onNameClick(friend.id, friend.name, e)}
    >
      <div className="flex items-center gap-2">
        <button
          className="cursor-grab text-muted-foreground hover:text-foreground p-1 -ml-1" // Added padding and negative margin for better hit area
          {...listeners}
          {...attributes}
          aria-label="Drag to reorder"
        >
          <GripVertical size={16} />
        </button>
        <p className="font-medium">{friend.name}</p>
      </div>
      <p className="text-sm text-muted-foreground">Last Active: {formatDistanceToNow(new Date(friend.lastActive), { addSuffix: true })}</p>
    </div>
  );
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
  } = useTimer();
  
  const { profile, loading: profileLoading, localFirstName, saveSession, getPublicProfile } = useProfile();
  const navigate = useNavigate();
  const { openProfilePopUp } = useProfilePopUp();

  const [isPrivate, setIsPrivate] = useState(isGlobalPrivate);
  const longPressRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);
  const [activeJoinedSession, setActiveJoinedSession] = useState<DemoSession | null>(null);
  const [isHoveringTimer, setIsHoveringTimer] = useState(false);

  const currentUserId = profile?.id || "mock-user-id-123"; 
  const currentUserName = profile?.first_name || localFirstName || "You";

  const [isEditingSeshTitle, setIsEditingSeshTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [showNearbySessions, setShowNearbySessions] = useState(true);
  const [showFriendsSessions, setShowFriendsSessions] = useState(true);
  const [hiddenNearbyCount, setHiddenNearbyCount] = useState(0);
  const [hiddenFriendsCount, setHiddenFriendsCount] = useState(0);

  // NEW: State for inactive friends list visibility
  const [showInactiveFriends, setShowInactiveFriends] = useState(false);
  // NEW: State for draggable inactive friends list
  const [inactiveFriendsState, setInactiveFriendsState] = useState<DraggableFriend[]>(initialInactiveFriends);

  const [showJoinInput, setShowJoinInput] = useState(false);
  const [joinSessionCode, setJoinSessionCode] = useState("");

  useEffect(() => {
    setIsPrivate(isGlobalPrivate);
  }, [isGlobalPrivate]);

  useEffect(() => {
    if (isEditingSeshTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingSeshTitle]);

  useEffect(() => {
    console.log("Index: Current activeAsks on homepage:", activeAsks);
  }, [activeAsks]);

  const playStartSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

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
      setIsPrivate(!isPrivate);
    } else {
      setIsPrivate(!isPrivate);
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
      setNotes("");
      setSeshTitle("Notes");
      setActiveAsks([]);
    }

    playStartSound();
    setIsRunning(true);
    setIsPaused(false);
    setIsFlashing(false);
    setSessionStartTime(Date.now());
    setCurrentPhaseStartTime(Date.now());
    setAccumulatedFocusSeconds(0);
    setAccumulatedBreakSeconds(0);
    setTimeLeft(focusMinutes * 60);

    setCurrentSessionRole('host');
    setCurrentSessionHostName(currentUserName);
    setCurrentSessionOtherParticipants([]);
    setActiveJoinedSessionCoworkerCount(0);
  };

  const resumeTimer = () => {
    playStartSound();
    setIsRunning(true);
    setIsPaused(false);
    if (isScheduleActive && isSchedulePending) {
      setIsSchedulePending(false);
      setCurrentPhaseStartTime(Date.now());
      toast({
        title: "Schedule Resumed!",
        description: `"${activeScheduleDisplayTitle}" has resumed.`,
      });
    } else if (currentPhaseStartTime === null) {
      setCurrentPhaseStartTime(Date.now());
    }
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
      setTimeLeft(focusMinutes * 60);
      setActiveJoinedSession(null);
      if (isScheduleActive || isSchedulePrepared) resetSchedule();
      setSessionStartTime(null);
      setCurrentPhaseStartTime(null);
      setAccumulatedFocusSeconds(0);
      setAccumulatedBreakSeconds(0);
      setNotes("");
      setSeshTitle("Notes");
      console.log("Index: Calling setActiveAsks. Current value of setActiveAsks:", setActiveAsks);
      setActiveAsks([]);

      setCurrentSessionRole(null);
      setCurrentSessionHostName(null);
      setCurrentSessionOtherParticipants([]);
    };

    const handleSaveAndStop = async () => {
      console.log("Index: Calling saveSession with activeAsks:", activeAsks);
      await saveSession(
        seshTitle,
        notes,
        finalAccumulatedFocus,
        finalAccumulatedBreak,
        totalSessionSeconds,
        activeJoinedSessionCoworkerCount,
        sessionStartTime || Date.now(),
        activeAsks,
        allParticipantsToDisplay
      );
      await performStopActions();
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
      const initialTime = timerType === 'focus' ? focusMinutes * 60 : breakMinutes * 60;
      setTimeLeft(initialTime);
      setActiveJoinedSession(null);
      if (isScheduleActive || isSchedulePrepared) resetSchedule();
      setSessionStartTime(null);
      setCurrentPhaseStartTime(null);
      setAccumulatedFocusSeconds(0);
      setAccumulatedBreakSeconds(0);
      setNotes("");
      setSeshTitle("Notes");
      setActiveAsks([]);

      setCurrentSessionRole(null);
      setCurrentSessionHostName(null);
      setCurrentSessionOtherParticipants([]);
    } else {
      if (confirm('Are you sure you want to reset the timer?')) {
        setIsRunning(false);
        setIsPaused(false);
        setIsFlashing(false);
        const initialTime = timerType === 'focus' ? focusMinutes * 60 : breakMinutes * 60;
        setTimeLeft(initialTime);
        setActiveJoinedSession(null);
        if (isScheduleActive || isSchedulePrepared) resetSchedule();
        setSessionStartTime(null);
        setCurrentPhaseStartTime(null);
        setAccumulatedFocusSeconds(0);
        setAccumulatedBreakSeconds(0);
      setNotes("");
      setSeshTitle("Notes");
      setActiveAsks([]);

      setCurrentSessionRole(null);
      setCurrentSessionHostName(null);
      setCurrentSessionOtherParticipants([]);
      }
    }
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
    playStartSound();
    setCurrentPhaseStartTime(Date.now());
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
    playStartSound();
    setCurrentPhaseStartTime(Date.now());
  };

  const handleCircularProgressChange = (progress: number) => {
    console.log("CircularProgress is not interactive. Progress change ignored:", progress);
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
  };

  const handleJoinSession = (session: DemoSession) => {
    if (isRunning || isPaused || isScheduleActive || isSchedulePrepared) {
      if (!confirm("A timer or schedule is already active. Do you want to override it and join this session?")) {
        return;
      }
      if (isScheduleActive || isSchedulePrepared) resetSchedule();
      setIsRunning(false);
      setIsPaused(false);
      setIsFlashing(false);
      setAccumulatedFocusSeconds(0);
      setAccumulatedBreakSeconds(0);
      setNotes("");
      setSeshTitle("Notes");
      setActiveAsks([]);
    }

    setActiveJoinedSession(session);
    setActiveJoinedSessionCoworkerCount(session.participants.length);
    setTimerType(session.currentPhase);
    
    const elapsedSecondsInJoinedPhase = Math.floor((Date.now() - session.startTime) / 1000);
    const remainingSecondsInJoinedPhase = Math.max(0, session.currentPhaseDurationMinutes * 60 - elapsedSecondsInJoinedPhase);
    setTimeLeft(remainingSecondsInJoinedPhase);
    
    setIsRunning(true);
    setIsPaused(false);
    setIsFlashing(false);
    setSessionStartTime(Date.now());
    setCurrentPhaseStartTime(Date.now());
    setAccumulatedFocusSeconds(0);
    setAccumulatedBreakSeconds(0);
    toast({
      title: "Session Joined!",
      description: `You've joined "${session.title}".`,
    });

    setCurrentSessionRole('coworker');
    setCurrentSessionHostName(session.participants[0]?.name || session.title);
    setCurrentSessionOtherParticipants(session.participants.filter(p => p.id !== currentUserId));
  };

  const handleJoinCodeSubmit = () => {
    if (joinSessionCode.trim()) {
      toast({
        title: "Joining Session",
        description: `Attempting to join session with code: ${joinSessionCode.trim()}`,
      });
      setJoinSessionCode("");
      setShowJoinInput(false);
    }
  };

  const shouldHideSessionLists = !showSessionsWhileActive && (isRunning || isPaused || isScheduleActive || isSchedulePrepared || isSchedulePending);

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
      const hostSociability = mockNearbySessions.concat(mockFriendsSessions)
        .flatMap(s => s.participants)
        .find(p => p.name === currentSessionHostName)?.sociability || 50;

      participants.push({
        id: "host-id",
        name: currentSessionHostName,
        sociability: hostSociability,
        role: 'host',
      });
    }

    currentSessionOtherParticipants.forEach(p => {
      if (p.id !== currentUserId && p.name !== currentSessionHostName) {
        participants.push({ ...p, role: 'coworker' });
      }
    });

    return participants.sort((a, b) => {
      if (a.id === currentUserId) return -1;
      if (b.id === currentUserId) return 1;
      if (a.role === 'host' && b.role !== 'host') return -1;
      if (a.role !== 'host' && b.role === 'host') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [currentSessionRole, currentSessionHostName, currentSessionOtherParticipants, currentUserId, currentUserName, profile?.sociability, profile?.intention, profile?.bio]);


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

  const handleVotePoll = (pollId: string, optionIds: string[], customOptionText?: string) => {
    const currentAsk = activeAsks.find(ask => ask.id === pollId);
    if (!currentAsk || !('options' in currentAsk)) return;

    let currentPoll = currentAsk as Poll;

    if (customOptionText && customOptionText.trim()) {
      const existingCustomOption = currentPoll.options.find(
        opt => opt.text.toLowerCase() === customOptionText.toLowerCase() && opt.id.startsWith('custom-')
      );

      if (!existingCustomOption) {
        const newCustomOption: PollOption = {
          id: `custom-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          text: customOptionText.trim(),
          votes: [],
        };
        currentPoll = { ...currentPoll, options: [...currentPoll.options, newCustomOption] };
        optionIds = [...optionIds, newCustomOption.id];
      } else {
        if (!optionIds.includes(existingCustomOption.id)) {
          optionIds = [...optionIds, existingCustomOption.id];
        }
      }
    }

    const updatedOptions = currentPoll.options.map(option => {
      let newVotes = option.votes.filter(v => v.userId !== currentUserId);

      if (optionIds.includes(option.id)) {
        newVotes.push({ userId: currentUserId });
      }

      return { ...option, votes: newVotes };
    });

    updateAsk({ ...currentPoll, options: updatedOptions });
  };

  const handleCountdownEnd = useCallback(() => {
    setIsSchedulePending(false);
    setIsScheduleActive(true);
    setIsRunning(true);
    setIsPaused(false);
    setCurrentPhaseStartTime(Date.now());
    toast({
      title: "Schedule Commenced!",
      description: "Your scheduled session has now begun.",
    });

    setCurrentSessionRole('host');
    setCurrentSessionHostName(currentUserName);
    setCurrentSessionOtherParticipants([]);
  }, [setIsSchedulePending, setIsRunning, setIsPaused, setCurrentPhaseStartTime, toast, setCurrentSessionRole, setCurrentSessionHostName, setCurrentSessionOtherParticipants, currentUserName]);

  const currentItemDuration = isScheduleActive && activeSchedule[currentScheduleIndex]
    ? activeSchedule[currentScheduleIndex].durationMinutes
    : (timerType === 'focus' ? focusMinutes : breakMinutes);

  const isActiveTimer = isRunning || isPaused || isFlashing || isScheduleActive || isSchedulePending;

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

      if (targetDate.getTime() < now.getTime() && daysToAdd === 0) {
        targetDate.setDate(targetDate.getDate() + 7);
      }
      return targetDate.getTime();
    }
    return Infinity;
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

  const toggleNearbySessions = () => {
    setShowNearbySessions(prev => {
      const newState = !prev;
      setHiddenNearbyCount(newState ? 0 : mockNearbySessions.length);
      return newState;
    });
  };

  const toggleFriendsSessions = () => {
    setShowFriendsSessions(prev => {
      const newState = !prev;
      setHiddenFriendsCount(newState ? 0 : mockFriendsSessions.length);
      return newState;
    });
  };

  // NEW: Toggle for inactive friends section
  const toggleInactiveFriends = () => {
    setShowInactiveFriends(prev => !prev);
  };

  // DND Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end event
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setInactiveFriendsState((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleNameClick = useCallback(async (userId: string, userName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const targetProfileData = await getPublicProfile(userId, userName);
    if (targetProfileData) {
      openProfilePopUp(targetProfileData.id, targetProfileData.first_name || userName, event.clientX, event.clientY);
    } else {
      openProfilePopUp(userId, userName, event.clientX, event.clientY);
    }
  }, [openProfilePopUp, getPublicProfile]);

  return (
    <>
      <main className="max-w-4xl mx-auto pt-16 px-1 pb-4 lg:pt-20 lg:px-1 lg:pb-6">
        <div className="mb-6">
          <p className="text-muted-foreground">Sync your focus with nearby coworkers</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Timer Section */}
          <div className="space-y-6">
            <div className={`relative rounded-lg border border-border pt-1 pb-8 px-1 text-center transition-colors ${!isPrivate ? 'bg-[hsl(var(--public-bg))]' : 'bg-[hsl(var(--private-bg))]'}`}>
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
                        {!isPrivate ? <>
                            <Globe size={16} />
                            <span className="text-sm font-medium">Public</span>
                          </> : <>
                            <Lock size={16} />
                            <span className="text-sm font-medium">Private</span>
                          </>}
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
                          data-name="Join Session Button"
                        >
                          <Users size={16} />
                          <span className="text-sm font-medium">Join</span>
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center mb-4">
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
                      <div className="shape-octagon w-10 h-10 bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors flex items-center justify-center">
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

                  {!isScheduleActive && !isSchedulePrepared && (
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
                          className="w-16 h-8 text-center" 
                          min={timerIncrement} 
                          max="120" 
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
                          className="w-16 h-8 text-center" 
                          min={timerIncrement} 
                          max="60" 
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

            {/* Active Asks Section */}
            <ActiveAskSection 
              activeAsks={activeAsks} 
              onVoteExtend={handleVoteExtend} 
              onVotePoll={handleVotePoll}
              currentUserId={currentUserId} 
            />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* User Intention Section */}
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
                        // Optional: short press action, e.g., copy to clipboard or show full text
                      }
                    }}
                    data-name="My Intention Text"
                  >
                    {profile.intention}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Notes Section - Always visible */}
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
                  placeholder="Jot down your thoughts, to-do items, or reflections..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[120px] resize-none"
                  onFocus={(e) => e.target.select()}
                  data-name="Notes Textarea"
                />
              </CardContent>
            </Card>

            {/* Coworkers Section - Show only if there are more than just the current user */}
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

            {/* Sessions List */}
            <TooltipProvider>
              {/* Nearby Sessions */}
              {!shouldHideSessionLists && !isPrivate && (
                <div className="mb-6" data-name="Nearby Sessions Section">
                  <button 
                    onClick={toggleNearbySessions} 
                    className="flex items-center justify-between w-full text-lg font-semibold text-foreground mb-3 hover:opacity-80 transition-opacity"
                  >
                    <h3>Nearby</h3>
                    <div className="flex items-center gap-2">
                      {hiddenNearbyCount > 0 && (
                        <span className="text-sm text-muted-foreground">({hiddenNearbyCount})</span>
                      )}
                      {showNearbySessions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </button>
                  {showNearbySessions && (
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
              )}

              {/* Friends Sessions */}
              {!shouldHideSessionLists && (
                <div data-name="Friends Sessions Section">
                  <button 
                    onClick={toggleFriendsSessions} 
                    className="flex items-center justify-between w-full text-lg font-semibold text-foreground mb-3 hover:opacity-80 transition-opacity"
                  >
                    <h3>Friends</h3>
                    <div className="flex items-center gap-2">
                      {hiddenFriendsCount > 0 && (
                        <span className="text-sm text-muted-foreground">({hiddenFriendsCount})</span>
                      )}
                      {showFriendsSessions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </button>
                  {showFriendsSessions && (
                    <div className="space-y-3">
                      {mockFriendsSessions.map(session => (
                        <SessionCard 
                          key={session.id} 
                          session={session} 
                          onJoinSession={handleJoinSession} 
                          onNameClick={handleNameClick}
                        />
                      ))}

                      {/* NEW: Inactive Friends Section - Nested */}
                      <div className="mt-6" data-name="Inactive Friends Section">
                        <button
                          onClick={toggleInactiveFriends}
                          className="relative flex items-center justify-center w-full text-sm font-semibold text-muted-foreground hover:opacity-80 transition-opacity"
                        >
                          <h3>Inactive</h3>
                          {showInactiveFriends ? (
                            <ChevronUp size={16} className="absolute right-2 top-1/2 -translate-y-1/2" />
                          ) : (
                            <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2" />
                          )}
                        </button>
                        {showInactiveFriends && (
                          <div className="space-y-3 mt-3">
                            <DndContext
                              sensors={sensors}
                              collisionDetection={closestCenter}
                              onDragEnd={handleDragEnd}
                            >
                              <SortableContext
                                items={inactiveFriendsState.map(f => f.id)}
                                strategy={verticalListSortingStrategy}
                              >
                                {inactiveFriendsState.map(friend => (
                                  <SortableFriendItem
                                    key={friend.id}
                                    friend={friend}
                                    onNameClick={handleNameClick}
                                  />
                                ))}
                              </SortableContext>
                            </DndContext>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TooltipProvider>
          </div>
        </div>
        {/* Timeline Section (for active schedule) */}
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

        {/* NEW: Upcoming Section (for prepared schedules) */}
        {sortedPreparedSchedules.length > 0 && (
          <div className="mt-8" data-name="Upcoming Section">
            <h3 className="text-xl font-bold text-foreground mb-4">Upcoming Schedules</h3>
            <Accordion type="multiple" className="w-full space-y-4">
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

        {/* Join Session Dialog */}
        <Dialog open={showJoinInput} onOpenChange={setShowJoinInput}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Join Session</DialogTitle>
              <DialogDescription>
                Enter the session code to join an active session.
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