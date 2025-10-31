import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ScheduledTimer, ScheduledTimerTemplate, TimerContextType, ActiveAskItem, NotificationSettings } from '@/types/timer';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { DEFAULT_SCHEDULE_TEMPLATES } from '@/lib/default-schedules';
import { DAYS_OF_WEEK } from '@/lib/constants';
import { saveSessionToDatabase } from '@/utils/session-utils';

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_TIMER = 'deepsesh_timer_context';

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [timerIncrement, setTimerIncrementInternal] = useState(5);

  const [_defaultFocusMinutes, _setDefaultFocusMinutes] = useState(25);
  const [_defaultBreakMinutes, _setDefaultBreakMinutes] = useState(5);

  const [focusMinutes, _setFocusMinutes] = useState(_defaultFocusMinutes);
  const [breakMinutes, _setBreakMinutes] = useState(_defaultBreakMinutes);

  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(focusMinutes * 60);
  const [timerType, setTimerType] = useState<'focus' | 'break'>('focus');
  const [isFlashing, setIsFlashing] = useState(false);
  const [notes, setNotes] = useState("");
  const [_seshTitle, _setSeshTitle] = useState("Notes");
  const [isSeshTitleCustomized, setIsSeshTitleCustomized] = useState(false);
  const [showSessionsWhileActive, setShowSessionsWhileActive] = useState<'hidden' | 'nearby' | 'friends' | 'all'>('hidden'); // MODIFIED: Changed 'yes' to 'all' and set default to 'hidden'
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [schedule, setSchedule] = useState<ScheduledTimer[]>([]);
  const [currentScheduleIndex, setCurrentScheduleIndex] = useState(0);
  const [isSchedulingMode, setIsSchedulingMode] = useState(false);
  const [isScheduleActive, setIsScheduleActive] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState("My Focus Sesh");
  const [commenceTime, setCommenceTime] = useState("");
  const [commenceDay, setCommenceDay] = useState<number | null>(null);
  const [isGlobalPrivate, setIsGlobalPrivate] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [scheduleStartOption, setScheduleStartOption] = useState<'now' | 'manual' | 'custom_time'>('now');

  const [activeSchedule, setActiveSchedule] = useState<ScheduledTimer[]>([]);
  const [activeTimerColors, setActiveTimerColors] = useState<Record<string, string>>({});
  const [activeScheduleDisplayTitle, setActiveScheduleDisplayTitleInternal] = useState("My Focus Sesh");

  const [savedSchedules, setSavedSchedules] = useState<ScheduledTimerTemplate[]>([]);
  
  const [preparedSchedules, setPreparedSchedules] = useState<ScheduledTimerTemplate[]>([]);
  
  const [timerColors, setTimerColors] = useState<Record<string, string>>({});

  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [currentPhaseStartTime, setCurrentPhaseStartTime] = useState<number | null>(null);
  const [accumulatedFocusSeconds, setAccumulatedFocusSeconds] = useState(0);
  const [accumulatedBreakSeconds, setAccumulatedBreakSeconds] = useState(0);
  const [activeJoinedSessionCoworkerCount, setActiveJoinedSessionCoworkerCount] = useState(0);

  const [activeAsks, setActiveAsks] = useState<ActiveAskItem[]>([]);

  const [currentSessionRole, setCurrentSessionRole] = useState<'host' | 'coworker' | null>(null);
  const [currentSessionHostName, setCurrentSessionHostName] = useState<string | null>(null);
  const [currentSessionOtherParticipants, setCurrentSessionOtherParticipants] = useState<{ id: string; name: string; sociability?: number; intention?: string; bio?: string }[]>([]);

  const allParticipantsToDisplay = useMemo(() => {
    const participants: string[] = [];
    const uniqueNames = new Set<string>();

    const currentUserName = user?.user_metadata?.first_name || "You";

    if (user?.id) {
      uniqueNames.add(currentUserName);
    }

    if (currentSessionRole === 'coworker' && currentSessionHostName && currentSessionHostName !== currentUserName) {
      uniqueNames.add(currentSessionHostName);
    }

    currentSessionOtherParticipants.forEach(p => {
      if (p.name !== currentUserName && p.name !== currentSessionHostName) {
        uniqueNames.add(p.name);
      }
    });

    return Array.from(uniqueNames).sort();
  }, [currentSessionRole, currentSessionHostName, currentSessionOtherParticipants, user?.id, user?.user_metadata?.first_name]);

  const [isSchedulePending, setIsSchedulePending] = useState(false);
  const [isTimeLeftManagedBySession, setIsTimeLeftManagedBySession] = useState(false);
  
  const [shouldPlayEndSound, setShouldPlayEndSound] = useState(false);
  const [shouldShowEndToast, setShouldShowEndToast] = useState(false);
  const [isBatchNotificationsEnabled, setIsBatchNotificationsEnabled] = useState(false);
  const [batchNotificationPreference, setBatchNotificationPreference] = useState<'break' | 'sesh_end' | 'custom'>('break');
  const [customBatchMinutes, setCustomBatchMinutes] = useState(timerIncrement);
  const [lock, setLock] = useState(false);
  const [exemptionsEnabled, setExemptionsEnabled] = useState(false);
  const [phoneCalls, setPhoneCalls] = useState(false);
  const [favourites, setFavourites] = useState(false);
  const [workApps, setWorkApps] = useState(false);
  const [intentionalBreaches, setIntentionalBreaches] = useState(false);
  const [manualTransition, setManualTransition] = useState(false);
  const [maxDistance, setMaxDistance] = useState(1000);
  const [askNotifications, setAskNotifications] = useState<NotificationSettings>({ push: false, vibrate: false, sound: false });
  const [joinNotifications, setJoinNotifications] = useState<NotificationSettings>({ push: false, vibrate: false, sound: false });
  const [sessionInvites, setSessionInvites] = useState<NotificationSettings>({ push: false, vibrate: false, sound: false });
  const [friendActivity, setFriendActivity] = useState<NotificationSettings>({ push: false, vibrate: false, sound: false });
  const [breakNotificationsVibrate, setBreakNotificationsVibrate] = useState(false);
  const [verificationStandard, setVerificationStandard] = useState<'anyone' | 'phone1' | 'organisation' | 'id1'>('anyone');
  const [profileVisibility, setProfileVisibility] = useState<('public' | 'friends' | 'organisation' | 'private')[]>(['public']);
  const [locationSharing, setLocationSharing] = useState(false);
  const [openSettingsAccordions, setOpenSettingsAccordions] = useState<string[]>([]);
  const [is24HourFormat, setIs24HourFormat] = useState(true);
  const [areToastsEnabled, setAreToastsEnabled] = useState(false);
  const [startStopNotifications, setStartStopNotifications] = useState<NotificationSettings>({ push: false, vibrate: false, sound: false });
  const [hasWonPrize, setHasWonPrize] = useState(false);

  const isSchedulePrepared = preparedSchedules.length > 0;
  const setIsSchedulePrepared = useCallback((_val: boolean) => {}, []);

  const setHomepageFocusMinutes = useCallback((minutes: number) => {
    _setFocusMinutes(minutes);
  }, []);

  const setHomepageBreakMinutes = useCallback((minutes: number) => {
    _setBreakMinutes(minutes);
  }, []);

  const setDefaultFocusMinutes = useCallback((minutes: number) => {
    _setDefaultFocusMinutes(minutes);
    if (!isRunning && !isPaused && !isScheduleActive && !isSchedulePending && !isSchedulePrepared) {
      _setFocusMinutes(minutes);
    }
  }, [isRunning, isPaused, isScheduleActive, isSchedulePending, isSchedulePrepared]);

  const setDefaultBreakMinutes = useCallback((minutes: number) => {
    _setDefaultBreakMinutes(minutes);
    if (!isRunning && !isPaused && !isScheduleActive && !isSchedulePending && !isSchedulePrepared) {
      _setBreakMinutes(minutes);
    }
  }, [isRunning, isPaused, isScheduleActive, isSchedulePending, isSchedulePrepared]);


  const playSound = useCallback(() => {
    console.log("playSound called. startStopNotifications.sound:", startStopNotifications.sound);
    if (!startStopNotifications.sound) return;
    if (typeof window.AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined') {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 440;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } else {
      console.warn("AudioContext not supported in this browser.");
    }
  }, [startStopNotifications.sound]);

  const triggerVibration = useCallback(() => {
    console.log("triggerVibration called. startStopNotifications.vibrate:", startStopNotifications.vibrate);
    if (startStopNotifications.vibrate && navigator.vibrate) {
      navigator.vibrate(200);
    } else if (startStopNotifications.vibrate) {
      console.warn("Vibration API not supported in this browser.");
    }
  }, [startStopNotifications.vibrate]);

  const formatTime = useCallback((totalSeconds: number) => {
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const pad = (num: number) => num.toString().padStart(2, '0');

    let timeParts: string[] = [];

    if (days > 0) {
      timeParts.push(`${days}d`);
      timeParts.push(pad(hours));
      timeParts.push(pad(minutes));
      timeParts.push(pad(seconds));
      return `${timeParts[0]} ${timeParts.slice(1).join(':')}`;
    } else if (hours > 0) {
      timeParts.push(pad(hours));
      timeParts.push(pad(minutes));
      timeParts.push(pad(seconds));
      return timeParts.join(':');
    } else {
      return `${pad(minutes)}:${pad(seconds)}`;
    }
  }, []);

  const setSeshTitle = useCallback((newTitle: string) => {
    _setSeshTitle(newTitle);
    if (newTitle !== "Notes" && newTitle.trim() !== "") {
      setIsSeshTitleCustomized(true);
    } else {
      setIsSeshTitleCustomized(false);
    }
  }, []);

  const updateSeshTitleWithSchedule = useCallback((currentScheduleTitle: string) => {
    if (!isSeshTitleCustomized) {
      _setSeshTitle(`${currentScheduleTitle} Notes`);
    }
  }, [isSeshTitleCustomized]);

  const resetSchedule = useCallback(() => {
    setIsScheduleActive(false);
    setCurrentScheduleIndex(0);
    setSchedule([]);
    setScheduleTitle("My Focus Sesh");
    setCommenceTime("");
    setCommenceDay(null);
    setIsSchedulePending(false);
    setScheduleStartOption('now');
    setIsRecurring(false);
    setRecurrenceFrequency('daily');
    setTimerType('focus');
    _setFocusMinutes(_defaultFocusMinutes);
    _setBreakMinutes(_defaultBreakMinutes);
    setTimeLeft(_defaultFocusMinutes * 60);
    setIsRunning(false);
    setIsPaused(false);
    setIsFlashing(false);
    setSessionStartTime(null);
    setCurrentPhaseStartTime(null);
    setAccumulatedFocusSeconds(0);
    setAccumulatedBreakSeconds(0);
    _setSeshTitle("Notes");
    setIsSeshTitleCustomized(false);
    setTimerColors({});
    setActiveSchedule([]);
    setActiveTimerColors({});
    setActiveScheduleDisplayTitleInternal("My Focus Sesh");
    setPreparedSchedules([]);
    setActiveAsks([]);
    console.log("TimerContext: resetSchedule called. activeAsks cleared.");

    setCurrentSessionRole(null);
    setCurrentSessionHostName(null);
    setCurrentSessionOtherParticipants([]);
    setActiveJoinedSessionCoworkerCount(0);
    setIsTimeLeftManagedBySession(false);
    setHasWonPrize(false);
  }, [_defaultFocusMinutes, _defaultBreakMinutes]);

  const startSchedule = useCallback(() => {
    if (schedule.length === 0) {
      return;
    }

    if (scheduleStartOption === 'manual' || scheduleStartOption === 'custom_time') {
        const newPreparedSchedule: ScheduledTimerTemplate = {
            id: crypto.randomUUID(),
            title: scheduleTitle,
            schedule: [...schedule],
            commenceTime: commenceTime,
            commenceDay: commenceDay,
            scheduleStartOption: scheduleStartOption,
            isRecurring: isRecurring,
            recurrenceFrequency: recurrenceFrequency,
            timerColors: { ...timerColors },
        };
        setPreparedSchedules(prev => [...prev, newPreparedSchedule]);
        setIsSchedulingMode(false);
        if (areToastsEnabled) {
            toast("Schedule Prepared!", {
                description: `"${scheduleTitle}" is ready. ${scheduleStartOption === 'custom_time' ? 'It will begin at the scheduled time.' : 'Hit \'Commence\' to begin.'}`,
            });
        }
        return;
    }

    let needsOverrideConfirmation = false;
    let confirmationMessageParts: string[] = [];
    let shouldResetManualTimer = false;
    let shouldResetExistingActiveSchedule = false;

    if (isScheduleActive) {
        confirmationMessageParts.push("An active schedule is running.");
        shouldResetExistingActiveSchedule = true;
    }
    if (isRunning || isPaused) {
        confirmationMessageParts.push("A manual timer is also active.");
        shouldResetManualTimer = true;
    }

    if (confirmationMessageParts.length > 0) {
        needsOverrideConfirmation = true;
    }

    if (needsOverrideConfirmation) {
        const finalMessage = `${confirmationMessageParts.join(" ")} Do you want to override them and start this new schedule now?`;
        if (!confirm(finalMessage)) {
            return;
        }
        if (shouldResetExistingActiveSchedule) {
            resetSchedule();
        }
        if (shouldResetManualTimer) {
            setIsRunning(false);
            setIsPaused(false);
            setIsFlashing(false);
            setAccumulatedFocusSeconds(0);
            setAccumulatedBreakSeconds(0);
            _setSeshTitle("Notes");
            setIsSeshTitleCustomized(false);
            setActiveAsks([]);
            console.log("TimerContext: Manual timer reset during schedule start. activeAsks cleared.");
            setHasWonPrize(false);
        }
    }

    setActiveSchedule([...schedule]);
    setActiveTimerColors({ ...timerColors });
    setActiveScheduleDisplayTitleInternal(scheduleTitle);

    setCurrentScheduleIndex(0);
    setTimerType(schedule[0].type);
    setIsTimeLeftManagedBySession(true);
    setTimeLeft(schedule[0].durationMinutes * 60);
    setIsFlashing(false);
    setSessionStartTime(Date.now());
    setIsSchedulingMode(false);

    setIsScheduleActive(true);
    setIsSchedulePending(false);
    setIsRunning(true);
    setIsPaused(false);
    setCurrentPhaseStartTime(Date.now());
    updateSeshTitleWithSchedule(scheduleTitle);
    if (areToastsEnabled) {
        toast("Schedule Started!", {
            description: `"${scheduleTitle}" has begun.`,
        });
    }
    playSound();
    triggerVibration();

    setCurrentSessionRole('host');
    setCurrentSessionHostName(user?.user_metadata?.first_name || "Host");
    setCurrentSessionOtherParticipants([]);
    setActiveJoinedSessionCoworkerCount(0);
}, [
    schedule, scheduleTitle, commenceTime, commenceDay, scheduleStartOption, isRecurring, recurrenceFrequency,
    isRunning, isPaused, isScheduleActive, timerColors, updateSeshTitleWithSchedule,
    resetSchedule, setAccumulatedFocusSeconds, setAccumulatedBreakSeconds,
    _setSeshTitle, setIsSeshTitleCustomized, toast, areToastsEnabled, user?.user_metadata?.first_name, setActiveAsks,
    playSound, triggerVibration, setIsTimeLeftManagedBySession
]);

  const commenceSpecificPreparedSchedule = useCallback((templateId: string) => {
    const templateToCommence = preparedSchedules.find(template => template.id === templateId);
    if (!templateToCommence) return;

    let needsOverrideConfirmation = false;
    let confirmationMessageParts: string[] = [];
    let shouldResetManualTimer = false;
    let shouldResetExistingActiveSchedule = false;

    if (isScheduleActive) {
        confirmationMessageParts.push("An active schedule is running.");
        shouldResetExistingActiveSchedule = true;
    }
    if (isRunning || isPaused) {
        confirmationMessageParts.push("A manual timer is currently active.");
        shouldResetManualTimer = true;
    }

    if (confirmationMessageParts.length > 0) {
        needsOverrideConfirmation = true;
    }

    if (needsOverrideConfirmation) {
        const finalMessage = `${confirmationMessageParts.join(" ")} Do you want to override them and commence "${templateToCommence.title}"?`;
        if (!confirm(finalMessage)) {
            return;
        }
        if (shouldResetExistingActiveSchedule) {
            setIsScheduleActive(false);
            setCurrentScheduleIndex(0);
            setActiveSchedule([]);
            setActiveTimerColors({});
            setActiveScheduleDisplayTitleInternal("My Focus Sesh");
            setIsSchedulePending(false);
            setActiveAsks([]);
            console.log("TimerContext: Existing schedule reset during prepared schedule start. activeAsks cleared.");
            setHasWonPrize(false);
        }
        if (shouldResetManualTimer) {
            setIsRunning(false);
            setIsPaused(false);
            setAccumulatedFocusSeconds(0);
            setAccumulatedBreakSeconds(0);
            _setSeshTitle("Notes");
            setIsSeshTitleCustomized(false);
            setActiveAsks([]);
            console.log("TimerContext: Manual timer reset during prepared schedule start. activeAsks cleared.");
            setHasWonPrize(false);
        }
    }

    setActiveSchedule(templateToCommence.schedule);
    setActiveTimerColors(templateToCommence.timerColors || {});
    setActiveScheduleDisplayTitleInternal(templateToCommence.title);

    setCurrentScheduleIndex(0);
    setTimerType(templateToCommence.schedule[0].type);
    setIsTimeLeftManagedBySession(true);
    setTimeLeft(templateToCommence.schedule[0].durationMinutes * 60);
    setIsFlashing(false);
    setSessionStartTime(Date.now());

    setIsScheduleActive(true);
    setIsSchedulePending(templateToCommence.scheduleStartOption === 'custom_time');
    setIsRunning(true);
    setIsPaused(false);
    setCurrentPhaseStartTime(Date.now());
    updateSeshTitleWithSchedule(templateToCommence.title);
    
    setPreparedSchedules(prev => prev.filter(template => template.id !== templateId));

    if (areToastsEnabled) {
        toast("Schedule Commenced!", {
            description: `"${templateToCommence.title}" has begun.`,
        });
    }
    playSound();
    triggerVibration();

    setCurrentSessionRole('host');
    setCurrentSessionHostName(user?.user_metadata?.first_name || "Host");
    setCurrentSessionOtherParticipants([]);
    setActiveJoinedSessionCoworkerCount(0);
  }, [isScheduleActive, isRunning, isPaused, preparedSchedules, updateSeshTitleWithSchedule, setAccumulatedFocusSeconds, setAccumulatedBreakSeconds, _setSeshTitle, setIsSeshTitleCustomized, toast, areToastsEnabled, user?.user_metadata?.first_name, setActiveAsks, playSound, triggerVibration, setIsTimeLeftManagedBySession]);

  const discardPreparedSchedule = useCallback((templateId: string) => {
    setPreparedSchedules(prev => prev.filter(template => template.id !== templateId));
    if (areToastsEnabled) {
        toast("Schedule Discarded", {
            description: "The upcoming schedule has been removed.",
        });
    }
  }, [areToastsEnabled, toast]);

  const saveCurrentScheduleAsTemplate = useCallback(() => {
    if (!scheduleTitle.trim() || schedule.length === 0) {
      if (areToastsEnabled) {
        toast("Cannot save schedule", {
          description: "Please provide a title and add timers to your schedule.",
        });
      }
      return;
    }

    const newTemplate: ScheduledTimerTemplate = {
      id: crypto.randomUUID(),
      title: scheduleTitle,
      schedule: schedule,
      commenceTime: commenceTime,
      commenceDay: commenceDay,
      scheduleStartOption: scheduleStartOption,
      isRecurring: isRecurring,
      recurrenceFrequency: recurrenceFrequency,
      timerColors: timerColors,
    };

    setSavedSchedules((prev) => [...prev, newTemplate]);
    if (areToastsEnabled) {
        toast("Schedule Saved!", {
            description: `"${scheduleTitle}" has been saved as a template.`,
        });
    }
  }, [scheduleTitle, schedule, commenceTime, commenceDay, scheduleStartOption, isRecurring, recurrenceFrequency, timerColors, areToastsEnabled, toast]);

  const loadScheduleTemplate = useCallback((templateId: string) => {
    const templateToLoad = savedSchedules.find(template => template.id === templateId);
    if (templateToLoad) {
      setSchedule(templateToLoad.schedule);
      setScheduleTitle(templateToLoad.title);
      setCommenceTime(templateToLoad.commenceTime);
      setCommenceDay(templateToLoad.commenceDay);
      setScheduleStartOption(templateToLoad.scheduleStartOption);
      setIsRecurring(templateToLoad.isRecurring);
      setRecurrenceFrequency(templateToLoad.recurrenceFrequency);
      setTimerColors(templateToLoad.timerColors || {});
      
      if (areToastsEnabled) {
        toast("Template Loaded!", {
          description: `"${templateToLoad.title}" has been loaded into the editor.`,
        });
      }
    }
  }, [savedSchedules, areToastsEnabled, toast]);

  const deleteScheduleTemplate = useCallback((templateId: string) => {
    setSavedSchedules((prev) => prev.filter(template => template.id !== templateId));
    if (areToastsEnabled) {
        toast("Schedule Deleted!", {
            description: "The schedule template has been removed.",
        });
    }
  }, [areToastsEnabled, toast]);

  useEffect(() => {
    if (isRunning && !isPaused && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      clearInterval(timerRef.current!);

      if (currentPhaseStartTime !== null) {
        const elapsed = (Date.now() - currentPhaseStartTime) / 1000;
        if (timerType === 'focus') {
          setAccumulatedFocusSeconds((prev: number) => prev + elapsed);
        } else {
          setAccumulatedBreakSeconds((prev: number) => prev + elapsed);
        }
      }

      if (shouldPlayEndSound) playSound();
      if (breakNotificationsVibrate && navigator.vibrate) navigator.vibrate(200);

      if (isScheduleActive) {
        const nextIndex = currentScheduleIndex + 1;
        if (nextIndex < activeSchedule.length) {
          setCurrentScheduleIndex(nextIndex);
          setTimerType(activeSchedule[nextIndex].type);
          setTimeLeft(activeSchedule[nextIndex].durationMinutes * 60);
          setIsRunning(true);
          setIsFlashing(false);
          setCurrentPhaseStartTime(Date.now());
        } else {
          // Schedule has reached its end
          if (isRecurring && activeSchedule.length > 0) {
            // Loop the schedule
            setCurrentScheduleIndex(0);
            setTimerType(activeSchedule[0].type);
            setTimeLeft(activeSchedule[0].durationMinutes * 60);
            setIsRunning(true);
            setIsFlashing(false);
            setCurrentPhaseStartTime(Date.now());
            if (shouldShowEndToast && areToastsEnabled) {
              toast("Schedule Looping!", {
                description: `"${scheduleTitle}" is restarting.`,
              });
            }
          } else {
            // Schedule completed, stop and save
            if (shouldShowEndToast && areToastsEnabled) {
              toast("Schedule Completed!", {
                description: `"${scheduleTitle}" has finished.`,
              });
            }
            
            const finalFocusSeconds = accumulatedFocusSeconds;
            const finalBreakSeconds = accumulatedBreakSeconds;
            const totalSession = finalFocusSeconds + finalBreakSeconds;

            console.log("TimerContext: activeAsks before saving (schedule completion):", activeAsks);
            saveSessionToDatabase(
              user?.id,
              _seshTitle,
              notes,
              finalFocusSeconds,
              finalBreakSeconds,
              totalSession,
              activeJoinedSessionCoworkerCount,
              sessionStartTime || Date.now(),
              activeAsks,
              allParticipantsToDisplay,
              areToastsEnabled
            );

            resetSchedule();
          }
        }
      } else {
        if (shouldShowEndToast && areToastsEnabled) {
          toast("Timer Ended!", {
            description: `Your ${timerType} session has finished.`,
          });
        }

        if (manualTransition) {
          setIsRunning(false);
          setIsFlashing(true);
          setCurrentPhaseStartTime(null);
        } else {
          setIsFlashing(false);
          setIsRunning(true);

          if (timerType === 'focus') {
            setTimerType('break');
            setTimeLeft(breakMinutes * 60);
          } else {
            setTimerType('focus');
            setTimeLeft(focusMinutes * 60);
          }
          setCurrentPhaseStartTime(Date.now());
        }
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, isPaused, timeLeft, isFlashing, playSound, isScheduleActive, activeSchedule, currentScheduleIndex, timerType, resetSchedule, scheduleTitle, currentPhaseStartTime, setAccumulatedFocusSeconds, setAccumulatedBreakSeconds, shouldPlayEndSound, shouldShowEndToast, user?.id, _seshTitle, notes, accumulatedFocusSeconds, accumulatedBreakSeconds, activeJoinedSessionCoworkerCount, sessionStartTime, manualTransition, focusMinutes, breakMinutes, areToastsEnabled, activeAsks, allParticipantsToDisplay, breakNotificationsVibrate, triggerVibration, isRecurring]);

  useEffect(() => {
    if (!isTimeLeftManagedBySession && !isRunning && !isPaused && !isScheduleActive && !isSchedulePending) {
      const expectedTime = (timerType === 'focus' ? focusMinutes : breakMinutes) * 60;
      if (timeLeft !== expectedTime) {
        setTimeLeft(expectedTime);
      }
    }
  }, [focusMinutes, breakMinutes, timerType, isRunning, isPaused, isScheduleActive, isSchedulePending, isTimeLeftManagedBySession, timeLeft]);

  useEffect(() => {
    if (!isSeshTitleCustomized && activeScheduleDisplayTitle.trim() !== "") {
      _setSeshTitle(`${activeScheduleDisplayTitle} Notes`);
    }
  }, [activeScheduleDisplayTitle, isSeshTitleCustomized]);


  const addAsk = useCallback((ask: ActiveAskItem) => {
    setActiveAsks((prev) => [...prev, ask]);
  }, []);

  const updateAsk = useCallback((updatedAsk: ActiveAskItem) => {
    setActiveAsks((prev) =>
      prev.map((ask) => (ask.id === updatedAsk.id ? updatedAsk : ask))
    );
  }, []);

  useEffect(() => {
    const checkAndCommenceSchedules = () => {
      const now = new Date();
      for (const template of preparedSchedules) {
        if (template.scheduleStartOption === 'custom_time') {
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
      }
    };

    const intervalId = setInterval(checkAndCommenceSchedules, 60 * 1000);
    checkAndCommenceSchedules();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [preparedSchedules, isScheduleActive, isSchedulePending, commenceSpecificPreparedSchedule, discardPreparedSchedule]);


  useEffect(() => {
    const storedData = localStorage.getItem(LOCAL_STORAGE_KEY_TIMER);
    if (storedData) {
      const data = JSON.parse(storedData);
      _setDefaultFocusMinutes(data._defaultFocusMinutes ?? 25);
      _setDefaultBreakMinutes(data. _defaultBreakMinutes ?? 5);
      _setFocusMinutes(data.focusMinutes ?? data._defaultFocusMinutes ?? 25);
      _setBreakMinutes(data.breakMinutes ?? data._defaultBreakMinutes ?? 5);
      _setSeshTitle(data._seshTitle ?? "Notes");
      setIsSeshTitleCustomized(data.isSeshTitleCustomized ?? false);
      setNotes(data.notes ?? "");
      setTimerIncrementInternal(data.timerIncrement ?? 5);
      
      // MODIFIED: Handle 'yes' to 'all' conversion for showSessionsWhileActive
      let loadedShowSessionsWhileActive = data.showSessionsWhileActive ?? 'hidden';
      if (loadedShowSessionsWhileActive === 'yes') {
        loadedShowSessionsWhileActive = 'all';
      }
      setShowSessionsWhileActive(loadedShowSessionsWhileActive);

      setIsGlobalPrivate(data.isGlobalPrivate ?? false);
      setTimerType(data.timerType ?? 'focus');
      setTimeLeft(data.timeLeft ?? (data.timerType === 'focus' ? (data.focusMinutes ?? data._defaultFocusMinutes ?? 25) * 60 : (data.breakMinutes ?? data._defaultBreakMinutes ?? 5) * 60));
      setIsRunning(data.isRunning ?? false);
      setIsPaused(data.isPaused ?? false);
      setIsFlashing(data.isFlashing ?? false);
      setSchedule(data.schedule ?? []);
      setCurrentScheduleIndex(data.currentScheduleIndex ?? 0);
      setIsSchedulingMode(data.isSchedulingMode ?? false);
      setIsScheduleActive(data.isScheduleActive ?? false);
      setScheduleTitle(data.scheduleTitle ?? "My Focus Sesh");
      setCommenceTime(data.commenceTime ?? "");
      setCommenceDay(data.commenceDay ?? null);
      setIsRecurring(data.isRecurring ?? false);
      setRecurrenceFrequency(data.recurrenceFrequency ?? 'daily');
      setSessionStartTime(data.sessionStartTime ?? null);
      setCurrentPhaseStartTime(data.currentPhaseStartTime ?? null);
      setAccumulatedFocusSeconds(data.accumulatedFocusSeconds ?? 0);
      setAccumulatedBreakSeconds(data.accumulatedBreakSeconds ?? 0);
      setActiveJoinedSessionCoworkerCount(data.activeJoinedSessionCoworkerCount ?? 0);
      setActiveAsks(data.activeAsks ?? []);
      console.log("TimerContext: Loading activeAsks from local storage:", data.activeAsks);
      setIsSchedulePending(data.isSchedulePending ?? false);
      setScheduleStartOption(data.scheduleStartOption ?? 'now');
      setIsTimeLeftManagedBySession(data.isTimeLeftManagedBySession ?? false);
      setShouldPlayEndSound(data.shouldPlayEndSound ?? false);
      setShouldShowEndToast(data.shouldShowEndToast ?? false);
      setIsBatchNotificationsEnabled(data.isBatchNotificationsEnabled ?? false);
      setBatchNotificationPreference(data.batchNotificationPreference ?? 'break');
      setCustomBatchMinutes(data.customBatchMinutes ?? timerIncrement);
      setLock(data.lock ?? false);
      setExemptionsEnabled(data.exemptionsEnabled ?? false);
      setPhoneCalls(data.phoneCalls ?? false);
      setFavourites(data.favourites ?? false);
      setWorkApps(data.workApps ?? false);
      setIntentionalBreaches(data.intentionalBreaches ?? false);
      setManualTransition(data.manualTransition ?? false);
      setMaxDistance(data.maxDistance ?? 1000);
      setAskNotifications(data.askNotifications ?? { push: false, vibrate: false, sound: false });
      setJoinNotifications(data.joinNotifications ?? { push: false, vibrate: false, sound: false });
      setSessionInvites(data.sessionInvites ?? { push: false, vibrate: false, sound: false });
      setFriendActivity(data.friendActivity ?? { push: false, vibrate: false, sound: false });
      setBreakNotificationsVibrate(data.breakNotificationsVibrate ?? false);
      setVerificationStandard(data.verificationStandard ?? 'anyone');
      setProfileVisibility(data.profileVisibility ?? ['public']);
      setLocationSharing(data.locationSharing ?? false);
      setOpenSettingsAccordions(data.openSettingsAccordions ?? []);
      setTimerColors(data.timerColors ?? {});
      setActiveSchedule(data.activeSchedule ?? {});
      setActiveTimerColors(data.activeTimerColors ?? {});
      setActiveScheduleDisplayTitleInternal(data.activeScheduleDisplayTitle ?? "My Focus Sesh");
      setIs24HourFormat(data.is24HourFormat ?? true);
      setAreToastsEnabled(data.areToastsEnabled ?? false);
      setStartStopNotifications(data.startStopNotifications ?? { push: false, vibrate: false, sound: false });
      setHasWonPrize(data.hasWonPrize ?? false);

      setCurrentSessionRole(data.currentSessionRole ?? null);
      setCurrentSessionHostName(data.currentSessionHostName ?? null);
      setCurrentSessionOtherParticipants(data.currentSessionOtherParticipants ?? []);

      const loadedSchedules = data.savedSchedules ?? [];
      setSavedSchedules(loadedSchedules.length > 0 ? loadedSchedules : DEFAULT_SCHEDULE_TEMPLATES);
      
      setPreparedSchedules(data.preparedSchedules ?? []);
    } else {
      setSavedSchedules(DEFAULT_SCHEDULE_TEMPLATES);
    }
  }, []);

  useEffect(() => {
    const dataToSave = {
      _defaultFocusMinutes, _defaultBreakMinutes,
      focusMinutes, breakMinutes,
      isRunning, isPaused, timeLeft, timerType, isFlashing,
      notes, _seshTitle, isSeshTitleCustomized, showSessionsWhileActive, schedule, currentScheduleIndex,
      isSchedulingMode, isScheduleActive, scheduleTitle, commenceTime, commenceDay,
      isGlobalPrivate, isRecurring, recurrenceFrequency, savedSchedules, timerColors, sessionStartTime,
      currentPhaseStartTime, accumulatedFocusSeconds, accumulatedBreakSeconds,
      activeJoinedSessionCoworkerCount, activeAsks, isSchedulePending, scheduleStartOption,
      isTimeLeftManagedBySession,
      shouldPlayEndSound, shouldShowEndToast, isBatchNotificationsEnabled, batchNotificationPreference,
      customBatchMinutes, lock, exemptionsEnabled, phoneCalls, favourites, workApps,
      intentionalBreaches, manualTransition, maxDistance, askNotifications, joinNotifications, sessionInvites,
      friendActivity, breakNotificationsVibrate, verificationStandard, profileVisibility,
      locationSharing, openSettingsAccordions, activeSchedule, activeTimerColors, activeScheduleDisplayTitle,
      is24HourFormat,
      preparedSchedules,
      timerIncrement,
      areToastsEnabled,
      startStopNotifications,
      hasWonPrize,
      currentSessionRole, currentSessionHostName, currentSessionOtherParticipants,
      // Removed duplicate 'isRecurring' here
    };
    localStorage.setItem(LOCAL_STORAGE_KEY_TIMER, JSON.stringify(dataToSave));
    console.log("TimerContext: Saving activeAsks to local storage:", activeAsks);
  }, [
    _defaultFocusMinutes, _defaultBreakMinutes,
    focusMinutes, breakMinutes,
    isRunning, isPaused, timeLeft, timerType, isFlashing,
    notes, _seshTitle, isSeshTitleCustomized, showSessionsWhileActive, schedule, currentScheduleIndex,
    isSchedulingMode, isScheduleActive, scheduleTitle, commenceTime, commenceDay,
    isGlobalPrivate, isRecurring, recurrenceFrequency, savedSchedules, timerColors, sessionStartTime,
    currentPhaseStartTime, accumulatedFocusSeconds, accumulatedBreakSeconds,
    activeJoinedSessionCoworkerCount, activeAsks, isSchedulePending, scheduleStartOption,
    isTimeLeftManagedBySession,
    shouldPlayEndSound, shouldShowEndToast, isBatchNotificationsEnabled, batchNotificationPreference,
    customBatchMinutes, lock, exemptionsEnabled, phoneCalls, favourites, workApps,
    intentionalBreaches, manualTransition, maxDistance, askNotifications, joinNotifications, sessionInvites,
    friendActivity, breakNotificationsVibrate, verificationStandard, profileVisibility,
    locationSharing, openSettingsAccordions, activeSchedule, activeTimerColors, activeScheduleDisplayTitle,
    is24HourFormat,
    preparedSchedules,
    timerIncrement,
    areToastsEnabled,
    startStopNotifications,
    hasWonPrize,
    currentSessionRole, currentSessionHostName, currentSessionOtherParticipants,
  ]);

  const value: TimerContextType = {
    focusMinutes,
    setHomepageFocusMinutes,
    breakMinutes,
    setHomepageBreakMinutes,
    
    defaultFocusMinutes: _defaultFocusMinutes,
    setDefaultFocusMinutes,
    defaultBreakMinutes: _defaultBreakMinutes,
    setDefaultBreakMinutes,

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
    seshTitle: _seshTitle,
    setSeshTitle,
    isSeshTitleCustomized,
    formatTime,
    showSessionsWhileActive,
    setShowSessionsWhileActive,
    timerIncrement,
    setTimerIncrement: setTimerIncrementInternal,

    schedule,
    setSchedule,
    currentScheduleIndex,
    setCurrentScheduleIndex,
    isSchedulingMode,
    setIsSchedulingMode,
    isScheduleActive,
    setIsScheduleActive,
    isSchedulePrepared,
    setIsSchedulePrepared,
    startSchedule,
    commenceSpecificPreparedSchedule,
    discardPreparedSchedule,
    resetSchedule,
    scheduleTitle,
    setScheduleTitle,
    commenceTime,
    setCommenceTime,
    commenceDay,
    setCommenceDay,
    isGlobalPrivate,
    setIsGlobalPrivate,
    isRecurring,
    setIsRecurring,
    recurrenceFrequency,
    setRecurrenceFrequency,

    activeSchedule,
    setActiveSchedule,
    activeTimerColors,
    setActiveTimerColors,
    activeScheduleDisplayTitle: activeScheduleDisplayTitle,
    setActiveScheduleDisplayTitle: setActiveScheduleDisplayTitleInternal,

    savedSchedules,
    saveCurrentScheduleAsTemplate,
    loadScheduleTemplate,
    deleteScheduleTemplate,

    preparedSchedules,
    setPreparedSchedules,

    timerColors,
    setTimerColors,

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

    currentSessionRole,
    setCurrentSessionRole,
    currentSessionHostName,
    setCurrentSessionHostName,
    currentSessionOtherParticipants,
    setCurrentSessionOtherParticipants,
    allParticipantsToDisplay,

    isSchedulePending,
    setIsSchedulePending,
    isTimeLeftManagedBySession,
    setIsTimeLeftManagedBySession,
    scheduleStartOption,
    setScheduleStartOption,

    shouldPlayEndSound,
    setShouldPlayEndSound,
    shouldShowEndToast,
    setShouldShowEndToast,
    isBatchNotificationsEnabled,
    setIsBatchNotificationsEnabled,
    batchNotificationPreference,
    setBatchNotificationPreference,
    customBatchMinutes,
    setCustomBatchMinutes,
    lock,
    setLock,
    exemptionsEnabled,
    setExemptionsEnabled,
    phoneCalls,
    setPhoneCalls,
    favourites,
    setFavourites,
    workApps,
    setWorkApps,
    intentionalBreaches,
    setIntentionalBreaches,
    manualTransition,
    setManualTransition,
    maxDistance,
    setMaxDistance,
    askNotifications,
    setAskNotifications,
    joinNotifications,
    setJoinNotifications,
    sessionInvites,
    setSessionInvites,
    friendActivity,
    setFriendActivity,
    breakNotificationsVibrate,
    setBreakNotificationsVibrate,
    verificationStandard,
    setVerificationStandard,
    profileVisibility,
    setProfileVisibility,
    locationSharing,
    setLocationSharing,
    openSettingsAccordions,
    setOpenSettingsAccordions,
    is24HourFormat,
    setIs24HourFormat,
    areToastsEnabled,
    setAreToastsEnabled,
    startStopNotifications,
    setStartStopNotifications,
    playSound,
    triggerVibration,
    hasWonPrize,
    setHasWonPrize,
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};