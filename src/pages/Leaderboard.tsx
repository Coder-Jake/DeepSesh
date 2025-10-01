import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Clock, Award, Gift } from "lucide-react";
import TimeFilterToggle from "@/components/TimeFilterToggle";
import { useState, useMemo } from "react";
import { useTimer } from "@/contexts/TimerContext"; // Import useTimer
import { supabase } from "@/integrations/supabase/client"; // Import supabase client
import { Tables } from "@/integrations/supabase/types"; // Import Tables type
import { useQuery } from "@tanstack/react-query"; // Import useQuery
import { mockSessions, mockProfiles as initialMockProfiles } from "@/lib/mockData"; // Import mock sessions and profiles

type LeaderboardEntry = {
  id: string;
  name: string;
  value: number;
};

const Leaderboard = () => {
  const { 
    leaderboardFocusTimePeriod, 
    setLeaderboardFocusTimePeriod, 
    leaderboardCollaborationTimePeriod, 
    setLeaderboardCollaborationTimePeriod 
  } = useTimer();

  // Fetch all authenticated sessions for leaderboard calculations
  const { data: authenticatedSessions = [], isLoading: isLoadingSessions } = useQuery<Tables<'sessions'>[]>({
    queryKey: ['allAuthenticatedSessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('user_id, focus_duration_seconds, coworker_count, session_start_time')
        .not('user_id', 'is', null); // Only fetch sessions with a user_id
      
      if (error) {
        console.error("Error fetching all authenticated sessions:", error);
        return [];
      }
      return data;
    },
  });

  // Fetch profiles to get user names
  const { data: realProfiles = [], isLoading: isLoadingProfiles } = useQuery<Tables<'profiles'>[]>({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name');
      
      if (error) {
        console.error("Error fetching profiles:", error);
        return [];
      }
      return data;
    },
  });

  // Combine real profiles with mock profiles
  const allProfiles = useMemo(() => [...realProfiles, ...initialMockProfiles], [realProfiles]);

  // Combine authenticated sessions with mock sessions (which have mock user_ids)
  const allLeaderboardSessions = useMemo(() => {
    // Filter mock sessions to only include those with a user_id (as per leaderboard requirement)
    const filteredMockSessions = mockSessions.filter(session => session.user_id !== null);
    return [...authenticatedSessions, ...filteredMockSessions];
  }, [authenticatedSessions]);


  const getUserName = (userId: string | null) => {
    if (!userId) return "Anonymous"; 
    const profile = allProfiles.find(p => p.id === userId);
    return profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown User' : 'Unknown User';
  };

  const filterSessionsByTimePeriod = (sessions: Tables<'sessions'>[], period: 'week' | 'month' | 'all') => {
    const now = new Date();
    return sessions.filter(session => {
      const sessionDate = new Date(session.session_start_time);
      if (period === 'week') {
        const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));
        return sessionDate >= oneWeekAgo;
      } else if (period === 'month') {
        const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));
        return sessionDate >= oneMonthAgo;
      }
      return true; // 'all' time period
    });
  };

  const calculateFocusHoursLeaderboard = (sessions: Tables<'sessions'>[], period: 'week' | 'month' | 'all'): LeaderboardEntry[] => {
    const filteredSessions = filterSessionsByTimePeriod(sessions, period);
    const userFocusTimes: { [userId: string]: number } = {};

    filteredSessions.forEach(session => {
      if (session.user_id) {
        userFocusTimes[session.user_id] = (userFocusTimes[session.user_id] || 0) + session.focus_duration_seconds;
      }
    });

    return Object.entries(userFocusTimes)
      .map(([userId, totalSeconds]) => ({
        id: userId,
        name: getUserName(userId),
        value: Math.round(totalSeconds / 3600), // Convert seconds to hours
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5
  };

  const calculateCollaboratedUsersLeaderboard = (sessions: Tables<'sessions'>[], period: 'week' | 'month' | 'all'): LeaderboardEntry[] => {
    const filteredSessions = filterSessionsByTimePeriod(sessions, period);
    const userCollaborations: { [userId: string]: Set<string> } = {}; // Use Set to count unique sessions with coworkers

    filteredSessions.forEach(session => {
      if (session.user_id && session.coworker_count > 0) {
        if (!userCollaborations[session.user_id]) {
          userCollaborations[session.user_id] = new Set();
        }
        userCollaborations[session.user_id].add(session.id); // Count each session with coworkers as a collaboration instance
      }
    });

    return Object.entries(userCollaborations)
      .map(([userId, sessionsSet]) => ({
        id: userId,
        name: getUserName(userId),
        value: sessionsSet.size, // Count of unique sessions with coworkers
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5
  };

  const currentFocusHoursLeaderboard = useMemo(() => 
    calculateFocusHoursLeaderboard(allLeaderboardSessions, leaderboardFocusTimePeriod), 
    [allLeaderboardSessions, leaderboardFocusTimePeriod, allProfiles]
  );

  const currentCollaboratedUsersLeaderboard = useMemo(() => 
    calculateCollaboratedUsersLeaderboard(allLeaderboardSessions, leaderboardCollaborationTimePeriod), 
    [allLeaderboardSessions, leaderboardCollaborationTimePeriod, allProfiles]
  );

  if (isLoadingSessions || isLoadingProfiles) {
    return (
      <main className="max-w-4xl mx-auto pt-16 px-4 pb-4 lg:pt-20 lg:px-6 lg:pb-6 text-center text-muted-foreground">
        Loading leaderboard...
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
            {currentFocusHoursLeaderboard.map((user, index) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg text-primary">{index + 1}.</span>
                  <p className="font-medium text-foreground">{user.name}</p>
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
            {currentCollaboratedUsersLeaderboard.map((user, index) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg text-primary">{index + 1}.</span>
                  <p className="font-medium text-foreground">{user.name}</p>
                </div>
                <p className="text-muted-foreground">{user.value} sessions</p>
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