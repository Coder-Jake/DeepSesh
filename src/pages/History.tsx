import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Calendar, FileText, Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import TimeFilterToggle from "@/components/TimeFilterToggle";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTimer } from "@/contexts/TimerContext"; // Import useTimer
import { isWithinInterval, subWeeks, subMonths, parseISO } from 'date-fns';
import type { Tables } from "@/integrations/supabase/types"; // Import Tables type

type Session = Tables<'sessions'>;

const History = () => {
  const { historyTimePeriod, setHistoryTimePeriod, localSessionHistory } = useTimer(); // Use persistent state from context

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Function to calculate stats based on sessions and time period
  const calculateStats = (sessions: Session[], period: 'week' | 'month' | 'all') => {
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
    const totalFocusHours = (totalFocusSeconds / 3600).toFixed(1);
    const sessionsCompleted = filteredSessions.length;
    
    const uniqueCoworkers = new Set<string>();
    filteredSessions.forEach(session => {
      // For local sessions, coworker_count is a simple number.
      // For mock data, we'll just use the number directly.
      // In a real scenario with actual coworker IDs, we'd add unique IDs to the set.
      if (session.coworker_count && session.coworker_count > 0) {
        // For simplicity, if a session had N coworkers, we count N unique coworkers for that session.
        // This is a simplification for mock data; real implementation would track actual unique user IDs.
        for (let i = 0; i < session.coworker_count; i++) {
          uniqueCoworkers.add(`${session.id}-coworker-${i}`);
        }
      }
    });

    // Mock ranks (these would come from a global leaderboard in a real app)
    const focusRank = period === 'week' ? "3rd" : (period === 'month' ? "5th" : "4th");
    const coworkerRank = period === 'week' ? "4th" : (period === 'month' ? "3rd" : "5th");

    return {
      totalFocusTime: `${totalFocusHours}h`,
      sessionsCompleted: sessionsCompleted,
      uniqueCoworkers: uniqueCoworkers.size,
      focusRank: focusRank,
      coworkerRank: coworkerRank,
    };
  };

  // Combine mock sessions with local sessions
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
    return [...localSessionHistory, ...mockSessionsTyped].sort((a, b) => 
      parseISO(b.session_start_time).getTime() - parseISO(a.session_start_time).getTime()
    );
  }, [localSessionHistory]);

  // Get current stats based on selected time period
  const currentStats = useMemo(() => calculateStats(allSessions, historyTimePeriod), [allSessions, historyTimePeriod]);

  // Filtered sessions based on search query and time period
  const filteredAndTimedSessions = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    if (historyTimePeriod === 'week') {
      startDate = subWeeks(now, 1);
    } else if (historyTimePeriod === 'month') {
      startDate = subMonths(now, 1);
    } else {
      startDate = new Date(0); // All time
    }

    return allSessions.filter(session => {
      const sessionDate = parseISO(session.session_start_time);
      const matchesTimePeriod = isWithinInterval(sessionDate, { start: startDate, end: now });
      const matchesSearch = searchQuery 
        ? (session.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           session.notes?.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;
      return matchesTimePeriod && matchesSearch;
    });
  }, [allSessions, historyTimePeriod, searchQuery]);

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
            
            {filteredAndTimedSessions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No sessions found matching your criteria.</p>
            ) : (
              filteredAndTimedSessions.map((session) => (
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
                            {session.total_session_seconds ? `${Math.round(session.total_session_seconds / 60)} mins` : 'N/A'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users size={14} />
                            {session.coworker_count} Coworker{session.coworker_count !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary">{session.focus_duration_seconds > session.break_duration_seconds ? 'focus' : 'break'}</Badge>
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