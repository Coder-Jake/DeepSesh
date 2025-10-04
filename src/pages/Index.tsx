import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CircularProgress } from "@/components/CircularProgress";
import { useState, useRef, useEffect, useCallback } from "react";
import { Globe, Lock, CalendarPlus, Share2, Square } from "lucide-react";
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
import { toast } from "@/hooks/use-toast"; // Using shadcn toast for UI feedback

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
  id: number;
  title: string;
  type: 'focus' | 'break';
  totalDurationMinutes: number;
  currentPhase: 'focus' | 'break';
  currentPhaseDurationMinutes: number; // Added missing property
  startTime: number;
  location: string;
  workspaceImage: string;
  workspaceDescription: string;
  participants: { id: number; name: string; sociability: number; intention?: string; bio?: string }[];
}

const mockNearbySessions: DemoSession[] = [
  {
    id: 101,
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
      { id: 1, name: "Alex", sociability: 90, intention: "Reviewing differential equations." },
      { id: 2, name: "Sam", sociability: 80, intention: "Working on problem set 3." },
      { id: 3, name: "Taylor", sociability: 90, intention: "Preparing for the midterm exam." },
    ],
  },
  {
    id: 102,
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
      { id: 4, name: "Morgan", sociability: 20, intention: "Debugging a Python script." },
      { id: 5, name: "Jordan", sociability: 10, intention: "Writing documentation for API." },
      { id: 6, name: "Casey", sociability: 20, intention: "Learning new framework." },
      { id: 7, name: "Riley", sociability: 20, intention: "Code refactoring." },
      { id: 8, name: "Avery", sociability: 30, intention: "Designing database schema." },
    ],
  },
];

const mockFriendsSessions: DemoSession[] = [
  {
    id: 201,
    title: "Psychology 101 Final Review",
    type: "focus",
    totalDurationMinutes: 90,
    currentPhase: "break",
    currentPhaseDurationMinutes: 15,
    startTime: Date.now() - (10.66 * 60 * 1000),
    location: "Main Library - Study Room 12",
    workspaceImage: "/api/placeholder/200/120",
    workspaceDescription: "Private group study room",
    participants: [
      { id: 9, name: "Jamie", sociability: 60, intention: "Reviewing cognitive psychology." },
      { id: 10, name: "Quinn", sociability: 60, intention: "Memorizing key terms." },
      { id: 11, name: "Blake", sociability: 70, intention: "Practicing essay questions." },
      { id: 12, name: "Drew", sociability: 60, intention: "Summarizing research papers." },
      { id: 13, name: "Chris", sociability: 50, intention: "Creating flashcards." },
      { id: 14, name: "Pat", sociability: 55, intention: "Discussing theories." },
      { id: 15, name: "Taylor", sociability: 65, intention: "Collaborating on study guide." },
      { id: 16, name: "Jess", sociability: 70, intention: "Peer teaching." },
    ],
  },
];

const Index = () => {
  const {
    focusMinutes,
    setFocusMinutes,
    breakMinutes,
    setBreakMinutes,
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
    seshTitle, // Get seshTitle from context
    setSeshTitle, // Get setSeshTitle from context
    formatTime,
    showSessionsWhileActive,
    timerIncrement,
    
    schedule,
    currentScheduleIndex,
    isSchedulingMode,
    setIsSchedulingMode,
    isScheduleActive,
    startSchedule,
    resetSchedule,
    scheduleTitle,
    commenceTime,
    commenceDay, // Now can be null
    isGlobalPrivate,

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
    // saveSessionToHistory, // REMOVED from useTimer destructuring

    // Active Asks from TimerContext
    activeAsks,
    addAsk,
    updateAsk,

    // New: Schedule pending state
    isSchedulePending,
    setIsSchedulePending,
    scheduleStartOption, // Get scheduleStartOption from context
  } = useTimer();
  
  const { profile, loading: profileLoading, localFirstName, saveSession } = useProfile(); // Get saveSession from useProfile
  const navigate = useNavigate();

  const [isPrivate, setIsPrivate] = useState(isGlobalPrivate);
  const longPressRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);
  const [activeJoinedSession, setActiveJoinedSession] = useState<DemoSession | null>(null);
  // Removed local activeAsks state, now using context

  const currentUserId = profile?.id || "mock-user-id-123"; 
  const currentUserName = profile?.first_name || localFirstName || "You"; // Use localFirstName as fallback

  // State for editable Sesh Title
  const [isEditingSeshTitle, setIsEditingSeshTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

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
  };
  
  const handlePublicPrivateToggle = () => {
    if (isLongPress.current) {
      setIsPrivate(!isPrivate);
    } else {
      if (confirm(`Switch to ${isPrivate ? 'Public' : 'Private'} mode?`)) {
        setIsPrivate(!isPrivate);
      }
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
  
  const startTimer = () => {
    if (!isRunning && !isPaused) {
      playStartSound();
      setIsRunning(true);
      setIsPaused(false);
      setIsFlashing(false);
      setSessionStartTime(Date.now()); // Record overall session start time
      setCurrentPhaseStartTime(Date.now()); // Record current phase start time
      setAccumulatedFocusSeconds(0);
      setAccumulatedBreakSeconds(0);
    } else if (isPaused) {
      setIsRunning(true);
      setIsPaused(false);
      setCurrentPhaseStartTime(Date.now()); // Resume current phase timer
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
      await saveSession(
        seshTitle,
        notes,
        finalAccumulatedFocus,
        finalAccumulatedBreak,
        totalSessionSeconds,
        activeJoinedSessionCoworkerCount,
        sessionStartTime || Date.now() // Use sessionStartTime or current time if null
      );
      // Reset timer states after saving
      setIsRunning(false);
      setIsPaused(false);
      setIsFlashing(false);
      setTimerType('focus'); // Reset to default focus type
      setTimeLeft(focusMinutes * 60); // Reset to default focus time
      setActiveJoinedSession(null);
      if (isScheduleActive) resetSchedule();
      setSessionStartTime(null);
      setCurrentPhaseStartTime(null);
      setAccumulatedFocusSeconds(0);
      setAccumulatedBreakSeconds(0);
      setNotes("");
      setSeshTitle("Notes");
    };

    if (longPressRef.current) {
      // Long press: save without confirmation
      await performStopActions();
    } else {
      // Regular click: ask for confirmation
      if (confirm('Are you sure you want to stop the timer?')) {
        await performStopActions();
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
      if (isScheduleActive) resetSchedule();
      setSessionStartTime(null);
      setCurrentPhaseStartTime(null);
      setAccumulatedFocusSeconds(0);
      setAccumulatedBreakSeconds(0);
      setNotes("");
      setSeshTitle("Notes");
    } else {
      if (confirm('Are you sure you want to reset the timer?')) {
        setIsRunning(false);
        setIsPaused(false);
        setIsFlashing(false);
        const initialTime = timerType === 'focus' ? focusMinutes * 60 : breakMinutes * 60;
        setTimeLeft(initialTime);
        setActiveJoinedSession(null);
        if (isScheduleActive) resetSchedule();
        setSessionStartTime(null);
        setCurrentPhaseStartTime(0); // Reset current phase start time
        setAccumulatedFocusSeconds(0);
        setAccumulatedBreakSeconds(0);
        setNotes("");
        setSeshTitle("Notes");
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
    if (isRunning || isPaused || isFlashing || isScheduleActive) return; // Prevent interaction if schedule is active
    
    if (timerType === 'focus') {
      const minutes = (progress / 100) * 120;
      const actualMinutes = Math.max(timerIncrement, Math.round(minutes / timerIncrement) * timerIncrement);
      setFocusMinutes(actualMinutes);
      setTimeLeft(actualMinutes * 60);
    } else {
      const minutes = (progress / 100) * 30;
      const actualMinutes = Math.max(timerIncrement, Math.round(minutes / timerIncrement) * timerIncrement);
      setBreakMinutes(actualMinutes);
      setTimeLeft(actualMinutes * 60);
    }
  };

  const handleModeToggle = (mode: 'focus' | 'break') => {
    if (isRunning || isPaused || isScheduleActive) return; // Prevent interaction if schedule is active

    if (mode === 'focus') {
      setTimerType('focus');
      setTimeLeft(focusMinutes * 60);
    } else {
      setTimerType('break');
      setTimeLeft(breakMinutes * 60);
    }
  };

  const handleJoinSession = (session: DemoSession) => {
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
  };

  const shouldHideSessionLists = !showSessionsWhileActive && (isRunning || isPaused || isScheduleActive || isSchedulePending);

  const currentCoworkers = activeJoinedSession ? activeJoinedSession.participants : [];

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
    
    const totalParticipants = (activeJoinedSession?.participants.length || 0) + 1; 
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
    setIsRunning(true);
    setIsPaused(false);
    // playStartSound(); // Play sound when schedule actually starts
    setCurrentPhaseStartTime(Date.now()); // Start the first phase timer
    toast({
      title: "Schedule Commenced!",
      description: "Your scheduled session has now begun.",
    });
  }, [setIsSchedulePending, setIsRunning, setIsPaused, setCurrentPhaseStartTime, toast]);

  // Determine the total duration of the current timer phase for CircularProgress
  const currentItemDuration = isScheduleActive && schedule[currentScheduleIndex]
    ? schedule[currentScheduleIndex].durationMinutes
    : (timerType === 'focus' ? focusMinutes : breakMinutes);

  // Determine the background color for the CircularProgress
  const circularProgressBackgroundColor = timerType === 'focus' 
    ? 'hsl(var(--focus-bg-light))' 
    : 'hsl(var(--break-bg-light))';

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
                    >
                      {!isPrivate ? <>
                          <Globe size={16} />
                          <span className="text-sm font-medium">Public</span>
                        </> : <>
                          <Lock size={16} />
                          <span className="text-sm font-medium">Private</span>
                        </>}
                    </button>
                    
                    {/* Share Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="flex items-center gap-2 px-3 py-1 rounded-full border border-border hover:bg-muted transition-colors"
                        >
                          <Share2 size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-muted-foreground" onClick={() => console.log('Share QR')}>QR</DropdownMenuItem>
                        <DropdownMenuItem className="text-muted-foreground" onClick={() => console.log('Share Link')}>Link</DropdownMenuItem>
                        <DropdownMenuItem className="text-muted-foreground" onClick={() => console.log('Share NFC')}>NFC</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <div className="flex justify-center mb-4">
                  <CircularProgress
                    size={280}
                    strokeWidth={12}
                    progress={(timeLeft / (currentItemDuration * 60)) * 100}
                    interactive={!isRunning && !isPaused && !isFlashing && !isScheduleActive} // Removed isSchedulePending
                    onInteract={handleCircularProgressChange}
                    className={isFlashing ? 'animate-pulse' : ''}
                    backgroundColor={circularProgressBackgroundColor} // Pass the dynamic background color
                  >
                    <div className={`text-4xl font-mono font-bold text-foreground transition-all duration-300 ${isFlashing ? 'scale-110' : ''} select-none`}>
                      {formatTime(timeLeft)}
                    </div>
                  </CircularProgress>
                </div>
                
                <div className="flex gap-3 justify-center mb-6">
                  {isFlashing ? (
                    <Button size="lg" className="px-8" onClick={timerType === 'focus' ? switchToBreak : switchToFocus}>
                      Start {timerType === 'focus' ? 'Break' : 'Focus'}
                    </Button>
                  ) : (
                    <Button 
                      size="lg" 
                      className="px-8" 
                      onClick={isRunning ? pauseTimer : startTimer}
                      // Removed disabled={isSchedulePending}
                    >
                      {isRunning ? 'Pause' : (isPaused ? 'Resume' : 'Start')}
                    </Button>
                  )}
                </div>

                {(isPaused || isRunning || isScheduleActive || isSchedulePending) && ( // Show stop button if pending
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
                      >
                        <Square size={16} fill="currentColor" /> {/* Solid Square icon */}
                      </Button>
                    </div>
                  </div>
                )}

                {!isScheduleActive && ( // Hide timer settings if schedule is active (removed isSchedulePending)
                  <div className="flex justify-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span 
                        className={cn(
                          "text-muted-foreground cursor-pointer select-none",
                          timerType === 'focus' && "font-bold text-foreground"
                        )}
                        onClick={() => handleModeToggle('focus')}
                      >
                        Focus:
                      </span>
                      <Input 
                        type="number" 
                        value={focusMinutes === 0 ? "" : focusMinutes} 
                        onChange={e => {
                          const value = e.target.value;
                          if (value === "") {
                            setFocusMinutes(0);
                          } else {
                            setFocusMinutes(parseFloat(value) || 0);
                          }
                        }} 
                        onBlur={() => {
                          if (focusMinutes === 0) {
                            setFocusMinutes(timerIncrement);
                          }
                        }}
                        className="w-16 h-8 text-center" 
                        min={timerIncrement} 
                        max="120" 
                        step={timerIncrement}
                        onFocus={(e) => e.target.select()}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span 
                        className={cn(
                          "text-muted-foreground cursor-pointer select-none",
                          timerType === 'break' && "font-bold text-foreground"
                        )}
                        onClick={() => handleModeToggle('break')}
                      >
                        Break:
                      </span>
                      <Input 
                        type="number" 
                        value={breakMinutes === 0 ? "" : breakMinutes} 
                        onChange={e => {
                          const value = e.target.value;
                          if (value === "") {
                            setBreakMinutes(0);
                          } else {
                            setBreakMinutes(parseFloat(value) || 0);
                          }
                        }} 
                        onBlur={() => {
                          if (breakMinutes === 0) {
                            setBreakMinutes(timerIncrement);
                          }
                        }}
                        className="w-16 h-8 text-center" 
                        min={timerIncrement} 
                        max="60" 
                        step={timerIncrement}
                        onFocus={(e) => e.target.select()}
                      />
                    </div>
                  </div>
                )}
                {(isRunning || isPaused || isScheduleActive || isSchedulePending) && <AskMenu onExtendSubmit={handleExtendSubmit} onPollSubmit={handlePollSubmit} />}
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
                  onTouchEnd={handleLongPressEnd}
                  onClick={() => {
                    if (!isLongPress.current) {
                      // Optional: short press action, e.g., copy to clipboard or show full text
                    }
                  }}
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
              />
            </CardContent>
          </Card>

          {/* Coworkers Section - Show when running or paused */}
          {(isRunning || isPaused || isScheduleActive || isSchedulePending) && currentCoworkers.length > 0 && ( // Show if pending
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Coworkers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {currentCoworkers.map(participant => (
                  <Tooltip key={participant.id}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-default select-none">
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
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">Nearby</h3>
                <div className="space-y-3">
                  {mockNearbySessions.map(session => (
                    <SessionCard 
                      key={session.id} 
                      session={session} 
                      onJoinSession={handleJoinSession} 
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Friends Sessions */}
            {!shouldHideSessionLists && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Friends</h3>
                <div className="space-y-3">
                  {mockFriendsSessions.map(session => (
                    <SessionCard 
                      key={session.id} 
                      session={session} 
                      onJoinSession={handleJoinSession} 
                    />
                  ))}
                </div>
              </div>
            )}
          </TooltipProvider>
        </div>
      </div>
      {/* Timeline Section (for active schedule and upcoming) */}
      {(isScheduleActive || (isSchedulePending && scheduleStartOption === 'custom_time')) && (
        <div className="mt-8"> {/* Add some top margin for separation */}
          <Timeline
            schedule={schedule}
            currentScheduleIndex={currentScheduleIndex}
            timeLeft={timeLeft}
            commenceTime={commenceTime}
            commenceDay={commenceDay === null ? new Date().getDay() : commenceDay}
            isSchedulePending={isSchedulePending && scheduleStartOption === 'custom_time'}
            onCountdownEnd={handleCountdownEnd}
          />
        </div>
      )}
    </main>
  );
};
export default Index;