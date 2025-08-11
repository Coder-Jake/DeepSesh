import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useRef } from "react";
import { Globe, Lock, Star } from "lucide-react";
import { useTimer } from "@/contexts/TimerContext";
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
  } = useTimer();
  
  const [isPublic, setIsPublic] = useState(true);
  const longPressRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);
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
    if (isLongPress.current) {
      setIsRunning(false);
      setIsPaused(false);
      setIsFlashing(false);
    } else {
      if (confirm('Are you sure you want to stop the timer?')) {
        setIsRunning(false);
        setIsPaused(false);
        setIsFlashing(false);
      }
    }
  };
  
  const resetTimer = () => {
    if (isLongPress.current) {
      setIsRunning(false);
      setIsPaused(false);
      setIsFlashing(false);
      const initialTime = timerType === 'focus' ? focusMinutes * 60 : breakMinutes * 60;
      setTimeLeft(initialTime);
    } else {
      if (confirm('Are you sure you want to reset the timer?')) {
        setIsRunning(false);
        setIsPaused(false);
        setIsFlashing(false);
        const initialTime = timerType === 'focus' ? focusMinutes * 60 : breakMinutes * 60;
        setTimeLeft(initialTime);
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
  return <main className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <p className="text-muted-foreground">Sync your focus with nearby coworkers</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Timer Section */}
          <div className="space-y-6">
            <div className={`rounded-lg border border-border p-8 text-center transition-colors ${isPublic ? 'bg-[hsl(var(--public-bg))]' : 'bg-[hsl(var(--private-bg))]'}`}>
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1"></div>
                <div className="flex-1 flex justify-end">
                  <button 
                    onMouseDown={() => handleLongPressStart(handlePublicPrivateToggle)}
                    onMouseUp={handleLongPressEnd}
                    onMouseLeave={handleLongPressEnd}
                    onTouchStart={() => handleLongPressStart(handlePublicPrivateToggle)}
                    onTouchEnd={handleLongPressEnd}
                    onClick={handlePublicPrivateToggle}
                    className="flex items-center gap-2 px-3 py-1 rounded-full border border-border hover:bg-muted transition-colors"
                  >
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
              
              <div className="flex gap-3 justify-center mb-6 relative">
                <div className="absolute left-0 bottom-0 flex flex-col gap-1">
                  {(isPaused || isRunning) && (
                    <button
                      onMouseDown={() => handleLongPressStart(stopTimer)}
                      onMouseUp={handleLongPressEnd}
                      onMouseLeave={handleLongPressEnd}
                      onTouchStart={() => handleLongPressStart(stopTimer)}
                      onTouchEnd={handleLongPressEnd}
                      onClick={stopTimer}
                      className="text-xs px-2 py-1 rounded border border-border hover:bg-muted transition-colors text-muted-foreground"
                    >
                      Stop
                    </button>
                  )}
                  {(!isRunning && !isFlashing) && (
                    <button
                      onMouseDown={() => handleLongPressStart(resetTimer)}
                      onMouseUp={handleLongPressEnd}
                      onMouseLeave={handleLongPressEnd}
                      onTouchStart={() => handleLongPressStart(resetTimer)}
                      onTouchEnd={handleLongPressEnd}
                      onClick={resetTimer}
                      className="text-xs px-2 py-1 rounded border border-border hover:bg-muted transition-colors text-muted-foreground"
                    >
                      Reset
                    </button>
                  )}
                </div>
                
                {isFlashing ? <Button size="lg" className="px-8" onClick={timerType === 'focus' ? switchToBreak : switchToFocus}>
                    Start {timerType === 'focus' ? 'Break' : 'Focus'}
                  </Button> : <>
                    <Button 
                      size="lg" 
                      className="px-8" 
                      onClick={isRunning ? pauseTimer : (isPaused ? () => { setIsRunning(true); setIsPaused(false); } : startTimer)}
                    >
                      {isRunning ? 'Pause' : (isPaused ? 'Resume' : 'Start')}
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

          {/* Right Column */}
          <div className="space-y-6">
            {/* Notes Section - Show when running or paused */}
            {(isRunning || isPaused) && (
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
            )}

            {/* Sessions List */}
            <TooltipProvider>
              {/* Nearby Sessions */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">Nearby</h3>
                <div className="space-y-3">
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-foreground">Study Group Alpha</h4>
                        <p className="text-sm text-muted-foreground">Deep Work Session</p>
                      </div>
                      <div className="text-sm text-muted-foreground">12:45 remaining</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <Tooltip>
                        <TooltipTrigger className="text-sm text-muted-foreground cursor-pointer">
                          3 participants
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span>Alex</span>
                              <div className="flex">
                                {[1,2,3,4,5].map((star) => (
                                  <Star key={star} size={12} className={star <= 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>Sam</span>
                              <div className="flex">
                                {[1,2,3,4,5].map((star) => (
                                  <Star key={star} size={12} className={star <= 2 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>Taylor</span>
                              <div className="flex">
                                {[1,2,3,4,5].map((star) => (
                                  <Star key={star} size={12} className={star <= 5 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                                ))}
                              </div>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                      <Button size="sm">Join</Button>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-foreground">Focus Flow</h4>
                        <p className="text-sm text-muted-foreground">Coding Session</p>
                      </div>
                      <div className="text-sm text-muted-foreground">8:23 remaining</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <Tooltip>
                        <TooltipTrigger className="text-sm text-muted-foreground cursor-pointer">
                          5 participants
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span>Morgan</span>
                              <div className="flex">
                                {[1,2,3,4,5].map((star) => (
                                  <Star key={star} size={12} className={star <= 3 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>Jordan</span>
                              <div className="flex">
                                {[1,2,3,4,5].map((star) => (
                                  <Star key={star} size={12} className={star <= 1 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>Casey</span>
                              <div className="flex">
                                {[1,2,3,4,5].map((star) => (
                                  <Star key={star} size={12} className={star <= 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>Riley</span>
                              <div className="flex">
                                {[1,2,3,4,5].map((star) => (
                                  <Star key={star} size={12} className={star <= 2 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>Avery</span>
                              <div className="flex">
                                {[1,2,3,4,5].map((star) => (
                                  <Star key={star} size={12} className={star <= 5 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                                ))}
                              </div>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                      <Button size="sm">Join</Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Friends Sessions */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Friends</h3>
                <div className="space-y-3">
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-foreground">Exam Prep</h4>
                        <p className="text-sm text-muted-foreground">Silent Study</p>
                      </div>
                      <div className="text-sm text-muted-foreground">Break - 2:15 remaining</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <Tooltip>
                        <TooltipTrigger className="text-sm text-muted-foreground cursor-pointer">
                          Jamie + 7 participants
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 border-b border-border pb-1">
                              <span className="font-medium">Jamie (Friend)</span>
                              <div className="flex">
                                {[1,2,3,4,5].map((star) => (
                                  <Star key={star} size={12} className={star <= 3 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>Quinn</span>
                              <div className="flex">
                                {[1,2,3,4,5].map((star) => (
                                  <Star key={star} size={12} className={star <= 2 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>Blake</span>
                              <div className="flex">
                                {[1,2,3,4,5].map((star) => (
                                  <Star key={star} size={12} className={star <= 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>Drew</span>
                              <div className="flex">
                                {[1,2,3,4,5].map((star) => (
                                  <Star key={star} size={12} className={star <= 1 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                                ))}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">+4 more participants</div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                      <Button size="sm">Join</Button>
                    </div>
                  </div>
                </div>
              </div>
            </TooltipProvider>
          </div>
        </div>
      </main>;
};
export default Index;