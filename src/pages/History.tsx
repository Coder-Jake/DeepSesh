import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Calendar, FileText, Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import TimeFilterToggle from "@/components/TimeFilterToggle";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTimer } from "@/contexts/TimerContext";
import { Tables } from "@/integrations/supabase/types";

const History = () => {
  const { localSessions, historyTimePeriod, setHistoryTimePeriod, formatTime } = useTimer();

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

  const filterAndCalculateStats = (sessions: Tables<'sessions'>[], period: 'week' | 'month' | 'all') => {
    const now = new Date();
    let filteredSessions = sessions;

    if (period === 'week') {
      const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));
      filteredSessions = sessions.filter(s => new Date(s.session_start_time) >= oneWeekAgo);
    } else if (period === 'month') {
      const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));
      filteredSessions = sessions.filter(s => new Date(s.session_start_time) >= oneMonthAgo);
    }

    const totalFocusSeconds = filteredSessions.reduce((sum, s) => sum + s.focus_duration_seconds, 0);
    const sessionsCompleted = filteredSessions.length;
    const sessionsWithCoworkers = filteredSessions.filter(s => s.coworker_count > 0).length;

    return {
      totalFocusTime: formatTime(totalFocusSeconds),
      sessionsCompleted,
      sessionsWithCoworkers,
    };
  };

  const currentStats = useMemo(() => filterAndCalculateStats(localSessions, historyTimePeriod), [localSessions, historyTimePeriod]);

  const filteredSessions = useMemo(() => {
    if (!searchQuery) {
      return localSessions;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    return localSessions.filter(session => 
      session.title.toLowerCase().includes(lowerCaseQuery) ||
      (session.notes && session.notes.toLowerCase().includes(lowerCaseQuery))
    );
  }, [localSessions, searchQuery]);

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
                      <p className="text-2xl font-bold">{currentStats.sessionsWithCoworkers}</p>
                      <p className="text-sm text-muted-foreground"> Collaborative Sessions</p>
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
                            {formatTime(session.total_session_seconds)}
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