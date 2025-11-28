import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ScheduledTimer, ScheduledTimerTemplate, TimerContextType, ActiveAskItem, NotificationSettings, ParticipantSessionData, SupabaseSessionData, DemoSession } from '@/types/timer';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { DEFAULT_SCHEDULE_TEMPLATES } from '@/lib/default-schedules';
import { DAYS_OF_WEEK } from '@/lib/constants';
import { saveSessionToDatabase } from '@/utils/session-utils';
import { useProfile } from '../contexts/ProfileContext';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js'; // Import RealtimeChannel
import { isValidUUID } from '@/lib/utils'; // NEW: Import isValidUUID
import { getEdgeFunctionErrorMessage } from '@/utils/error-utils'; // NEW: Import the error utility

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_TIMER = 'deepsesh_timer_context';

interface TimerProviderProps {
  children: React.ReactNode;
  areToastsEnabled: boolean;
  setAreToastsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}

export const TimerProvider: React.FC<TimerProviderProps> = ({ children, areToastsEnabled, setAreToastsEnabled }) => {
  const { user, session } = useAuth(); // MODIFIED: Destructure session from useAuth
  const { localFirstName, profile, focusPreference: userFocusPreference, joinCode: userJoinCode, loading: profileLoading } = useProfile(); // RENAMED: hostCode to joinCode, NEW: Get profileLoading

  // Define getDefaultSeshTitle early so it can be used in useState initializers
  const getDefaultSeshTitle = useCallback(() => {
    // Prioritize profile's first_name if it's explicitly set, otherwise use join_code
    const profileFirstName = profile?.first_name;
    const code = profile?.join_code;

    if (profileFirstName && profileFirstName !== "You" && profileFirstName.trim() !== "") {
      return `${profileFirstName}'s DeepSesh`;
    } else if (code && code.trim() !== "") {
      return `${code}'s DeepSesh`;
    }
    // Fallback if neither a custom name nor a join code is available
    return "Coworker's DeepSesh"; // Replaced "My DeepSesh"
  }, [profile?.first_name, profile?.join_code]); // Add profile?.join_code to dependencies

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
  const [hostNotes, setHostNotes] = useState(""); // NEW: Add hostNotes state
  const [_seshTitle, _setSeshTitle] = useState("Coworker's DeepSesh"); // MODIFIED: Initialize with placeholder
  const [isSeshTitleCustomized, setIsSeshTitleCustomized] = useState(false);
  const [showSessionsWhileActive, setShowSessionsWhileActive] = useState<'hidden' | 'nearby' | 'friends' | 'all'>('all');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [schedule, setSchedule] = useState<ScheduledTimer[]>([]);
  const [currentScheduleIndex, setCurrentScheduleIndex] = useState(0);
  const [isSchedulingMode, setIsSchedulingMode] = useState(false);
  const [isScheduleActive, setIsScheduleActive] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState("Coworker's DeepSesh"); // MODIFIED: Initialize with placeholder
  const [commenceTime, setCommenceTime] = useState("");
  const [commenceDay, setCommenceDay] = useState<number | null>(null);
  
  // Synchronous initialization for isDiscoveryActivated, geolocationPermissionStatus, and sessionVisibility
  const [isDiscoveryActivated, setIsDiscoveryActivated] = useState<boolean>(() => {
    const storedData = localStorage.getItem(LOCAL_STORAGE_KEY_TIMER);
    if (storedData) {
      const data = JSON.parse(storedData);
      return data.isDiscoveryActivated ?? false;
    }
    return false;
  });

  const [geolocationPermissionStatus, setGeolocationPermissionStatus] = useState<PermissionState>(() => {
    const storedData = localStorage.getItem(LOCAL_STORAGE_KEY_TIMER);
    if (storedData) {
      const data = JSON.parse(storedData);
      return data.geolocationPermissionStatus ?? 'prompt';
    }
    return 'prompt';
  });

  const [sessionVisibility, setSessionVisibility] = useState<'public' | 'private' | 'organisation'>(() => {
    const storedData = localStorage.getItem(LOCAL_STORAGE_KEY_TIMER);
    if (storedData) {
      const data = JSON.parse(storedData);
      return data.sessionVisibility ?? 'private';
    }
    return 'private';
  });
  // End synchronous initialization

  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [scheduleStartOption, setScheduleStartOption] = useState<'now' | 'manual' | 'custom_time'>('now');

  const [activeSchedule, setActiveSchedule] = useState<ScheduledTimer[]>([]);
  const [activeTimerColors, setActiveTimerColors] = useState<Record<string, string>>({});
  const [activeScheduleDisplayTitle, setActiveScheduleDisplayTitleInternal] = useState("Coworker's DeepSesh"); // MODIFIED: Initialize with placeholder

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
  const [currentSessionOtherParticipants, setCurrentSessionOtherParticipants] = useState<ParticipantSessionData[]>([]);

  const [currentSessionParticipantsData, setCurrentSessionParticipantsData] = useState<ParticipantSessionData[]>([]);

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
      if (p.userName !== currentUserName && p.userName !== currentSessionHostName) {
        uniqueNames.add(p.userName);
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
  // REMOVED: profileVisibility and setProfileVisibility from TimerContext
  const [locationSharing, setLocationSharing] = useState(false);
  const [openSettingsAccordions, setOpenSettingsAccordions] = useState<string[]>([]);
  const [is24HourFormat, setIs24HourFormat] = useState(true);
  const [hasWonPrize, setHasWonPrize] = useState(false);

  const [isHomepageFocusCustomized, setIsHomepageFocusCustomized] = useState(false);
  const [isHomepageBreakCustomized, setIsHomepageBreakCustomized] = useState(false);

  const [activeSessionRecordId, setActiveSessionRecordId] = useState<string | null>(null);

  // geolocationPermissionStatus and isDiscoveryActivated are now initialized synchronously above
  // const [geolocationPermissionStatus, setGeolocationPermissionStatus] = useState<PermissionState>('prompt');
  // const [isDiscoveryActivated, setIsDiscoveryActivated] = useState(false);

  const [lastActivityTime, setLastActivityTime] = useState<number | null>(null);

  const [showDemoSessions, setShowDemoSessions] = useState(true);

  // NEW: State for the total duration of the current phase (in seconds)
  const [currentPhaseDurationSeconds, setCurrentPhaseDurationSeconds] = useState(0);
  // NEW: State to store remaining time when paused, for accurate resumption
  const [remainingTimeAtPause, setRemainingTimeAtPause] = useState(0);

  // NEW: State for Limit Discovery Radius
  const [limitDiscoveryRadius, setLimitDiscoveryRadius] = useState<boolean>(() => {
    const storedData = localStorage.getItem(LOCAL_STORAGE_KEY_TIMER);
    if (storedData) {
      const data = JSON.parse(storedData);
      return data.limitDiscoveryRadius ?? false;
    }
    return false;
  });

  const isSchedulePrepared = preparedSchedules.length > 0;
  const setIsSchedulePrepared = useCallback((_val: boolean) => {}, []);

  const setHomepageFocusMinutes = useCallback((minutes: number) => {
    _setFocusMinutes(minutes);
    setIsHomepageFocusCustomized(true);
  }, []);

  const setHomepageBreakMinutes = useCallback((minutes: number) => {
    _setBreakMinutes(minutes);
    setIsHomepageBreakCustomized(true);
  }, []);

  const setDefaultFocusMinutes = useCallback((minutes: number) => {
    _setDefaultFocusMinutes(minutes);
  }, []);

  const setDefaultBreakMinutes = useCallback((minutes: number) => {
    _setDefaultBreakMinutes(minutes);
  }, []);

  // REMOVED: useEffect that reset focusMinutes to _defaultFocusMinutes
  // REMOVED: useEffect that reset breakMinutes to _defaultBreakMinutes

  const [startStopNotifications, setStartStopNotifications] = useState<NotificationSettings>({ push: false, vibrate: false, sound: false });

  const playSound = useCallback(() => {
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
  }, [startStopNotifications]);

  const triggerVibration = useCallback(() => {
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
  }, [startStopNotifications]);

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

  const setSeshTitle = useCallback(async (newTitle: string) => {
    const defaultTitle = getDefaultSeshTitle();
    _setSeshTitle(newTitle);
    const isCustom = newTitle.trim() !== "" && newTitle !== defaultTitle;
    setIsSeshTitleCustomized(isCustom);

    // If a session is active and published to Supabase, update its title
    if (user?.id && activeSessionRecordId && currentSessionRole === 'host') {
      try {
        const { error } = await supabase
          .from('active_sessions')
          .update({ session_title: newTitle, last_heartbeat: new Date().toISOString() }) // ADDED: last_heartbeat
          .eq('id', activeSessionRecordId)
          .eq('user_id', user.id); // MODIFIED: Use user_id for RLS

        if (error) {
          console.error("Error updating session title in Supabase:", error);
          if (areToastsEnabled) {
            toast.error("Supabase Update Error", {
              description: `Failed to update session title: ${error.message}`,
            });
          }
        } else {
          console.log("Session title updated in Supabase:", newTitle);
        }
      } catch (error) {
        console.error("Unexpected error during Supabase title update:", error);
      }
    }
  }, [getDefaultSeshTitle, user?.id, activeSessionRecordId, currentSessionRole, areToastsEnabled]);

  const updateSeshTitleWithSchedule = useCallback((currentScheduleTitle: string) => {
    if (!isSeshTitleCustomized) {
      _setSeshTitle(currentScheduleTitle);
    }
  }, [isSeshTitleCustomized]);

  const getLocation = useCallback(async (): Promise<{ latitude: number | null; longitude: number | null }> => {
    return new Promise(async (resolve) => {
      if (!navigator.geolocation) {
        if (areToastsEnabled) {
          toast.error("Location Error", {
            description: "Geolocation is not supported by your browser.",
          });
        }
        setGeolocationPermissionStatus('denied');
        setSessionVisibility('private'); // MODIFIED: Force private if geolocation not supported
        resolve({ latitude: null, longitude: null });
        return;
      }

      const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
      setGeolocationPermissionStatus(permissionStatus.state);

      if (permissionStatus.state === 'granted') {
        if (areToastsEnabled) {
          toast.info("Location Already Enabled", {
            description: "Your browser is already sharing your location.",
          });
        }
      } else if (permissionStatus.state === 'denied') {
        if (areToastsEnabled) {
          toast.error("Location Access Denied", {
            description: "Location access denied. Your session has been set to private. Please enable in browser settings.",
          });
        }
        setSessionVisibility('private'); // MODIFIED: Force private if location denied
        setGeolocationPermissionStatus('denied');
        resolve({ latitude: null, longitude: null });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeolocationPermissionStatus('granted');
          // Do not force sessionVisibility here, it's managed by the toggle
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
              errorMessage = "Location access denied. Your session has been set to private. Please enable in browser settings.";
              setSessionVisibility('private'); // MODIFIED: Force private if location denied
              setGeolocationPermissionStatus('denied');
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
  }, [areToastsEnabled, setSessionVisibility, setGeolocationPermissionStatus]); // MODIFIED: setSessionVisibility to dependencies

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

  useEffect(() => {
    if (isDiscoveryActivated && geolocationPermissionStatus === 'denied' && sessionVisibility !== 'private') {
      setSessionVisibility('private'); // MODIFIED: Force private if discovery active but location denied
      if (areToastsEnabled) {
        toast.info("Discovery Privacy Adjusted", {
          description: "Location access is denied, so your sessions are now private.",
        });
      }
    }
  }, [isDiscoveryActivated, geolocationPermissionStatus, sessionVisibility, areToastsEnabled, setSessionVisibility]); // MODIFIED: sessionVisibility to dependencies

  const syncSessionToSupabase = useCallback(async () => {
    if (!user?.id || !activeSessionRecordId) {
      console.log("syncSessionToSupabase: Skipping sync. User ID or activeSessionRecordId missing.");
      return;
    }

    const currentScheduleItem = isScheduleActive ? activeSchedule[currentScheduleIndex] : null;
    const currentPhaseDuration = currentScheduleItem ? currentScheduleItem.durationMinutes : (timerType === 'focus' ? focusMinutes : breakMinutes);
    const currentPhaseEndTime = new Date(Date.now() + timeLeft * 1000).toISOString();

    const sessionData = {
      host_name: currentSessionHostName,
      session_title: activeScheduleDisplayTitle,
      current_phase_type: timerType,
      current_phase_end_time: currentPhaseEndTime,
      is_active: isRunning,
      is_paused: isPaused,
      focus_duration: focusMinutes,
      break_duration: breakMinutes,
      total_session_duration_seconds: isScheduleActive ? activeSchedule.reduce((sum, item) => sum + item.durationMinutes, 0) * 60 : currentPhaseDuration * 60,
      schedule_id: isScheduleActive && activeSchedule[0]?.id && isValidUUID(activeSchedule[0].id) ? activeSchedule[0].id : null, // MODIFIED: Added isValidUUID check
      current_schedule_index: isScheduleActive ? currentScheduleIndex : 0,
      schedule_data: activeSchedule,
      visibility: sessionVisibility, // MODIFIED: Use sessionVisibility
      participants_data: currentSessionParticipantsData,
      user_id: currentSessionParticipantsData.find(p => p.role === 'host')?.userId || null,
      join_code: userJoinCode, // RENAMED: host_code to join_code
      organization: profile?.organization || null, // NEW: Add organization
      last_heartbeat: new Date().toISOString(), // ADDED: last_heartbeat
      host_notes: hostNotes, // NEW: Add hostNotes
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
      } else {
        console.log("syncSessionToSupabase: Successfully updated session:", activeSessionRecordId);
      }
    } catch (error) {
      console.error("Unexpected error during Supabase sync:", error);
    }
  }, [
    user?.id, activeSessionRecordId, currentSessionHostName, activeScheduleDisplayTitle,
    timerType, isRunning, isPaused, focusMinutes, breakMinutes, isScheduleActive, activeSchedule,
    currentScheduleIndex, timeLeft, sessionVisibility, currentSessionParticipantsData, areToastsEnabled, // MODIFIED: sessionVisibility
    userJoinCode, profile?.organization, hostNotes // NEW: Add hostNotes
  ]);

  useEffect(() => {
    if (activeSessionRecordId && user?.id) {
      const handler = setTimeout(() => {
        syncSessionToSupabase();
      }, 500);

      return () => clearTimeout(handler);
    }
  }, [
    isRunning, isPaused, timeLeft, timerType, currentScheduleIndex, activeScheduleDisplayTitle,
    focusMinutes, breakMinutes, isScheduleActive, sessionVisibility, activeSessionRecordId, user?.id, // MODIFIED: sessionVisibility
    currentSessionParticipantsData, syncSessionToSupabase, hostNotes // NEW: Add hostNotes
  ]);

  // NEW: Periodic heartbeat sender for all participants
  useEffect(() => {
    let heartbeatInterval: NodeJS.Timeout | null = null;

    if (user?.id && activeSessionRecordId) {
      heartbeatInterval = setInterval(async () => {
        try {
          const response = await supabase.functions.invoke('update-session-data', {
            body: JSON.stringify({
              sessionId: activeSessionRecordId,
              actionType: 'heartbeat',
              payload: {
                participantId: user.id,
              },
            }),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`,
            },
          });

          if (response.error) throw response.error;
          if (response.data.error) throw new Error(response.data.error);
          console.log("Heartbeat sent for session:", activeSessionRecordId);
        } catch (error: any) {
          console.error("Error sending heartbeat:", error.message);
          // Optionally, handle disconnection or session termination if heartbeats consistently fail
        }
      }, 30000); // Send heartbeat every 30 seconds
    }

    return () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
    };
  }, [user?.id, activeSessionRecordId, session?.access_token]);


  // NEW: Supabase Realtime Subscription for active sessions
  useEffect(() => {
    let subscription: RealtimeChannel | null = null;

    if (activeSessionRecordId) {
      console.log("TimerContext: Subscribing to active_sessions for ID:", activeSessionRecordId);
      subscription = supabase
        .channel(`active_sessions:${activeSessionRecordId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'active_sessions',
            filter: `id=eq.${activeSessionRecordId}`,
          },
          (payload) => {
            console.log("TimerContext: Realtime update received for session:", payload.new.id);
            const updatedSession = payload.new as SupabaseSessionData;
            const updatedParticipants = (updatedSession.participants_data || []) as ParticipantSessionData[];
            setCurrentSessionParticipantsData(updatedParticipants);
            setActiveJoinedSessionCoworkerCount(updatedParticipants.filter(p => p.role === 'coworker').length);
            setActiveAsks(updatedSession.active_asks || []); // Sync active asks
            setHostNotes(updatedSession.host_notes || ""); // NEW: Sync hostNotes
          }
        )
        .subscribe();
    }

    return () => {
      if (subscription) {
        console.log("TimerContext: Unsubscribing from active_sessions for ID:", activeSessionRecordId);
        supabase.removeChannel(subscription);
      }
    };
  }, [activeSessionRecordId, setCurrentSessionParticipantsData, setActiveJoinedSessionCoworkerCount, setActiveAsks, setHostNotes]); // NEW: Add setHostNotes to dependencies

  const resetSessionStates = useCallback(() => {
    setIsScheduleActive(false);
    setCurrentScheduleIndex(0);
    setSchedule([]);
    setScheduleTitle(getDefaultSeshTitle());
    setCommenceTime("");
    setCommenceDay(null);
    setIsSchedulePending(false);
    setScheduleStartOption('now');
    setIsRecurring(false);
    setRecurrenceFrequency('daily');
    setTimerType('focus');
    // Reset homepage focus/break minutes to defaults and clear customization flags
    _setFocusMinutes(_defaultFocusMinutes);
    _setBreakMinutes(_defaultBreakMinutes);
    setIsHomepageFocusCustomized(false); // NEW
    setIsHomepageBreakCustomized(false); // NEW
    setTimeLeft(_defaultFocusMinutes * 60);
    setCurrentPhaseDurationSeconds(_defaultFocusMinutes * 60);
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
    setActiveScheduleDisplayTitleInternal(getDefaultSeshTitle());
    setPreparedSchedules([]);
    setActiveAsks([]);
    console.log("TimerContext: resetSessionStates called. activeAsks cleared.");
    setNotes(""); // NEW: Clear notes
    setHostNotes(""); // NEW: Clear hostNotes

    setCurrentSessionRole(null);
    setCurrentSessionHostName(null);
    setCurrentSessionOtherParticipants([]);
    setActiveJoinedSessionCoworkerCount(0);
    setIsTimeLeftManagedBySession(false);
    setHasWonPrize(false);
    // REMOVED: setIsHomepageFocusCustomized(false);
    // REMOVED: setIsHomepageBreakCustomized(false);
    setCurrentSessionParticipantsData([]);
    console.log("resetSessionStates: activeSessionRecordId cleared to null.");
    setActiveSessionRecordId(null);
    setLastActivityTime(null);
    setCurrentPhaseDurationSeconds(0); // NEW: Reset current phase duration
    setRemainingTimeAtPause(0); // NEW: Reset remaining time at pause
    // REMOVED: setIsDiscoveryActivated(false); // REMOVED THIS LINE
  }, [
    _defaultFocusMinutes, _defaultBreakMinutes, getDefaultSeshTitle, _setFocusMinutes, _setBreakMinutes, setIsHomepageFocusCustomized, setIsHomepageBreakCustomized
  ]);

  const resetSchedule = useCallback(async () => {
    if (activeSessionRecordId && user?.id && currentSessionRole === 'host') {
      console.log("resetSchedule: Attempting to delete active session from Supabase:", activeSessionRecordId);
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
      }
    } else {
      console.log("resetSchedule: Not deleting from Supabase. activeSessionRecordId:", activeSessionRecordId, "user?.id:", user?.id, "currentSessionRole:", currentSessionRole);
    }
    resetSessionStates();
  }, [activeSessionRecordId, user?.id, currentSessionRole, areToastsEnabled, resetSessionStates]);

  const transferHostRole = useCallback(async (): Promise<boolean> => { // MODIFIED: Added return type
    if (!user?.id || !activeSessionRecordId || currentSessionRole !== 'host') {
      console.warn("Attempted to transfer host role without being the host or having an active session.");
      return false; // MODIFIED: Return false if conditions not met
    }

    const currentHostId = user.id;
    const otherCoworkers = currentSessionParticipantsData
      .filter(p => p.role === 'coworker')
      .sort((a, b) => a.joinTime - b.joinTime);

    if (otherCoworkers.length > 0) {
      const newHost = otherCoworkers[0];
      
      try {
        const response = await supabase.functions.invoke('update-session-data', {
          body: JSON.stringify({
            sessionId: activeSessionRecordId,
            actionType: 'transfer_host',
            payload: {
              newHostId: newHost.userId,
              newHostName: newHost.userName,
            },
          }),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`, // MODIFIED: Use session.access_token
          },
        });

        if (response.error) throw response.error;
        if (response.data.error) throw new Error(response.data.error);

        if (areToastsEnabled) {
          toast.success("Host Role Transferred", {
            description: `Host role transferred to ${newHost.userName}.`,
          });
        }
        // REMOVED: Local state updates (setCurrentSessionRole, etc.)
        return true; // MODIFIED: Return true on success

      } catch (error: any) {
        console.error("Error transferring host role via Edge Function:", error);
        if (areToastsEnabled) {
          toast.error("Host Transfer Failed", {
            description: `Failed to transfer host role: ${await getEdgeFunctionErrorMessage(error)}`, // MODIFIED: Use getEdgeFunctionErrorMessage
          });
        }
        return false; // MODIFIED: Return false on error
      }

    } else {
      console.log("transferHostRole: No other coworkers to transfer to. Deleting session from Supabase.");
      try {
        const { error: deleteError } = await supabase
          .from('active_sessions')
          .delete()
          .eq('id', activeSessionRecordId)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;

        if (areToastsEnabled) {
          toast.info("Session Ended", {
            description: "No other participants to transfer host role to. Session ended.",
          });
        }
        // REMOVED: Local state updates (resetSchedule())
        return true; // MODIFIED: Return true on success

      } catch (deleteError: any) {
        console.error("Error deleting session when no other participants:", deleteError);
        if (areToastsEnabled) {
          toast.error("Session Deletion Failed", {
            description: `Failed to end session: ${deleteError.message}`,
          });
        }
        return false; // MODIFIED: Return false on error
      }
    }
  }, [user?.id, activeSessionRecordId, currentSessionRole, currentSessionParticipantsData, localFirstName, areToastsEnabled, session?.access_token]); // RENAMED: userHostCode to userJoinCode, NEW: Add session.access_token to dependencies

  const leaveSession = useCallback(async (): Promise<boolean> => { // MODIFIED: Added return type
    if (!user?.id || !activeSessionRecordId) {
      console.warn("Attempted to leave session without active session or user ID.");
      return false; // MODIFIED: Return false if conditions not met
    }

    // REMOVED: if (currentSessionRole === 'host') { await transferHostRole(); return; }
    // This logic is now handled by stopTimer.

    try {
      const response = await supabase.functions.invoke('update-session-data', {
        body: JSON.stringify({
          sessionId: activeSessionRecordId,
          actionType: 'leave_session',
          payload: {
            participantId: user.id,
          },
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`, // MODIFIED: Use session.access_token
        },
      });

      if (response.error) throw response.error;
      if (response.data.error) throw new Error(response.data.error);

      if (areToastsEnabled) {
        toast.info("Session Left", {
          description: "You have left the session.",
        });
      }
      return true; // MODIFIED: Return true on success
    } catch (error: any) {
      console.error("Error leaving session via Edge Function:", error);
      if (areToastsEnabled) {
        toast.error("Leave Session Failed", {
          description: `An unexpected error occurred: ${await getEdgeFunctionErrorMessage(error)}.`, // MODIFIED: Use getEdgeFunctionErrorMessage
        });
      }
      return false; // MODIFIED: Return false on error
    }
    // REMOVED: finally block with resetSessionStates()
  }, [user?.id, activeSessionRecordId, areToastsEnabled, session?.access_token]); // NEW: Add session.access_token to dependencies

  const stopTimer = useCallback(async (confirmPrompt: boolean, isLongPress: boolean) => {
    // Always stop the local timer immediately for the user
    let finalAccumulatedFocus = accumulatedFocusSeconds;
    let finalAccumulatedBreak = accumulatedBreakSeconds;

    // Calculate final accumulated times before stopping
    if (isRunning && currentPhaseStartTime !== null) {
      const elapsed = (Date.now() - currentPhaseStartTime) / 1000;
      if (timerType === 'focus') {
        finalAccumulatedFocus += elapsed;
      } else {
        finalAccumulatedBreak += elapsed;
      }
    }
    const totalSessionSeconds = finalAccumulatedFocus + finalAccumulatedBreak;

    // Attempt to update remote session state if applicable
    if (currentSessionRole === 'host') {
      // Host is stopping. Transfer role or delete session from Supabase.
      await transferHostRole(); // This function handles its own toasts/errors
    } else if (currentSessionRole === 'coworker') {
      // Coworker is stopping. Leave session from Supabase.
      await leaveSession(); // This function handles its own toasts/errors
    } else {
      // Solo timer. No remote session to update.
      // Save local session data.
      console.log("TimerContext: Calling saveSessionToDatabase with activeAsks:", activeAsks);
      await saveSessionToDatabase(
        user?.id,
        _seshTitle,
        notes,
        hostNotes,
        finalAccumulatedFocus,
        finalAccumulatedBreak,
        totalSessionSeconds,
        activeJoinedSessionCoworkerCount,
        sessionStartTime || Date.now(),
        activeAsks,
        allParticipantsToDisplay,
        areToastsEnabled
      );
    }

    // Always reset local timer states for the current user.
    resetSessionStates();
    playSound();
    triggerVibration();

  }, [
    currentSessionRole, accumulatedFocusSeconds, accumulatedBreakSeconds,
    isRunning, currentPhaseStartTime, timerType, user?.id, _seshTitle, notes, hostNotes,
    activeJoinedSessionCoworkerCount, sessionStartTime, activeAsks, allParticipantsToDisplay,
    areToastsEnabled, resetSessionStates, playSound, triggerVibration, transferHostRole, leaveSession
  ]);


  const startSessionCommonLogic = useCallback(async (
    sessionType: 'manual' | 'schedule',
    initialSchedule: ScheduledTimer[],
    initialScheduleTitle: string,
    initialTimerColors: Record<string, string>,
    initialCommenceTime: string,
    initialCommenceDay: number | null,
    initialScheduleStartOption: 'now' | 'manual' | 'custom_time',
    initialIsRecurring: boolean,
    initialRecurrenceFrequency: 'daily' | 'weekly' | 'monthly',
    isPendingStart: boolean = false
  ) => {
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
        const finalMessage = `${confirmationMessageParts.join(" ")} Do you want to override them and start this new session now?`;
        if (!confirm(finalMessage)) {
            return false;
        }
        if (shouldResetExistingActiveSchedule) {
            await resetSchedule();
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
            console.log("TimerContext: Manual timer reset during session start. activeAsks cleared.");
            setHasWonPrize(false);
            setIsHomepageFocusCustomized(false);
            setIsHomepageBreakCustomized(false);
            setNotes(""); // NEW: Clear notes
            setHostNotes(""); // NEW: Clear hostNotes
        }
    }

    setActiveSchedule(initialSchedule);
    setActiveTimerColors(initialTimerColors);
    _setSeshTitle(initialScheduleTitle); // NEW: Set the main timer title
    setIsSeshTitleCustomized(false); // NEW: It's coming from a schedule, so not "customized" by direct user input
    setActiveScheduleDisplayTitleInternal(initialScheduleTitle); // MODIFIED: Use initialScheduleTitle

    setCurrentScheduleIndex(0);
    setTimerType(initialSchedule[0].type);
    setIsTimeLeftManagedBySession(true);
    
    // NEW: Set currentPhaseDurationSeconds for the first item
    const initialDurationSeconds = initialSchedule[0].durationMinutes * 60;
    setCurrentPhaseDurationSeconds(initialDurationSeconds);
    setTimeLeft(initialDurationSeconds); // Initialize timeLeft to full duration

    setIsFlashing(false);
    setSessionStartTime(Date.now());
    setCurrentPhaseStartTime(Date.now()); // NEW: Set current phase start time
    setIsSchedulingMode(false);

    setIsScheduleActive(true);
    setIsSchedulePending(isPendingStart);
    setIsRunning(true);
    setIsPaused(false);
    // REMOVED: updateSeshTitleWithSchedule(initialScheduleTitle); // MODIFIED: Removed this call
    if (areToastsEnabled) {
        toast("Session Started!", {
            description: `"${initialScheduleTitle}" has begun.`,
        });
    }
    playSound();
    triggerVibration();

    const hostParticipant: ParticipantSessionData = {
      userId: user?.id || `anon-${crypto.randomUUID()}`,
      userName: localFirstName,
      joinTime: Date.now(),
      role: 'host',
      focusPreference: userFocusPreference || 50,
      intention: profile?.profile_data?.intention?.value || null, // Changed undefined to null
      bio: profile?.profile_data?.bio?.value || null, // Changed undefined to null
    };
    setCurrentSessionParticipantsData([hostParticipant]);
    setCurrentSessionRole('host');
    setCurrentSessionHostName(localFirstName);
    setCurrentSessionOtherParticipants([]);
    setActiveJoinedSessionCoworkerCount(0);

    console.log("--- Debugging Session Title before Supabase Insert ---");
    console.log("User ID:", user?.id);
    console.log("localFirstName (from ProfileContext):", localFirstName);
    console.log("isSeshTitleCustomized (from TimerContext):", isSeshTitleCustomized);
    console.log("getDefaultSeshTitle():", getDefaultSeshTitle());
    console.log("initialScheduleTitle (value being sent to Supabase):", initialScheduleTitle);
    console.log("--- End Debugging Session Title ---");

    if (sessionVisibility !== 'private') { // MODIFIED: Check sessionVisibility
      const { latitude, longitude } = await getLocation();
      const currentScheduleItem = initialSchedule[0];
      const currentPhaseEndTime = new Date(Date.now() + currentScheduleItem.durationMinutes * 60 * 1000).toISOString();
      try {
        const { data, error } = await supabase
          .from('active_sessions')
          .insert({
            user_id: hostParticipant.userId,
            host_name: hostParticipant.userName,
            session_title: initialScheduleTitle, // MODIFIED: Use initialScheduleTitle
            visibility: sessionVisibility, // MODIFIED: Use sessionVisibility
            focus_duration: initialSchedule.filter(s => s.type === 'focus').reduce((sum, s) => sum + s.durationMinutes, 0),
            break_duration: initialSchedule.filter(s => s.type === 'break').reduce((sum, s) => sum + s.durationMinutes, 0),
            current_phase_type: currentScheduleItem.type,
            current_phase_end_time: currentPhaseEndTime,
            total_session_duration_seconds: initialSchedule.reduce((sum, item) => sum + item.durationMinutes, 0) * 60,
            schedule_id: initialSchedule[0]?.id && isValidUUID(initialSchedule[0].id) ? initialSchedule[0].id : null, // MODIFIED: Added isValidUUID check
            is_active: true,
            is_paused: false,
            current_schedule_index: 0,
            schedule_data: initialSchedule,
            location_lat: latitude,
            location_long: longitude,
            participants_data: [hostParticipant],
            join_code: userJoinCode, // RENAMED: host_code to join_code
            organization: profile?.organization || null, // NEW: Add organization
            last_heartbeat: new Date().toISOString(), // ADDED: last_heartbeat
            host_notes: hostNotes, // NEW: Add hostNotes
          })
          .select('id')
          .single();

        if (error) throw error;
        setActiveSessionRecordId(data.id);
        console.log("startSessionCommonLogic: Active session inserted into Supabase:", data.id);
      } catch (error: any) {
        console.error("Error inserting active session into Supabase:", error.message);
        if (areToastsEnabled) {
          toast.error("Supabase Error", {
            description: `Failed to publish session: ${error.message}`,
          });
        }
      }
    }
    return true;
  }, [
    isScheduleActive, isRunning, isPaused, resetSchedule, setAccumulatedFocusSeconds, setAccumulatedBreakSeconds,
    setIsSeshTitleCustomized, setActiveAsks, setHasWonPrize, setIsHomepageFocusCustomized, setIsHomepageBreakCustomized,
    /* REMOVED: updateSeshTitleWithSchedule, */ areToastsEnabled, playSound, triggerVibration, user?.id, localFirstName,
    userFocusPreference, profile?.profile_data?.intention?.value, profile?.profile_data?.bio?.value, getLocation, getDefaultSeshTitle, scheduleTitle, isSeshTitleCustomized,
    setCurrentPhaseDurationSeconds, setTimeLeft, setCurrentPhaseStartTime, userJoinCode, sessionVisibility, profile?.organization, hostNotes,
    _setSeshTitle, setActiveScheduleDisplayTitleInternal // NEW: Added setters to dependencies
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

    await startSessionCommonLogic(
      'schedule',
      schedule,
      scheduleTitle,
      timerColors,
      commenceTime,
      commenceDay,
      scheduleStartOption,
      isRecurring,
      recurrenceFrequency,
      false
    );
}, [
    schedule, scheduleTitle, commenceTime, commenceDay, scheduleStartOption, isRecurring, recurrenceFrequency,
    timerColors, areToastsEnabled, startSessionCommonLogic
]);

  const commenceSpecificPreparedSchedule = useCallback(async (templateId: string) => {
    const templateToCommence = preparedSchedules.find(template => template.id === templateId);
    if (!templateToCommence) return;

    const started = await startSessionCommonLogic(
      'schedule',
      templateToCommence.schedule,
      templateToCommence.title,
      templateToCommence.timerColors || {},
      templateToCommence.commenceTime,
      templateToCommence.commenceDay,
      templateToCommence.scheduleStartOption,
      templateToCommence.isRecurring,
      templateToCommence.recurrenceFrequency,
      templateToCommence.scheduleStartOption === 'custom_time'
    );

    if (started) {
      setPreparedSchedules(prev => prev.filter(template => template.id !== templateId));
    }
  }, [preparedSchedules, startSessionCommonLogic]);

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
      setIsHomepageFocusCustomized(false);
      setIsHomepageBreakCustomized(false);

      // Set homepage focus/break minutes to the first item of the loaded schedule, or its default
      const firstScheduleItem = templateToLoad.schedule[0];
      if (firstScheduleItem) {
        // REMOVED: _setFocusMinutes(firstScheduleItem.type === 'focus' ? firstScheduleItem.durationMinutes : _defaultFocusMinutes);
        // REMOVED: _setBreakMinutes(firstScheduleItem.type === 'break' ? firstScheduleItem.durationMinutes : _defaultBreakMinutes);
        // REMOVED: setTimerType(firstScheduleItem.type);
        // REMOVED: setTimeLeft(firstScheduleItem.durationMinutes * 60);
        // REMOVED: setCurrentPhaseDurationSeconds(firstScheduleItem.durationMinutes * 60);
      } else {
        // If schedule is empty, fall back to current defaults
        // REMOVED: setTimerType('focus');
        // REMOVED: setTimeLeft(_defaultFocusMinutes * 60);
        // REMOVED: setCurrentPhaseDurationSeconds(_defaultFocusMinutes * 60);
      }
      _setSeshTitle(getDefaultSeshTitle()); 
      setIsSeshTitleCustomized(false); 
      setNotes(""); // NEW: Clear notes
      setHostNotes(""); // NEW: Clear hostNotes
    }
  }, [savedSchedules, areToastsEnabled, toast, _defaultFocusMinutes, _defaultBreakMinutes, _setFocusMinutes, _setBreakMinutes, setIsHomepageFocusCustomized, setIsHomepageBreakCustomized, getDefaultSeshTitle]);

  const deleteScheduleTemplate = useCallback((templateId: string) => {
    setSavedSchedules((prev) => prev.filter(template => template.id !== templateId));
    if (areToastsEnabled) {
        toast("Schedule Deleted!", {
            description: "The schedule template has been removed.",
        });
    }
  }, [areToastsEnabled, toast]);

  const joinSessionAsCoworker = useCallback(async (
    sessionToJoin: DemoSession, // MODIFIED: Accept DemoSession directly
    sessionTitle: string,
    hostName: string,
    participants: ParticipantSessionData[], // This is the list of participants from the *mock* session
    fullSchedule: ScheduledTimer[],
    currentPhaseType: 'focus' | 'break',
    currentPhaseDurationMinutes: number,
    remainingSecondsInPhase: number
  ) => {
    if (!user?.id) {
      if (areToastsEnabled) {
        toast.error("Join Session Failed", {
          description: "You must be logged in to join a session.",
        });
      }
      return;
    }

    if (isRunning || isPaused || isScheduleActive || isSchedulePrepared) {
      if (isScheduleActive || isSchedulePrepared) await resetSchedule();
      setIsRunning(false);
      setIsPaused(false);
      setIsFlashing(false);
      setAccumulatedFocusSeconds(0);
      setAccumulatedBreakSeconds(0);
      setSeshTitle(getDefaultSeshTitle());
      setActiveAsks([]);
      setHasWonPrize(false);
      setIsHomepageFocusCustomized(false);
      setIsHomepageBreakCustomized(false);
      setNotes(""); // NEW: Clear notes
      setHostNotes(""); // NEW: Clear hostNotes
    }

    setActiveSessionRecordId(sessionToJoin.id); // Use the actual session ID
    setActiveSchedule(fullSchedule);
    setActiveScheduleDisplayTitleInternal(sessionTitle);
    setTimerType(currentPhaseType);
    setIsTimeLeftManagedBySession(true);
    
    // NEW: Set currentPhaseDurationSeconds for the joined session
    const initialDurationSeconds = currentPhaseDurationMinutes * 60;
    setCurrentPhaseDurationSeconds(initialDurationSeconds);
    setTimeLeft(Math.max(0, remainingSecondsInPhase)); // timeLeft is the actual remaining time

    setIsRunning(true);
    setIsPaused(false);
    setIsFlashing(false);
    // Calculate the actual start time of the current phase based on its total duration and remaining time
    const elapsedSecondsInPhase = initialDurationSeconds - remainingSecondsInPhase;
    const actualCurrentPhaseStartTime = Date.now() - elapsedSecondsInPhase * 1000;
    setCurrentPhaseStartTime(actualCurrentPhaseStartTime); // MODIFIED: Set currentPhaseStartTime correctly
    
    // The sessionStartTime should reflect when the *entire session* started, not just the current phase.
    // For a coworker joining, we don't have the exact session start time from the host directly in these props.
    // A more robust solution would be to pass session.startTime from the fetched SupabaseSessionData.
    setSessionStartTime(Date.now() - (currentPhaseDurationMinutes * 60 - remainingSecondsInPhase) * 1000); 
    
    setAccumulatedFocusSeconds(0);
    setAccumulatedBreakSeconds(0);

    if (currentPhaseType === 'focus') {
      setHomepageFocusMinutes(currentPhaseDurationMinutes);
      setHomepageBreakMinutes(_defaultBreakMinutes);
    } else {
      setHomepageBreakMinutes(currentPhaseDurationMinutes);
      setHomepageFocusMinutes(_defaultFocusMinutes);
    }

    setCurrentSessionRole('coworker');
    setCurrentSessionHostName(hostName);
    setCurrentSessionOtherParticipants(participants.filter(p => p.userId !== user.id));
    setHostNotes(sessionToJoin.host_notes || ""); // NEW: Set hostNotes from joined session

    const newCoworker: ParticipantSessionData = {
      userId: user.id,
      userName: localFirstName,
      joinTime: Date.now(),
      role: 'coworker',
      focusPreference: userFocusPreference || 50,
      intention: profile?.profile_data?.intention?.value || null, // Changed undefined to null
      bio: profile?.profile_data?.bio?.value || null, // Changed undefined to null
    };

    // NEW: Check if it's a mock session (no user_id means it's a mock session)
    if (!sessionToJoin.user_id) {
      console.log("Joining mock session locally:", sessionToJoin.id);
      // Simulate joining locally for mock sessions
      const updatedParticipantsData = [...participants, newCoworker];
      setCurrentSessionParticipantsData(updatedParticipantsData);
      setActiveJoinedSessionCoworkerCount(updatedParticipantsData.filter(p => p.role === 'coworker').length);
      if (areToastsEnabled) {
        toast.success("Mock Sesh Joined!", {
          description: `You've joined "${sessionTitle}" (mock session).`,
        });
      }
      playSound();
      triggerVibration();
      return; // Exit early for mock sessions
    }

    // For real sessions, invoke the Edge Function
    try {
      const response = await supabase.functions.invoke('join-session', {
        body: JSON.stringify({
          sessionCode: sessionToJoin.join_code, // MODIFIED: Use sessionToJoin.join_code
          participantData: newCoworker,
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`, // MODIFIED: Use session.access_token
        },
      });

      if (response.error) {
        console.error("Supabase Edge Function 'join-session' returned an error:", response.error);
        throw response.error; // Re-throw to be caught by the outer catch block
      }
      if (response.data.error) {
        console.error("Supabase Edge Function 'join-session' returned a data error:", response.data.error);
        throw new Error(response.data.error); // Throw the specific error message from data
      }

      const updatedSession = response.data.session;
      const updatedParticipantsData: ParticipantSessionData[] = (updatedSession?.participants_data || []) as ParticipantSessionData[];
      setCurrentSessionParticipantsData(updatedParticipantsData);
      setHostNotes(updatedSession.host_notes || ""); // NEW: Set hostNotes from joined session

      if (areToastsEnabled) {
        toast.success("Sesh Joined!", {
          description: `You've joined "${sessionTitle}".`,
        });
      }
      playSound();
      triggerVibration();
    } catch (error: any) {
      console.error("Unexpected error during joinSessionAsCoworker:", error);
      if (areToastsEnabled) {
        toast.error("Join Session Failed", {
          description: `An unexpected error occurred: ${await getEdgeFunctionErrorMessage(error)}.`, // MODIFIED: Use getEdgeFunctionErrorMessage
        });
      }
      resetSessionStates();
    }
  }, [
    user?.id, areToastsEnabled, isRunning, isPaused, isScheduleActive, isSchedulePrepared,
    resetSchedule, setIsRunning, setIsPaused, setIsFlashing, setAccumulatedFocusSeconds,
    setAccumulatedBreakSeconds, setSeshTitle, setActiveAsks, setHasWonPrize,
    setIsHomepageFocusCustomized, setIsHomepageBreakCustomized, setActiveSessionRecordId,
    setActiveSchedule, setActiveScheduleDisplayTitleInternal, setTimerType,
    setIsTimeLeftManagedBySession, setTimeLeft, setSessionStartTime, setCurrentPhaseStartTime,
    setHomepageFocusMinutes, setHomepageBreakMinutes, setCurrentSessionRole,
    setCurrentSessionHostName, setCurrentSessionOtherParticipants, localFirstName,
    userFocusPreference, profile?.profile_data?.intention?.value, profile?.profile_data?.bio?.value, _defaultBreakMinutes, _defaultFocusMinutes,
    playSound, triggerVibration, getDefaultSeshTitle, resetSessionStates, setCurrentPhaseDurationSeconds, session?.access_token
  ]);

  // NEW: Main timer countdown effect
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (isRunning && !isPaused && currentPhaseStartTime !== null && currentPhaseDurationSeconds > 0) {
      timerRef.current = setInterval(() => {
        const elapsedSeconds = (Date.now() - currentPhaseStartTime) / 1000;
        // Calculate remaining time by subtracting the *floored* elapsed seconds
        // from the total duration of the current phase.
        // This ensures that the displayed time only decrements after a full second has passed.
        const secondsPassed = Math.floor(elapsedSeconds);
        setTimeLeft(Math.max(0, currentPhaseDurationSeconds - secondsPassed));
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, isPaused, currentPhaseStartTime, currentPhaseDurationSeconds]); // Dependencies for the interval setup

  // NEW: Effect to handle timer completion (when timeLeft hits 0)
  useEffect(() => {
    if (timeLeft === 0 && isRunning && currentPhaseStartTime !== null) {
      // Clear any running interval to prevent re-triggering
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

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
          
          // NEW: Set new phase duration and start time
          const nextPhaseDurationSeconds = activeSchedule[nextIndex].durationMinutes * 60;
          setCurrentPhaseDurationSeconds(nextPhaseDurationSeconds);
          setTimeLeft(nextPhaseDurationSeconds);
          setCurrentPhaseStartTime(Date.now()); // Corrected to Date.now()

          setIsRunning(true);
          setIsFlashing(false);
        } else {
          if (isRecurring && activeSchedule.length > 0) {
            setCurrentScheduleIndex(0);
            setTimerType(activeSchedule[0].type);

            // NEW: Set new phase duration and start time for loop
            const firstPhaseDurationSeconds = activeSchedule[0].durationMinutes * 60;
            setCurrentPhaseDurationSeconds(firstPhaseDurationSeconds);
            setTimeLeft(firstPhaseDurationSeconds);
            setCurrentPhaseStartTime(Date.now());

            setIsRunning(true);
            setIsFlashing(false);
            if (areToastsEnabled) {
              toast("Schedule Looping!", {
                description: `"${scheduleTitle}" is restarting.`,
              });
            }
          } else {
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
              hostNotes, // NEW: Pass hostNotes
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
        // Manual timer completion
        if (shouldShowEndToast && areToastsEnabled) { // MODIFIED: Explicitly check shouldShowEndToast
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
            // NEW: Set new phase duration and start time
            const newBreakDurationSeconds = breakMinutes * 60;
            setCurrentPhaseDurationSeconds(newBreakDurationSeconds);
            setTimeLeft(newBreakDurationSeconds);
            setCurrentPhaseStartTime(Date.now());
          } else {
            setTimerType('focus');
            // NEW: Set new phase duration and start time
            const newFocusDurationSeconds = focusMinutes * 60;
            setCurrentPhaseDurationSeconds(newFocusDurationSeconds);
            setTimeLeft(newFocusDurationSeconds);
            setCurrentPhaseStartTime(Date.now());
          }
        }
      }
    }
  }, [
    timeLeft, isRunning, currentPhaseStartTime, currentPhaseDurationSeconds, // NEW dependencies
    isFlashing, playSound, isScheduleActive, activeSchedule, currentScheduleIndex, timerType, resetSchedule, scheduleTitle,
    setAccumulatedFocusSeconds, setAccumulatedBreakSeconds, shouldShowEndToast, user?.id, _seshTitle, notes, hostNotes, // NEW: Add hostNotes
    accumulatedFocusSeconds, accumulatedBreakSeconds, activeJoinedSessionCoworkerCount, sessionStartTime, manualTransition,
    focusMinutes, breakMinutes, areToastsEnabled, activeAsks, allParticipantsToDisplay, breakNotificationsVibrate, triggerVibration,
    isRecurring, setCurrentScheduleIndex, setTimerType, setIsRunning, setIsFlashing, setCurrentPhaseStartTime, setTimeLeft,
    _defaultFocusMinutes, _defaultBreakMinutes, setHomepageFocusMinutes, setHomepageBreakMinutes, getDefaultSeshTitle,
    setIsHomepageFocusCustomized, setIsHomepageBreakCustomized, setHasWonPrize, shouldPlayEndSound
  ]);

  useEffect(() => {
    if (!isTimeLeftManagedBySession && !isRunning && !isPaused && !isScheduleActive && !isSchedulePending) {
      const expectedTime = (timerType === 'focus' ? focusMinutes : breakMinutes) * 60;
      if (timeLeft !== expectedTime) {
        setTimeLeft(expectedTime);
        setCurrentPhaseDurationSeconds(expectedTime); // NEW: Also update currentPhaseDurationSeconds
      }
    }
  }, [focusMinutes, breakMinutes, timerType, isRunning, isPaused, isScheduleActive, isSchedulePending, isTimeLeftManagedBySession, timeLeft, setCurrentPhaseDurationSeconds]);

  // Effect to update _seshTitle when profile or customization changes
  useEffect(() => {
    // Only update if no timer is active
    if (!isRunning && !isPaused && !isScheduleActive && !isSchedulePending && !profileLoading) {
      const defaultTitle = getDefaultSeshTitle();
      if (!isSeshTitleCustomized && _seshTitle !== defaultTitle) {
        _setSeshTitle(defaultTitle);
      }
    }
  }, [profileLoading, getDefaultSeshTitle, isSeshTitleCustomized, _seshTitle, isRunning, isPaused, isScheduleActive, isSchedulePending]);

  // Effect to update scheduleTitle when profile changes
  useEffect(() => {
    // Only update if no timer is active
    if (!isRunning && !isPaused && !isScheduleActive && !isSchedulePending && !profileLoading) {
      const defaultTitle = getDefaultSeshTitle();
      // Only update if the current scheduleTitle is still the generic default,
      // or if it's the old default derived from an empty profile.
      // This prevents overwriting a user-set schedule title (e.g., from a loaded template).
      if (scheduleTitle === "Coworker's DeepSesh") { // Check against initial placeholder
        setScheduleTitle(defaultTitle);
      }
    }
  }, [profileLoading, getDefaultSeshTitle, scheduleTitle, isRunning, isPaused, isScheduleActive, isSchedulePending]);

  // Effect to update activeScheduleDisplayTitle when profile changes
  useEffect(() => {
    // Only update if no timer is active
    if (!isRunning && !isPaused && !isScheduleActive && !isSchedulePending && !profileLoading) {
      const defaultTitle = getDefaultSeshTitle();
      if (activeScheduleDisplayTitle === "Coworker's DeepSesh") { // Only update if it's still the initial placeholder
        setActiveScheduleDisplayTitleInternal(defaultTitle);
      }
    }
  }, [profileLoading, getDefaultSeshTitle, activeScheduleDisplayTitle, isRunning, isPaused, isScheduleActive, isSchedulePending]);


  const addAsk = useCallback(async (ask: ActiveAskItem) => {
    if (!user?.id || !activeSessionRecordId) {
      setActiveAsks((prev) => [...prev, ask]); // Add locally if no active session
      return;
    }

    try {
      const response = await supabase.functions.invoke('update-session-data', {
        body: JSON.stringify({
          sessionId: activeSessionRecordId,
          actionType: 'add_ask',
          payload: {
            ask: { ...ask, creatorId: user.id }, // Add creatorId for server-side validation
          },
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`, // MODIFIED: Use session.access_token
        },
      });

      if (response.error) throw response.error;
      if (response.data.error) throw new Error(response.data.error);

      // The realtime subscription will update activeAsks
      if (areToastsEnabled) {
        toast.success("Ask Created!", {
          description: "Your ask has been added to the session.",
        });
      }
    } catch (error: any) {
      console.error("Error adding ask via Edge Function:", error);
      if (areToastsEnabled) {
        toast.error("Failed to Create Ask", {
          description: `Could not add your ask: ${await getEdgeFunctionErrorMessage(error)}`, // MODIFIED: Use getEdgeFunctionErrorMessage
        });
      }
    }
  }, [user?.id, activeSessionRecordId, areToastsEnabled, setActiveAsks, session?.access_token]); // NEW: Add session.access_token to dependencies

  const updateAsk = useCallback(async (updatedAsk: ActiveAskItem) => {
    if (!user?.id || !activeSessionRecordId) {
      setActiveAsks((prev) =>
        prev.map((ask) => (ask.id === updatedAsk.id ? updatedAsk : ask))
      );
      return;
    }

    try {
      const response = await supabase.functions.invoke('update-session-data', {
        body: JSON.stringify({
          sessionId: activeSessionRecordId,
          actionType: 'update_ask',
          payload: {
            ask: { ...updatedAsk, creatorId: user.id }, // Pass creatorId for validation
          },
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`, // MODIFIED: Use session.access_token
        },
      });

      if (response.error) throw response.error;
      if (response.data.error) throw new Error(response.data.error);

      // The realtime subscription will update activeAsks
      if (areToastsEnabled) {
        toast.success("Ask Updated!", {
          description: "Your vote/update has been recorded.",
        });
      }
    } catch (error: any) {
      console.error("Error updating ask via Edge Function:", error);
      if (areToastsEnabled) {
        toast.error("Failed to Update Ask", {
          description: `Could not update ask: ${await getEdgeFunctionErrorMessage(error)}`, // MODIFIED: Use getEdgeFunctionErrorMessage
        });
      }
    }
  }, [user?.id, activeSessionRecordId, areToastsEnabled, setActiveAsks, session?.access_token]); // NEW: Add session.access_token to dependencies

  useEffect(() => {
    const checkAndCommenceSchedules = () => {
      const now = new Date();
      for (const template of preparedSchedules) {
        if (!template) {
          console.warn("Skipping undefined or null template in preparedSchedules array.");
          continue;
        }
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
              let nextCommenceDate = new Date(targetDate);
              while (nextCommenceDate.getTime() < now.getTime()) {
                if (template.recurrenceFrequency === 'daily') {
                  nextCommenceDate.setDate(nextCommenceDate.getDate() + 1);
                } else if (template.recurrenceFrequency === 'weekly') {
                  nextCommenceDate.setDate(nextCommenceDate.getDate() + 7);
                } else if (template.recurrenceFrequency === 'monthly') {
                  nextCommenceDate.setMonth(nextCommenceDate.getMonth() + 1);
                } else {
                  console.warn(`Unknown recurrenceFrequency '${template.recurrenceFrequency}' for template ID '${template.id}'. Skipping recurrence.`);
                  break;
                }
              }
              targetDate = nextCommenceDate;
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
  }, [preparedSchedules, isScheduleActive, isSchedulePending, commenceSpecificPreparedSchedule, discardPreparedSchedule, isRecurring, scheduleTitle, activeSchedule, currentScheduleIndex, timerType, timeLeft, accumulatedFocusSeconds, accumulatedBreakSeconds, sessionStartTime, activeJoinedSessionCoworkerCount, activeAsks, allParticipantsToDisplay, areToastsEnabled, user?.id, _seshTitle, notes, hostNotes, playSound, breakNotificationsVibrate, triggerVibration, manualTransition, focusMinutes, _defaultFocusMinutes, breakMinutes, _defaultBreakMinutes, currentPhaseDurationSeconds]); // NEW: Added currentPhaseDurationSeconds to dependencies

  useEffect(() => {
    if (isRunning || isPaused || isFlashing || isScheduleActive || isSchedulePending) {
      setLastActivityTime(Date.now());
    } else {
      setLastActivityTime(null);
    }
  }, [isRunning, isPaused, isFlashing, isScheduleActive, isSchedulePending]);

  // Helper function to get the current state for saving
  const getTimerContextDataToSave = useCallback(() => {
    return {
      _defaultFocusMinutes, _defaultBreakMinutes,
      focusMinutes, breakMinutes,
      isRunning, isPaused, timeLeft, timerType, isFlashing,
      notes, hostNotes, _seshTitle, isSeshTitleCustomized, showSessionsWhileActive, schedule, currentScheduleIndex, // NEW: Add hostNotes
      isSchedulingMode, isScheduleActive, scheduleTitle, commenceTime, commenceDay,
      sessionVisibility, isRecurring, recurrenceFrequency, savedSchedules, timerColors, sessionStartTime,
      currentPhaseStartTime, accumulatedFocusSeconds, accumulatedBreakSeconds,
      activeJoinedSessionCoworkerCount, activeAsks, isSchedulePending, scheduleStartOption,
      isTimeLeftManagedBySession,
      shouldPlayEndSound, shouldShowEndToast, isBatchNotificationsEnabled, batchNotificationPreference,
      customBatchMinutes, lock, exemptionsEnabled, phoneCalls, favourites, workApps,
      intentionalBreaches, manualTransition, maxDistance, askNotifications, joinNotifications, sessionInvites,
      friendActivity, breakNotificationsVibrate, verificationStandard,
      locationSharing, openSettingsAccordions, activeSchedule, activeTimerColors, activeScheduleDisplayTitle,
      is24HourFormat,
      preparedSchedules,
      timerIncrement,
      startStopNotifications,
      hasWonPrize,
      currentSessionRole, currentSessionHostName, currentSessionOtherParticipants,
      isHomepageFocusCustomized, isHomepageBreakCustomized,
      activeSessionRecordId,
      isDiscoveryActivated,
      geolocationPermissionStatus,
      currentSessionParticipantsData,
      lastActivityTime,
      showDemoSessions,
      currentPhaseDurationSeconds,
      remainingTimeAtPause,
      limitDiscoveryRadius,
    };
  }, [
    _defaultFocusMinutes, _defaultBreakMinutes, focusMinutes, breakMinutes, isRunning, isPaused, timeLeft, timerType, isFlashing,
    notes, hostNotes, _seshTitle, isSeshTitleCustomized, showSessionsWhileActive, schedule, currentScheduleIndex, isSchedulingMode, // NEW: Add hostNotes
    isScheduleActive, scheduleTitle, commenceTime, commenceDay, sessionVisibility, isRecurring, recurrenceFrequency,
    savedSchedules, timerColors, sessionStartTime, currentPhaseStartTime, accumulatedFocusSeconds, accumulatedBreakSeconds,
    activeJoinedSessionCoworkerCount, activeAsks, isSchedulePending, scheduleStartOption, isTimeLeftManagedBySession,
    shouldPlayEndSound, shouldShowEndToast, isBatchNotificationsEnabled, batchNotificationPreference, customBatchMinutes,
    lock, exemptionsEnabled, phoneCalls, favourites, workApps, intentionalBreaches, manualTransition, maxDistance,
    askNotifications, joinNotifications, sessionInvites, friendActivity, breakNotificationsVibrate, verificationStandard,
    locationSharing, openSettingsAccordions, activeSchedule, activeTimerColors, activeScheduleDisplayTitle, is24HourFormat,
    preparedSchedules, timerIncrement, startStopNotifications, hasWonPrize, currentSessionRole, currentSessionHostName,
    currentSessionOtherParticipants, isHomepageFocusCustomized, isHomepageBreakCustomized, activeSessionRecordId,
    isDiscoveryActivated, geolocationPermissionStatus, currentSessionParticipantsData, lastActivityTime, showDemoSessions,
    currentPhaseDurationSeconds, remainingTimeAtPause, limitDiscoveryRadius,
  ]);

  useEffect(() => {
    const storedData = localStorage.getItem(LOCAL_STORAGE_KEY_TIMER);
    let initialSavedSchedules: ScheduledTimerTemplate[] = [];

    let data: any = {}; 
    let loadedIsRunning: boolean = false;
    let loadedIsPaused: boolean = false;
    let loadedIsScheduleActive: boolean = false;
    let loadedIsSchedulePending: boolean = false;

    if (storedData) {
      data = JSON.parse(storedData); 
      loadedIsRunning = data.isRunning ?? false;
      loadedIsPaused = data.isPaused ?? false;
      loadedIsScheduleActive = data.isScheduleActive ?? false;
      loadedIsSchedulePending = data.isSchedulePending ?? false;

      // Restore active timer states if a timer was active
      if (loadedIsRunning || loadedIsPaused || loadedIsScheduleActive || loadedIsSchedulePending) {
        _setFocusMinutes(data.focusMinutes ?? _defaultFocusMinutes);
        _setBreakMinutes(data.breakMinutes ?? _defaultBreakMinutes);
        setIsRunning(loadedIsRunning);
        setIsPaused(loadedIsPaused);
        setTimeLeft(data.timeLeft ?? (data.focusMinutes ?? _defaultFocusMinutes) * 60);
        setTimerType(data.timerType ?? 'focus');
        setIsFlashing(data.isFlashing ?? false);
        setNotes(data.notes ?? "");
        setHostNotes(data.hostNotes ?? ""); // NEW: Load hostNotes
        _setSeshTitle(data._seshTitle ?? getDefaultSeshTitle());
        setIsSeshTitleCustomized(data.isSeshTitleCustomized ?? false);
        setShowSessionsWhileActive(data.showSessionsWhileActive ?? 'all');
        setSchedule(data.schedule ?? []);
        setCurrentScheduleIndex(data.currentScheduleIndex ?? 0);
        setIsSchedulingMode(data.isSchedulingMode ?? false);
        setIsScheduleActive(loadedIsScheduleActive);
        setScheduleTitle(data.scheduleTitle ?? getDefaultSeshTitle());
        setCommenceTime(data.commenceTime ?? "");
        setCommenceDay(data.commenceDay ?? null);
        setSessionVisibility(data.sessionVisibility ?? 'private');
        setIsRecurring(data.isRecurring ?? false);
        setRecurrenceFrequency(data.recurrenceFrequency ?? 'daily');
        setScheduleStartOption(data.scheduleStartOption ?? 'now');
        setActiveSchedule(data.activeSchedule ?? []);
        setActiveTimerColors(data.activeTimerColors ?? {});
        setActiveScheduleDisplayTitleInternal(data.activeScheduleDisplayTitle ?? getDefaultSeshTitle());
        setTimerColors(data.timerColors ?? {});
        setSessionStartTime(data.sessionStartTime ?? null);
        setCurrentPhaseStartTime(data.currentPhaseStartTime ?? null);
        setAccumulatedFocusSeconds(data.accumulatedFocusSeconds ?? 0);
        setAccumulatedBreakSeconds(data.accumulatedBreakSeconds ?? 0);
        setActiveJoinedSessionCoworkerCount(data.activeJoinedSessionCoworkerCount ?? 0);
        setActiveAsks(data.activeAsks ?? []);
        setIsSchedulePending(loadedIsSchedulePending);
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
        setLocationSharing(data.locationSharing ?? false);
        setOpenSettingsAccordions(data.openSettingsAccordions ?? []);
        setIs24HourFormat(data.is24HourFormat ?? true);
        setAreToastsEnabled(data.areToastsEnabled ?? false);
        setStartStopNotifications(data.startStopNotifications ?? { push: false, vibrate: false, sound: false });
        setHasWonPrize(data.hasWonPrize ?? false);
        setCurrentSessionRole(data.currentSessionRole ?? null);
        setCurrentSessionHostName(data.currentSessionHostName ?? null);
        setCurrentSessionOtherParticipants(data.currentSessionOtherParticipants ?? []);
        setCurrentSessionParticipantsData(data.currentSessionParticipantsData ?? []);
        setIsHomepageFocusCustomized(data.isHomepageFocusCustomized ?? false);
        setIsHomepageBreakCustomized(data.isHomepageBreakCustomized ?? false);
        setActiveSessionRecordId(data.activeSessionRecordId ?? null);
        setIsDiscoveryActivated(data.isDiscoveryActivated ?? false);
        setGeolocationPermissionStatus(data.geolocationPermissionStatus ?? 'prompt');
        setLastActivityTime(data.lastActivityTime ?? null);
        setShowDemoSessions(data.showDemoSessions ?? true);
        setCurrentPhaseDurationSeconds(data.currentPhaseDurationSeconds ?? 0);
        setRemainingTimeAtPause(data.remainingTimeAtPause ?? 0);
        setLimitDiscoveryRadius(data.limitDiscoveryRadius ?? false);
      }

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

    // Only apply default template or homepage defaults if no timer was active
    if (!(loadedIsRunning || loadedIsPaused || loadedIsScheduleActive || loadedIsSchedulePending)) {
      const initialScheduleToLoad = finalSavedSchedules.find(
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

        setIsHomepageFocusCustomized(false);
        setIsHomepageBreakCustomized(false);

        const firstScheduleItem = initialScheduleToLoad.schedule[0];
        if (firstScheduleItem) {
          _setFocusMinutes(firstScheduleItem.type === 'focus' ? firstScheduleItem.durationMinutes : _defaultFocusMinutes);
          _setBreakMinutes(firstScheduleItem.type === 'break' ? firstScheduleItem.durationMinutes : _defaultBreakMinutes);
          setTimerType(firstScheduleItem.type);
          setTimeLeft(firstScheduleItem.durationMinutes * 60);
          setCurrentPhaseDurationSeconds(firstScheduleItem.durationMinutes * 60);
        } else {
          setTimerType('focus');
          setTimeLeft(_defaultFocusMinutes * 60);
          setCurrentPhaseDurationSeconds(_defaultFocusMinutes * 60);
        }
        _setSeshTitle(getDefaultSeshTitle()); 
        setIsSeshTitleCustomized(false); 
        setNotes(""); // NEW: Clear notes
        setHostNotes(""); // NEW: Clear hostNotes
      } else {
        const currentHomepageFocus = data.focusMinutes ?? _defaultFocusMinutes;
        const currentHomepageBreak = data.breakMinutes ?? _defaultBreakMinutes;
        const currentTimerType = data.timerType ?? 'focus';

        setTimerType(currentTimerType);
        setTimeLeft((currentTimerType === 'focus' ? currentHomepageFocus : currentHomepageBreak) * 60);
        setCurrentPhaseDurationSeconds((currentTimerType === 'focus' ? currentHomepageFocus : currentHomepageBreak) * 60);
        _setSeshTitle(data._seshTitle ?? getDefaultSeshTitle());
        setIsSeshTitleCustomized(data.isSeshTitleCustomized ?? false);
        setNotes(data.notes ?? ""); // NEW: Load notes
        setHostNotes(data.hostNotes ?? ""); // NEW: Load hostNotes
      }
    }
  }, [getDefaultSeshTitle, _defaultFocusMinutes, _defaultBreakMinutes, areToastsEnabled, setAreToastsEnabled, timerIncrement, resetSessionStates, setIsDiscoveryActivated, setGeolocationPermissionStatus, setSessionVisibility, _setFocusMinutes, _setBreakMinutes, setIsHomepageFocusCustomized, setIsHomepageBreakCustomized, _setSeshTitle, setIsSeshTitleCustomized, setSchedule, setScheduleTitle, setCommenceTime, setCommenceDay, setScheduleStartOption, setIsRecurring, setRecurrenceFrequency, setTimerColors, setTimerType, setTimeLeft, setCurrentPhaseDurationSeconds, setSavedSchedules, setPreparedSchedules, setNotes, setHostNotes]);

  // MODIFIED: Optimized local storage saving
  useEffect(() => {
    // Debounce the localStorage.setItem call
    const handler = setTimeout(() => {
      const dataToSave = getTimerContextDataToSave();
      localStorage.setItem(LOCAL_STORAGE_KEY_TIMER, JSON.stringify(dataToSave));
      console.log("TimerContext: Debounced state saved to local storage.");
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [
    // Dependencies for triggering the save (excluding rapidly changing timer values)
    _defaultFocusMinutes, _defaultBreakMinutes,
    focusMinutes, breakMinutes,
    /* isRunning removed */ /* isPaused removed */ /* timeLeft removed */ timerType, isFlashing,
    notes, hostNotes, _seshTitle, isSeshTitleCustomized, showSessionsWhileActive, schedule, currentScheduleIndex, // NEW: Add hostNotes
    isSchedulingMode, isScheduleActive, scheduleTitle, commenceTime, commenceDay,
    sessionVisibility, isRecurring, recurrenceFrequency, savedSchedules, timerColors, /* sessionStartTime removed */
    /* currentPhaseStartTime removed */ /* accumulatedFocusSeconds removed */ /* accumulatedBreakSeconds removed */
    activeJoinedSessionCoworkerCount, activeAsks, isSchedulePending, scheduleStartOption,
    isTimeLeftManagedBySession,
    shouldPlayEndSound, shouldShowEndToast, isBatchNotificationsEnabled, batchNotificationPreference,
    customBatchMinutes, lock, exemptionsEnabled, phoneCalls, favourites, workApps,
    intentionalBreaches, manualTransition, maxDistance, askNotifications, joinNotifications, sessionInvites,
    friendActivity, breakNotificationsVibrate, verificationStandard,
    locationSharing, openSettingsAccordions, activeSchedule, activeTimerColors, activeScheduleDisplayTitle,
    is24HourFormat,
    preparedSchedules,
    timerIncrement,
    startStopNotifications,
    hasWonPrize,
    currentSessionRole, currentSessionHostName, currentSessionOtherParticipants,
    isHomepageFocusCustomized, isHomepageBreakCustomized,
    activeSessionRecordId,
    isDiscoveryActivated,
    geolocationPermissionStatus,
    currentSessionParticipantsData,
    lastActivityTime,
    showDemoSessions,
    /* currentPhaseDurationSeconds removed */
    remainingTimeAtPause,
    limitDiscoveryRadius,
    getTimerContextDataToSave, // Add the helper function to dependencies
  ]);

  // NEW: Effect for immediate saving of isRunning/isPaused
  useEffect(() => {
    if (isRunning || isPaused || isScheduleActive || isSchedulePending) {
      const dataToSave = getTimerContextDataToSave();
      localStorage.setItem(LOCAL_STORAGE_KEY_TIMER, JSON.stringify(dataToSave));
      console.log("TimerContext: Immediate state saved to local storage (isRunning/isPaused change).");
    }
  }, [isRunning, isPaused, isScheduleActive, isSchedulePending, getTimerContextDataToSave]);


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
    hostNotes, // NEW: Add hostNotes
    setHostNotes, // NEW: Add setHostNotes
    seshTitle: _seshTitle,
    setSeshTitle,
    isSeshTitleCustomized,
    formatTime,
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
    sessionVisibility, // MODIFIED: Changed from isGlobalPrivate
    setSessionVisibility, // MODIFIED: Changed from setIsGlobalPrivate
    isRecurring,
    setIsRecurring,
    recurrenceFrequency,
    setRecurrenceFrequency,
    scheduleStartOption,
    setScheduleStartOption,

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
    currentSessionParticipantsData,
    setCurrentSessionParticipantsData,
    allParticipantsToDisplay,

    isSchedulePending,
    setIsSchedulePending,
    isTimeLeftManagedBySession,
    setIsTimeLeftManagedBySession,

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
    // REMOVED: profileVisibility,
    // REMOVED: setProfileVisibility,
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
    showSessionsWhileActive,
    setShowSessionsWhileActive,
    hasWonPrize,
    setHasWonPrize,
    getLocation,
    geolocationPermissionStatus,
    isDiscoveryActivated,
    setIsDiscoveryActivated,
    activeSessionRecordId,
    setActiveSessionRecordId,
    joinSessionAsCoworker,
    leaveSession,
    transferHostRole,
    stopTimer,
    resetSessionStates,
    showDemoSessions,
    setShowDemoSessions,
    currentPhaseDurationSeconds, // ADDED
    setCurrentPhaseDurationSeconds, // ADDED
    remainingTimeAtPause, // ADDED
    setRemainingTimeAtPause, // ADDED
    limitDiscoveryRadius, // NEW: Add limitDiscoveryRadius
    setLimitDiscoveryRadius, // NEW: Add setLimitDiscoveryRadius
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