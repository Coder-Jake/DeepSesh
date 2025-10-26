import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ScheduledTimer, ScheduledTimerTemplate, TimerContextType, ActiveAskItem, NotificationSettings } from '@/types/timer'; // Import all types
import { toast } from '@/hooks/use-toast'; // Using shadcn toast for UI feedback
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import { supabase } from '@/integrations/supabase/client'; // Import supabase client
import { DEFAULT_SCHEDULE_TEMPLATES } from '@/lib/default-schedules'; // Import default templates
import { useProfile } from './ProfileContext'; // Import useProfile
import { DAYS_OF_WEEK } from '@/lib/constants'; // NEW: Import DAYS_OF_WEEK from constants

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_TIMER = 'deepsesh_timer_context'; // New local storage key for TimerContext

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth(); // Get user from AuthContext
  const { saveSession, localFirstName } = useProfile(); // Get saveSession and localFirstName from useProfile

  const [timerIncrement, setTimerIncrementInternal] = useState(5); // Default increment for focus/break minutes

  // Default timer settings (controlled by Settings page)
  const [_defaultFocusMinutes, _setDefaultFocusMinutes] = useState(25);
  const [_defaultBreakMinutes, _setDefaultBreakMinutes] = useState(5);

  // Current timer settings (used by homepage, initialized from defaults)
  const [focusMinutes, _setFocusMinutes] = useState(_defaultFocusMinutes);
  const [breakMinutes, _setBreakMinutes] = useState(_defaultBreakMinutes);

  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(focusMinutes * 60);
  const [timerType, setTimerType] = useState<'focus' | 'break'>('focus');
  const [isFlashing, setIsFlashing] = useState(false);
  const [notes, setNotes] = useState("");
  const [_seshTitle, _setSeshTitle] = useState("Notes"); // Renamed internal state
  const [isSeshTitleCustomized, setIsSeshTitleCustomized] = useState(false); // New state for customization
  const [showSessionsWhileActive, setShowSessionsWhileActive] = useState<'hidden' | 'nearby' | 'friends' | 'yes'>('hidden'); // Changed default to 'hidden'
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Schedule related states
  const [schedule, setSchedule] = useState<ScheduledTimer[]>([]); // This is the schedule being *edited* in ScheduleForm
  const [currentScheduleIndex, setCurrentScheduleIndex] = useState(0);
  const [isSchedulingMode, setIsSchedulingMode] = useState(false);
  const [isScheduleActive, setIsScheduleActive] = useState(false); // True when schedule is actively running/paused as part of its execution
  const [scheduleTitle, setScheduleTitle] = useState("My Focus Sesh"); // Title for the schedule being *edited*
  const [commenceTime, setCommenceTime] = useState(""); // Commence time for the schedule being *edited*
  const [commenceDay, setCommenceDay] = useState<number | null>(null); // Commence day for the schedule being *edited*
  const [isGlobalPrivate, setIsGlobalPrivate] = useState(false); // Moved here from Settings.tsx
  const [isRecurring, setIsRecurring] = useState(false); // Added
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily'); // Added
  const [scheduleStartOption, setScheduleStartOption] = useState<'now' | 'manual' | 'custom_time'>('now'); // Start option for the schedule being *edited*

  // Snapshot of the schedule when it's active
  const [activeSchedule, setActiveSchedule] = useState<ScheduledTimer[]>([]); // The schedule that is *currently running*
  const [activeTimerColors, setActiveTimerColors] = useState<Record<string, string>>({}); // Colors for the *currently running* schedule
  const [activeScheduleDisplayTitle, setActiveScheduleDisplayTitleInternal] = useState("My Focus Sesh"); // Title for the *currently running* schedule timeline

  // Saved Schedules (Templates)
  const [savedSchedules, setSavedSchedules] = useState<ScheduledTimerTemplate[]>([]); // Added
  
  // Prepared Schedules (Upcoming) - NEW STATE
  const [preparedSchedules, setPreparedSchedules] = useState<ScheduledTimerTemplate[]>([]);
  
  // Timer Colors for the schedule being *edited*
  const [timerColors, setTimerColors] = useState<Record<string, string>>({}); // NEW

  // New session tracking states
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [currentPhaseStartTime, setCurrentPhaseStartTime] = useState<number | null>(null);
  const [accumulatedFocusSeconds, setAccumulatedFocusSeconds] = useState(0);
  const [accumulatedBreakSeconds, setAccumulatedBreakSeconds] = useState(0);
  const [activeJoinedSessionCoworkerCount, setActiveJoinedSessionCoworkerCount] = useState(0);

  // Active Asks state
  const [activeAsks, setActiveAsks] = useState<ActiveAskItem[]>([]
  );

  // NEW: Host/Coworker role states
  const [currentSessionRole, setCurrentSessionRole] = useState<'host' | 'coworker' | null>(null);
  const [currentSessionHostName, setCurrentSessionHostName] = useState<string | null>(null);
  const [currentSessionOtherParticipants, setCurrentSessionOtherParticipants] = useState<{ id: string; name: string; sociability?: number; intention?: string; bio?: string }[]>([]);

  // Derived state for all participants to display in tooltips/coworker list
  const allParticipantsToDisplay = useMemo(() => {
    const participants: string[] = [];
    const uniqueNames = new Set<string>();

    // Add the current user
    if (user?.id) {
      uniqueNames.add(localFirstName);
    }

    // Add the host if they are not the current user
    if (currentSessionRole === 'coworker' && currentSessionHostName && currentSessionHostName !== localFirstName) {
      uniqueNames.add(currentSessionHostName);
    }

    // Add other participants
    currentSessionOtherParticipants.forEach(p => {
      if (p.name !== localFirstName && p.name !== currentSessionHostName) {
        uniqueNames.add(p.name);
      }
    });

    return Array.from(uniqueNames).sort();
  }, [currentSessionRole, currentSessionHostName, currentSessionOtherParticipants, user?.id, localFirstName]);

  // Schedule pending state (only for the *active* schedule if it's custom_time and waiting)
  const [isSchedulePending, setIsSchedulePending] = useState(false);
  // NEW: State to indicate if timeLeft is being managed by an active session/schedule
  const [isTimeLeftManagedBySession, setIsTimeLeftManagedBySession] = useState(false);
  
  // Settings states
  const [shouldPlayEndSound, setShouldPlayEndSound] = useState(false); // Changed default to false
  const [shouldShowEndToast, setShouldShowEndToast] = useState(false); // Changed default to false
  const [isBatchNotificationsEnabled, setIsBatchNotificationsEnabled] = useState(false);
  const [batchNotificationPreference, setBatchNotificationPreference] = useState<'break' | 'sesh_end' | 'custom'>('break');
  const [customBatchMinutes, setCustomBatchMinutes] = useState(timerIncrement);
  const [lock, setLock] = useState(false);
  const [exemptionsEnabled, setExemptionsEnabled] = useState(false);
  const [phoneCalls, setPhoneCalls] = useState(false);
  const [favourites, setFavourites] = useState(false);
  const [workApps, setWorkApps] = useState(false);
  const [intentionalBreaches, setIntentionalBreaches] = useState(false);
  const [manualTransition, setManualTransition] = useState(false); // Default to false (Auto)
  const [maxDistance, setMaxDistance] = useState(1000); // Default to 1km
  const [askNotifications, setAskNotifications] = useState<NotificationSettings>({ push: false, vibrate: false, sound: false }); // Changed default to false
  const [joinNotifications, setJoinNotifications] = useState<NotificationSettings>({ push: false, vibrate: false, sound: false }); // NEW: Initialize joinNotifications
  const [sessionInvites, setSessionInvites] = useState<NotificationSettings>({ push: false, vibrate: false, sound: false }); // Changed default to false
  const [friendActivity, setFriendActivity] = useState<NotificationSettings>({ push: false, vibrate: false, sound: false }); // Changed default to false
  const [breakNotificationsVibrate, setBreakNotificationsVibrate] = useState(false); // Changed default to false
  const [verificationStandard, setVerificationStandard] = useState<'anyone' | 'phone1' | 'organisation' | 'id1'>('anyone');
  const [profileVisibility, setProfileVisibility] = useState<('public' | 'friends' | 'organisation' | 'private')[]>(['public']); // Updated to array
  const [locationSharing, setLocationSharing] = useState(false);
  const [openSettingsAccordions, setOpenSettingsAccordions] = useState<string[]>([]); // Added
  const [is24HourFormat, setIs24HourFormat] = useState(true); // NEW: Default to 24-hour format
  const [areToastsEnabled, setAreToastsEnabled] = useState(false); // NEW: Default to false
  const [startStopNotifications, setStartStopNotifications] = useState<NotificationSettings>({ push: false, vibrate: false, sound: false }); // NEW: Default off

  // Derived state for isSchedulePrepared (true if there's at least one prepared schedule)
  const isSchedulePrepared = preparedSchedules.length > 0;
  // Derived state for setIsSchedulePrepared (setter is not needed as it's derived)
  // For type consistency, we can provide a no-op setter or remove it from context type if not strictly needed.
  // For now, I'll keep it in the type and provide a no-op here.
  const setIsSchedulePrepared = useCallback((_val: boolean) => {}, []);

  // Public setter for timerIncrement, ensuring a minimum of 1
  const setTimerIncrement = useCallback((increment: number) => {
    setTimerIncrementInternal(Math.max(1, increment));
  }, []);

  // Public setters for homepage timer values, ensuring a minimum of timerIncrement
  const setHomepageFocusMinutes = useCallback((minutes: number) => {
    _setFocusMinutes(Math.max(timerIncrement, minutes));
  }, [timerIncrement]);

  const setHomepageBreakMinutes = useCallback((minutes: number) => {
    _setBreakMinutes(Math.max(timerIncrement, minutes));
  }, [timerIncrement]);

  // Public setters for default timer values (from settings), ensuring a minimum of timerIncrement
  const setDefaultFocusMinutes = useCallback((minutes: number) => {
    const clampedMinutes = Math.max(timerIncrement, minutes);
    _setDefaultFocusMinutes(clampedMinutes);
    // Also update current homepage value if not running/paused/scheduled
    if (!isRunning && !isPaused && !isScheduleActive && !isSchedulePending) {
      _setFocusMinutes(clampedMinutes);
    }
  }, [isRunning, isPaused, isScheduleActive, isSchedulePending, timerIncrement]);

  const setDefaultBreakMinutes = useCallback((minutes: number) => {
    const clampedMinutes = Math.max(timerIncrement, minutes);
    _setDefaultBreakMinutes(clampedMinutes);
    // Also update current homepage value if not running/paused/scheduled
    if (!isRunning && !isPaused && !isScheduleActive && !isSchedulePending) {
      _setBreakMinutes(clampedMinutes);
    }
  }, [isRunning, isPaused, isScheduleActive, isSchedulePending, timerIncrement]);


  const playSound = useCallback(() => {
    console.log("playSound called. startStopNotifications.sound:", startStopNotifications.sound); // Debug log
    if (!startStopNotifications.sound) return; // NEW: Check startStopNotifications.sound
    if (typeof window.AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined') { // NEW: Check for AudioContext availability
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 440; // A4 note
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } else {
      console.warn("AudioContext not supported in this browser."); // Warn if not supported
    }
  }, [startStopNotifications.sound]); // NEW: Dependency

  const triggerVibration = useCallback(() => { // NEW: Function to trigger vibration
    console.log("triggerVibration called. startStopNotifications.vibrate:", startStopNotifications.vibrate); // Debug log
    if (startStopNotifications.vibrate && navigator.vibrate) {
      navigator.vibrate(200); // Vibrate for 200ms
    } else if (startStopNotifications.vibrate) { // NEW: Warn if vibrate is enabled but API not supported
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
      // Only seconds or zero
      return `00:${pad(seconds)}`;
    }
  }, []);

  // Public setter for seshTitle, also manages customization flag
  const setSeshTitle = useCallback((newTitle: string) => {
    _setSeshTitle(newTitle);
    // If the new title is not the default "Notes" and not empty, it's customized.
    // If it's set back to "Notes" or cleared, it's no longer customized.
    if (newTitle !== "Notes" && newTitle.trim() !== "") {
      setIsSeshTitleCustomized(true);
    } else {
      setIsSeshTitleCustomized(false);
    }
  }, []);

  // Function to automatically update seshTitle based on scheduleTitle
  const updateSeshTitleWithSchedule = useCallback((currentScheduleTitle: string) => {
    if (!isSeshTitleCustomized) { // Only update if not customized by user
      _setSeshTitle(`${currentScheduleTitle} Notes`);
    }
  }, [isSeshTitleCustomized]);

  const resetSchedule = useCallback(() => {
    setIsScheduleActive(false);
    setCurrentScheduleIndex(0);
    setSchedule([]); // Clear the editing schedule
    setScheduleTitle("My Focus Sesh");
    setCommenceTime(""); // Changed to empty string
    setCommenceDay(null);
    setIsSchedulePending(false);
    setScheduleStartOption('now');
    setIsRecurring(false); // Reset recurrence
    setRecurrenceFrequency('daily'); // Reset recurrence frequency
    // Reset main timer to default focus
    setTimerType('focus');
    _setFocusMinutes(_defaultFocusMinutes); // Reset current focus minutes to default
    _setBreakMinutes(_defaultBreakMinutes); // Reset current break minutes to default
    setTimeLeft(_defaultFocusMinutes * 60); // Use default focus minutes for initial timeLeft
    setIsRunning(false);
    setIsPaused(false);
    setIsFlashing(false);
    setSessionStartTime(null);
    setCurrentPhaseStartTime(null);
    setAccumulatedFocusSeconds(0);
    setAccumulatedBreakSeconds(0);
    setNotes("");
    _setSeshTitle("Notes"); // Reset internal seshTitle
    setIsSeshTitleCustomized(false); // Reset customization flag
    setTimerColors({}); // Reset timer colors for the editing schedule
    setActiveSchedule([]); // NEW: Clear active schedule
    setActiveTimerColors({}); // NEW: Clear active timer colors
    setActiveScheduleDisplayTitleInternal("My Focus Sesh"); // NEW: Reset timeline title
    setPreparedSchedules([]); // NEW: Clear all prepared schedules
    setActiveAsks([]); // NEW: Clear active asks
    console.log("TimerContext: resetSchedule called. activeAsks cleared."); // DEBUG

    // NEW: Reset role states
    setCurrentSessionRole(null);
    setCurrentSessionHostName(null);
    setCurrentSessionOtherParticipants([]);
    setActiveJoinedSessionCoworkerCount(0); // Reset coworker count
    setIsTimeLeftManagedBySession(false); // NEW: Reset this flag
  }, [_defaultFocusMinutes, _defaultBreakMinutes]);

  const startSchedule = useCallback(() => {
    if (schedule.length === 0) {
      return;
    }

    // If the schedule is being prepared (manual or custom_time), do NOT prompt for override.
    // Just add it to preparedSchedules.
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
        if (areToastsEnabled) { // Conditionally show toast
            toast({
                title: "Schedule Prepared!",
                description: `"${scheduleTitle}" is ready. ${scheduleStartOption === 'custom_time' ? 'It will begin at the scheduled time.' : 'Hit \'Commence\' to begin.'}`,
            });
        }
        return; // Exit early, no override logic needed for preparing
    }

    // If scheduleStartOption is 'now', then proceed with override checks.
    let needsOverrideConfirmation = false;
    let confirmationMessageParts: string[] = [];
    let shouldResetManualTimer = false;
    let shouldResetExistingActiveSchedule = false;

    if (isScheduleActive) {
        confirmationMessageParts.push("An active schedule is running.");
        shouldResetExistingActiveSchedule = true;
    }
    if (isRunning || isPaused) { // This covers manual timer
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
            resetSchedule(); // This resets all schedule-related states
        }
        if (shouldResetManualTimer) {
            setIsRunning(false);
            setIsPaused(false);
            setIsFlashing(false);
            setAccumulatedFocusSeconds(0);
            setAccumulatedBreakSeconds(0);
            setNotes("");
            _setSeshTitle("Notes");
            setIsSeshTitleCustomized(false);
            setActiveAsks([]); // NEW: Clear active asks for manual timer
            console.log("TimerContext: Manual timer reset during schedule start. activeAsks cleared."); // DEBUG
        }
    }

    // Logic for starting 'now'
    setActiveSchedule([...schedule]);
    setActiveTimerColors({ ...timerColors });
    setActiveScheduleDisplayTitleInternal(scheduleTitle);

    setCurrentScheduleIndex(0);
    setTimerType(schedule[0].type);
    setIsTimeLeftManagedBySession(true); // NEW: Set flag
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
    if (areToastsEnabled) { // Conditionally show toast
        toast({
            title: "Schedule Started!",
            description: `"${scheduleTitle}" has begun.`,
        });
    }
    playSound(); // NEW: Play sound on start
    triggerVibration(); // NEW: Trigger vibration on start

    // NEW: Set role to host
    setCurrentSessionRole('host');
    setCurrentSessionHostName(localFirstName); // Use localFirstName as the host name
    setCurrentSessionOtherParticipants([]);
    setActiveJoinedSessionCoworkerCount(0); // Ensure coworker count is 0 for a new host session
}, [
    schedule, scheduleTitle, commenceTime, commenceDay, scheduleStartOption, isRecurring, recurrenceFrequency,
    isRunning, isPaused, isScheduleActive, timerColors, updateSeshTitleWithSchedule,
    resetSchedule, setAccumulatedFocusSeconds, setAccumulatedBreakSeconds,
    setNotes, _setSeshTitle, setIsSeshTitleCustomized, toast, areToastsEnabled, localFirstName, setActiveAsks,
    playSound, triggerVibration, setIsTimeLeftManagedBySession // NEW: Dependency
]);

  const commenceSpecificPreparedSchedule = useCallback((templateId: string) => {
    const templateToCommence = preparedSchedules.find(template => template.id === templateId);
    if (!templateToCommence) return;

    let needsOverrideConfirmation = false;
    let confirmationMessageParts: string[] = [];
    let shouldResetManualTimer = false;
    let shouldResetExistingActiveSchedule = false;

    // Check for existing active schedule
    if (isScheduleActive) {
        confirmationMessageParts.push("An active schedule is running.");
        shouldResetExistingActiveSchedule = true;
    }
    // Check for existing manual timer
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
        // If confirmed, perform resets
        if (shouldResetExistingActiveSchedule) {
            // Only reset the active schedule, not all prepared ones
            setIsScheduleActive(false);
            setCurrentScheduleIndex(0);
            setActiveSchedule([]);
            setActiveTimerColors({});
            setActiveScheduleDisplayTitleInternal("My Focus Sesh");
            setIsSchedulePending(false);
            setActiveAsks([]); // NEW: Clear active asks for existing schedule
            console.log("TimerContext: Existing schedule reset during prepared schedule start. activeAsks cleared."); // DEBUG
        }
        if (shouldResetManualTimer) {
            // Reset manual timer states
            setIsRunning(false);
            setIsPaused(false);
            setAccumulatedFocusSeconds(0);
            setAccumulatedBreakSeconds(0);
            setNotes("");
            _setSeshTitle("Notes");
            setIsSeshTitleCustomized(false);
            setActiveAsks([]); // NEW: Clear active asks for manual timer
            console.log("TimerContext: Manual timer reset during prepared schedule start. activeAsks cleared."); // DEBUG
        }
    }

    // Now, actually start the prepared schedule
    setActiveSchedule(templateToCommence.schedule);
    setActiveTimerColors(templateToCommence.timerColors || {});
    setActiveScheduleDisplayTitleInternal(templateToCommence.title);

    setCurrentScheduleIndex(0);
    setTimerType(templateToCommence.schedule[0].type);
    setIsTimeLeftManagedBySession(true); // NEW: Set flag
    setTimeLeft(templateToCommence.schedule[0].durationMinutes * 60);
    setIsFlashing(false);
    setSessionStartTime(Date.now()); // Record overall session start time

    setIsScheduleActive(true);
    setIsSchedulePending(templateToCommence.scheduleStartOption === 'custom_time');
    setIsRunning(true);
    setIsPaused(false);
    setCurrentPhaseStartTime(Date.now()); // Start the first phase timer
    updateSeshTitleWithSchedule(templateToCommence.title);
    
    // Remove the commenced schedule from preparedSchedules
    setPreparedSchedules(prev => prev.filter(template => template.id !== templateId));

    if (areToastsEnabled) { // Conditionally show toast
        toast({
            title: "Schedule Commenced!",
            description: `"${templateToCommence.title}" has begun.`,
        });
    }
    playSound(); // NEW: Play sound on commence
    triggerVibration(); // NEW: Trigger vibration on commence

    // NEW: Set role to host
    setCurrentSessionRole('host');
    setCurrentSessionHostName(localFirstName); // Use localFirstName as the host name
    setCurrentSessionOtherParticipants([]);
    setActiveJoinedSessionCoworkerCount(0); // Ensure coworker count is 0 for a new host session
  }, [isScheduleActive, isRunning, isPaused, preparedSchedules, updateSeshTitleWithSchedule, setAccumulatedFocusSeconds, setAccumulatedBreakSeconds, setNotes, _setSeshTitle, setIsSeshTitleCustomized, toast, areToastsEnabled, localFirstName, setActiveAsks, playSound, triggerVibration, setIsTimeLeftManagedBySession]);

  const discardPreparedSchedule = useCallback((templateId: string) => {
    setPreparedSchedules(prev => prev.filter(template => template.id !== templateId));
    if (areToastsEnabled) { // Conditionally show toast
        toast({
            title: "Schedule Discarded",
            description: "The upcoming schedule has been removed.",
        });
    }
  }, [areToastsEnabled, toast]);

  const saveCurrentScheduleAsTemplate = useCallback(() => {
    if (!scheduleTitle.trim() || schedule.length === 0) {
      if (areToastsEnabled) { // Conditionally show toast
        toast({
          title: "Cannot save schedule",
          description: "Please provide a title and add timers to your schedule.",
          variant: "destructive",
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
      timerColors: timerColors, // NEW: Save current timer colors with the template
    };

    setSavedSchedules((prev) => [...prev, newTemplate]);
    if (areToastsEnabled) { // Conditionally show toast
        toast({
            title: "Schedule Saved!",
            description: `"${scheduleTitle}" has been saved as a template.`,
        });
    }
  }, [scheduleTitle, schedule, commenceTime, commenceDay, scheduleStartOption, isRecurring, recurrenceFrequency, timerColors, areToastsEnabled, toast]);

  const loadScheduleTemplate = useCallback((templateId: string) => {
    const templateToLoad = savedSchedules.find(template => template.id === templateId);
    if (templateToLoad) {
      // When loading a template, populate the *editing* schedule states
      setSchedule(templateToLoad.schedule);
      setScheduleTitle(templateToLoad.title);
      setCommenceTime(templateToLoad.commenceTime);
      setCommenceDay(templateToLoad.commenceDay);
      setScheduleStartOption(templateToLoad.scheduleStartOption);
      setIsRecurring(templateToLoad.isRecurring);
      setRecurrenceFrequency(templateToLoad.recurrenceFrequency);
      setTimerColors(templateToLoad.timerColors || {}); // Load timer colors for editing
      
      // Do NOT automatically add to preparedSchedules here.
      // The user needs to explicitly click "Begin" or "Prepare" in ScheduleForm.
      
      if (areToastsEnabled) { // Conditionally show toast
        toast({
          title: "Template Loaded!",
          description: `"${templateToLoad.title}" has been loaded into the editor.`,
        });
      }
    }
  }, [savedSchedules, areToastsEnabled, toast]);

  const deleteScheduleTemplate = useCallback((templateId: string) => {
    setSavedSchedules((prev) => prev.filter(template => template.id !== templateId));
    if (areToastsEnabled) { // Conditionally show toast
        toast({
            title: "Schedule Deleted!",
            description: "The schedule template has been removed.",
        });
    }
  }, [areToastsEnabled, toast]);

  // Timer logic
  useEffect(() => {
    if (isRunning && !isPaused && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      clearInterval(timerRef.current!);

      // Accumulate time for the phase that just ended
      if (currentPhaseStartTime !== null) {
        const elapsed = (Date.now() - currentPhaseStartTime) / 1000;
        if (timerType === 'focus') {
          setAccumulatedFocusSeconds((prev: number) => prev + elapsed);
        } else {
          setAccumulatedBreakSeconds((prev: number) => prev + elapsed);
        }
      }

      if (shouldPlayEndSound) playSound();
      if (breakNotificationsVibrate && navigator.vibrate) navigator.vibrate(200); // NEW: Vibrate on break end

      if (isScheduleActive) {
        const nextIndex = currentScheduleIndex + 1;
        if (nextIndex < activeSchedule.length) {
          setCurrentScheduleIndex(nextIndex);
          setTimerType(activeSchedule[nextIndex].type);
          setTimeLeft(activeSchedule[nextIndex].durationMinutes * 60);
          setIsRunning(true);
          setIsFlashing(false);
          setCurrentPhaseStartTime(Date.now()); // Start new phase timer
        } else {
          // Schedule completed
          if (shouldShowEndToast && areToastsEnabled) { // Conditionally show toast
            toast({
              title: "Schedule Completed!",
              description: `"${scheduleTitle}" has finished.`,
            });
          }
          
          // Final accumulated times are already updated above
          const finalFocusSeconds = accumulatedFocusSeconds;
          const finalBreakSeconds = accumulatedBreakSeconds;
          const totalSession = finalFocusSeconds + finalBreakSeconds;

          console.log("TimerContext: activeAsks before saving (schedule completion):", activeAsks); // DEBUG
          saveSession(
            _seshTitle, // Use internal seshTitle for saving
            notes,
            finalFocusSeconds,
            finalBreakSeconds,
            totalSession,
            activeJoinedSessionCoworkerCount,
            sessionStartTime || Date.now(),
            activeAsks, // NEW: Pass activeAsks to saveSession
            allParticipantsToDisplay // NEW: Pass allParticipantsToDisplay
          );

          resetSchedule();
        }
      } else { // Manual timer logic
        if (shouldShowEndToast && areToastsEnabled) { // Conditionally show toast
          toast({
            title: "Timer Ended!",
            description: `Your ${timerType} session has finished.`,
          });
        }

        if (manualTransition) {
          // Manual transition is ON: stop and flash, wait for user input
          setIsRunning(false);
          setIsFlashing(true);
          setCurrentPhaseStartTime(null); // No active phase being tracked
        } else {
          // Manual transition is OFF: automatically switch phases
          setIsFlashing(false); // No flashing
          setIsRunning(true); // Keep running

          if (timerType === 'focus') {
            setTimerType('break');
            setTimeLeft(breakMinutes * 60);
          } else {
            setTimerType('focus');
            setTimeLeft(focusMinutes * 60);
          }
          setCurrentPhaseStartTime(Date.now()); // Start new phase timer immediately
        }
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, isPaused, timeLeft, isFlashing, playSound, isScheduleActive, activeSchedule, currentScheduleIndex, timerType, resetSchedule, scheduleTitle, currentPhaseStartTime, setAccumulatedFocusSeconds, setAccumulatedBreakSeconds, shouldPlayEndSound, shouldShowEndToast, saveSession, _seshTitle, notes, accumulatedFocusSeconds, accumulatedBreakSeconds, activeJoinedSessionCoworkerCount, sessionStartTime, manualTransition, focusMinutes, breakMinutes, areToastsEnabled, activeAsks, allParticipantsToDisplay, breakNotificationsVibrate, triggerVibration]);

  // Initial time setting when focus/break minutes change
  useEffect(() => {
    // Only set timeLeft if it's not currently managed by an active session/schedule
    // and the timer is in an idle state (not running, not paused, not active schedule, not pending)
    if (!isTimeLeftManagedBySession && !isRunning && !isPaused && !isScheduleActive && !isSchedulePending) {
      const expectedTime = (timerType === 'focus' ? focusMinutes : breakMinutes) * 60;
      // Update if timeLeft is different from the expected value
      if (timeLeft !== expectedTime) {
        setTimeLeft(expectedTime);
      }
    }
  }, [focusMinutes, breakMinutes, timerType, isRunning, isPaused, isScheduleActive, isSchedulePending, isTimeLeftManagedBySession, timeLeft]);

  // Effect to synchronize seshTitle with activeScheduleDisplayTitle
  useEffect(() => {
    // Only update seshTitle if it hasn't been manually customized
    if (!isSeshTitleCustomized && activeScheduleDisplayTitle.trim() !== "") {
      _setSeshTitle(`${activeScheduleDisplayTitle} Notes`);
    }
  }, [activeScheduleDisplayTitle, isSeshTitleCustomized]);


  // Active Asks functions
  const addAsk = useCallback((ask: ActiveAskItem) => {
    setActiveAsks((prev) => [...prev, ask]);
  }, []);

  const updateAsk = useCallback((updatedAsk: ActiveAskItem) => {
    setActiveAsks((prev) =>
      prev.map((ask) => (ask.id === updatedAsk.id ? updatedAsk : ask))
    );
  }, []);

  // NEW: Effect to automatically commence prepared schedules
  useEffect(() => {
    const checkAndCommenceSchedules = () => {
      const now = new Date();
      for (const template of preparedSchedules) {
        if (template.scheduleStartOption === 'custom_time') {
          const [hours, minutes] = template.commenceTime.split(':').map(Number);
          let targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);

          const currentDay = now.getDay(); // 0 for Sunday, 1 for Monday
          const templateDay = template.commenceDay === null ? currentDay : template.commenceDay;
          const daysToAdd = (templateDay - currentDay + 7) % 7;
          targetDate.setDate(now.getDate() + daysToAdd);

          // If the target time is in the past for today, and it's not recurring, skip it.
          // If it's recurring, and in the past, check for next week/month.
          if (targetDate.getTime() < now.getTime()) {
            if (!template.isRecurring) {
              // If not recurring and time has passed, discard it
              discardPreparedSchedule(template.id);
              continue;
            } else {
              // For recurring schedules, advance to the next occurrence
              if (template.recurrenceFrequency === 'daily') {
                targetDate.setDate(targetDate.getDate() + 1);
              } else if (template.recurrenceFrequency === 'weekly') {
                targetDate.setDate(targetDate.getDate() + 7);
              } else if (template.recurrenceFrequency === 'monthly') {
                targetDate.setMonth(targetDate.getMonth() + 1);
              }
              // If after advancing, it's still in the past (e.g., a monthly schedule from last year),
              // keep advancing until it's in the future.
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

          // Check if current time is within a small window of the target time (e.g., 1 minute)
          // This prevents multiple commencements if the interval is longer than 1 second.
          const timeDifference = targetDate.getTime() - now.getTime();
          if (timeDifference <= 60 * 1000 && timeDifference >= -1000) { // Within 1 minute in the future or slightly past
            // Only commence if no other schedule is currently active or pending
            if (!isScheduleActive && !isSchedulePending) {
              commenceSpecificPreparedSchedule(template.id);
              // If it's recurring, update the template's commence time for the next cycle
              if (template.isRecurring) {
                const nextCommenceDate = new Date(targetDate);
                if (template.recurrenceFrequency === 'daily') {
                  nextCommenceDate.setDate(nextCommenceDate.getDate() + 1);
                } else if (template.recurrenceFrequency === 'weekly') {
                  nextCommenceDate.setDate(nextCommenceDate.getDate() + 7);
                } else if (template.recurrenceFrequency === 'monthly') {
                  nextCommenceDate.setMonth(nextCommenceDate.getMonth() + 1);
                }
                // Update the template in preparedSchedules with the new next commence time
                setPreparedSchedules(prev => prev.map(p => 
                  p.id === template.id ? { 
                    ...p, 
                    commenceTime: nextCommenceDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }),
                    commenceDay: nextCommenceDate.getDay()
                  } : p
                ));
              }
              return; // Only commence one schedule per check interval
            }
          }
        }
      }
    };

    const intervalId = setInterval(checkAndCommenceSchedules, 60 * 1000); // Check every minute
    checkAndCommenceSchedules(); // Run once immediately on mount

    return () => clearInterval(intervalId);
  }, [preparedSchedules, isScheduleActive, isSchedulePending, commenceSpecificPreparedSchedule, discardPreparedSchedule]);


  // Load TimerContext states from local storage on initial mount
  useEffect(() => {
    const storedData = localStorage.getItem(LOCAL_STORAGE_KEY_TIMER);
    const minIncrement = 1; // Minimum allowed increment

    if (storedData) {
      const data = JSON.parse(storedData);
      
      // Clamp timerIncrement first, as other values depend on it
      const loadedTimerIncrement = Math.max(data.timerIncrement ?? 5, minIncrement);
      setTimerIncrementInternal(loadedTimerIncrement);

      // Clamp default focus/break minutes
      const loadedDefaultFocus = Math.max(data._defaultFocusMinutes ?? 25, loadedTimerIncrement);
      const loadedDefaultBreak = Math.max(data._defaultBreakMinutes ?? 5, loadedTimerIncrement);
      _setDefaultFocusMinutes(loadedDefaultFocus);
      _setDefaultBreakMinutes(loadedDefaultBreak);

      // Clamp current homepage focus/break minutes
      const loadedFocusMinutes = Math.max(data.focusMinutes ?? loadedDefaultFocus, loadedTimerIncrement);
      const loadedBreakMinutes = Math.max(data.breakMinutes ?? loadedDefaultBreak, loadedTimerIncrement);
      _setFocusMinutes(loadedFocusMinutes);
      _setBreakMinutes(loadedBreakMinutes);

      _setSeshTitle(data._seshTitle ?? "Notes"); // Load internal state
      setIsSeshTitleCustomized(data.isSeshTitleCustomized ?? false); // Load new state
      setNotes(data.notes ?? "");
      setShowSessionsWhileActive(data.showSessionsWhileActive ?? 'hidden'); // Load new string type, default to 'hidden'
      setIsGlobalPrivate(data.isGlobalPrivate ?? false);
      setTimerType(data.timerType ?? 'focus');
      
      // Calculate timeLeft based on clamped values
      const initialTimeLeft = data.timeLeft ?? (data.timerType === 'focus' ? loadedFocusMinutes * 60 : loadedBreakMinutes * 60);
      setTimeLeft(initialTimeLeft);

      setIsRunning(data.isRunning ?? false);
      setIsPaused(data.isPaused ?? false);
      setIsFlashing(data.isFlashing ?? false);
      setSchedule(data.schedule ?? []);
      setCurrentScheduleIndex(data.currentScheduleIndex ?? 0);
      setIsSchedulingMode(data.isSchedulingMode ?? false);
      setIsScheduleActive(data.isScheduleActive ?? false);
      setScheduleTitle(data.scheduleTitle ?? "My Focus Sesh");
      setCommenceTime(data.commenceTime ?? ""); // Changed default to empty string
      setCommenceDay(data.commenceDay ?? null);
      setIsRecurring(data.isRecurring ?? false);
      setRecurrenceFrequency(data.recurrenceFrequency ?? 'daily');
      setSessionStartTime(data.sessionStartTime ?? null);
      setCurrentPhaseStartTime(data.currentPhaseStartTime ?? null);
      setAccumulatedFocusSeconds(data.accumulatedFocusSeconds ?? 0);
      setAccumulatedBreakSeconds(data.accumulatedBreakSeconds ?? 0);
      setActiveJoinedSessionCoworkerCount(data.activeJoinedSessionCoworkerCount ?? 0);
      setActiveAsks(data.activeAsks ?? []);
      console.log("TimerContext: Loading activeAsks from local storage:", data.activeAsks); // DEBUG
      setIsSchedulePending(data.isSchedulePending ?? false);
      setScheduleStartOption(data.scheduleStartOption ?? 'now');
      setIsTimeLeftManagedBySession(data.isTimeLeftManagedBySession ?? false); // NEW: Load isTimeLeftManagedBySession
      setShouldPlayEndSound(data.shouldPlayEndSound ?? false); // Changed default to false
      setShouldShowEndToast(data.shouldShowEndToast ?? false); // Changed default to false
      setIsBatchNotificationsEnabled(data.isBatchNotificationsEnabled ?? false);
      setBatchNotificationPreference(data.batchNotificationPreference ?? 'break');
      setCustomBatchMinutes(data.customBatchMinutes ?? loadedTimerIncrement);
      setLock(data.lock ?? false);
      setExemptionsEnabled(data.exemptionsEnabled ?? false);
      setPhoneCalls(data.phoneCalls ?? false);
      setFavourites(data.favourites ?? false);
      setWorkApps(data.workApps ?? false);
      setIntentionalBreaches(data.intentionalBreaches ?? false);
      setManualTransition(data.manualTransition ?? false); // NEW: Load manualTransition
      setMaxDistance(data.maxDistance ?? 1000);
      setAskNotifications(data.askNotifications ?? { push: false, vibrate: false, sound: false }); // Changed default to false
      setJoinNotifications(data.joinNotifications ?? { push: false, vibrate: false, sound: false }); // NEW: Load joinNotifications
      setSessionInvites(data.sessionInvites ?? { push: false, vibrate: false, sound: false }); // Changed default to false
      setFriendActivity(data.friendActivity ?? { push: false, vibrate: false, sound: false }); // Changed default to false
      setBreakNotificationsVibrate(data.breakNotificationsVibrate ?? false); // Changed default to false
      setVerificationStandard(data.verificationStandard ?? 'anyone');
      setProfileVisibility(data.profileVisibility ?? ['public']); // Updated default to array
      setLocationSharing(data.locationSharing ?? false);
      setOpenSettingsAccordions(data.openSettingsAccordions ?? []);
      setTimerColors(data.timerColors ?? {}); // NEW: Load timer colors
      setActiveSchedule(data.activeSchedule ?? []); // NEW: Load active schedule
      setActiveTimerColors(data.activeTimerColors ?? {}); // NEW: Load active timer colors
      setActiveScheduleDisplayTitleInternal(data.activeScheduleDisplayTitle ?? "My Focus Sesh"); // NEW: Load active schedule display title
      setIs24HourFormat(data.is24HourFormat ?? true); // NEW: Load is24HourFormat
      setAreToastsEnabled(data.areToastsEnabled ?? false); // NEW: Load areToastsEnabled
      setStartStopNotifications(data.startStopNotifications ?? { push: false, vibrate: false, sound: false }); // NEW: Load startStopNotifications

      // NEW: Load role states
      setCurrentSessionRole(data.currentSessionRole ?? null);
      setCurrentSessionHostName(data.currentSessionHostName ?? null);
      setCurrentSessionOtherParticipants(data.currentSessionOtherParticipants ?? []);

      // Load savedSchedules, merging with defaults if local storage is empty for schedules
      const loadedSchedules = data.savedSchedules ?? [];
      setSavedSchedules(loadedSchedules.length > 0 ? loadedSchedules : DEFAULT_SCHEDULE_TEMPLATES);
      
      // NEW: Load preparedSchedules
      setPreparedSchedules(data.preparedSchedules ?? []);
    } else {
      // If no data in local storage, initialize with default templates
      setSavedSchedules(DEFAULT_SCHEDULE_TEMPLATES);
    }
  }, []);

  // Save TimerContext states to local storage whenever they change
  useEffect(() => {
    const dataToSave = {
      _defaultFocusMinutes, _defaultBreakMinutes, // Save default minutes
      focusMinutes, breakMinutes, // Save current homepage minutes
      isRunning, isPaused, timeLeft, timerType, isFlashing,
      notes, _seshTitle, isSeshTitleCustomized, showSessionsWhileActive, schedule, currentScheduleIndex, // NEW: _seshTitle and isSeshTitleCustomized
      isSchedulingMode, isScheduleActive, scheduleTitle, commenceTime, commenceDay, // NEW
      isGlobalPrivate, isRecurring, recurrenceFrequency, savedSchedules, timerColors, sessionStartTime, // NEW: timerColors
      currentPhaseStartTime, accumulatedFocusSeconds, accumulatedBreakSeconds,
      activeJoinedSessionCoworkerCount, activeAsks, isSchedulePending, scheduleStartOption,
      isTimeLeftManagedBySession, // NEW: Dependency
      shouldPlayEndSound, shouldShowEndToast, isBatchNotificationsEnabled, batchNotificationPreference,
      customBatchMinutes, lock, exemptionsEnabled, phoneCalls, favourites, workApps,
      intentionalBreaches, manualTransition, maxDistance, askNotifications, joinNotifications, sessionInvites, // NEW: Save joinNotifications
      friendActivity, breakNotificationsVibrate, verificationStandard, profileVisibility,
      locationSharing, openSettingsAccordions, activeSchedule, activeTimerColors, activeScheduleDisplayTitle, // NEW: Save active schedule and colors, and display title
      is24HourFormat, // NEW: Save is24HourFormat
      preparedSchedules, // NEW: Save prepared schedules
      timerIncrement, // Save timerIncrement
      areToastsEnabled, // NEW: Save areToastsEnabled
      startStopNotifications, // NEW: Dependency
      // NEW: Dependencies for role states
      currentSessionRole, currentSessionHostName, currentSessionOtherParticipants,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY_TIMER, JSON.stringify(dataToSave));
    console.log("TimerContext: Saving activeAsks to local storage:", activeAsks); // DEBUG
  }, [
    _defaultFocusMinutes, _defaultBreakMinutes, // Dependencies for default minutes
    focusMinutes, breakMinutes, // Dependencies for current homepage minutes
    isRunning, isPaused, timeLeft, timerType, isFlashing,
    notes, _seshTitle, isSeshTitleCustomized, showSessionsWhileActive, schedule, currentScheduleIndex, // NEW: _seshTitle and isSeshTitleCustomized
    isSchedulingMode, isScheduleActive, scheduleTitle, commenceTime, commenceDay, // NEW
    isGlobalPrivate, isRecurring, recurrenceFrequency, savedSchedules, timerColors, sessionStartTime, // NEW: timerColors
    currentPhaseStartTime, accumulatedFocusSeconds, accumulatedBreakSeconds,
    activeJoinedSessionCoworkerCount, activeAsks, isSchedulePending, scheduleStartOption,
    isTimeLeftManagedBySession, // NEW: Dependency
    shouldPlayEndSound, shouldShowEndToast, isBatchNotificationsEnabled, batchNotificationPreference,
    customBatchMinutes, lock, exemptionsEnabled, phoneCalls, favourites, workApps,
    intentionalBreaches, manualTransition, maxDistance, askNotifications, joinNotifications, sessionInvites, // NEW: Save joinNotifications
    friendActivity, breakNotificationsVibrate, verificationStandard, profileVisibility,
    locationSharing, openSettingsAccordions, activeSchedule, activeTimerColors, activeScheduleDisplayTitle, // NEW: Save active schedule and colors, and display title
    is24HourFormat, // NEW: Save is24HourFormat
    preparedSchedules, // NEW: Save prepared schedules
    timerIncrement, // Save timerIncrement
    areToastsEnabled, // NEW: Save areToastsEnabled
    startStopNotifications, // NEW: Dependency
    // NEW: Dependencies for role states
    currentSessionRole, currentSessionHostName, currentSessionOtherParticipants,
  ]);

  const value: TimerContextType = { // NEW: Explicitly type the value object
    // Current homepage timer values
    focusMinutes,
    setHomepageFocusMinutes,
    breakMinutes,
    setHomepageBreakMinutes,
    
    // Default timer values (from settings)
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
    seshTitle: _seshTitle, // Expose internal state
    setSeshTitle, // Expose public setter
    isSeshTitleCustomized, // Expose customization flag
    formatTime,
    showSessionsWhileActive,
    setShowSessionsWhileActive,
    timerIncrement,
    setTimerIncrement, // Expose public setter

    schedule,
    setSchedule,
    currentScheduleIndex,
    setCurrentScheduleIndex,
    isSchedulingMode,
    setIsSchedulingMode,
    isScheduleActive,
    setIsScheduleActive,
    isSchedulePrepared, // NEW: Derived state
    setIsSchedulePrepared, // NEW: No-op setter for derived state
    startSchedule,
    commenceSpecificPreparedSchedule, // NEW
    discardPreparedSchedule, // NEW
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

    activeSchedule, // NEW
    setActiveSchedule, // NEW
    activeTimerColors, // NEW
    setActiveTimerColors, // NEW
    activeScheduleDisplayTitle: activeScheduleDisplayTitle, // NEW
    setActiveScheduleDisplayTitle: setActiveScheduleDisplayTitleInternal, // NEW

    savedSchedules,
    saveCurrentScheduleAsTemplate,
    loadScheduleTemplate,
    deleteScheduleTemplate,

    preparedSchedules, // NEW
    setPreparedSchedules, // NEW

    timerColors, // NEW
    setTimerColors, // NEW

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
    setActiveAsks, // <--- THIS WAS MISSING!

    // NEW: Host/Coworker role states
    currentSessionRole,
    setCurrentSessionRole,
    currentSessionHostName,
    setCurrentSessionHostName,
    currentSessionOtherParticipants,
    setCurrentSessionOtherParticipants,
    allParticipantsToDisplay, // NEW: Expose allParticipantsToDisplay

    isSchedulePending,
    setIsSchedulePending,
    isTimeLeftManagedBySession, // NEW: Expose isTimeLeftManagedBySession
    setIsTimeLeftManagedBySession, // NEW: Expose setIsTimeLeftManagedBySession
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
    joinNotifications, // NEW
    setJoinNotifications, // NEW
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
    is24HourFormat, // NEW
    setIs24HourFormat, // NEW
    areToastsEnabled, // NEW
    setAreToastsEnabled, // NEW
    startStopNotifications, // NEW
    setStartStopNotifications, // NEW
    playSound,
    triggerVibration,
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  console.log("TimerContext: Value provided by useTimer hook:", context); // Add this
  return context;
};