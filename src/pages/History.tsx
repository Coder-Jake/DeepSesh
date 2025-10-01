import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Calendar, FileText, Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import TimeFilterToggle from "@/components/TimeFilterToggle";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTimer } from "@/contexts/TimerContext";
import { useProfile } from "@/contexts/ProfileContext"; // Import useProfile
import { supabase } from "@/integrations/supabase/client"; // Import supabase client
import { Tables } from "@/integrations/supabase/types"; // Import Supabase types
import { useQuery } from "@tanstack/react-query"; // Import useQuery

type Session = Tables<'sessions'>;
type Profile = Tables<'profiles'>;

const History = () => {
  const { historyTimePeriod, setHistoryTimePeriod } = useTimer();
  const { profile } = useProfile(); // Get current user's profile

  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchUserSessions = async (userId: string, timePeriod: 'week' | 'month' | 'all') => {
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

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('session_start_time', startDate.toISOString())
      .order('session_start_time', { ascending: false });

    if (error) {
      console.error("Error fetching sessions:", error);
      return [];
    }
    return data;
  };

  const { data: sessions = [], isLoading, error } = useQuery<Session[], Error>({
    queryKey: ['historySessions', historyTimePeriod, profile?.id],
    queryFn: () => fetchUserSessions(profile!.id, historyTimePeriod),
    enabled: !!profile?.id, // Only run query if user ID is available
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Dynamically calculate stats based on fetched sessions
  const currentStats = useMemo(() => {
    let totalFocusSeconds = 0;
    let sessionsCompleted = sessions.length;
    const uniqueCoworkers = new Set<string>(); // In a real app, this would track actual coworker IDs

    sessions.forEach(session => {
      totalFocusSeconds += session.focus_duration_seconds;
      // For demo, coworker_count is directly from session. In real app, would aggregate from participants
      if (session.coworker_count > 0) {
        // This is a placeholder. Real unique coworker tracking would involve a separate table or more complex logic.
        // For now, we'll just count sessions with coworkers as contributing to "unique coworkers" for simplicity.
        // A better approach would be to have a `session_participants` table.
        uniqueCoworkers.add(session.id); // Using session ID as a proxy for unique coworker interaction
      }
    });

    const totalFocusTimeHours = Math.floor(totalFocusSeconds / 3600);
    const totalFocusTimeMinutes = Math.floor((totalFocusSeconds % 3600) / 60);

    return {
      totalFocusTime: `${totalFocusTimeHours}h ${totalFocusTimeMinutes}m`,
      sessionsCompleted,
      uniqueCoworkers: uniqueCoworkers.size,
      focusRank: "N/A", // Placeholder, real ranking requires global data
      coworkerRank: "N/A", // Placeholder, real ranking requires global data
    };
  }, [sessions]);

  // Filtered sessions based on search query
  const filteredSessions = useMemo(() => {
    if (!searchQuery) {
      return sessions;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    return sessions.filter(session => 
      session.title.toLowerCase().includes(lowerCaseQuery) ||
      (session.notes && session.notes.toLowerCase().includes(lowerCaseQuery))
    );
  }, [sessions, searchQuery]);

  if (isLoading) {
    return (
      <main className="max-w-4xl mx-auto pt-16 px-6 pb-6 text-center text-muted-foreground">
        Loading history...
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-4xl mx-auto pt-16 px-6 pb-6 text-center text-destructive">
        Error loading history: {error.message}
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto pt-16 px-6 pb-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">History</h1>
          <p className="text-muted-foreground mt-2">Review stats from past Seshs</p>
        </div>
        <TimeFilterToggle onValueChange={setHistoryTimePeriod} defaultValue={historyTimePeriod} />
      </div>
        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Link to="/leaderboard#focus-hours-leaderboard" className="block hover:opacity-80 transition-opacity">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{currentStats.totalFocusTime}</p>
                      <p className="text-sm text-muted-foreground">Total Focus Time</p>
                      <p className="text-xs text-muted-foreground">Rank: {currentStats.focusRank}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{currentStats.sessionsCompleted}</p>
                    <p className="text-sm text-muted-foreground">Sessions Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Link to="/leaderboard#collaborated-users-leaderboard" className="block hover:opacity-80 transition-opacity">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{currentStats.uniqueCoworkers}</p>
                      <p className="text-sm text-muted-foreground"> Unique Coworkers</p>
                      <p className="text-xs text-muted-foreground">Rank: {currentStats.coworkerRank}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Session List */}
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-semibold text-foreground">Recent Sessions</h2>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowSearchBar(!showSearchBar)}
                className="text-muted-foreground hover:text-foreground"
              >
                {showSearchBar ? <X size={20} /> : <Search size={20} />}
              </Button>
            </div>

            {showSearchBar && (
              <div className="mb-4">
                <Input
                  type="text"
                  placeholder="Search session notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
            )}
            
            {filteredSessions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No sessions found matching your search.</p>
            ) : (
              filteredSessions.map((session) => (
                <Card key={session.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{session.title}</CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            {formatDate(session.session_start_time)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            {Math.round(session.total_session_seconds / 60)} mins
                          </div>
                          <div className="flex items-center gap-1">
                            <Users size={14} />
                            {session.coworker_count} Coworker{session.coworker_count !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary">Focus: {Math.round(session.focus_duration_seconds / 60)}m</Badge>
                    </div>
                  </CardHeader>
                  
                  {session.notes && (
                    <CardContent>
                      <div className="flex items-start gap-2">
                        <FileText size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-muted-foreground">{session.notes}</p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
  );
};

export default History;