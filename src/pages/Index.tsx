import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CircularProgress } from "@/components/CircularProgress";
import { useState, useRef } from "react";
import { Globe, Lock, CalendarPlus, Share2 } from "lucide-react"; // Added Share2
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
} from "@/components/ui/dropdown-menu"; // Added DropdownMenu components
import { toast } from "@/hooks/use-toast"; // Import toast for notifications

// Define types for Ask items
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
  currentPhaseDurationMinutes: number;
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
    currentPhaseDurationMinutes: 75,
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
    formatTime,
    showSessionsWhileActive, // Renamed
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
    commenceDay,
  } = useTimer();
  
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();

  const [isPublic, setIsPublic] = useState(true);
  const longPressRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);
  const [activeJoinedSession, setActiveJoinedSession] = useState<DemoSession | null>(null);
  const [activeAsks, setActiveAsks] = useState<ActiveAskItem[]>([]);

  const currentUserId = profile?.id || "mock-user-id-123"; 
  const currentUserName = profile?.first_name || "You";

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
      setIsPublic(!isPublic);
    } else {
      if (confirm(`Switch to ${isPublic ? 'Private' : 'Public'} mode?`)) {
        setIsPublic(!isPublic);
      }
    }
  };

  const handleIntentionLongPress = () => {
    if (isLongPress.current) {
      navigate('/profile');
    }
  };
  
  const startTimer = () => {
    if (!isRunning && !isPaused) {
      playStartSound();
      setIsRunning(true);
      setIsPaused(false);
      setIsFlashing(false);
    }
  };
  
  const pauseTimer = () => {
    setIsPaused(true);
    setIsRunning(false);
  };
  
  const stopTimer = () => {
    if (longPressRef.current) {
      setIsRunning(false);
      setIsPaused(false);
      setIsFlashing(false);
      setActiveJoinedSession(null);
      if (isScheduleActive) resetSchedule();
    } else {
      if (confirm('Are you sure you want to stop the timer?')) {
        setIsRunning(false);
        setIsPaused(false);
        setIsFlashing(false);
        setActiveJoinedSession(null);
        if (isScheduleActive) resetSchedule();
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
    } else {
      if (confirm('Are you sure you want to reset the timer?')) {
        setIsRunning(false);
        setIsPaused(false);
        setIsFlashing(false);
        const initialTime = timerType === 'focus' ? focusMinutes * 60 : breakMinutes * 60;
        setTimeLeft(initialTime);
        setActiveJoinedSession(null);
        if (isScheduleActive) resetSchedule();
      }
    }
  };

  const switchToBreak = () => {
    setTimerType('break');
    setTimeLeft(breakMinutes * 60);
    setIsFlashing(false);
    setIsRunning(true);
    playStartSound();
  };

  const switchToFocus = () => {
    setTimerType('focus');
    setTimeLeft(focusMinutes * 60);
    setIsFlashing(false);
    setIsRunning(true);
    playStartSound();
  };

  const handleCircularProgressChange = (progress: number) => {
    if (isRunning || isPaused || isFlashing || isScheduleActive) return;
    
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
    if (isRunning || isPaused || isScheduleActive) return;

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
    setTimerType(session.currentPhase);
    setTimeLeft(session.currentPhaseDurationMinutes * 60);
    setIsRunning(true);
    setIsPaused(false);
    setIsFlashing(false);
    toast({
      title: "Session Joined!",
      description: `You've joined "${session.title}".`,
    });
  };

  const shouldHideSessionLists = !showSessionsWhileActive && (isRunning || isPaused || isScheduleActive); // Updated logic

  const currentCoworkers = activeJoinedSession ? activeJoinedSession.participants : [];

  const handleExtendSubmit = (minutes: number) => {
    const newSuggestion: ExtendSuggestion = {
      id: `extend-${Date.now()}`,
      minutes,
      creator: currentUserName,
      votes: [],
      status: 'pending',
    };
    setActiveAsks(prev => [newSuggestion, ...prev]);
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
    setActiveAsks(prev => [newPoll, ...prev]);
  };

  const handleVoteExtend = (id: string, newVote: 'yes' | 'no' | 'neutral' | null) => {
    setActiveAsks(prevAsks => {
      return prevAsks.map(ask => {
        if (ask.id === id && 'minutes' in ask) {
          let updatedVotes = ask.votes.filter(v => v.userId !== currentUserId);

          if (newVote !== null) {
            updatedVotes.push({ userId: currentUserId, vote: newVote });
          }

          const yesVotes = updatedVotes.filter(v => v.vote === 'yes').length;
          const noVotes = updatedVotes.filter(v => v.vote === 'no').length;
          
          const totalParticipants = (activeJoinedSession?.participants.length || 0) + 1; 
          const threshold = Math.ceil(totalParticipants / 2);

          let newStatus = ask.status;
          if (yesVotes >= threshold) {
            newStatus = 'accepted';
          } else if (noVotes >= threshold) {
            newStatus = 'rejected';
          } else {
            if (ask.status !== 'pending' && yesVotes < threshold && noVotes < threshold) {
              newStatus = 'pending';
            }
          }

          return {
            ...ask,
            votes: updatedVotes,
            status: newStatus,
          };
        }
        return ask;
      });
    });
  };

  const handleVotePoll = (pollId: string, optionIds: string[], customOptionText?: string) => {
    setActiveAsks(prevAsks =>
      prevAsks.map(ask => {
        if (ask.id === pollId && 'options' in ask) {
          let currentPoll = ask as Poll;

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
              option.votes = option.votes.filter(v => v.userId !== currentUserId);
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
          
          return { ...currentPoll, options: updatedOptions };
        }
        return ask;
      })
    );
  };


  return (
    <main className="max-w-4xl mx-auto py-4 px-1 lg:py-6 lg:px-1">
      <div className="mb-6">
        <p className="text-muted-foreground">Sync your focus with nearby coworkers</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Timer Section */}
        <div className="space-y-6">
          <div className={`relative rounded-lg border border-border pt-1 pb-8 px-1 text-center transition-colors ${isPublic ? 'bg-[hsl(var(--public-bg))]' : 'bg-[hsl(var(--private-bg))]'}`}>
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
                      {isPublic ? <>
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
                        <DropdownMenuItem onClick={() => console.log('Share QR')}>QR</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => console.log('Share Link')}>Link</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => console.log('Share NFC')}>NFC</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <div className="flex justify-center mb-4">
                  <CircularProgress
                    size={280}
                    strokeWidth={12}
                    progress={timerType === 'focus' 
                      ? (timeLeft / (focusMinutes * 60)) * 100 
                      : (timeLeft / (breakMinutes * 60)) * 100
                    }
                    interactive={!isRunning && !isPaused && !isFlashing && !isScheduleActive}
                    onInteract={handleCircularProgressChange}
                    className={isFlashing ? 'animate-pulse' : ''}
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
                      onClick={isRunning ? pauseTimer : (isPaused ? () => { setIsRunning(true); setIsPaused(false); } : startTimer)}
                    >
                      {isRunning ? 'Pause' : (isPaused ? 'Resume' : 'Start')}
                    </Button>
                  )}
                </div>

                {(isPaused || isRunning || isScheduleActive) && (
                  <div className="absolute bottom-4 left-4 flex flex-col gap-1">
                    <button
                      onMouseDown={() => handleLongPressStart(stopTimer)}
                      onMouseUp={handleLongPressEnd}
                      onMouseLeave={handleLongPressEnd}
                      onTouchStart={() => handleLongPressStart(stopTimer)}
                      onTouchEnd={handleLongPressEnd}
                      onClick={stopTimer}
                      className="text-xs px-2 py-1 rounded border border-border hover:bg-muted transition-colors text-muted-foreground select-none"
                    >
                      Stop
                    </button>
                  </div>
                )}

                {!isScheduleActive && (
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
                      />
                    </div>
                  </div>
                )}
                {(isRunning || isPaused || isScheduleActive) && <AskMenu onExtendSubmit={handleExtendSubmit} onPollSubmit={handlePollSubmit} />}
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
            <CardHeader>
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Jot down your thoughts, to-do items, or reflections..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[120px] resize-none"
              />
            </CardContent>
          </Card>

          {/* Coworkers Section - Show when running or paused */}
          {(isRunning || isPaused || isScheduleActive) && currentCoworkers.length > 0 && (
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
            {!shouldHideSessionLists && isPublic && (
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
      {/* Timeline Section */}
      {isScheduleActive && (
        <Timeline 
          schedule={schedule} 
          currentScheduleIndex={currentScheduleIndex} 
          timeLeft={timeLeft} 
          formatTime={formatTime} 
          scheduleTitle={scheduleTitle}
          commenceTime={commenceTime}
          commenceDay={commenceDay}
        />
      )}
    </main>
  );
};
export default Index;