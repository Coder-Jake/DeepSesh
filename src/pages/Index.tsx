import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { Globe, Lock } from "lucide-react";
const Index = () => {
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [isPublic, setIsPublic] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // in seconds
  const [timerType, setTimerType] = useState<'focus' | 'break'>('focus');
  const [isFlashing, setIsFlashing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  const playStartSound = () => {
    // Create a simple beep sound using Web Audio API
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
  const startTimer = () => {
    if (!isRunning) {
      playStartSound();
      setIsRunning(true);
      setIsFlashing(false);
    }
  };
  const resetTimer = () => {
    setIsRunning(false);
    setIsFlashing(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    const initialTime = timerType === 'focus' ? focusMinutes * 60 : breakMinutes * 60;
    setTimeLeft(initialTime);
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

  // Timer countdown effect
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsFlashing(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  // Update timeLeft when focus/break minutes change and timer is not running
  useEffect(() => {
    if (!isRunning && !isFlashing) {
      const newTime = timerType === 'focus' ? focusMinutes * 60 : breakMinutes * 60;
      setTimeLeft(newTime);
    }
  }, [focusMinutes, breakMinutes, timerType, isRunning, isFlashing]);
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground">DeepSesh</h1>
          <p className="text-muted-foreground mt-2">Sync your focus with nearby coworkers</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Timer Section */}
          <div className="space-y-6">
            <div className={`rounded-lg border border-border p-8 text-center transition-colors ${isPublic ? 'bg-[hsl(var(--public-bg))]' : 'bg-[hsl(var(--private-bg))]'}`}>
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1"></div>
                <div className="flex-1 flex justify-end">
                  <button onClick={() => setIsPublic(!isPublic)} className="flex items-center gap-2 px-3 py-1 rounded-full border border-border hover:bg-muted transition-colors">
                    {isPublic ? <>
                        <Globe size={16} />
                        <span className="text-sm font-medium">Public</span>
                      </> : <>
                        <Lock size={16} />
                        <span className="text-sm font-medium">Private</span>
                      </>}
                  </button>
                </div>
              </div>
              
              <div className={`text-6xl font-mono font-bold text-foreground mb-4 transition-all duration-300 ${isFlashing ? 'animate-pulse scale-110' : ''}`}>
                {formatTime(timeLeft)}
              </div>
              <p className="text-muted-foreground mb-6">
                {isFlashing ? `${timerType === 'focus' ? 'Focus' : 'Break'} Complete! Click to start ${timerType === 'focus' ? 'break' : 'focus'}` : `${timerType === 'focus' ? 'Focus' : 'Break'} Time`}
              </p>
              
              <div className="flex gap-3 justify-center mb-6">
                {isFlashing ? <Button size="lg" className="px-8" onClick={timerType === 'focus' ? switchToBreak : switchToFocus}>
                    Start {timerType === 'focus' ? 'Break' : 'Focus'}
                  </Button> : <>
                    <Button size="lg" className="px-8" onClick={startTimer} disabled={isRunning}>
                      {isRunning ? 'Running...' : 'Start'}
                    </Button>
                    <Button variant="outline" size="lg" onClick={resetTimer}>
                      Reset
                    </Button>
                  </>}
              </div>

              <div className="flex justify-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <label className="text-muted-foreground">Focus:</label>
                  <Input type="number" value={focusMinutes} onChange={e => setFocusMinutes(parseInt(e.target.value) || 1)} className="w-16 h-8 text-center" min="1" max="60" />
                  <span className="text-muted-foreground">min</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-muted-foreground">Break:</label>
                  <Input type="number" value={breakMinutes} onChange={e => setBreakMinutes(parseInt(e.target.value) || 1)} className="w-16 h-8 text-center" min="1" max="30" />
                  <span className="text-muted-foreground">min</span>
                </div>
              </div>
            </div>

            {/* Session Controls */}
            <div className="grid grid-cols-2 gap-4">
              
              
            </div>
          </div>

          {/* Sessions List */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">Active Sessions</h2>
              <div className="space-y-3">
                {/* Sample sessions */}
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-foreground">Study Group Alpha</h3>
                      <p className="text-sm text-muted-foreground">Deep Work Session</p>
                    </div>
                    <div className="text-sm text-muted-foreground">12:45 remaining</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">3 participants</div>
                    <Button size="sm">Join</Button>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-foreground">Focus Flow</h3>
                      <p className="text-sm text-muted-foreground">Coding Session</p>
                    </div>
                    <div className="text-sm text-muted-foreground">8:23 remaining</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">5 participants</div>
                    <Button size="sm">Join</Button>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-foreground">Exam Prep</h3>
                      <p className="text-sm text-muted-foreground">Silent Study</p>
                    </div>
                    <div className="text-sm text-muted-foreground">Break - 2:15 remaining</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">8 participants</div>
                    <Button size="sm">Join</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>;
};
export default Index;