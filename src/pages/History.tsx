import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Calendar, FileText, Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import TimeFilterToggle from "@/components/TimeFilterToggle";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTimer } from "@/contexts/TimerContext"; // Import useTimer
import { Tables } from "@/integrations/supabase/types"; // Import Tables type

const History = () => {
  const { historyTimePeriod, setHistoryTimePeriod, localAnonymousSessions } = useTimer(); // Use persistent state from context

  // Sample data - KEEPING MOCK DATA
  const mockSessions = [
    {
      id: "mock-1",
      title: "Deep Work Sprint",
      session_start_time: "2025-09-15T10:00:00Z",
      total_session_seconds: 45 * 60,
      focus_duration_seconds: 45 * 60,
      break_duration_seconds: 0,
      coworker_count: 3,
      notes: "Great session focusing on project documentation. Made significant progress on the API specs.",
      user_id: null, // Mock sessions are not tied to a user
      created_at: "2025-09-15T10:00:00Z",
      session_end_time: "2025-09-15T10:45:00Z",
    },
    {
      id: "mock-2",
      title: "Study Group Alpha",
      session_start_time: "2025-09-14T14:00:00Z",
      total_session_seconds: 90 * 60,
      focus_duration_seconds: 90 * 60,
      break_duration_seconds: 0,
      coworker_count: 5,
      notes: "Collaborative study session for the upcoming presentation. Everyone stayed focused and productive.",
      user_id: null,
      created_at: "2025-09-14T14:00:00Z",
      session_end_time: "2025-09-14T15:30:00Z",
    },
    {
      id: "mock-3",
      title: "Solo Focus",
      session_start_time: "2025-09-13T09:00:00Z",
      total_session_seconds: 30 * 60,
      focus_duration_seconds: 30 * 60,
      break_duration_seconds: 0,
      coworker_count: 1,
      notes: "Quick focused session to review quarterly goals and plan next steps.",
      user_id: null,
      created_at: "2025-09-13T09:00:00Z",
      session_end_time: "2025-09-13T09:30:00Z",
    },
    {
      id: "mock-4",
      title: "Coding Session",
      session_start_time: "2025-09-12T11:00:00Z",
      total_session_seconds: 120 * 60,
      focus_duration_seconds: 120 * 60,
      break_duration_seconds: 0,
      coworker_count: 2,
      notes: "Pair programming session working on the new user interface components. Fixed several bugs.",
      user_id: null,
      created_at: "2025-09-12T11:00:00Z",
      session_end_time: "2025-09-12T13:00:00Z",
    },
    {
      id: "mock-5",
      title: "Research Deep Dive",
      session_start_time: "2025-09-11T13:00:00Z",
      total_session_seconds: 60 * 60,
      focus_duration_seconds: 60 * 60,
      break_duration_seconds: 0,
      coworker_count: 4,
      notes: "Market research session for the new product launch. Gathered valuable competitive intelligence.",
      user_id: null,
      created_at: "2025-09-11T13:00:00Z",
      session_end_time: "2025-09-11T14:00:00Z",
    }
  ];

  // Combine mock sessions with local anonymous sessions
  const allSessions: Tables<'sessions'>[] = useMemo(() => {
    // Filter out any local sessions that might have the same ID as mock sessions if that were a concern,
    // but for now, just combine.
    return [...mockSessions, ...localAnonymousSessions];
  }, [mockSessions, localAnonymousSessions]);

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

  // Dynamically calculate stats based on filtered sessions
  const currentStats = useMemo(() => {
    const filteredByTime = filterSessionsByTimePeriod(allSessions, historyTimePeriod);

    const totalFocusSeconds = filteredByTime.reduce((sum, session) => sum + (session.focus_duration_seconds || 0), 0);
    const totalFocusTime = `${Math.floor(totalFocusSeconds / 3600)}h ${Math.floor((totalFocusSeconds % 3600) / 60)}m`;
    const sessionsCompleted = filteredByTime.length;
    
    // For unique coworkers, we'll just count sessions with >1 coworker for now,
    // as actual unique coworker IDs would require more complex data.
    const uniqueCoworkers = new Set(filteredByTime.filter(s => (s.coworker_count || 0) > 0).map(s => s.id)).size; // Placeholder for unique coworkers

    // Ranks are still mock for now as there's no global data to compare against
    const focusRank = "N/A"; 
    const coworkerRank = "N/A";

    return {
      totalFocusTime,
      sessionsCompleted,
      uniqueCoworkers,
      focusRank,
      coworkerRank,
    };
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
      (session.notes?.toLowerCase().includes(lowerCaseQuery) ?? false)
    );
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
                            {`${Math.floor((session.total_session_seconds || 0) / 60)} mins`}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users size={14} />
                            {session.coworker_count} Coworker{session.coworker_count !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary">Focus</Badge> {/* Assuming all saved sessions are focus for now */}
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