import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CircularProgress } from "@/components/CircularProgress";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Globe, Lock, CalendarPlus, Share2, Square, ChevronDown, ChevronUp, Users } from "lucide-react";
import { useTimer } from "@/contexts/TimerContext";
import { useProfile } from "@/contexts/ProfileContext"; // Ensure useProfile is imported
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
  Dialog, // Import Dialog components
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast"; // Using shadcn toast for UI feedback
import { format } from 'date-fns'; // Import date-fns for time formatting
import { ScheduledTimerTemplate } from "@/types/timer"; // Corrected import path for ScheduledTimerTemplate
import { DAYS_OF_WEEK } from "@/contexts/TimerContext"; // DAYS_OF_WEEK is still exported from TimerContext
import { Accordion } from "@/components/ui/accordion"; // NEW
import UpcomingScheduleAccordionItem from "@/components/UpcomingScheduleAccordionItem"; // NEW
import UpcomingScheduleCardContent from "@/components/UpcomingScheduleCard"; // Renamed import

// Define types for Ask items (copied from TimerContext to ensure consistency)
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
  id: string; // Changed to string
  title: string;
  type: 'focus' | 'break';
  totalDurationMinutes: number;
  currentPhase: 'focus' | 'break';
  currentPhaseDurationMinutes: number; // Added missing property
  startTime: number;
  location: string;
  workspaceImage: "/api/placeholder/200/120";
  workspaceDescription: string;
  participants: { id: string; name: string; sociability: number; intention?: string; bio?: string }[]; // Changed to string
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
      { id: "1", name: "Alex", sociability: 90, intention: "Reviewing differential equations." },
      { id: "2", name: "Sam", sociability: 80, intention: "Working on problem set 3." },
      { id: "3", name: "Taylor", sociability: 90, intention: "Preparing for the midterm exam." },
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
      { id: "4", name: "Morgan", sociability: 20, intention: "Debugging a Python script." },
      { id: "5", name: "Jordan", sociability: 10, intention: "Writing documentation for API." },
      { id: "6", name: "Casey", sociability: 20, intention: "Learning new framework." },
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
      { id: "9", name: "Jamie", sociability: 60, intention: "Reviewing cognitive psychology." },
      { id: "10", name: "Quinn", sociability: 60, intention: "Memorizing key terms." },
      { id: "11", name: "Blake", sociability: 70, intention: "Practicing essay questions." },
      { id: "12", name: "Drew", sociability: 60, intention: "Summarizing research papers." },
      { id: "13", name: "Chris", sociability: 50, intention: "Creating flashcards." },
      { id: "14", name: "Pat", sociability: 55, intention: "Discussing theories." },
      { id: "15", name: "Taylor", sociability: 65, intention: "Collaborating on study guide." },
      { id: "16", name: "Jess", sociability: 70, intention: "Peer teaching." },
    ],
  },
];

const Index = () => {
  const {
    // Current homepage timer values and their setters
    focusMinutes,
    setHomepageFocusMinutes,
    breakMinutes,
    setHomepageBreakMinutes,
    // Default timer values from settings
    defaultFocusMinutes,
    defaultBreakMinutes,

    isRunning,
    setIsRunning,
    isPaused,
    setIsPaused,
    timeLeft,
    setTimeLeft,
    timerType, // Get timerType from context
    setTimerType,
    isFlashing,
    setIsFlashing,
    notes,
    setNotes,
    seshTitle, // Get seshTitle from context
    setSeshTitle, // Get setSeshTitle from context
    isSeshTitleCustomized, // NEW: Get customization flag
    formatTime,
    showSessionsWhileActive,
    timerIncrement,
    
    schedule, // Keep schedule for editing in ScheduleForm
    activeSchedule, // NEW: Use activeSchedule for Timeline
    activeTimerColors, // NEW: Use activeTimerColors for Timeline
    currentScheduleIndex,
    isSchedulingMode,
    setIsSchedulingMode,
    isScheduleActive,
    setIsScheduleActive, // Destructure setIsScheduleActive
    isSchedulePrepared, // NEW: Derived state from preparedSchedules.length > 0
    startSchedule,
    commenceSpecificPreparedSchedule, // NEW: Function to commence a specific prepared schedule
    discardPreparedSchedule, // NEW: Function to discard a specific prepared schedule
    resetSchedule,
    scheduleTitle, // This is the title for the schedule being *edited*
    commenceTime, // This is the commenceTime for the schedule being *edited*
    commenceDay, // This is the commenceDay for the schedule being *edited*
    isGlobalPrivate,
    activeScheduleDisplayTitle, // NEW: Get activeScheduleDisplayTitle

    // New session tracking states and functions
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

    // Active Asks from TimerContext
    activeAsks,
    addAsk,
    updateAsk,

    // New: Schedule pending state (for the *active* schedule)
    isSchedulePending,
    setIsSchedulePending,
    scheduleStartOption, // Get scheduleStartOption from context
    is24HourFormat, // NEW: Get is24HourFormat from context

    preparedSchedules, // NEW: Get the array of prepared schedules

    // NEW: Host/Coworker role states
    currentSessionRole,
    setCurrentSessionRole,
    currentSessionHostName,
    setCurrentSessionHostName,
    currentSessionOtherParticipants,
    setCurrentSessionOtherParticipants,
  } = useTimer();
  
  const { profile, loading: profileLoading, localFirstName, saveSession } = useProfile(); // Get saveSession from useProfile
  const navigate = useNavigate();

  const [isPrivate, setIsPrivate] = useState(isGlobalPrivate);
  const longPressRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);
  const [activeJoinedSession, setActiveJoinedSession] = useState<DemoSession | null>(null);
  const [isHoveringTimer, setIsHoveringTimer] = useState(false); // NEW: State for timer hover

  const currentUserId = profile?.id || "mock-user-id-123"; 
  const currentUserName = profile?.first_name || localFirstName || "You"; // Use localFirstName as fallback

  // State for editable Sesh Title
  const [isEditingSeshTitle, setIsEditingSeshTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // NEW: States for Nearby/Friends session list visibility
  const [showNearbySessions, setShowNearbySessions] = useState(true);
  const [showFriendsSessions, setShowFriendsSessions] = useState(true);
  const [hiddenNearbyCount, setHiddenNearbyCount] = useState(0);
  const [hiddenFriendsCount, setHiddenFriendsCount] = useState(0);

  // NEW: State for Join input box visibility and value
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [joinSessionCode, setJoinSessionCode] = useState("");

  // Effect to update local isPrivate when isGlobalPrivate changes
  useEffect(() => {
    setIsPrivate(isGlobalPrivate);
  }, [isGlobalPrivate]);

  // Effect to focus the input when isEditingSeshTitle becomes true
  useEffect(() => {
    if (isEditingSeshTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select(); // Select the text when focused
    }
  }, [isEditingSeshTitle]);

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
    isLongPress.current = false; // Reset long press flag
    // Removed setIsHoveringTimer(false) from here, now handled by onMouseLeave on the specific div
  };
  
  const handlePublicPrivateToggle = () => {
    if (isLongPress.current) {
      setIsPrivate(!isPrivate);
    } else {
      // Removed the confirm dialog here
      setIsPrivate(!isPrivate);
    }
  };

  const handleIntentionLongPress = () => {
    if (isLongPress.current) {
      navigate('/profile');
    }
  };

  // Handlers for Sesh Title editing
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
        setSeshTitle("Notes"); // Revert to default if empty
      }
    }
  };

  const handleTitleInputBlur = () => {
    setIsEditingSeshTitle(false);
    if (seshTitle.trim() === "") {
      setSeshTitle("Notes"); // Revert to default if empty
    }
  };

  const handleTitleLongPress = () => {
    if (isLongPress.current) {
      setIsEditingSeshTitle(true);
    }
  };
  
  const startNewManualTimer = () => { // Renamed to be explicit
    if (isRunning || isPaused || isScheduleActive || isSchedulePrepared) { // Only check for actively running/paused manual timer or immediate schedule
      if (!confirm("A timer or schedule is already active. Do you want to override it and start a new manual timer?")) {
        return;
      }
      // If confirmed, reset existing schedule/timer before starting new one
      if (isScheduleActive || isSchedulePrepared) resetSchedule(); // Reset any active or prepared schedule
      setIsRunning(false);
      setIsPaused(false);
      setIsFlashing(false);
      setAccumulatedFocusSeconds(0);
      setAccumulatedBreakSeconds(0);
      setNotes("");
      setSeshTitle("Notes"); // Use the public setter, which will also set isSeshTitleCustomized(false)
    }

    playStartSound();
    setIsRunning(true);
    setIsPaused(false);
    setIsFlashing(false);
    setSessionStartTime(Date.now()); // Record overall session start time
    setCurrentPhaseStartTime(Date.now()); // Record current phase start time
    setAccumulatedFocusSeconds(0);
    setAccumulatedBreakSeconds(0);
    // Use current homepage timer values
    setTimeLeft(focusMinutes * 60); // Use current focusMinutes

    // NEW: Set role to host
    setCurrentSessionRole('host');
    setCurrentSessionHostName(currentUserName);
    setCurrentSessionOtherParticipants([]);
  };

  const resumeTimer = () => {
    playStartSound(); // Optional, but good for consistency
    setIsRunning(true);
    setIsPaused(false);
    // If a schedule was pending and now resuming, ensure currentPhaseStartTime is set
    if (isScheduleActive && isSchedulePending) {
      setIsSchedulePending(false); // No longer pending, now running
      setCurrentPhaseStartTime(Date.now());
      toast({
        title: "Schedule Resumed!",
        description: `"${activeScheduleDisplayTitle}" has resumed.`,
      });
    } else if (currentPhaseStartTime === null) {
      // If it was a manual timer paused, restart phase tracking
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
      setCurrentPhaseStartTime(null); // Reset phase start time
    }
    setIsPaused(true);
    setIsRunning(false);
  };
  
  const stopTimer = async () => {
    // Calculate final accumulated times before saving
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
      // Reset timer states after saving
      setIsRunning(false);
      setIsPaused(false);
      setIsFlashing(false);
      setTimerType('focus'); // Reset to default focus type
      // Use current homepage timer values
      setTimeLeft(focusMinutes * 60); // Reset to current focus time
      setActiveJoinedSession(null);
      if (isScheduleActive || isSchedulePrepared) resetSchedule(); // Reset any active or prepared schedule
      setSessionStartTime(null);
      setCurrentPhaseStartTime(null);
      setAccumulatedFocusSeconds(0);
      setAccumulatedBreakSeconds(0);
      setNotes("");
      setSeshTitle("Notes"); // Use the public setter, which will also set isSeshTitleCustomized(false)

      // NEW: Reset role states
      setCurrentSessionRole(null);
      setCurrentSessionHostName(null);
      setCurrentSessionOtherParticipants([]);
    };

    const handleSaveAndStop = async () => {
      if (totalSessionSeconds < 30) {
        toast({
          title: "Session Too Short",
          description: "Sessions shorter than 30 seconds are not saved to history.",
          variant: "destructive",
        });
      } else {
        await saveSession(
          seshTitle,
          notes,
          finalAccumulatedFocus,
          finalAccumulatedBreak,
          totalSessionSeconds,
          activeJoinedSessionCoworkerCount,
          sessionStartTime || Date.now() // Use sessionStartTime or current time if null
        );
      }
      await performStopActions();
    };

    if (longPressRef.current) {
      // Long press: save without confirmation
      await handleSaveAndStop();
    } else {
      // Regular click: ask for confirmation
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
      // Use current homepage timer values
      const initialTime = timerType === 'focus' ? focusMinutes * 60 : breakMinutes * 60; // Use current homepage values
      setTimeLeft(initialTime);
      setActiveJoinedSession(null);
      if (isScheduleActive || isSchedulePrepared) resetSchedule(); // Reset any active or prepared schedule
      setSessionStartTime(null);
      setCurrentPhaseStartTime(null); // Reset current phase start time
      setAccumulatedFocusSeconds(0);
      setAccumulatedBreakSeconds(0);
      setNotes("");
      setSeshTitle("Notes"); // Use the public setter, which will also set isSeshTitleCustomized(false)

      // NEW: Reset role states
      setCurrentSessionRole(null);
      setCurrentSessionHostName(null);
      setCurrentSessionOtherParticipants([]);
    } else {
      if (confirm('Are you sure you want to reset the timer?')) {
        setIsRunning(false);
        setIsPaused(false);
        setIsFlashing(false);
        // Use current homepage timer values
        const initialTime = timerType === 'focus' ? focusMinutes * 60 : breakMinutes * 60; // Use current homepage values
        setTimeLeft(initialTime);
        setActiveJoinedSession(null);
        if (isScheduleActive || isSchedulePrepared) resetSchedule(); // Reset any active or prepared schedule
        setSessionStartTime(null);
        setCurrentPhaseStartTime(null); // Reset current phase start time
        setAccumulatedFocusSeconds(0);
        setAccumulatedBreakSeconds(0);
      setNotes("");
      setSeshTitle("Notes"); // Use the public setter, which will also set isSeshTitleCustomized(false)

      // NEW: Reset role states
      setCurrentSessionRole(null);
      setCurrentSessionHostName(null);
      setCurrentSessionOtherParticipants([]);
      }
    }
  };

  const switchToBreak = () => {
    // Accumulate time for the phase just ended
    if (currentPhaseStartTime !== null) {
      const elapsed = (Date.now() - currentPhaseStartTime) / 1000;
      setAccumulatedFocusSeconds((prev: number) => prev + elapsed);
    }
    setTimerType('break');
    setTimeLeft(breakMinutes * 60);
    setIsFlashing(false);
    setIsRunning(true);
    playStartSound();
    setCurrentPhaseStartTime(Date.now()); // Start new phase timer
  };

  const switchToFocus = () => {
    // Accumulate time for the phase just ended
    if (currentPhaseStartTime !== null) {
      const elapsed = (Date.now() - currentPhaseStartTime) / 1000;
      setAccumulatedBreakSeconds((prev: number) => prev + elapsed);
    }
    setTimerType('focus');
    setTimeLeft(focusMinutes * 60);
    setIsFlashing(false);
    setIsRunning(true);
    playStartSound();
    setCurrentPhaseStartTime(Date.now()); // Start new phase timer
  };

  const handleCircularProgressChange = (progress: number) => {
    // This function is no longer needed as the CircularProgress is not interactive.
    // However, to avoid breaking existing logic that might call it, we can keep it
    // as a no-op or remove it if it's truly unused. For now, I'll keep it as a no-op.
    console.log("CircularProgress is not interactive. Progress change ignored:", progress);
  };

  const handleModeToggle = (mode: 'focus' | 'break') => {
    if (isRunning || isPaused || isScheduleActive || isSchedulePrepared) return; // Prevent interaction if schedule is active or prepared

    if (mode === 'focus') {
      setTimerType('focus');
      setTimeLeft(focusMinutes * 60);
    } else {
      setTimerType('break');
      setTimeLeft(breakMinutes * 60);
    }
  };

  const handleJoinSession = (session: DemoSession) => {
    if (isRunning || isPaused || isScheduleActive || isSchedulePrepared) { // Check for prepared schedule too
      if (!confirm("A timer or schedule is already active. Do you want to override it and join this session?")) {
        return;
      }
      // If confirmed, reset existing schedule/timer before joining new one
      if (isScheduleActive || isSchedulePrepared) resetSchedule(); // Reset any active or prepared schedule
      setIsRunning(false);
      setIsPaused(false);
      setIsFlashing(false);
      setAccumulatedFocusSeconds(0);
      setAccumulatedBreakSeconds(0);
      setNotes("");
      setSeshTitle("Notes"); // Use the public setter, which will also set isSeshTitleCustomized(false)
    }

    setActiveJoinedSession(session);
    setActiveJoinedSessionCoworkerCount(session.participants.length); // Set coworker count
    setTimerType(session.currentPhase);
    
    // Calculate remaining time based on session's start time and current phase duration
    const elapsedSecondsInJoinedPhase = Math.floor((Date.now() - session.startTime) / 1000);
    const remainingSecondsInJoinedPhase = Math.max(0, session.currentPhaseDurationMinutes * 60 - elapsedSecondsInJoinedPhase);
    setTimeLeft(remainingSecondsInJoinedPhase); // Set timer to continue from where the session was
    
    setIsRunning(true);
    setIsPaused(false);
    setIsFlashing(false);
    setSessionStartTime(Date.now()); // Record overall session start time for *this user*
    setCurrentPhaseStartTime(Date.now()); // Record current phase start time for *this user*
    setAccumulatedFocusSeconds(0); // Reset personal accumulated focus time
    setAccumulatedBreakSeconds(0); // Reset personal accumulated break time
    toast({
      title: "Session Joined!",
      description: `You've joined "${session.title}".`,
    });

    // NEW: Set role to coworker
    setCurrentSessionRole('coworker');
    // Assuming the first participant in the demo session is the host
    setCurrentSessionHostName(session.participants[0]?.name || session.title);
    // Filter out the current user from the participants list to get other coworkers
    setCurrentSessionOtherParticipants(session.participants.filter(p => p.id !== currentUserId));
  };

  const handleJoinCodeSubmit = () => {
    if (joinSessionCode.trim()) {
      toast({
        title: "Joining Session",
        description: `Attempting to join session with code: ${joinSessionCode.trim()}`,
      });
      // In a real application, you would send this code to your backend
      // to validate and join the user to the corresponding session.
      setJoinSessionCode(""); // Clear input after attempt
      setShowJoinInput(false); // Hide input after attempt
    }
  };

  const shouldHideSessionLists = !showSessionsWhileActive && (isRunning || isPaused || isScheduleActive || isSchedulePrepared || isSchedulePending); // Check for prepared schedule too

  // NEW: Use currentSessionOtherParticipants for display
  const displayParticipants = useMemo(() => {
    if (currentSessionRole === 'host') {
      return currentSessionOtherParticipants; // Should be empty initially
    } else if (currentSessionRole === 'coworker') {
      return currentSessionOtherParticipants;
    }
    return [];
  }, [currentSessionRole, currentSessionOtherParticipants]);


  const handleExtendSubmit = (minutes: number) => {
    const newSuggestion: ExtendSuggestion = {
      id: `extend-${Date.now()}`,
      minutes,
      creator: currentUserName,
      votes: [],
      status: 'pending',
    };
    addAsk(newSuggestion); // Use context function
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
    addAsk(newPoll); // Use context function
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
    
    const totalParticipants = (activeJoinedSessionCoworkerCount || 0) + (currentSessionRole === 'host' ? 1 : 0); // If hosting, count self. If joined, activeJoinedSessionCoworkerCount already includes host.
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

    updateAsk({ // Use context function
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
        optionIds = [...optionIds, existingCustomOption.id];
      }
    }

    const updatedOptions = currentPoll.options.map(option => {
      if (currentPoll.type === 'choice' || currentPoll.type === 'closed') {
        option.votes = option.votes.filter(v => v.userId === currentUserId); // Filter out current user's previous vote
      }

      if (optionIds.includes(option.id)) {
        if (!option.votes.some(v => v.userId === currentUserId)) {
          return { ...option, votes: [...option.votes, { userId: currentUserId }] };
        }
      } else {
        if (currentPoll.type === 'selection') {
          return { ...option, votes: option.votes.filter(v => v.userId !== currentUserId) };
        }
      }
      return option;
    });
    
    updateAsk({ ...currentPoll, options: updatedOptions }); // Use context function
  };

  // Callback for when the schedule countdown ends in Timeline
  const handleCountdownEnd = useCallback(() => {
    setIsSchedulePending(false);
    setIsScheduleActive(true); // Now it's actively running
    setIsRunning(true);
    setIsPaused(false);
    // playStartSound(); // Play sound when schedule actually starts
    setCurrentPhaseStartTime(Date.now()); // Start the first phase timer
    toast({
      title: "Schedule Commenced!",
      description: "Your scheduled session has now begun.",
    });

    // NEW: Set role to host when schedule starts
    setCurrentSessionRole('host');
    setCurrentSessionHostName(currentUserName);
    setCurrentSessionOtherParticipants([]);
  }, [setIsSchedulePending, setIsRunning, setIsPaused, setCurrentPhaseStartTime, toast, setCurrentSessionRole, setCurrentSessionHostName, setCurrentSessionOtherParticipants, currentUserName]);

  // Determine the total duration of the current timer phase for CircularProgress
  const currentItemDuration = isScheduleActive && activeSchedule[currentScheduleIndex] // Use activeSchedule here
    ? activeSchedule[currentScheduleIndex].durationMinutes // Use activeSchedule here
    : (timerType === 'focus' ? focusMinutes : breakMinutes);

  // Determine if the timer is in an active state (running, paused, flashing, or part of a schedule)
  const isActiveTimer = isRunning || isPaused || isFlashing || isScheduleActive || isSchedulePending; // Check for prepared schedule too

  // Helper function to get the effective start timestamp for sorting
  const getEffectiveStartTime = useCallback((template: ScheduledTimerTemplate, now: Date): number => {
    if (template.scheduleStartOption === 'manual') {
      // Manual schedules are ready to start immediately, place them at the very beginning
      return -Infinity; 
    } else if (template.scheduleStartOption === 'custom_time') {
      const [hours, minutes] = template.commenceTime.split(':').map(Number);
      let targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);

      const currentDay = now.getDay();
      const templateDay = template.commenceDay === null ? currentDay : template.commenceDay;
      const daysToAdd = (templateDay - currentDay + 7) % 7;
      targetDate.setDate(now.getDate() + daysToAdd);

      // If the target time is in the past for today, set it for next week
      if (targetDate.getTime() < now.getTime() && daysToAdd === 0) {
        targetDate.setDate(targetDate.getDate() + 7);
      }
      return targetDate.getTime();
    }
    return Infinity; // Should not happen for prepared schedules
  }, []);

  // NEW: Sort prepared schedules chronologically
  const sortedPreparedSchedules = useMemo(() => {
    const now = new Date();
    return [...preparedSchedules].sort((a, b) => {
      const timeA = getEffectiveStartTime(a, now);
      const timeB = getEffectiveStartTime(b, now);

      if (timeA === timeB) {
        // If times are identical (e.g., both manual), sort by title for stable order
        return a.title.localeCompare(b.title);
      }
      return timeA - timeB;
    });
  }, [preparedSchedules, getEffectiveStartTime]);

  // Handlers for toggling Nearby/Friends sections
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

  return (
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
                    
                    {isActiveTimer ? ( // Conditionally render Share Dropdown
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
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-muted-foreground" onClick={() => console.log('Share QR')} data-name="Share QR Option">QR</DropdownMenuItem>
                          <DropdownMenuItem className="text-muted-foreground" onClick={() => console.log('Share Link')} data-name="Share Link Option">Link</DropdownMenuItem>
                          <DropdownMenuItem className="text-muted-foreground" onClick={() => console.log('Share NFC')} data-name="Share NFC Option">NFC</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : ( // Render Join button and input when no timer is active
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowJoinInput(true)} // Open the dialog
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
                      <div className="h-10 flex items-center" data-name="Time Left Display"> {/* Fixed height for time display */}
                        {formatTime(timeLeft)}
                      </div>
                      {isHoveringTimer && isActiveTimer && (
                        <p className="absolute top-full mt-1 text-xs text-muted-foreground whitespace-nowrap" data-name="Estimated End Time"> {/* Absolute positioning */}
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
                          // If there are prepared schedules, and one is pending, commence it.
                          // If multiple, this button should probably not be here or should open a selection.
                          // For now, we'll assume the user will use the UpcomingScheduleCard's commence button.
                          // This button will only start a manual timer if no schedule is active/prepared.
                          startNewManualTimer(); 
                        } else if (isRunning) {
                          pauseTimer();
                        } else if (isPaused) {
                          resumeTimer();
                        } else {
                          startNewManualTimer(); // Call the new explicit function for starting a fresh timer
                        }
                      }}
                      data-name={`${isRunning ? 'Pause' : (isPaused ? 'Resume' : 'Start')} Timer Button`}
                    >
                      {isRunning ? 'Pause' : (isPaused ? 'Resume' : 'Start')}
                    </Button>
                  )}
                </div>

                {(isPaused || isRunning || isScheduleActive || isSchedulePrepared || isSchedulePending) && ( // Show stop button if pending or prepared
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
                          isPaused ? "text-red-500" : "text-secondary-foreground" // Conditional red color
                        )}
                        data-name="Stop Timer Button"
                      >
                        <Square size={16} fill="currentColor" /> {/* Solid Square icon */}
                      </Button>
                    </div>
                  </div>
                )}

                {!isScheduleActive && !isSchedulePrepared && ( // Hide timer settings if schedule is active or prepared
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
                            setHomepageFocusMinutes(defaultFocusMinutes); // Use defaultFocusMinutes here
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
                            setHomepageBreakMinutes(defaultBreakMinutes); // Use defaultBreakMinutes here
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
            onVotePoll={handleVotePoll} // Corrected prop here
            currentUserId={currentUserId} 
          />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* User Intention Section */}
          {!profileLoading && profile?.intention && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">My Intention</CardTitle>
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
            <CardHeader className="pb-2"> {/* Reduced bottom padding */}
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

          {/* Coworkers Section - Show when running or paused */}
          {(isRunning || isPaused || isScheduleActive || isSchedulePrepared || isSchedulePending) && (currentSessionRole !== null) && ( // Show if pending or prepared and a role is assigned
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Coworkers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {currentSessionRole === 'host' && (
                  <div className="flex items-center justify-between p-2 rounded-md bg-muted text-foreground font-medium select-none">
                    <span>You</span>
                    <span className="text-sm text-muted-foreground">Host</span>
                  </div>
                )}
                {currentSessionRole === 'coworker' && currentSessionHostName && (
                  <div className="flex items-center justify-between p-2 rounded-md bg-muted text-foreground font-medium select-none">
                    <span>{currentSessionHostName}</span>
                    <span className="text-sm text-muted-foreground">Host</span>
                  </div>
                )}
                {currentSessionRole === 'coworker' && (
                  <div className="flex items-center justify-between p-2 rounded-md bg-muted text-foreground font-medium select-none">
                    <span>You</span>
                    <span className="text-sm text-muted-foreground">Coworker</span>
                  </div>
                )}
                {displayParticipants.map(participant => (
                  <Tooltip key={participant.id}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-default select-none" data-name={`Coworker: ${participant.name}`}>
                        <span className="font-medium text-foreground">{participant.name}</span>
                        <span className="text-sm text-muted-foreground">Sociability: {participant.sociability}%</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-center max-w-xs">
                        <p className="font-medium mb-1">{participant.name}</p>
                        <p className="text-sm text-muted-foreground">Sociability: {participant.sociability}%</p>
                        {participant.intention && (
                          <p className="text-xs text-muted-foreground mt-1">Intention: {participant.intention}</p>
                        )}
                        {timerType === 'break' && (
                          <>
                            <p className="text-xs text-muted-foreground mt-2">Bio: {participant.bio}</p>
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
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </TooltipProvider>
        </div>
      </div>
      {/* Timeline Section (for active schedule) */}
      {isScheduleActive && ( // Show only if active
        <div className="mt-8" data-name="Timeline Section"> {/* Add some top margin for separation */}
          <Timeline
            schedule={activeSchedule} // NEW: Pass activeSchedule
            currentScheduleIndex={currentScheduleIndex}
            timeLeft={timeLeft}
            commenceTime={commenceTime} // This will be from the active schedule's original template
            commenceDay={commenceDay === null ? new Date().getDay() : commenceDay} // This will be from the active schedule's original template
            isSchedulePending={isSchedulePending} // Keep this prop for Timeline's internal logic
            onCountdownEnd={handleCountdownEnd}
            timerColors={activeTimerColors} // NEW: Pass activeTimerColors
          />
        </div>
      )}

      {/* NEW: Upcoming Section (for prepared schedules) */}
      {sortedPreparedSchedules.length > 0 && (
        <div className="mt-8" data-name="Upcoming Section">
          <h3 className="text-xl font-bold text-foreground mb-4">Upcoming Schedules</h3>
          <Accordion type="multiple" className="w-full space-y-4"> {/* Use Accordion here */}
            {sortedPreparedSchedules.map((template) => (
              <UpcomingScheduleAccordionItem
                key={template.id}
                template={template}
                commencePreparedSchedule={() => commenceSpecificPreparedSchedule(template.id)}
                discardPreparedSchedule={() => discardPreparedSchedule(template.id)}
                showCommenceButton={!isActiveTimer} // Pass the condition
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
  );
};
export default Index;