import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Calendar, FileText, Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import TimeFilterToggle from "@/components/TimeFilterToggle";
import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTimer } from "@/contexts/TimerContext"; // Import useTimer
import { useProfile } from "@/contexts/ProfileContext"; // Import useProfile
import { supabase } from "@/integrations/supabase/client"; // Import supabase client
import { Tables } from "@/integrations/supabase/types"; // Import Tables type
import { useQuery } from "@tanstack/react-query"; // Import useQuery

const History = () => {
  const { 
    historyTimePeriod, 
    setHistoryTimePeriod, 
    anonymousSessions, // Get anonymous sessions from context
    formatTime // Get formatTime from context
  } = useTimer();
  const { profile } = useProfile();
  const userId = profile?.id;

  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch authenticated sessions from Supabase
  const { data: authenticatedSessions = [], isLoading: isLoadingAuthSessions } = useQuery<Tables<'sessions'>[]>({
    queryKey: ['userSessions', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .order('session_start_time', { ascending: false });
      
      if (error) {
        console.error("Error fetching authenticated sessions:", error);
        return [];
      }
      return data;
    },
    enabled: !!userId, // Only run query if userId exists
  });

  // Combine authenticated and anonymous sessions
  const allSessions = useMemo(() => {
    const combined = [...authenticatedSessions, ...anonymousSessions];
    // Sort by session_start_time in descending order
    return combined.sort((a, b) => new Date(b.session_start_time).getTime() - new Date(a.session_start_time).getTime());
  }, [authenticatedSessions, anonymousSessions]);

  const filterSessionsByTimePeriod = (sessions: Tables<'sessions'>[], period: 'week' | 'month' | 'all') => {
    const now = new Date();
    return sessions.filter(session => {
      const sessionDate = new Date(session.session_start_time);
      if (period === 'week') {
        const one WeekAgo = new Date(now.setDate(now.getDate() - 7));
        return sessionDate >= one WeekAgo;
      } else if (period === 'month') {
        const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));
        return sessionDate >= oneMonthAgo;
      }
      return true; // 'all' time period
    });
  };

  // Calculate stats dynamically based on filtered sessions
  const calculateStats = (sessions: Tables<'sessions'>[]) => {
    let totalFocusSeconds = 0;
    let sessionsCompleted = 0;
    const uniqueCoworkers = new Set<string>(); // Using string for simplicity, could be UUIDs

    sessions.forEach(session => {
      totalFocusSeconds += session.focus_duration_seconds;
      sessionsCompleted++;
      if (session.coworker_count > 0) {
        // For simplicity, we'll just count the session as having coworkers
        // A more robust solution would track unique coworker IDs if available
        uniqueCoworkers.add(session.id + '-coworked'); // Use session ID to represent a unique coworker instance
      }
    });

    const totalFocusTimeHours = Math.floor(totalFocusSeconds / 3600);
    const totalFocusTimeMinutes = Math.round((totalFocusSeconds % 3600) / 60);

    return {
      totalFocusTime: `${totalFocusTimeHours}h ${totalFocusTimeMinutes}m`,
      sessionsCompleted,
      uniqueCoworkers: uniqueCoworkers.size,
      focusRank: "N/A", // Ranks are for global leaderboard, not personal stats
      coworkerRank: "N/A",
    };
  };

  const currentStats = useMemo(() => {
    const filteredByTime = filterSessionsByTimePeriod(allSessions, historyTimePeriod);
    return calculateStats(filteredByTime);
  }, [allSessions, historyTimePeriod]);

  // Filtered sessions based on search query
  const filteredSessions = useMemo(() => {
    const sessionsByTime = filterSessionsByTimePeriod(allSessions, historyTimePeriod);
    if (!searchQuery) {
      return sessionsByTime;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    return sessionsByTime.filter(session => 
      session.title.toLowerCase().includes(lowerCaseQuery) ||
      (session.notes && session.notes.toLowerCase().includes(lowerCaseQuery))
    );
  }, [allSessions, historyTimePeriod, searchQuery]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (isLoadingAuthSessions) {
    return (
      <main className="max-w-4xl mx-auto pt-16 px-6 pb-6 text-center text-muted-foreground">
        Loading history...
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
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{currentStats.totalFocusTime}</p>
                    <p className="text-sm text-muted-foreground">Total Focus Time</p>
                    {/* <p className="text-xs text-muted-foreground">Rank: {currentStats.focusRank}</p> */}
                  </div>
                </div>
              </CardContent>
            </Card>
            
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
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{currentStats.uniqueCoworkers}</p>
                    <p className="text-sm text-muted-foreground"> Unique Coworkers</p>
                    {/* <p className="text-xs text-muted-foreground">Rank: {currentStats.coworkerRank}</p> */}
                  </div>
                </div>
              </CardContent>
            </Card>
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
                            {formatTime(session.total_session_seconds)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users size={14} />
                            {session.coworker_count} Coworker{session.coworker_count !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary">{session.focus_duration_seconds > session.break_duration_seconds ? 'Focus' : 'Break'}</Badge>
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