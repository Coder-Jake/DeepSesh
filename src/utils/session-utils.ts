import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TablesInsert, Json } from "@/integrations/supabase/types";
import { ActiveAskItem } from "@/types/timer";

export const saveSessionToDatabase = async (
  userId: string | undefined,
  seshTitle: string,
  notes: string,
  finalAccumulatedFocusSeconds: number,
  finalAccumulatedBreakSeconds: number,
  totalSessionSeconds: number,
  activeJoinedSessionCoworkerCount: number,
  sessionStartTime: number,
  activeAsks: ActiveAskItem[] | undefined,
  allParticipantNames: string[] | undefined, // This is not used in the DB insert, but was passed to saveSession
  areToastsEnabled: boolean // Pass this as an argument
) => {
  console.log("saveSessionToDatabase: received activeAsks:", activeAsks);

  const newSessionDate = new Date(sessionStartTime);
  const sessionEndTime = new Date(sessionStartTime + totalSessionSeconds * 1000);

  const currentActiveAsks = activeAsks ?? [];
  console.log("saveSessionToDatabase: currentActiveAsks for new session:", currentActiveAsks);

  if (!userId) {
    if (areToastsEnabled) {
      toast.success("Session saved locally!", {
        description: "Your session has been recorded in this browser.",
      });
    }
    return;
  }

  const sessionData: TablesInsert<'public', 'sessions'> = {
    id: crypto.randomUUID(),
    user_id: userId,
    title: seshTitle,
    focus_duration_seconds: Math.round(finalAccumulatedFocusSeconds),
    break_duration_seconds: Math.round(finalAccumulatedBreakSeconds),
    total_session_seconds: Math.round(totalSessionSeconds),
    coworker_count: activeJoinedSessionCoworkerCount,
    session_start_time: newSessionDate.toISOString(),
    session_end_time: sessionEndTime.toISOString(),
    active_asks: currentActiveAsks as unknown as Json,
    notes: notes,
  };

  const { data, error: insertError } = await supabase
    .from('sessions')
    .insert(sessionData)
    .select('id')
    .single();

  if (insertError) {
    console.error("Error saving session to Supabase:", insertError);
    if (areToastsEnabled) {
      toast.error("Error saving session", {
        description: `Failed to save core session data to cloud. Notes and asks are saved locally. ${insertError.message}`,
      });
    }
  } else if (data) {
    console.log("Core session data saved to Supabase:", data);
    if (areToastsEnabled) {
      toast.success("Session saved!", {
        description: "Your session has been successfully recorded.",
      });
    }
  }
};