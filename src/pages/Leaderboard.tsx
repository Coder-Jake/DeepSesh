import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Clock, Award, Gift } from "lucide-react";
import TimeFilterToggle from "@/components/TimeFilterToggle";
import { useMemo } from "react";
import { useTimer } from "@/contexts/TimerContext"; // Import useTimer
import { isWithinInterval, subWeeks, subMonths, parseISO } from 'date-fns';
import type { Tables } from "@/integrations/supabase/types"; // Import Tables type

type Session = Tables<'sessions'>;

const Leaderboard = () => {
  const { 
    leaderboardFocusTimePeriod, 
    setLeaderboardFocusTimePeriod, 
    leaderboardCollaborationTimePeriod, 
    setLeaderboardCollaborationTimePeriod,
    localSessionHistory
  } = useTimer(); // Use persistent states from context

  // Combine mock sessions with local sessions for calculations
  const allSessions: Session[] = useMemo(() => {
    // Convert mock sessions to the Tables<'sessions'> type for consistency
    const mockSessionsTyped: Session[] = [
      {
        id: "mock-1", title: "Deep Work Sprint", session_start_time: "2025-09-15T09:00:00Z", session_end_time: "2025-09-15T09:45:00Z",
        focus_duration_seconds: 45 * 60, break_duration_seconds: 0, total_session_seconds: 45 * 60,
        coworker_count: 3, notes: "Great session focusing on project documentation. Made significant progress on the API specs.",
        user_id: null, created_at: "2025-09-15T09:45:00Z"
      },
      {
        id: "mock-2", title: "Study Group Alpha", session_start_time: "2025-09-14T10:00:00Z", session_end_time: "2025-09-14T11:30:00Z",
        focus_duration_seconds: 90 * 60, break_duration_seconds: 0, total_session_seconds: 90 * 60,
        coworker_count: 5, notes: "Collaborative study session for the upcoming presentation. Everyone stayed focused and productive.",
        user_id: null, created_at: "2025-09-14T11:30:00Z"
      },
      {
        id: "mock-3", title: "Solo Focus", session_start_time: "2025-09-13T14:00:00Z", session_end_time: "2025-09-13T14:30:00Z",
        focus_duration_seconds: 30 * 60, break_duration_seconds: 0, total_session_seconds: 30 * 60,
        coworker_count: 1, notes: "Quick focused session to review quarterly goals and plan next steps.",
        user_id: null, created_at: "2025-09-13T14:30:00Z"
      },
      {
        id: "mock-4", title: "Coding Session", session_start_time: "2025-09-12T11:00:00Z", session_end_time: "2025-09-12T13:00:00Z",
        focus_duration_seconds: 120 * 60, break_duration_seconds: 0, total_session_seconds: 120 * 60,
        coworker_count: 2, notes: "Pair programming session working on the new user interface components. Fixed several bugs.",
        user_id: null, created_at: "2025-09-12T13:00:00Z"
      },
      {
        id: "mock-5", title: "Research Deep Dive", session_start_time: "2025-09-11T10:00:00Z", session_end_time: "2025-09-11T11:00:00Z",
        focus_duration_seconds: 60 * 60, break_duration_seconds: 0, total_session_seconds: 60 * 60,
        coworker_count: 4, notes: "Market research session for the new product launch. Gathered valuable competitive intelligence.",
        user_id: null, created_at: "2025-09-11T11:00:00Z"
      }
    ];
    return [...localSessionHistory, ...mockSessionsTyped];
  }, [localSessionHistory]);

  // Function to calculate user's stats for a given period
  const calculateUserStats = (sessions: Session[], period: 'week' | 'month' | 'all') => {
    const now = new Date();
    let startDate: Date;

    if (period === 'week') {
      startDate = subWeeks(now, 1);
    } else if (period === 'month') {
      startDate = subMonths(now, 1);
    } else {
      startDate = new Date(0); // All time
    }

    const filteredSessions = sessions.filter(session => 
      session.session_start_time && isWithinInterval(parseISO(session.session_start_time), { start: startDate, end: now })
    );

    const totalFocusSeconds = filteredSessions.reduce((sum, session) => sum + (session.focus_duration_seconds || 0), 0);
    const focusHours = Math.round(totalFocusSeconds / 3600);

    const uniqueCoworkers = new Set<string>();
    filteredSessions.forEach(session => {
      if (session.coworker_count && session.coworker_count > 0) {
        for (let i = 0; i < session.coworker_count; i++) {
          uniqueCoworkers.add(`${session.id}-coworker-${i}`);
        }
      }
    });
    const collaboratedUsers = uniqueCoworkers.size;

    return { focusHours, collaboratedUsers };
  };

  // Generate dynamic leaderboard data
  const generateLeaderboard = (period: 'week' | 'month' | 'all') => {
    const { focusHours: userFocusHours, collaboratedUsers: userCollaboratedUsers } = calculateUserStats(allSessions, period);

    const baseFocusData = {
      week: [
        { id: 1, name: "Angie", focusHours: 30 },
        { id: 2, name: "Bob", focusHours: 25 },
        { id: 3, name: "Charlie", focusHours: 20 },
        { id: 4, name: "Diana", focusHours: 18 },
      ],
      month: [
        { id: 1, name: "Angie", focusHours: 120 },
        { id: 2, name: "Bob", focusHours: 110 },
        { id: 3, name: "Diana", focusHours: 95 },
        { id: 4, name: "Charlie", focusHours: 80 },
      ],
      all: [
        { id: 1, name: "Angie", focusHours: 500 },
        { id: 2, name: "Bob", focusHours: 450 },
        { id: 3, name: "Charlie", focusHours: 400 },
        { id: 4, name: "Diana", focusHours: 350 },
      ],
    };

    const baseCollaborationData = {
      week: [
        { id: 1, name: "Angie", collaboratedUsers: 8 },
        { id: 2, name: "Frank", collaboratedUsers: 7 },
        { id: 3, name: "Grace", collaboratedUsers: 6 },
        { id: 4, name: "Heidi", collaboratedUsers: 4 }, 
      ],
      month: [
        { id: 1, name: "Angie", collaboratedUsers: 25 },
        { id: 2, name: "Liam", collaboratedUsers: 22 }, 
        { id: 3, name: "Mia", collaboratedUsers: 17 }, 
        { id: 4, name: "Noah", collaboratedUsers: 15 }, 
      ],
      all: [
        { id: 1, name: "Angie", collaboratedUsers: 100 },
        { id: 2, name: "Peter", collaboratedUsers: 90 }, 
        { id: 3, name: "Quinn", collaboratedUsers: 80 }, 
        { id: 4, name: "Rachel", collaboratedUsers: 70 }, 
      ],
    };

    // Merge user's data into focus leaderboard
    const focusLeaderboard = [...baseFocusData[period], { id: 99, name: "You", focusHours: userFocusHours }]
      .sort((a, b) => b.focusHours - a.focusHours)
      .slice(0, 5); // Keep top 5

    // Merge user's data into collaboration leaderboard
    const collaborationLeaderboard = [...baseCollaborationData[period], { id: 99, name: "You", collaboratedUsers: userCollaboratedUsers }]
      .sort((a, b) => b.collaboratedUsers - a.collaboratedUsers)
      .slice(0, 5); // Keep top 5

    return { focusLeaderboard, collaborationLeaderboard };
  };

  const { focusLeaderboard: currentFocusHoursLeaderboard, collaborationLeaderboard: currentCollaboratedUsersLeaderboard } = useMemo(() => {
    return generateLeaderboard(leaderboardFocusTimePeriod);
  }, [allSessions, leaderboardFocusTimePeriod]);

  const { collaborationLeaderboard: currentCollaborationLeaderboardForDisplay } = useMemo(() => {
    return generateLeaderboard(leaderboardCollaborationTimePeriod);
  }, [allSessions, leaderboardCollaborationTimePeriod]);

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
                <p className="text-muted-foreground">{user.focusHours} hours</p>
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
            {currentCollaborationLeaderboardForDisplay.map((user, index) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg text-primary">{index + 1}.</span>
                  <p className="font-medium text-foreground">{user.name}</p>
                </div>
                <p className="text-muted-foreground">{user.collaboratedUsers} users</p>
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