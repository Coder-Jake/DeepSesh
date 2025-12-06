import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ScheduledTimer, ScheduledTimerTemplate, TimerContextType, NotificationSettings, ParticipantSessionData, SupabaseSessionData, DemoSession } from '@/types/timer';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { DEFAULT_SCHEDULE_TEMPLATES } from '@/lib/default-schedules';
import { DAYS_OF_WEEK } from '@/lib/constants';
import { saveSessionToDatabase } from '@/utils/session-utils';
import { useProfile } from '../contexts/ProfileContext';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { isValidUUID } from '@/lib/utils';
import { getEdgeFunctionErrorMessage } from '@/utils/error-utils';

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_TIMER = 'deepsesh_timer_context';

interface TimerProviderProps {
  children: React.ReactNode;
  areToastsEnabled: boolean;
  setAreToastsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}

export const TimerProvider: React.FC<TimerProviderProps> = ({ children, areToastsEnabled, setAreToastsEnabled }) => {
  const { user, session } = useAuth();
  const { localFirstName, profile, focusPreference: userFocusPreference, joinCode: userJoinCode, loading: profileLoading, organisation: userOrganisations } = useProfile(); // NEW: Get userOrganisations from profile context

  const getDefaultSeshTitle = useCallback(() => {
    const profileFirstName = profile?.first_name;
    const code = profile?.join_code;

    if (profileFirstName && profileFirstName !== "You" && profileFirstName.trim() !== "") {
      return `${profileFirstName}'s DeepSesh`;
    } else if (code && code.trim() !== "") {
      return `${code}'s DeepSesh`;
    }
    return "Coworker's DeepSesh";
  }, [profile?.first_name, profile?.join_code]);

  const [timerIncrement, setTimerIncrementInternal] = useState(5);

  const [_defaultFocusMinutes, _setDefaultFocusMinutes] = useState(25);
  const [_defaultBreakMinutes, _setDefaultBreakMinutes] = useState(5);

  const [focusMinutes, _setFocusMinutes] = useState(_defaultFocusMinutes);
  const [breakMinutes, _setBreakMinutes] = useState(_defaultBreakMinutes);

  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(focusMinutes * 60);
  const [timerType, setTimerType] = useState<'focus' | 'break'>('focus');
  const [isFlashing, setIsFlashing] = useState(false);
  const [notes, setNotes] = useState("");
  const [hostNotes, setHostNotes] = useState("");
  const [_seshTitle, _setSeshTitle] = useState("Coworker's DeepSesh");
  const [isSeshTitleCustomized, setIsSeshTitleCustomized] = useState(false);
  const [showSessionsWhileActive, setShowSessionsWhileActive] = useState<'hidden' | 'nearby' | 'friends' | 'all'>('all');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [schedule, setSchedule] = useState<ScheduledTimer[]>([]);
  const [currentScheduleIndex, setCurrentScheduleIndex] = useState(0);
  const [isSchedulingMode, setIsSchedulingMode] = useState(false);
  const [isScheduleActive, setIsScheduleActive] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState("Coworker's DeepSesh");
  const [commenceTime, setCommenceTime] = useState("");
  const [commenceDay, setCommenceDay] = useState<number | null>(null);
  
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

  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [scheduleStartOption, setScheduleStartOption] = useState<'now' | 'manual' | 'custom_time'>('now');

  const [activeSchedule, setActiveSchedule] = useState<ScheduledTimer[]>([]);
  const [activeTimerColors, setActiveTimerColors] = useState<Record<string, string>>({});
  const [activeScheduleDisplayTitle, setActiveScheduleDisplayTitleInternal] = useState("Coworker's DeepSesh");

  const [savedSchedules, setSavedSchedules] = useState<ScheduledTimerTemplate[]>([]);

  const [preparedSchedules, setPreparedSchedules] = useState<ScheduledTimerTemplate[]>([]);

  const [timerColors, setTimerColors] = useState<Record<string, string>>({});

  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [currentPhaseStartTime, setCurrentPhaseStartTime] = useState<number | null>(null);
  const [accumulatedFocusSeconds, setAccumulatedFocusSeconds] = useState(0);
  const [accumulatedBreakSeconds, setAccumulatedBreakSeconds] = useState(0);
  const [activeJoinedSessionCoworkerCount, setActiveJoinedSessionCoworkerCount] = useState(0);

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

  const [shouldShowEndToast, setShouldShowEndToast] = useState(false); // NEW: Initialize shouldShowEndToast
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
  const [askNotifications, setAskNotifications] = useState<NotificationSettings>({ push: false });
  const [joinNotifications, setJoinNotifications] = useState<NotificationSettings>({ push: false });
  const [sessionInvites, setSessionInvites] = useState<NotificationSettings>({ push: false });
  const [friendActivity, setFriendActivity] = useState<NotificationSettings>({ push: false });
  const [verificationStandard, setVerificationStandard] = useState<'anyone' | 'phone1' | 'organisation' | 'id1'>('anyone');
  const [locationSharing, setLocationSharing] = useState(false);
  const [openSettingsAccordions, setOpenSettingsAccordions] = useState<string[]>([]);
  const [is24HourFormat, setIs24HourFormat] = useState(true);
  const [hasWonPrize, setHasWonPrize] = useState(false);

  const [isHomepageFocusCustomized, setIsHomepageFocusCustomized] = useState(false);
  const [isHomepageBreakCustomized, setIsHomepageBreakCustomized] = useState(false);

  const [activeSessionRecordId, setActiveSessionRecordId] = useState<string | null>(null);

  const [lastActivityTime, setLastActivityTime] = useState<number | null>(null);

  const [showDemoSessions, setShowDemoSessions] = useState(true);

  const [currentPhaseDurationSeconds, setCurrentPhaseDurationSeconds] = useState(0);
  // Removed: const [remainingTimeAtPause, setRemainingTimeAtPause] = useState(0);

  const [limitDiscoveryRadius, setLimitDiscoveryRadius] = useState<boolean>(() => {
    const storedData = localStorage.getItem(LOCAL_STORAGE_KEY_TIMER);
    if (storedData) {
      const data = JSON.parse(storedData);
      return data.limitDiscoveryRadius ?? false;
    }
    return false;
  });

  const [selectedHostingOrganisation, setSelectedHostingOrganisation] = useState<string | null>(null);

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

  const [startStopNotifications, setStartStopNotifications] = useState<NotificationSettings>({ push: false });

  const playSound = useCallback(() => {
    // Sound notifications removed
  }, []);

  const triggerVibration = useCallback(() => {
    // Vibration notifications removed
  }, []);

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

    if (user?.id && activeSessionRecordId && currentSessionRole === 'host') {
      try {
        const { error } = await supabase
          .from('active_sessions')
          .update({ session_title: newTitle, last_heartbeat: new Date().toISOString() })
          .eq('id', activeSessionRecordId)
          .eq('user_id', user.id);

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
            description: "Location access denied. Please enable in browser settings if you wish to use location-based features.",
          });
        }
        setGeolocationPermissionStatus('denied');
        resolve({ latitude: null, longitude: null });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeolocationPermissionStatus('granted');
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
              errorMessage = "Location access denied. Please enable in browser settings if you wish to use location-based features.";
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
  }, [areToastsEnabled, setGeolocationPermissionStatus]);

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
      if (areToastsEnabled) {
        toast.info("Discovery Privacy Note", {
          description: "Location access is denied. Public sessions may not be discoverable by others.",
        });
      }
    }
  }, [isDiscoveryActivated, geolocationPermissionStatus, sessionVisibility, areToastsEnabled]);

  const syncSessionToSupabase = useCallback(async () => {
    if (!user?.id || !activeSessionRecordId) {
      console.log("syncSessionToSupabase: Skipping sync. User ID or activeSessionRecordId missing.");
      return;
    }

    if (currentSessionRole !== 'host') {
      console.log("syncSessionToSupabase: Skipping full state sync for non-host participant.");
      return;
    }

    const currentScheduleItem = isScheduleActive ? activeSchedule[currentScheduleIndex] : null;
    const currentPhaseDuration = currentScheduleItem ? currentScheduleItem.durationMinutes : (timerType === 'focus' ? focusMinutes : breakMinutes);
    const currentPhaseEndTime = new Date(Date.now() + timeLeft * 1000).toISOString();

    const sessionDataToUpdate = {
      host_name: currentSessionHostName,
      session_title: activeScheduleDisplayTitle,
      current_phase_type: timerType,
      current_phase_end_time: currentPhaseEndTime,
      // Removed 'is_active: isRunning,' as the column no longer exists
      current_schedule_index: isScheduleActive ? currentScheduleIndex : 0,
      schedule_data: activeSchedule,
      visibility: sessionVisibility,
      participants_data: currentSessionParticipantsData,
      user_id: currentSessionParticipantsData.find(p => p.role === 'host')?.userId || null,
      join_code: userJoinCode,
      organisation: sessionVisibility === 'organisation' && selectedHostingOrganisation && userOrganisations && userOrganisations.includes(selectedHostingOrganisation)
        ? [selectedHostingOrganisation]
        : null,
      last_heartbeat: new Date().toISOString(),
      host_notes: hostNotes,
      is_mock: false,
    };

    try {
      console.log(`Invoking Edge Function 'update-session-data' (syncSessionToSupabase). Token present: ${!!session?.access_token}. Token start: ${session?.access_token?.substring(0, 10)}`);
      const response = await supabase.functions.invoke('update-session-data', {
        body: JSON.stringify({
          sessionId: activeSessionRecordId,
          actionType: 'update_full_session_state',
          payload: sessionDataToUpdate,
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) throw response.error;
      if (response.data.error) throw new Error(response.data.error);

      console.log("syncSessionToSupabase: Successfully updated session via Edge Function:", activeSessionRecordId);
    } catch (error: any) {
      console.error("Error updating active session via Edge Function:", error);
      if (areToastsEnabled) {
        toast.error("Supabase Sync Error",
          { description: `Failed to update active session: ${await getEdgeFunctionErrorMessage(error)}` });
      }
    }
  }, [
    user?.id, activeSessionRecordId, currentSessionHostName, activeScheduleDisplayTitle,
    timerType, isRunning, focusMinutes, breakMinutes, isScheduleActive, activeSchedule,
    currentScheduleIndex, timeLeft, sessionVisibility, currentSessionParticipantsData, areToastsEnabled,
    userJoinCode, selectedHostingOrganisation, hostNotes, session?.access_token, currentSessionRole, userOrganisations
  ]);

  useEffect(() => {
    if (activeSessionRecordId && user?.id) {
      const handler = setTimeout(() => {
        syncSessionToSupabase();
      }, 500);

      return () => clearTimeout(handler);
    }
  }, [
    isRunning, timeLeft, timerType, currentScheduleIndex, activeScheduleDisplayTitle,
    focusMinutes, breakMinutes, isScheduleActive, sessionVisibility, activeSessionRecordId, user?.id,
    currentSessionParticipantsData, syncSessionToSupabase, hostNotes, selectedHostingOrganisation
  ]);

  useEffect(() => {
    let heartbeatInterval: NodeJS.Timeout | null = null;

    if (user?.id && activeSessionRecordId) {
      heartbeatInterval = setInterval(async () => {
        try {
          console.log(`Invoking Edge Function 'update-session-data' (heartbeat). Token present: ${!!session?.access_token}. Token start: ${session?.access_token?.substring(0, 10)}`);
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
        }
      }, 30000);
    }

    return () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
    };
  }, [user?.id, activeSessionRecordId, session?.access_token]);


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
            setHostNotes(updatedSession.host_notes || "");
            setSelectedHostingOrganisation(updatedSession.organisation?.[0] || null);
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
  }, [activeSessionRecordId, setCurrentSessionParticipantsData, setActiveJoinedSessionCoworkerCount, setHostNotes, setSelectedHostingOrganisation]);

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
    _setFocusMinutes(_defaultFocusMinutes);
    _setBreakMinutes(_defaultBreakMinutes);
    setIsHomepageFocusCustomized(false);
    setIsHomepageBreakCustomized(false);
    setTimeLeft(_defaultFocusMinutes * 60);
    setCurrentPhaseDurationSeconds(_defaultFocusMinutes * 60);
    setIsRunning(false);
    setIsFlashing(false);
    setSessionStartTime(null);
    setCurrentPhaseStartTime(null);
    setAccumulatedFocusSeconds(0);
    setAccumulatedBreakSeconds(0);
    _setSeshTitle(getDefaultSeshTitle());
    setIsSeshTitleCustomized(false);
    console.log("TimerContext: resetSessionStates called. activeAsks cleared.");

    setTimerColors({});
    setActiveSchedule([]);
    setActiveTimerColors({});
    setActiveScheduleDisplayTitleInternal(getDefaultSeshTitle());
    setPreparedSchedules([]);

    setCurrentSessionRole(null);
    setCurrentSessionHostName(null);
    setCurrentSessionOtherParticipants([]);
    setActiveJoinedSessionCoworkerCount(0);
    setIsTimeLeftManagedBySession(false);
    setHasWonPrize(false);
    setCurrentSessionParticipantsData([]);
    console.log("resetSessionStates: activeSessionRecordId cleared to null.");
    setActiveSessionRecordId(null);
    setLastActivityTime(null);
    setCurrentPhaseDurationSeconds(0);
    // Removed: setRemainingTimeAtPause(0);
    setSelectedHostingOrganisation(null);
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

  const transferHostRole = useCallback(async (): Promise<boolean> => {
    if (!user?.id || !activeSessionRecordId || currentSessionRole !== 'host') {
      console.warn("Attempted to transfer host role without being the host or having an active session.");
      return false;
    }

    const currentHostId = user.id;
    const otherCoworkers = currentSessionParticipantsData
      .filter(p => p.role === 'coworker')
      .sort((a, b) => a.joinTime - b.joinTime);

    if (otherCoworkers.length > 0) {
      const newHost = otherCoworkers[0];
      
      try {
        console.log(`Invoking Edge Function 'update-session-data' (transfer_host). Token present: ${!!session?.access_token}. Token start: ${session?.access_token?.substring(0, 10)}`);
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
            'Authorization': `Bearer ${session?.access_token}`,
          },
        });

        if (response.error) throw response.error;
        if (response.data.error) throw new Error(response.data.error);

        if (areToastsEnabled) {
          toast.success("Host Role Transferred", {
            description: `Host role transferred to ${newHost.userName}.`,
          });
        }
        return true;

      } catch (error: any) {
        console.error("Error transferring host role via Edge Function:", error);
        if (areToastsEnabled) {
          toast.error("Host Transfer Failed", {
            description: `Failed to transfer host role: ${await getEdgeFunctionErrorMessage(error)}`,
          });
        }
        return false;
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
        return true;

      } catch (deleteError: any) {
        console.error("Error deleting session when no other participants:", deleteError);
        if (areToastsEnabled) {
          toast.error("Session Deletion Failed", {
            description: `Failed to end session: ${deleteError.message}`,
          });
        }
        return false;
      }
    }
  }, [user?.id, activeSessionRecordId, currentSessionRole, currentSessionParticipantsData, localFirstName, areToastsEnabled, session?.access_token]);

  const leaveSession = useCallback(async (): Promise<boolean> => {
    if (!user?.id || !activeSessionRecordId) {
      console.warn("Attempted to leave session without active session or user ID.");
      return false;
    }

    try {
      console.log(`Invoking Edge Function 'update-session-data' (leave_session). Token present: ${!!session?.access_token}. Token start: ${session?.access_token?.substring(0, 10)}`);
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
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) throw response.error;
      if (response.data.error) throw new Error(response.data.error);

      if (areToastsEnabled) {
        toast.info("Session Left", {
          description: "You have left the session.",
        });
      }
      return true;
    } catch (error: any) {
      console.error("Error leaving session via Edge Function:", error);
      if (areToastsEnabled) {
        toast.error("Leave Session Failed", {
          description: `An unexpected error occurred: ${await getEdgeFunctionErrorMessage(error)}.`,
        });
      }
      resetSessionStates();
      return false;
    }
  }, [user?.id, activeSessionRecordId, areToastsEnabled, session?.access_token]);

  const stopTimer = useCallback(async (confirmPrompt: boolean, isLongPress: boolean) => {
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

    if (activeSessionRecordId) {
      console.log("stopTimer: Handling published session stop.");
      if (currentSessionRole === 'host') {
        await transferHostRole();
      } else if (currentSessionRole === 'coworker') {
        await leaveSession();
      } else {
        console.warn("stopTimer: Unexpected state - activeSessionRecordId exists but no active role. Resetting states.");
      }
    } else {
      console.log("stopTimer: Handling local-only session stop (no activeSessionRecordId).");
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
        areToastsEnabled
      );
    }

    resetSessionStates();
    // playSound(); // Removed
    // triggerVibration(); // Removed

  }, [
    currentSessionRole, accumulatedFocusSeconds, accumulatedBreakSeconds,
    isRunning, currentPhaseStartTime, timerType, user?.id, _seshTitle, notes, hostNotes,
    activeJoinedSessionCoworkerCount, sessionStartTime, allParticipantsToDisplay,
    areToastsEnabled, resetSessionStates, transferHostRole, leaveSession
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
    simulatedStartTime: number | null = null,
    simulatedCurrentPhaseIndex: number = 0,
    simulatedTimeLeftInPhase: number | null = null
  ): Promise<boolean> => {
    if (!user?.id) {
      if (areToastsEnabled) {
        toast.error("Authentication Required", {
          description: "You must be logged in to start a session.",
        });
      }
      console.error("startSessionCommonLogic: User ID is null, cannot start session.");
      return false;
    }

    let needsOverrideConfirmation = false;
    let confirmationMessageParts: string[] = [];
    let shouldResetManualTimer = false;
    let shouldResetExistingActiveSchedule = false;

    if (isScheduleActive) {
        confirmationMessageParts.push("An active schedule is running.");
        shouldResetExistingActiveSchedule = true;
    }
    if (isRunning) { // Removed isPaused check
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
            setIsFlashing(false);
            setAccumulatedFocusSeconds(0);
            setAccumulatedBreakSeconds(0);
            _setSeshTitle(getDefaultSeshTitle());
            setIsSeshTitleCustomized(false);
            console.log("TimerContext: Manual timer reset during session start. activeAsks cleared.");
            setHasWonPrize(false);
            setIsHomepageFocusCustomized(false);
            setIsHomepageBreakCustomized(false);
            setNotes("");
            setHostNotes("");
        }
    }

    const hostParticipant: ParticipantSessionData = {
      userId: user.id,
      userName: localFirstName,
      joinTime: Date.now(),
      role: 'host',
      focusPreference: userFocusPreference || 50,
      intention: profile?.profile_data?.intention?.value as string || null,
      bio: profile?.profile_data?.bio?.value as string || null,
    };

    let newActiveSessionRecordId: string | null = null;

    let latitude: number | null = null;
    let longitude: number | null = null;

    if (sessionVisibility !== 'private') {
      const locationData = await getLocation();
      latitude = locationData.latitude;
      longitude = locationData.longitude;
    }

    try {
      const { data, error } = await supabase
        .from('active_sessions')
        .insert({
          user_id: hostParticipant.userId,
          host_name: hostParticipant.userName,
          session_title: initialScheduleTitle,
          visibility: sessionVisibility,
          focus_duration: initialSchedule.filter(s => s.type === 'focus').reduce((sum, s) => sum + s.durationMinutes, 0),
          break_duration: initialSchedule.filter(s => s.type === 'break').reduce((sum, s) => sum + s.durationMinutes, 0),
          current_phase_type: initialSchedule[simulatedCurrentPhaseIndex]?.type || 'focus',
          current_phase_end_time: new Date(Date.now() + (simulatedTimeLeftInPhase !== null ? simulatedTimeLeftInPhase : (initialSchedule[simulatedCurrentPhaseIndex]?.durationMinutes || 0) * 60) * 1000).toISOString(),
          total_session_duration_seconds: initialSchedule.reduce((sum, item) => sum + item.durationMinutes, 0) * 60,
          schedule_id: initialSchedule[0]?.id && isValidUUID(initialSchedule[0].id) ? initialSchedule[0].id : null,
          current_schedule_index: simulatedCurrentPhaseIndex,
          schedule_data: initialSchedule,
          location_lat: latitude,
          location_long: longitude,
          participants_data: [hostParticipant],
          join_code: userJoinCode,
          organisation: sessionVisibility === 'organisation' && selectedHostingOrganisation && userOrganisations && userOrganisations.includes(selectedHostingOrganisation)
            ? [selectedHostingOrganisation]
            : null,
          last_heartbeat: new Date().toISOString(),
          host_notes: hostNotes,
          is_mock: false,
        })
        .select('id')
        .single();

      if (error) throw error;
      newActiveSessionRecordId = data.id;
      console.log("startSessionCommonLogic: Active session inserted into Supabase:", newActiveSessionRecordId);
    } catch (error: any) {
      console.error("Error inserting active session into Supabase:", error.message);
      if (areToastsEnabled) {
        toast.error("Supabase Error", {
          description: `Failed to publish session: ${error.message}`,
        });
      }
      return false;
    }

    setActiveSchedule(initialSchedule);
    setActiveTimerColors(initialTimerColors);
    _setSeshTitle(initialScheduleTitle);
    setIsSeshTitleCustomized(false);
    setActiveScheduleDisplayTitleInternal(initialScheduleTitle);

    const actualCurrentScheduleIndex = simulatedCurrentPhaseIndex;
    const actualTimerType = initialSchedule[actualCurrentScheduleIndex].type;
    const actualCurrentPhaseDurationSeconds = initialSchedule[actualCurrentScheduleIndex].durationMinutes * 60;
    const actualTimeLeft = simulatedTimeLeftInPhase !== null ? simulatedTimeLeftInPhase : actualCurrentPhaseDurationSeconds;
    const actualSessionStartTime = simulatedStartTime !== null ? simulatedStartTime : Date.now();
    const actualCurrentPhaseStartTime = Date.now() - (actualCurrentPhaseDurationSeconds - actualTimeLeft) * 1000;

    setCurrentScheduleIndex(actualCurrentScheduleIndex);
    setTimerType(actualTimerType);
    setIsTimeLeftManagedBySession(true);
    setCurrentPhaseDurationSeconds(actualCurrentPhaseDurationSeconds);
    setTimeLeft(actualTimeLeft);
    setSessionStartTime(actualSessionStartTime);
    setCurrentPhaseStartTime(actualCurrentPhaseStartTime);

    setIsFlashing(false);
    setIsSchedulingMode(false);

    setIsScheduleActive(true);
    setIsSchedulePending(simulatedStartTime === null && initialScheduleStartOption === 'custom_time');
    setIsRunning(true);

    if (areToastsEnabled) {
        toast("Session Started!", {
            description: `"${initialScheduleTitle}" has begun.`,
        });
    }
    // playSound(); // Removed
    // triggerVibration(); // Removed

    setCurrentSessionParticipantsData([hostParticipant]);
    setCurrentSessionRole('host');
    setCurrentSessionHostName(localFirstName);
    setCurrentSessionOtherParticipants([]);
    setActiveJoinedSessionCoworkerCount(0);

    setActiveSessionRecordId(newActiveSessionRecordId);

    return true;
  }, [
    isScheduleActive, isRunning, resetSchedule, setAccumulatedFocusSeconds, setAccumulatedBreakSeconds,
    setIsSeshTitleCustomized, setHasWonPrize, setIsHomepageFocusCustomized, setIsHomepageBreakCustomized,
    areToastsEnabled, user?.id, localFirstName,
    userFocusPreference, profile?.profile_data?.intention?.value, profile?.profile_data?.bio?.value, getLocation, getDefaultSeshTitle,
    sessionVisibility, selectedHostingOrganisation, hostNotes,
    _setSeshTitle, setActiveScheduleDisplayTitleInternal, userJoinCode, userOrganisations
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
      null,
      0,
      null
    );
}, [
    schedule, scheduleTitle, commenceTime, commenceDay, scheduleStartOption, isRecurring, recurrenceFrequency,
    timerColors, areToastsEnabled, startSessionCommonLogic
]);

  const commenceSpecificPreparedSchedule = useCallback(async (
    templateId: string,
    simulatedStartTime: number | null = null,
    simulatedCurrentPhaseIndex: number = 0,
    simulatedTimeLeftInPhase: number | null = null
  ): Promise<boolean> => {
    const templateToCommence = preparedSchedules.find(template => template.id === templateId);
    if (!templateToCommence) return false;

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
      simulatedStartTime,
      simulatedCurrentPhaseIndex,
      simulatedTimeLeftInPhase
    );

    if (started) {
      setPreparedSchedules(prev => prev.filter(template => template.id !== templateId));
    }
    return started;
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
      setSelectedHostingOrganisation(null);
    }
  }, [savedSchedules, areToastsEnabled, toast, setSelectedHostingOrganisation]);

  const deleteScheduleTemplate = useCallback((templateId: string) => {
    setSavedSchedules((prev) => prev.filter(template => template.id !== templateId));
    if (areToastsEnabled) {
        toast("Schedule Deleted!", {
            description: "The schedule template has been removed.",
        });
    }
  }, [areToastsEnabled, toast]);

  const joinSessionAsCoworker = useCallback(async (
    sessionToJoin: DemoSession,
    sessionTitle: string,
    hostName: string,
    participants: ParticipantSessionData[],
    fullSchedule: ScheduledTimer[],
    currentPhaseType: 'focus' | 'break',
    currentPhaseDurationMinutes: number,
    remainingSecondsInPhase: number
  ): Promise<boolean> => {
    if (!user?.id) {
      if (areToastsEnabled) {
        toast.error("Join Session Failed", {
          description: "You must be logged in to join a session.",
        });
      }
      return false;
    }

    if (isRunning || isScheduleActive || isSchedulePrepared) { // Removed isPaused check
      if (isScheduleActive || isSchedulePrepared) await resetSchedule();
      setIsRunning(false);
      setIsFlashing(false);
      setAccumulatedFocusSeconds(0);
      setAccumulatedBreakSeconds(0);
      setSeshTitle(getDefaultSeshTitle());
      setHasWonPrize(false);
      setIsHomepageFocusCustomized(false);
      setIsHomepageBreakCustomized(false);
      setNotes("");
      setHostNotes("");
      setSelectedHostingOrganisation(null);
    }

    setActiveSessionRecordId(sessionToJoin.id);
    setActiveSchedule(fullSchedule);
    setActiveScheduleDisplayTitleInternal(sessionTitle);
    setTimerType(currentPhaseType);
    setIsTimeLeftManagedBySession(true);
    
    const initialDurationSeconds = currentPhaseDurationMinutes * 60;
    setCurrentPhaseDurationSeconds(initialDurationSeconds);
    setTimeLeft(Math.max(0, remainingSecondsInPhase));

    setIsRunning(true);
    setIsFlashing(false);
    const elapsedSecondsInPhase = initialDurationSeconds - remainingSecondsInPhase;
    const actualCurrentPhaseStartTime = Date.now() - elapsedSecondsInPhase * 1000;
    setCurrentPhaseStartTime(actualCurrentPhaseStartTime);
    
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
    setHostNotes(sessionToJoin.host_notes || "");

    const newCoworker: ParticipantSessionData = {
      userId: user.id,
      userName: localFirstName,
      joinTime: Date.now(),
      role: 'coworker',
      focusPreference: userFocusPreference || 50,
      intention: profile?.profile_data?.intention?.value as string || null,
      bio: profile?.profile_data?.bio?.value as string || null,
    };

    setIsScheduleActive(true);

    if (sessionToJoin.is_mock) {
      console.log("Joining mock session locally:", sessionToJoin.id);
      const updatedParticipantsData = [...participants, newCoworker];
      setCurrentSessionParticipantsData(updatedParticipantsData);
      setActiveJoinedSessionCoworkerCount(updatedParticipantsData.filter(p => p.role === 'coworker').length);
      if (areToastsEnabled) {
        toast.success("Mock Sesh Joined!", {
          description: `You've joined "${sessionTitle}" (mock session).`,
        });
      }
      // playSound(); // Removed
      // triggerVibration(); // Removed
      return true;
    }

    try {
      console.log(`Invoking Edge Function 'join-session'. Token present: ${!!session?.access_token}. Token start: ${session?.access_token?.substring(0, 10)}`);
      const response = await supabase.functions.invoke('join-session', {
        body: JSON.stringify({
          sessionCode: sessionToJoin.join_code,
          participantData: newCoworker,
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) {
        console.error("Supabase Edge Function 'join-session' returned an error:", response.error);
        throw response.error;
      }
      if (response.data.error) {
        console.error("Supabase Edge Function 'join-session' returned a data error:", response.data.error);
        throw new Error(response.data.error);
      }

      const updatedSession = response.data.session;
      const updatedParticipantsData: ParticipantSessionData[] = (updatedSession?.participants_data || []) as ParticipantSessionData[];
      setCurrentSessionParticipantsData(updatedParticipantsData);
      setHostNotes(updatedSession.host_notes || "");

      if (areToastsEnabled) {
        toast.success("Sesh Joined!", {
          description: `You've joined "${sessionTitle}".`,
        });
      }
      // playSound(); // Removed
      // triggerVibration(); // Removed
      return true;
    } catch (error: any) {
      console.error("Unexpected error during joinSessionAsCoworker:", error);
      if (areToastsEnabled) {
        toast.error("Join Session Failed", {
          description: `An unexpected error occurred: ${await getEdgeFunctionErrorMessage(error)}.`,
        });
      }
      resetSessionStates();
      return false;
    }
  }, [
    user?.id, areToastsEnabled, isRunning, isScheduleActive, isSchedulePrepared, // Removed isPaused
    resetSchedule, setIsRunning, setIsFlashing, setAccumulatedFocusSeconds,
    setAccumulatedBreakSeconds, setSeshTitle, setHasWonPrize,
    setIsHomepageFocusCustomized, setIsHomepageBreakCustomized, setActiveSessionRecordId,
    setActiveSchedule, setActiveScheduleDisplayTitleInternal, setTimerType,
    setIsTimeLeftManagedBySession, setTimeLeft, setSessionStartTime, setCurrentPhaseStartTime,
    setHomepageFocusMinutes, setHomepageBreakMinutes, setCurrentSessionRole,
    setCurrentSessionHostName, setCurrentSessionOtherParticipants, localFirstName,
    userFocusPreference, profile?.profile_data?.intention?.value, profile?.profile_data?.bio?.value, _defaultBreakMinutes, _defaultFocusMinutes,
    getDefaultSeshTitle, resetSessionStates, setCurrentPhaseDurationSeconds, session?.access_token, setSelectedHostingOrganisation
  ]);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (isRunning && currentPhaseStartTime !== null && currentPhaseDurationSeconds > 0) { // Removed isPaused check
      timerRef.current = setInterval(() => {
        const elapsedSeconds = (Date.now() - currentPhaseStartTime) / 1000;
        const secondsPassed = Math.floor(elapsedSeconds);
        setTimeLeft(Math.max(0, currentPhaseDurationSeconds - secondsPassed));
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, currentPhaseStartTime, currentPhaseDurationSeconds]); // Removed isPaused

  useEffect(() => {
    if (timeLeft === 0 && isRunning && currentPhaseStartTime !== null) {
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

      // if (shouldPlayEndSound) playSound(); // Removed
      // if (breakNotificationsVibrate && navigator.vibrate) navigator.vibrate(200); // Removed

      if (isScheduleActive) {
        const nextIndex = currentScheduleIndex + 1;
        if (nextIndex < activeSchedule.length) {
          setCurrentScheduleIndex(nextIndex);
          setTimerType(activeSchedule[nextIndex].type);
          
          const nextPhaseDurationSeconds = activeSchedule[nextIndex].durationMinutes * 60;
          setCurrentPhaseDurationSeconds(nextPhaseDurationSeconds);
          setTimeLeft(nextPhaseDurationSeconds);
          setCurrentPhaseStartTime(Date.now());

          setIsRunning(true);
          setIsFlashing(false);
        } else {
          if (isRecurring && activeSchedule.length > 0) {
            setCurrentScheduleIndex(0);
            setTimerType(activeSchedule[0].type);

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

            console.log("TimerContext: activeAsks before saving (schedule completion):", "No active asks to save.");
            saveSessionToDatabase(
              user?.id,
              _seshTitle,
              notes,
              hostNotes,
              finalFocusSeconds,
              finalBreakSeconds,
              totalSession,
              activeJoinedSessionCoworkerCount,
              sessionStartTime || Date.now(),
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
            const newBreakDurationSeconds = breakMinutes * 60;
            setCurrentPhaseDurationSeconds(newBreakDurationSeconds);
            setTimeLeft(newBreakDurationSeconds);
            setCurrentPhaseStartTime(Date.now());
          } else {
            setTimerType('focus');
            const newFocusDurationSeconds = focusMinutes * 60;
            setCurrentPhaseDurationSeconds(newFocusDurationSeconds);
            setTimeLeft(newFocusDurationSeconds);
            setCurrentPhaseStartTime(Date.now());
          }
        }
      }
    }
  }, [
    timeLeft, isRunning, currentPhaseStartTime, currentPhaseDurationSeconds, // Removed isPaused
    isFlashing, isScheduleActive, activeSchedule, currentScheduleIndex, timerType, resetSchedule, scheduleTitle,
    setAccumulatedFocusSeconds, setAccumulatedBreakSeconds, shouldShowEndToast, user?.id, _seshTitle, notes, hostNotes,
    accumulatedFocusSeconds, accumulatedBreakSeconds, activeJoinedSessionCoworkerCount, sessionStartTime, manualTransition,
    focusMinutes, breakMinutes, areToastsEnabled, allParticipantsToDisplay,
    isRecurring, setCurrentScheduleIndex, setTimerType, setIsRunning, setIsFlashing, setCurrentPhaseStartTime, setTimeLeft,
    _defaultFocusMinutes, _defaultBreakMinutes, setHomepageFocusMinutes, setHomepageBreakMinutes, getDefaultSeshTitle,
    setIsHomepageFocusCustomized, setIsHomepageBreakCustomized, setHasWonPrize
  ]);

  useEffect(() => {
    if (!isTimeLeftManagedBySession && !isRunning && !isScheduleActive && !isSchedulePending) { // Removed isPaused
      const expectedTime = (timerType === 'focus' ? focusMinutes : breakMinutes) * 60;
      if (timeLeft !== expectedTime) {
        setTimeLeft(expectedTime);
        setCurrentPhaseDurationSeconds(expectedTime);
      }
    }
  }, [focusMinutes, breakMinutes, timerType, isRunning, isScheduleActive, isSchedulePending, isTimeLeftManagedBySession, timeLeft, setCurrentPhaseDurationSeconds]); // Removed isPaused

  useEffect(() => {
    if (!isRunning && !isScheduleActive && !isSchedulePending && !profileLoading) { // Removed isPaused
      const defaultTitle = getDefaultSeshTitle();
      if (!isSeshTitleCustomized && _seshTitle !== defaultTitle) {
        _setSeshTitle(defaultTitle);
      }
    }
  }, [profileLoading, getDefaultSeshTitle, isSeshTitleCustomized, _seshTitle, isRunning, isScheduleActive, isSchedulePending]); // Removed isPaused

  useEffect(() => {
    if (!isRunning && !isScheduleActive && !isSchedulePending && !profileLoading) { // Removed isPaused
      const defaultTitle = getDefaultSeshTitle();
      if (scheduleTitle === "Coworker's DeepSesh") {
        setScheduleTitle(defaultTitle);
      }
    }
  }, [profileLoading, getDefaultSeshTitle, scheduleTitle, isRunning, isScheduleActive, isSchedulePending]); // Removed isPaused

  useEffect(() => {
    if (!isRunning && !isScheduleActive && !isSchedulePending && !profileLoading) { // Removed isPaused
      const defaultTitle = getDefaultSeshTitle();
      if (activeScheduleDisplayTitle === "Coworker's DeepSesh") {
        setActiveScheduleDisplayTitleInternal(defaultTitle);
      }
    }
  }, [profileLoading, getDefaultSeshTitle, activeScheduleDisplayTitle, isRunning, isScheduleActive, isSchedulePending]); // Removed isPaused


  const addAsk = useCallback(async (ask: any) => { // Type changed to any as ActiveAskItem is removed
    // This function is no longer needed as 'Asks' feature is removed.
    // Keeping a placeholder to avoid immediate compilation errors, but it will be removed.
    console.warn("addAsk function called, but 'Asks' feature has been removed.");
  }, []);

  const updateAsk = useCallback(async (updatedAsk: any) => { // Type changed to any as ActiveAskItem is removed
    // This function is no longer needed as 'Asks' feature is removed.
    // Keeping a placeholder to avoid immediate compilation errors, but it will be removed.
    console.warn("updateAsk function called, but 'Asks' feature has been removed.");
  }, []);

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
          let daysToAdd = (templateDay - currentDay + 7) % 7;
          targetDate.setDate(now.getDate() + daysToAdd);

          if (targetDate.getTime() < now.getTime()) {
            if (!template.isRecurring) {
              let totalScheduleDurationSeconds = 0;
              template.schedule.forEach(item => {
                totalScheduleDurationSeconds += item.durationMinutes * 60;
              });
              const elapsedSecondsSinceScheduledStart = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

              if (elapsedSecondsSinceScheduledStart >= totalScheduleDurationSeconds) {
                discardPreparedSchedule(template.id);
                continue;
              }

              console.log(`Commencing past non-recurring schedule: ${template.title}`);
              
              let currentPhaseIndex = 0;
              let timeLeftInPhase = 0;
              let accumulatedDuration = 0;

              for (let i = 0; i < template.schedule.length; i++) {
                const phaseDurationSeconds = template.schedule[i].durationMinutes * 60;
                if (elapsedSecondsSinceScheduledStart < accumulatedDuration + phaseDurationSeconds) {
                  currentPhaseIndex = i;
                  timeLeftInPhase = (accumulatedDuration + phaseDurationSeconds) - elapsedSecondsSinceScheduledStart;
                  break;
                }
                accumulatedDuration += phaseDurationSeconds;
              }

              commenceSpecificPreparedSchedule(
                template.id,
                targetDate.getTime(),
                currentPhaseIndex,
                timeLeftInPhase
              );
              return;
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
              setPreparedSchedules(prev => prev.map(p =>
                p.id === template.id ? {
                  ...p,
                  commenceTime: nextCommenceDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }),
                  commenceDay: nextCommenceDate.getDay()
                } : p
              ));
            }
          }

          const timeDifference = targetDate.getTime() - now.getTime();
          if (timeDifference <= 60 * 1000 && timeDifference >= -1000) {
            if (!isScheduleActive && !isSchedulePending) { // Removed isPaused
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
  }, [preparedSchedules, isScheduleActive, isSchedulePending, commenceSpecificPreparedSchedule, discardPreparedSchedule, isRecurring, scheduleTitle, activeSchedule, currentScheduleIndex, timerType, timeLeft, accumulatedFocusSeconds, accumulatedBreakSeconds, sessionStartTime, activeJoinedSessionCoworkerCount, allParticipantsToDisplay, areToastsEnabled, user?.id, _seshTitle, notes, hostNotes, manualTransition, focusMinutes, _defaultFocusMinutes, breakMinutes, _defaultBreakMinutes, currentPhaseDurationSeconds]); // Removed isPaused

  useEffect(() => {
    if (isRunning || isFlashing || isScheduleActive || isSchedulePending) { // Removed isPaused
      setLastActivityTime(Date.now());
    } else {
      setLastActivityTime(null);
    }
  }, [isRunning, isFlashing, isScheduleActive, isSchedulePending]); // Removed isPaused

  const getTimerContextDataToSave = useCallback(() => {
    return {
      _defaultFocusMinutes, _defaultBreakMinutes,
      focusMinutes, breakMinutes,
      isRunning, timeLeft, timerType, isFlashing,
      notes, hostNotes, _seshTitle, isSeshTitleCustomized, showSessionsWhileActive, schedule, currentScheduleIndex,
      isSchedulingMode, isScheduleActive, scheduleTitle, commenceTime, commenceDay,
      sessionVisibility, isRecurring, recurrenceFrequency, savedSchedules, timerColors, sessionStartTime,
      currentPhaseStartTime, accumulatedFocusSeconds, accumulatedBreakSeconds,
      activeJoinedSessionCoworkerCount, isSchedulePending, scheduleStartOption,
      isTimeLeftManagedBySession,
      shouldShowEndToast, // NEW
      isBatchNotificationsEnabled, batchNotificationPreference,
      customBatchMinutes, lock, exemptionsEnabled, phoneCalls, favourites, workApps,
      intentionalBreaches, manualTransition, maxDistance, askNotifications, joinNotifications, sessionInvites,
      friendActivity, verificationStandard,
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
      // Removed: remainingTimeAtPause,
      limitDiscoveryRadius,
      selectedHostingOrganisation,
    };
  }, [
    _defaultFocusMinutes, _defaultBreakMinutes, focusMinutes, breakMinutes, isRunning, timeLeft, timerType, isFlashing,
    notes, hostNotes, _seshTitle, isSeshTitleCustomized, showSessionsWhileActive, schedule, currentScheduleIndex, isSchedulingMode,
    isScheduleActive, scheduleTitle, commenceTime, commenceDay, sessionVisibility, isRecurring, recurrenceFrequency,
    savedSchedules, timerColors, sessionStartTime, currentPhaseStartTime, accumulatedFocusSeconds, accumulatedBreakSeconds,
    activeJoinedSessionCoworkerCount, isSchedulePending, scheduleStartOption, isTimeLeftManagedBySession,
    shouldShowEndToast, // NEW
    isBatchNotificationsEnabled, batchNotificationPreference, customBatchMinutes,
    lock, exemptionsEnabled, phoneCalls, favourites, workApps, intentionalBreaches, manualTransition, maxDistance,
    askNotifications, joinNotifications, sessionInvites, friendActivity, verificationStandard,
    locationSharing, openSettingsAccordions, activeSchedule, activeTimerColors, activeScheduleDisplayTitle, is24HourFormat,
    preparedSchedules, timerIncrement, startStopNotifications, hasWonPrize, currentSessionRole, currentSessionHostName,
    currentSessionOtherParticipants, isHomepageFocusCustomized, isHomepageBreakCustomized, activeSessionRecordId,
    isDiscoveryActivated, geolocationPermissionStatus, currentSessionParticipantsData, lastActivityTime, showDemoSessions,
    currentPhaseDurationSeconds, // Removed: remainingTimeAtPause,
    limitDiscoveryRadius, selectedHostingOrganisation,
  ]);

  useEffect(() => {
    const storedData = localStorage.getItem(LOCAL_STORAGE_KEY_TIMER);
    let initialSavedSchedules: ScheduledTimerTemplate[] = [];

    let data: any = {}; 
    let loadedIsRunning: boolean = false;
    let loadedIsScheduleActive: boolean = false;
    let loadedIsSchedulePending: boolean = false;

    if (storedData) {
      data = JSON.parse(storedData); 
      loadedIsRunning = data.isRunning ?? false;
      loadedIsScheduleActive = data.isScheduleActive ?? false;
      loadedIsSchedulePending = data.isSchedulePending ?? false;

      if (loadedIsRunning || loadedIsScheduleActive || loadedIsSchedulePending) { // Removed loadedIsPaused
        _setFocusMinutes(data.focusMinutes ?? _defaultFocusMinutes);
        _setBreakMinutes(data.breakMinutes ?? _defaultBreakMinutes);
        setIsRunning(loadedIsRunning);
        setTimeLeft(data.timeLeft ?? (data.focusMinutes ?? _defaultFocusMinutes) * 60);
        setTimerType(data.timerType ?? 'focus');
        setIsFlashing(data.isFlashing ?? false);
        setNotes(data.notes ?? "");
        setHostNotes(data.hostNotes ?? "");
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
        setIsSchedulePending(loadedIsSchedulePending);
        setIsTimeLeftManagedBySession(data.isTimeLeftManagedBySession ?? false);
        setShouldShowEndToast(data.shouldShowEndToast ?? false); // NEW
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
        setAskNotifications(data.askNotifications ?? { push: false });
        setJoinNotifications(data.joinNotifications ?? { push: false });
        setSessionInvites(data.sessionInvites ?? { push: false });
        setFriendActivity(data.friendActivity ?? { push: false });
        setVerificationStandard(data.verificationStandard ?? 'anyone');
        setLocationSharing(data.locationSharing ?? false);
        setOpenSettingsAccordions(data.openSettingsAccordions ?? []);
        setIs24HourFormat(data.is24HourFormat ?? true);
        setAreToastsEnabled(data.areToastsEnabled ?? false);
        setStartStopNotifications(data.startStopNotifications ?? { push: false });
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
        // Removed: setRemainingTimeAtPause(data.remainingTimeAtPause ?? 0);
        setSelectedHostingOrganisation(data.selectedHostingOrganisation ?? null);
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

    if (!(loadedIsRunning || loadedIsScheduleActive || loadedIsSchedulePending)) { // Removed loadedIsPaused
      const initialScheduleToLoad = finalSavedSchedules.find(
        (template) => template.id === "b2c3d4e5-f6a7-4890-8123-4567890abcdef0"
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
      } 
      const currentHomepageFocus = data.focusMinutes ?? _defaultFocusMinutes;
      const currentHomepageBreak = data.breakMinutes ?? _defaultBreakMinutes;
      const currentTimerType = data.timerType ?? 'focus';

      setTimerType(currentTimerType);
      setTimeLeft((currentTimerType === 'focus' ? currentHomepageFocus : currentHomepageBreak) * 60);
      setCurrentPhaseDurationSeconds((currentTimerType === 'focus' ? currentHomepageFocus : currentHomepageBreak) * 60);
      _setSeshTitle(data._seshTitle ?? getDefaultSeshTitle());
      setIsSeshTitleCustomized(data.isSeshTitleCustomized ?? false);
      setNotes(data.notes ?? "");
      setHostNotes(data.hostNotes ?? "");
      setSelectedHostingOrganisation(data.selectedHostingOrganisation ?? null);
    }
  }, [getDefaultSeshTitle, _defaultFocusMinutes, _defaultBreakMinutes, areToastsEnabled, setAreToastsEnabled, timerIncrement, resetSessionStates, setIsDiscoveryActivated, setGeolocationPermissionStatus, setSessionVisibility, _setFocusMinutes, _setBreakMinutes, setIsHomepageFocusCustomized, setIsHomepageBreakCustomized, _setSeshTitle, setIsSeshTitleCustomized, setSchedule, setScheduleTitle, setCommenceTime, setCommenceDay, setScheduleStartOption, setIsRecurring, setRecurrenceFrequency, setTimerColors, setTimerType, setTimeLeft, setCurrentPhaseDurationSeconds, setSavedSchedules, setPreparedSchedules, setNotes, setHostNotes, setSelectedHostingOrganisation]);

  useEffect(() => {
    const handler = setTimeout(() => {
      const dataToSave = getTimerContextDataToSave();
      localStorage.setItem(LOCAL_STORAGE_KEY_TIMER, JSON.stringify(dataToSave));
      console.log("TimerContext: Debounced state saved to local storage.");
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [
    _defaultFocusMinutes, _defaultBreakMinutes, focusMinutes, breakMinutes, isRunning, timeLeft, timerType, isFlashing,
    notes, hostNotes, _seshTitle, isSeshTitleCustomized, showSessionsWhileActive, schedule, currentScheduleIndex,
    isSchedulingMode, isScheduleActive, scheduleTitle, commenceTime, commenceDay,
    sessionVisibility, isRecurring, recurrenceFrequency, savedSchedules, timerColors,
    activeJoinedSessionCoworkerCount, isSeshTitleCustomized, scheduleStartOption,
    isTimeLeftManagedBySession,
    shouldShowEndToast, // NEW
    isBatchNotificationsEnabled, batchNotificationPreference,
    customBatchMinutes, lock, exemptionsEnabled, phoneCalls, favourites, workApps,
    intentionalBreaches, manualTransition, maxDistance, askNotifications, joinNotifications, sessionInvites,
    friendActivity, verificationStandard,
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
    // Removed: remainingTimeAtPause,
    limitDiscoveryRadius,
    selectedHostingOrganisation,
    getTimerContextDataToSave,
  ]);

  useEffect(() => {
    if (isRunning || isScheduleActive || isSchedulePending) { // Removed isPaused
      const dataToSave = getTimerContextDataToSave();
      localStorage.setItem(LOCAL_STORAGE_KEY_TIMER, JSON.stringify(dataToSave));
      console.log("TimerContext: Immediate state saved to local storage (isRunning/isPaused change).");
    }
  }, [isRunning, isScheduleActive, isSchedulePending, getTimerContextDataToSave]); // Removed isPaused


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
    timeLeft,
    setTimeLeft,
    timerType,
    setTimerType,
    isFlashing,
    setIsFlashing,
    notes,
    setNotes,
    hostNotes,
    setHostNotes,
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
    sessionVisibility,
    setSessionVisibility,
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

    shouldShowEndToast, // NEW
    setShouldShowEndToast, // NEW
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
    verificationStandard,
    setVerificationStandard,
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
    currentPhaseDurationSeconds,
    setCurrentPhaseDurationSeconds,
    // Removed: remainingTimeAtPause,
    limitDiscoveryRadius,
    setLimitDiscoveryRadius,
    selectedHostingOrganisation,
    setSelectedHostingOrganisation,
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