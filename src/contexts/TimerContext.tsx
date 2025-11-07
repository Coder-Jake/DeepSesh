import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ScheduledTimer, ScheduledTimerTemplate, TimerContextType, ActiveAskItem, NotificationSettings } from '@/types/timer';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { DEFAULT_SCHEDULE_TEMPLATES } from '@/lib/default-schedules';
import { DAYS_OF_WEEK } from '@/lib/constants';
import { saveSessionToDatabase } from '@/utils/session-utils';
import { useProfile } from '../contexts/ProfileContext';
import { supabase } from '@/integrations/supabase/client'; // Import Supabase client

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_TIMER = 'deepsesh_timer_context';

interface TimerProviderProps {
  children: React.ReactNode;
  areToastsEnabled: boolean;
  setAreToastsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}

export const TimerProvider: React.FC<TimerProviderProps> = ({ children, areToastsEnabled, setAreToastsEnabled }) => {
  const { user } = useAuth();
  const { localFirstName } = useProfile();

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
  const [showSessionsWhileActive, setShowSessionsWhileActive] = useState<'hidden' | 'nearby' | 'friends' | 'all'>('all'); // MODIFIED: Default to 'all'
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
  const [hasWonPrize, setHasWonPrize] = useState(false);

  // NEW: State to track if homepage focus/break minutes have been manually customized
  const [isHomepageFocusCustomized, setIsHomepageFocusCustomized] = useState(false);
  const [isHomepageBreakCustomized, setIsHomepageBreakCustomized] = useState(false);

  // NEW: State to store the ID of the active session record in Supabase
  const [activeSessionRecordId, setActiveSessionRecordId] = useState<string | null>(null);

  // NEW: State to track geolocation permission status
  const [geolocationPermissionStatus, setGeolocationPermissionStatus] = useState<PermissionState>('prompt');

  const isSchedulePrepared = preparedSchedules.length > 0;
  const setIsSchedulePrepared = useCallback((_val: boolean) => {}, []);

  const setHomepageFocusMinutes = useCallback((minutes: number) => {
    _setFocusMinutes(minutes);
    setIsHomepageFocusCustomized(true); // Mark as customized
  }, []);

  const setHomepageBreakMinutes = useCallback((minutes: number) => {
    _setBreakMinutes(minutes);
    setIsHomepageBreakCustomized(true); // Mark as customized
  }, []);

  const setDefaultFocusMinutes = useCallback((minutes: number) => {
    _setDefaultFocusMinutes(minutes);
  }, []);

  const setDefaultBreakMinutes = useCallback((minutes: number) => {
    _setDefaultBreakMinutes(minutes);
  }, []);

  // Effect to synchronize homepage focusMinutes with defaultFocusMinutes when idle AND not customized
  useEffect(() => {
    if (!isRunning && !isPaused && !isScheduleActive && !isSchedulePending && !isTimeLeftManagedBySession && !isHomepageFocusCustomized) {
      if (focusMinutes !== _defaultFocusMinutes) {
        _setFocusMinutes(_defaultFocusMinutes);
      }
    }
  }, [_defaultFocusMinutes, isRunning, isPaused, isScheduleActive, isSchedulePending, isTimeLeftManagedBySession, focusMinutes, isHomepageFocusCustomized]);

  // Effect to synchronize homepage breakMinutes with defaultBreakMinutes when idle AND not customized
  useEffect(() => {
    if (!isRunning && !isPaused && !isScheduleActive && !isSchedulePending && !isTimeLeftManagedBySession && !isHomepageBreakCustomized) {
      if (breakMinutes !== _defaultBreakMinutes) {
        _setBreakMinutes(_defaultBreakMinutes);
      }
    }
  }, [_defaultBreakMinutes, isRunning, isPaused, isScheduleActive, isSchedulePending, isTimeLeftManagedBySession, breakMinutes, isHomepageBreakCustomized]);

  const getDefaultSeshTitle = useCallback(() => {
    return (localFirstName && localFirstName !== "You") ? `${localFirstName}'s Focus Sesh` : "My Focus Sesh";
  }, [localFirstName]);

  const [startStopNotifications, setStartStopNotifications] = useState<NotificationSettings>({ push: false, vibrate: false, sound: false });

  const playSound = useCallback(() => {
    // Defensive check for the object itself
    if (!startStopNotifications || !startStopNotifications.sound) {
      console.log("playSound: startStopNotifications object or sound property is not enabled/defined.");
      return;
    }
    console.log("playSound called. startStopNotifications.sound:", startStopNotifications.sound);
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
  }, [startStopNotifications]); // Dependency changed to the whole object

  const triggerVibration = useCallback(() => {
    // Defensive check for the object itself
    if (!startStopNotifications || !startStopNotifications.vibrate) {
      console.log("triggerVibration: startStopNotifications object or vibrate property is not enabled/defined.");
      return;
    }
    console.log("triggerVibration called. startStopNotifications.vibrate:", startStopNotifications.vibrate);
    if (startStopNotifications.vibrate && navigator.vibrate) {
      navigator.vibrate(200);
    } else if (startStopNotifications.vibrate) {
      console.warn("Vibration API not supported in this browser.");
    }
  }, [startStopNotifications]); // Dependency changed to the whole object

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
    const defaultTitle = getDefaultSeshTitle();
    _setSeshTitle(newTitle);
    setIsSeshTitleCustomized(newTitle.trim() !== "" && newTitle !== defaultTitle);
  }, [getDefaultSeshTitle]);

  const updateSeshTitleWithSchedule = useCallback((currentScheduleTitle: string) => {
    if (!isSeshTitleCustomized) {
      _setSeshTitle(currentScheduleTitle);
    }
  }, [isSeshTitleCustomized]);

  // Helper function to get user's current location
  const getLocation = useCallback(async (): Promise<{ latitude: number | null; longitude: number | null }> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        if (areToastsEnabled) {
          toast.error("Location Error", {
            description: "Geolocation is not supported by your browser.",
          });
        }
        resolve({ latitude: null, longitude: null });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeolocationPermissionStatus('granted'); // Update status on success
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          if (areToastsEnabled) {
            let errorMessage = "Failed to get your location.";
            if (error.code === error.PERMISSION_DENIED) {
              errorMessage = "Location access denied. Your session has been set to private.";
              setIsGlobalPrivate(true); // Automatically switch to private
              setGeolocationPermissionStatus('denied'); // Update status on denial
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              errorMessage = "Location information is unavailable.";
            } else if (error.code === error.TIMEOUT) {
              errorMessage = "The request to get user location timed out.";
            }
            toast.error("Location Error", {
              description: errorMessage,
            });
          }
          resolve({ latitude: null, longitude: null });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, [areToastsEnabled, setIsGlobalPrivate]);

  // NEW: Effect to query and listen for geolocation permission changes
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((permissionStatus) => {
        setGeolocationPermissionStatus(permissionStatus.state);
        permissionStatus.onchange = () => {
          setGeolocationPermissionStatus(permissionStatus.state);
        };
      });
    }
  }, []);

  // NEW: Function to sync session data to Supabase
  const syncSessionToSupabase = useCallback(async () => {
    if (!user?.id || isGlobalPrivate || !activeSessionRecordId) {
      return;
    }

    const currentScheduleItem = isScheduleActive ? activeSchedule[currentScheduleIndex] : null;
    const currentPhaseDuration = currentScheduleItem ? currentScheduleItem.durationMinutes : (timerType === 'focus' ? focusMinutes : breakMinutes);
    const currentPhaseEndTime = new Date(Date.now() + timeLeft * 1000).toISOString();

    const sessionData = {
      host_name: localFirstName,
      session_title: activeScheduleDisplayTitle,
      current_phase_type: timerType,
      current_phase_end_time: currentPhaseEndTime,
      is_active: isRunning,
      is_paused: isPaused,
      focus_duration: focusMinutes, // Store current homepage focus/break for manual timers
      break_duration: breakMinutes,
      total_session_duration_seconds: isScheduleActive ? activeSchedule.reduce((sum, item) => sum + item.durationMinutes, 0) * 60 : currentPhaseDuration * 60,
      schedule_id: isScheduleActive ? activeSchedule[0]?.id : null, // Assuming first item ID can represent schedule ID
      current_schedule_index: isScheduleActive ? currentScheduleIndex : 0,
      schedule_data: isScheduleActive ? activeSchedule : null,
    };

    try {
      const { error } = await supabase
        .from('active_sessions')
        .update(sessionData)
        .eq('id', activeSessionRecordId);

      if (error) {
        console.error("Error updating active session in Supabase:", error);
        if (areToastsEnabled) {
          toast.error("Supabase Sync Error", {
            description: `Failed to update active session: ${error.message}`,
          });
        }
      }
    } catch (error) {
      console.error("Unexpected error during Supabase sync:", error);
    }
  }, [
    user?.id, isGlobalPrivate, activeSessionRecordId, localFirstName, activeScheduleDisplayTitle,
    timerType, isRunning, isPaused, focusMinutes, breakMinutes, isScheduleActive, activeSchedule,
    currentScheduleIndex, timeLeft, areToastsEnabled
  ]);

  // NEW: Effect to sync session data to Supabase on relevant state changes
  useEffect(() => {
    if (activeSessionRecordId && user?.id && !isGlobalPrivate) {
      // Debounce updates to avoid excessive writes
      const handler = setTimeout(() => {
        syncSessionToSupabase();
      }, 500); // Sync every 500ms if state changes

      return () => clearTimeout(handler);
    }
  }, [
    isRunning, isPaused, timeLeft, timerType, currentScheduleIndex, activeScheduleDisplayTitle,
    focusMinutes, breakMinutes, isScheduleActive, isGlobalPrivate, activeSessionRecordId, user?.id,
    syncSessionToSupabase
  ]);

  const resetSchedule = useCallback(async () => {
    // NEW: Delete active session from Supabase if it exists
    if (activeSessionRecordId && user?.id && !isGlobalPrivate) {
      try {
        const { error } = await supabase
          .from('active_sessions')
          .delete()
          .eq('id', activeSessionRecordId)
          .eq('user_id', user.id);

        if (error) {
          console.error("Error deleting active session from Supabase:", error);
          if (areToastsEnabled) {
            toast.error("Supabase Delete Error", {
              description: `Failed to delete active session: ${error.message}`,
            });
          }
        } else {
          console.log("Active session deleted from Supabase:", activeSessionRecordId);
        }
      } catch (error) {
        console.error("Unexpected error during Supabase delete:", error);
      } finally {
        setActiveSessionRecordId(null); // Clear the record ID
      }
    }

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
    _setSeshTitle(getDefaultSeshTitle());
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
    setIsHomepageFocusCustomized(false); // Reset customization flag
    setIsHomepageBreakCustomized(false); // Reset customization flag
  }, [
    _defaultFocusMinutes, _defaultBreakMinutes, getDefaultSeshTitle, activeSessionRecordId, user?.id,
    isGlobalPrivate, areToastsEnabled
  ]);

  const startSchedule = useCallback(async () => {
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
        const finalMessage = `${confirmationMessageParts.join(" ")} Do you want to override them and start this new schedule now?`;
        if (!confirm(finalMessage)) {
            return;
        }
        if (shouldResetExistingActiveSchedule) {
            await resetSchedule(); // Use await here
        }
        if (shouldResetManualTimer) {
            setIsRunning(false);
            setIsPaused(false);
            setIsFlashing(false);
            setAccumulatedFocusSeconds(0);
            setAccumulatedBreakSeconds(0);
            _setSeshTitle(getDefaultSeshTitle());
            setIsSeshTitleCustomized(false);
            setActiveAsks([]);
            console.log("TimerContext: Manual timer reset during schedule start. activeAsks cleared.");
            setHasWonPrize(false);
            setIsHomepageFocusCustomized(false); // Reset customization flag
            setIsHomepageBreakCustomized(false); // Reset customization flag
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

    // NEW: Insert into active_sessions if not private
    if (user?.id && !isGlobalPrivate) {
      const { latitude, longitude } = await getLocation(); // Get location
      const currentScheduleItem = schedule[0];
      const currentPhaseEndTime = new Date(Date.now() + currentScheduleItem.durationMinutes * 60 * 1000).toISOString();
      try {
        const { data, error } = await supabase
          .from('active_sessions')
          .insert({
            user_id: user.id,
            host_name: localFirstName,
            session_title: scheduleTitle,
            visibility: 'public', // Always public if not isGlobalPrivate
            focus_duration: schedule.filter(s => s.type === 'focus').reduce((sum, s) => sum + s.durationMinutes, 0),
            break_duration: schedule.filter(s => s.type === 'break').reduce((sum, s) => sum + s.durationMinutes, 0),
            current_phase_type: currentScheduleItem.type,
            current_phase_end_time: currentPhaseEndTime,
            total_session_duration_seconds: schedule.reduce((sum, item) => sum + item.durationMinutes, 0) * 60,
            schedule_id: schedule[0]?.id, // Use the first item's ID as a simple schedule ID
            is_active: true,
            is_paused: false,
            current_schedule_index: 0,
            schedule_data: schedule,
            location_lat: latitude, // Include latitude
            location_long: longitude, // Include longitude
          })
          .select('id')
          .single();

        if (error) throw error;
        setActiveSessionRecordId(data.id);
        console.log("Active session inserted into Supabase:", data.id);
      } catch (error: any) {
        console.error("Error inserting active session into Supabase:", error.message);
        if (areToastsEnabled) {
          toast.error("Supabase Error", {
            description: `Failed to publish session: ${error.message}`,
          });
        }
      }
    }
}, [
    schedule, scheduleTitle, commenceTime, commenceDay, scheduleStartOption, isRecurring, recurrenceFrequency,
    isRunning, isPaused, isScheduleActive, timerColors, updateSeshTitleWithSchedule,
    resetSchedule, setAccumulatedFocusSeconds, setAccumulatedBreakSeconds,
    setIsSeshTitleCustomized, toast, areToastsEnabled, user?.user_metadata?.first_name, setActiveAsks,
    playSound, triggerVibration, setIsTimeLeftManagedBySession, getDefaultSeshTitle,
    setIsHomepageFocusCustomized, setIsHomepageBreakCustomized, user?.id, isGlobalPrivate, localFirstName, getLocation
]);

  const commenceSpecificPreparedSchedule = useCallback(async (templateId: string) => {
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
        const finalMessage = `${confirmationMessageParts.join(" ")} Do you want to override them and commence "${templateToCommence.title}"?`;
        if (!confirm(finalMessage)) {
            return;
        }
        if (shouldResetExistingActiveSchedule) {
            await resetSchedule(); // Use await here
        }
        if (shouldResetManualTimer) {
            setIsRunning(false);
            setIsPaused(false);
            setAccumulatedFocusSeconds(0);
            setAccumulatedBreakSeconds(0);
            _setSeshTitle(getDefaultSeshTitle());
            setIsSeshTitleCustomized(false);
            setActiveAsks([]);
            console.log("TimerContext: Manual timer reset during prepared schedule start. activeAsks cleared.");
            setHasWonPrize(false);
            setIsHomepageFocusCustomized(false); // Reset customization flag
            setIsHomepageBreakCustomized(false); // Reset customization flag
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

    // NEW: Insert into active_sessions if not private
    if (user?.id && !isGlobalPrivate) {
      const { latitude, longitude } = await getLocation(); // Get location
      const currentScheduleItem = templateToCommence.schedule[0];
      const currentPhaseEndTime = new Date(Date.now() + currentScheduleItem.durationMinutes * 60 * 1000).toISOString();
      try {
        const { data, error } = await supabase
          .from('active_sessions')
          .insert({
            user_id: user.id,
            host_name: localFirstName,
            session_title: templateToCommence.title,
            visibility: 'public', // Always public if not isGlobalPrivate
            focus_duration: templateToCommence.schedule.filter(s => s.type === 'focus').reduce((sum, s) => sum + s.durationMinutes, 0),
            break_duration: templateToCommence.schedule.filter(s => s.type === 'break').reduce((sum, s) => sum + s.durationMinutes, 0),
            current_phase_type: currentScheduleItem.type,
            current_phase_end_time: currentPhaseEndTime,
            total_session_duration_seconds: templateToCommence.schedule.reduce((sum, item) => sum + item.durationMinutes, 0) * 60,
            schedule_id: templateToCommence.id,
            is_active: true,
            is_paused: false,
            current_schedule_index: 0,
            schedule_data: templateToCommence.schedule,
            location_lat: latitude, // Include latitude
            location_long: longitude, // Include longitude
          })
          .select('id')
          .single();

        if (error) throw error;
        setActiveSessionRecordId(data.id);
        console.log("Active session inserted into Supabase (prepared schedule):", data.id);
      } catch (error: any) {
        console.error("Error inserting active session into Supabase (prepared schedule):", error.message);
        if (areToastsEnabled) {
          toast.error("Supabase Error", {
            description: `Failed to publish session: ${error.message}`,
          });
        }
      }
    }
  }, [isScheduleActive, isRunning, isPaused, preparedSchedules, updateSeshTitleWithSchedule, setAccumulatedFocusSeconds, setAccumulatedBreakSeconds, setIsSeshTitleCustomized, toast, areToastsEnabled, user?.user_metadata?.first_name, setActiveAsks, playSound, triggerVibration, setIsTimeLeftManagedBySession, getDefaultSeshTitle, setIsHomepageFocusCustomized, setIsHomepageBreakCustomized, user?.id, isGlobalPrivate, localFirstName, resetSchedule, getLocation]);

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
      // When loading a template, it's considered a fresh state, so reset customization flags
      setIsHomepageFocusCustomized(false);
      setIsHomepageBreakCustomized(false);
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
            if (areToastsEnabled) {
              toast("Schedule Looping!", {
                description: `"${scheduleTitle}" is restarting.`,
              });
            }
          } else {
            // Schedule completed, stop and save
            if (areToastsEnabled) {
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
        if (areToastsEnabled) {
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
    // This effect ensures timeLeft is correct when switching timerType or when homepage values change,
    // but only if not managed by an active session/schedule.
    if (!isTimeLeftManagedBySession && !isRunning && !isPaused && !isScheduleActive && !isSchedulePending) {
      const expectedTime = (timerType === 'focus' ? focusMinutes : breakMinutes) * 60;
      if (timeLeft !== expectedTime) {
        setTimeLeft(expectedTime);
      }
    }
  }, [focusMinutes, breakMinutes, timerType, isRunning, isPaused, isScheduleActive, isSchedulePending, isTimeLeftManagedBySession, timeLeft]);

  useEffect(() => {
    if (!isSeshTitleCustomized && activeScheduleDisplayTitle.trim() !== "") {
      _setSeshTitle(activeScheduleDisplayTitle);
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
    let initialSavedSchedules: ScheduledTimerTemplate[] = [];
    let initialScheduleToLoad: ScheduledTimerTemplate | undefined;

    if (storedData) {
      const data = JSON.parse(storedData);
      _setDefaultFocusMinutes(data._defaultFocusMinutes ?? 25);
      _setDefaultBreakMinutes(data. _defaultBreakMinutes ?? 5);
      
      // Load focusMinutes and breakMinutes, respecting customization flags
      const loadedFocusMinutes = data.focusMinutes ?? data._defaultFocusMinutes ?? 25;
      const loadedBreakMinutes = data.breakMinutes ?? data._defaultBreakMinutes ?? 5;
      const loadedIsHomepageFocusCustomized = data.isHomepageFocusCustomized ?? false;
      const loadedIsHomepageBreakCustomized = data.isHomepageBreakCustomized ?? false;

      _setFocusMinutes(loadedFocusMinutes);
      _setBreakMinutes(loadedBreakMinutes);
      setIsHomepageFocusCustomized(loadedIsHomepageFocusCustomized);
      setIsHomepageBreakCustomized(loadedIsHomepageBreakCustomized);
      
      let loadedSeshTitle = data._seshTitle ?? getDefaultSeshTitle();
      let loadedIsSeshTitleCustomized = data.isSeshTitleCustomized ?? false;

      if (loadedSeshTitle === "Notes" || loadedSeshTitle.trim() === "" || loadedSeshTitle === getDefaultSeshTitle()) {
        loadedSeshTitle = getDefaultSeshTitle();
        loadedIsSeshTitleCustomized = false;
      }
      _setSeshTitle(loadedSeshTitle);
      setIsSeshTitleCustomized(loadedIsSeshTitleCustomized);
      
      setNotes(data.notes ?? "");
      setTimerIncrementInternal(data.timerIncrement ?? 5);
      
      let loadedShowSessionsWhileActive = data.showSessionsWhileActive ?? 'all'; // MODIFIED: Default to 'all'
      if (loadedShowSessionsWhileActive === 'yes') {
        loadedShowSessionsWhileActive = 'all';
      }
      setShowSessionsWhileActive(loadedShowSessionsWhileActive);

      setIsGlobalPrivate(data.isGlobalPrivate ?? false);
      setTimerType(data.timerType ?? 'focus');
      setTimeLeft(data.timeLeft ?? (data.timerType === 'focus' ? loadedFocusMinutes * 60 : loadedBreakMinutes * 60));
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
      setActiveSessionRecordId(data.activeSessionRecordId ?? null); // NEW: Load activeSessionRecordId

      initialSavedSchedules = data.savedSchedules ?? [];
      setPreparedSchedules(data.preparedSchedules ?? []);
    }

    const mergedSchedulesMap = new Map<string, ScheduledTimerTemplate>();
    
    DEFAULT_SCHEDULE_TEMPLATES.forEach(template => mergedSchedulesMap.set(template.id, template));

    initialSavedSchedules.forEach(localSchedule => {
      mergedSchedulesMap.set(localSchedule.id, localSchedule);
    });

    const finalSavedSchedules = Array.from(mergedSchedulesMap.values());
    setSavedSchedules(finalSavedSchedules);

    initialScheduleToLoad = finalSavedSchedules.find(
      (template) => template.id === "default-school-timetable"
    );

    if (initialScheduleToLoad) {
      setSchedule(initialScheduleToLoad.schedule);
      setScheduleTitle(initialScheduleToLoad.title);
      setCommenceTime(initialScheduleToLoad.commenceTime);
      setCommenceDay(initialScheduleToLoad.commenceDay);
      setScheduleStartOption(initialScheduleToLoad.scheduleStartOption);
      setIsRecurring(initialScheduleToLoad.isRecurring);
      setRecurrenceFrequency(initialScheduleToLoad.recurrenceFrequency);
      setTimerColors(initialScheduleToLoad.timerColors || {});
      
      _setFocusMinutes(_defaultFocusMinutes);
      _setBreakMinutes(_defaultBreakMinutes);
      setTimerType('focus'); 
      setTimeLeft(_defaultFocusMinutes * 60); 
      _setSeshTitle(getDefaultSeshTitle()); 
      setIsSeshTitleCustomized(false);
      setIsHomepageFocusCustomized(false); // Ensure these are false on template load
      setIsHomepageBreakCustomized(false);
    } else {
      _setFocusMinutes(_defaultFocusMinutes);
      _setBreakMinutes(_defaultBreakMinutes);
      setTimerType('focus');
      setTimeLeft(_defaultFocusMinutes * 60);
      _setSeshTitle(getDefaultSeshTitle());
      setIsSeshTitleCustomized(false);
      setIsHomepageFocusCustomized(false); // Ensure these are false if no template loads
      setIsHomepageBreakCustomized(false);
    }
  }, [getDefaultSeshTitle, _defaultFocusMinutes, _defaultBreakMinutes, areToastsEnabled, setAreToastsEnabled]);

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
      startStopNotifications,
      hasWonPrize,
      currentSessionRole, currentSessionHostName, currentSessionOtherParticipants,
      isHomepageFocusCustomized, isHomepageBreakCustomized,
      activeSessionRecordId, // NEW: Save activeSessionRecordId
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
    startStopNotifications,
    hasWonPrize,
    currentSessionRole, currentSessionHostName, currentSessionOtherParticipants,
    isHomepageFocusCustomized, isHomepageBreakCustomized,
    activeSessionRecordId,
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
    getDefaultSeshTitle,

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
    getLocation, // NEW: Expose getLocation
    geolocationPermissionStatus, // NEW: Expose geolocationPermissionStatus
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