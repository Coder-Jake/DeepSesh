import { toast } from 'sonner';
import { ActiveAskItem } from "@/types/timer";

const LOCAL_STORAGE_SESSIONS_KEY = 'deepsesh_local_sessions';

export const saveSessionToDatabase = async (
  userId: string | undefined, // userId is now optional as we might not have a logged-in user
  seshTitle: string,
  notes: string,
  finalAccumulatedFocusSeconds: number,
  finalAccumulatedBreakSeconds: number,
  totalSessionSeconds: number,
  activeJoinedSessionCoworkerCount: number,
  sessionStartTime: number,
  activeAsks: ActiveAskItem[] | undefined,
  allParticipantNames: string[] | undefined,
  areToastsEnabled: boolean
) => {
  console.log("saveSessionToDatabase: received activeAsks:", activeAsks);

  const newSessionDate = new Date(sessionStartTime);
  const sessionEndTime = new Date(sessionStartTime + totalSessionSeconds * 1000);

  const currentActiveAsks = activeAsks ?? [];
  console.log("saveSessionToDatabase: currentActiveAsks for new session:", currentActiveAsks);

  const sessionData = {
    id: crypto.randomUUID(),
    user_id: userId, // Will be undefined if not logged in
    title: seshTitle,
    focus_duration_seconds: Math.round(finalAccumulatedFocusSeconds),
    break_duration_seconds: Math.round(finalAccumulatedBreakSeconds),
    total_session_seconds: Math.round(totalSessionSeconds),
    coworker_count: activeJoinedSessionCoworkerCount,
    session_start_time: newSessionDate.toISOString(),
    session_end_time: sessionEndTime.toISOString(),
    active_asks: currentActiveAsks,
    notes: notes,
  };

  try {
    const storedSessions = localStorage.getItem(LOCAL_STORAGE_SESSIONS_KEY);
    const sessions = storedSessions ? JSON.parse(storedSessions) : [];
    sessions.push(sessionData);
    localStorage.setItem(LOCAL_STORAGE_SESSIONS_KEY, JSON.stringify(sessions));

    console.log("Session data saved to local storage:", sessionData);
    if (areToastsEnabled) {
      toast.success("Session saved locally!", {
        description: "Your session has been successfully recorded in this browser.",
      });
    }
  } catch (error) {
    console.error("Error saving session to local storage:", error);
    if (areToastsEnabled) {
      toast.error("Error saving session locally", {
        description: `Failed to save session data to local storage. ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }
};