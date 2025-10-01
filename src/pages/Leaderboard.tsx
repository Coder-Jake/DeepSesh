import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Clock, Award, Gift } from "lucide-react";
import TimeFilterToggle from "@/components/TimeFilterToggle";
import { useState, useMemo } from "react";
import { useTimer } from "@/contexts/TimerContext";
import { useProfile } from "@/contexts/ProfileContext"; // Import useProfile
import { supabase } from "@/integrations/supabase/client"; // Import supabase client
import { Tables } from "@/integrations/supabase/types"; // Import Supabase types
import { useQuery } from "@tanstack/react-query"; // Import useQuery

type Session = Tables<'sessions'>;
type Profile = Tables<'profiles'>;

interface LeaderboardEntry {
  id: string;
  name: string;
  value: number;
  isCurrentUser: boolean;
}

const Leaderboard = () => {
  const { 
    leaderboardFocusTimePeriod, 
    setLeaderboardFocusTimePeriod, 
    leaderboardCollaborationTimePeriod, 
    setLeaderboardCollaborationTimePeriod 
  } = useTimer();
  const { profile } = useProfile(); // Get current user's profile

  const fetchAllSessions = async (timePeriod: 'week' | 'month' | 'all') => {
    let startDate: Date;
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Normalize to start of day

    if (timePeriod === 'week') {
      startDate = new Date(now.setDate(now.getDate() - 7));
    } else if (timePeriod === 'month') {
      startDate = new Date(now.setMonth(now.getMonth() - 1));
    } else {
      startDate = new Date(0); // Epoch for 'all time'
    }

    const { data: sessionsData, error: sessionsError } = await supabase
      .from('sessions')
      .select('user_id, focus_duration_seconds, coworker_count, id') // Select id for unique coworker proxy
      .gte('session_start_time', startDate.toISOString());

    if (sessionsError) {
      console.error("Error fetching all sessions:", sessionsError);
      return { sessions: [], profiles: [] };
    }

    const uniqueUserIds = Array.from(new Set(sessionsData.map(s => s.user_id)));

    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', uniqueUserIds);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return { sessions: sessionsData, profiles: [] };
    }

    return { sessions: sessionsData, profiles: profilesData };
  };

  const { data: focusData, isLoading: isLoadingFocus, error: errorFocus } = useQuery<{ sessions: Session[], profiles: Profile[] }, Error>({
    queryKey: ['leaderboardAllSessionsFocus', leaderboardFocusTimePeriod],
    queryFn: () => fetchAllSessions(leaderboardFocusTimePeriod),
    enabled: !!profile?.id,
  });

  const { data: collaborationData, isLoading: isLoadingCollaboration, error: errorCollaboration } = useQuery<{ sessions: Session[], profiles: Profile[] }, Error>({
    queryKey: ['leaderboardAllSessionsCollaboration', leaderboardCollaborationTimePeriod],
    queryFn: () => fetchAllSessions(leaderboardCollaborationTimePeriod),
    enabled: !!profile?.id,
  });

  const focusHoursLeaderboard = useMemo(() => {
    if (!focusData?.sessions || !focusData?.profiles) return [];

    const userFocusMap = new Map<string, { name: string; focusHours: number }>();
    const profileMap = new Map<string, Profile>();
    focusData.profiles.forEach(p => profileMap.set(p.id, p));

    focusData.sessions.forEach(session => {
      const userName = profileMap.get(session.user_id)?.first_name || 'Unknown';
      const current = userFocusMap.get(session.user_id) || { name: userName, focusHours: 0 };
      current.focusHours += session.focus_duration_seconds / 3600; // Convert seconds to hours
      userFocusMap.set(session.user_id, current);
    });

    const leaderboard = Array.from(userFocusMap.entries())
      .map(([userId, data]) => ({
        id: userId,
        name: data.name,
        value: parseFloat(data.focusHours.toFixed(1)), // Round to 1 decimal place
        isCurrentUser: userId === profile?.id,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5

    // Ensure current user is in the list if not already in top 5
    if (profile?.id && !leaderboard.some(entry => entry.id === profile.id)) {
      const currentUserEntry = userFocusMap.get(profile.id);
      if (currentUserEntry) {
        leaderboard.push({
          id: profile.id,
          name: currentUserEntry.name,
          value: parseFloat(currentUserEntry.focusHours.toFixed(1)),
          isCurrentUser: true,
        });
        leaderboard.sort((a, b) => b.value - a.value); // Re-sort after adding
      }
    }
    return leaderboard;
  }, [focusData, profile]);

  const collaboratedUsersLeaderboard = useMemo(() => {
    if (!collaborationData?.sessions || !collaborationData?.profiles) return [];

    const userCollaborationMap = new Map<string, { name: string; uniqueCoworkers: Set<string> }>();
    const profileMap = new Map<string, Profile>();
    collaborationData.profiles.forEach(p => profileMap.set(p.id, p));

    collaborationData.sessions.forEach(session => {
      const userName = profileMap.get(session.user_id)?.first_name || 'Unknown';
      const current = userCollaborationMap.get(session.user_id) || { name: userName, uniqueCoworkers: new Set<string>() };
      // This is a simplified approach. In a real app, `coworker_count` would be derived from actual participant IDs.
      // For now, we'll use session ID as a proxy for a unique collaboration instance if coworker_count > 0.
      if (session.coworker_count > 0) {
        current.uniqueCoworkers.add(session.id); // Add session ID as a proxy for a unique collaboration event
      }
      userCollaborationMap.set(session.user_id, current);
    });

    const leaderboard = Array.from(userCollaborationMap.entries())
      .map(([userId, data]) => ({
        id: userId,
        name: data.name,
        value: data.uniqueCoworkers.size,
        isCurrentUser: userId === profile?.id,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5

    // Ensure current user is in the list if not already in top 5
    if (profile?.id && !leaderboard.some(entry => entry.id === profile.id)) {
      const currentUserEntry = userCollaborationMap.get(profile.id);
      if (currentUserEntry) {
        leaderboard.push({
          id: profile.id,
          name: currentUserEntry.name,
          value: currentUserEntry.uniqueCoworkers.size,
          isCurrentUser: true,
        });
        leaderboard.sort((a, b) => b.value - a.value); // Re-sort after adding
      }
    }
    return leaderboard;
  }, [collaborationData, profile]);

  if (isLoadingFocus || isLoadingCollaboration) {
    return (
      <main className="max-w-4xl mx-auto pt-16 px-4 pb-4 lg:pt-20 lg:px-6 lg:pb-6 text-center text-muted-foreground">
        Loading leaderboard...
      </main>
    );
  }

  if (errorFocus || errorCollaboration) {
    return (
      <main className="max-w-4xl mx-auto pt-16 px-4 pb-4 lg:pt-20 lg:px-6 lg:pb-6 text-center text-destructive">
        Error loading leaderboard: {errorFocus?.message || errorCollaboration?.message}
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto pt-16 px-4 pb-4 lg:pt-20 lg:px-6 lg:pb-6">
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Trophy className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Leaderboard</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Compare your focus and collaboration with the FlowSesh community!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Focus Hours Leaderboard */}
        <Card id="focus-hours-leaderboard">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Total Focus Hours
            </CardTitle>
            <TimeFilterToggle onValueChange={setLeaderboardFocusTimePeriod} defaultValue={leaderboardFocusTimePeriod} />
          </CardHeader>
          <CardContent className="space-y-3">
            {focusHoursLeaderboard.map((user, index) => (
              <div key={user.id} className={`flex items-center justify-between p-3 rounded-lg ${user.isCurrentUser ? 'bg-primary/10 border border-primary' : 'bg-muted'}`}>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg text-primary">{index + 1}.</span>
                  <p className="font-medium text-foreground">{user.name} {user.isCurrentUser && "(You)"}</p>
                </div>
                <p className="text-muted-foreground">{user.value} hours</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Collaborated Users Leaderboard */}
        <Card id="collaborated-users-leaderboard">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Unique Coworkers
            </CardTitle>
            <TimeFilterToggle onValueChange={setLeaderboardCollaborationTimePeriod} defaultValue={leaderboardCollaborationTimePeriod} />
          </CardHeader>
          <CardContent className="space-y-3">
            {collaboratedUsersLeaderboard.map((user, index) => (
              <div key={user.id} className={`flex items-center justify-between p-3 rounded-lg ${user.isCurrentUser ? 'bg-primary/10 border border-primary' : 'bg-muted'}`}>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg text-primary">{index + 1}.</span>
                  <p className="font-medium text-foreground">{user.name} {user.isCurrentUser && "(You)"}</p>
                </div>
                <p className="text-muted-foreground">{user.value} users</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Weekly Competition Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Award className="h-6 w-6 text-primary" />
            Weekly Competition
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            Compete weekly for small prizes!
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Points for productivity and collaboration</li>
            <li>Prize: <span className="font-medium text-foreground">$50 voucher!</span></li>
          </ul>
          <div className="flex items-center gap-2 text-sm">
            <Gift className="h-4 w-4 text-primary" />
            <p>Sponsored by <span className="font-medium text-foreground">StartSpace Melbourne</span>.</p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default Leaderboard;