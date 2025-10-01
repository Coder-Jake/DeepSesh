import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Clock, Award, Gift } from "lucide-react";
import TimeFilterToggle from "@/components/TimeFilterToggle";
import { useMemo } from "react";
import { useTimer } from "@/contexts/TimerContext"; // Import useTimer
import { Tables } from "@/integrations/supabase/types"; // Import Tables type

const Leaderboard = () => {
  const { 
    leaderboardFocusTimePeriod, 
    setLeaderboardFocusTimePeriod, 
    leaderboardCollaborationTimePeriod, 
    setLeaderboardCollaborationTimePeriod,
    localAnonymousSessions
  } = useTimer(); // Use persistent states from context

  // For now, we'll use localAnonymousSessions. In a real app, this would be combined with Supabase data.
  const allSessions: Tables<'sessions'>[] = localAnonymousSessions;

  // Helper to filter sessions by time period
  const filterSessionsByTimePeriod = (sessions: Tables<'sessions'>[], period: 'week' | 'month' | 'all') => {
    const now = new Date();
    return sessions.filter(session => {
      const sessionDate = new Date(session.session_start_time);
      if (period === 'all') return true;

      const diffTime = Math.abs(now.getTime() - sessionDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (period === 'week') {
        return diffDays <= 7;
      }
      if (period === 'month') {
        return diffDays <= 30;
      }
      return true;
    });
  };

  // Calculate "Your" stats dynamically
  const yourStats = useMemo(() => {
    const filteredByFocusTime = filterSessionsByTimePeriod(allSessions, leaderboardFocusTimePeriod);
    const filteredByCollaborationTime = filterSessionsByTimePeriod(allSessions, leaderboardCollaborationTimePeriod);

    const yourFocusHours = Math.floor(filteredByFocusTime.reduce((sum, session) => sum + (session.focus_duration_seconds || 0), 0) / 3600);
    const yourCollaboratedUsers = new Set(filteredByCollaborationTime.filter(s => s.coworker_count > 0).map(s => s.id)).size; // Placeholder for unique coworkers

    return {
      focusHours: yourFocusHours,
      collaboratedUsers: yourCollaboratedUsers,
    };
  }, [allSessions, leaderboardFocusTimePeriod, leaderboardCollaborationTimePeriod]);

  // Sample data for Focus Hours Leaderboard, categorized by time period
  const focusHoursLeaderboardData = {
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

  // Sample data for Collaborated Users Leaderboard, categorized by time period
  const collaboratedUsersLeaderboardData = {
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

  // Get the data for the currently selected time period and insert "You"
  const currentFocusHoursLeaderboard = useMemo(() => {
    const data = [...focusHoursLeaderboardData[leaderboardFocusTimePeriod]];
    const yourEntry = { id: 99, name: "You", focusHours: yourStats.focusHours };
    
    // Find the correct position for "You"
    let inserted = false;
    for (let i = 0; i < data.length; i++) {
      if (yourEntry.focusHours >= data[i].focusHours) {
        data.splice(i, 0, yourEntry);
        inserted = true;
        break;
      }
    }
    if (!inserted) {
      data.push(yourEntry);
    }
    return data;
  }, [leaderboardFocusTimePeriod, yourStats.focusHours]);

  const currentCollaboratedUsersLeaderboard = useMemo(() => {
    const data = [...collaboratedUsersLeaderboardData[leaderboardCollaborationTimePeriod]];
    const yourEntry = { id: 99, name: "You", collaboratedUsers: yourStats.collaboratedUsers };

    // Find the correct position for "You"
    let inserted = false;
    for (let i = 0; i < data.length; i++) {
      if (yourEntry.collaboratedUsers >= data[i].collaboratedUsers) {
        data.splice(i, 0, yourEntry);
        inserted = true;
        break;
      }
    }
    if (!inserted) {
      data.push(yourEntry);
    }
    return data;
  }, [leaderboardCollaborationTimePeriod, yourStats.collaboratedUsers]);

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
            {currentCollaboratedUsersLeaderboard.map((user, index) => (
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