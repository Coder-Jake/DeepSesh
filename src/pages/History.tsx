import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Calendar, FileText, Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import TimeFilterToggle from "@/components/TimeFilterToggle";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const History = () => {
  // Sample data - in a real app this would come from a database
  const allSessions = [
    {
      id: 1,
      title: "Deep Work Sprint",
      date: "2024-07-25", // Recent
      duration: 45, // in minutes
      participants: 3,
      type: "focus",
      notes: "Great session focusing on project documentation. Made significant progress on the API specs."
    },
    {
      id: 2,
      title: "Study Group Alpha",
      date: "2024-07-20", // Recent
      duration: 90,
      participants: 5,
      type: "focus",
      notes: "Collaborative study session for the upcoming presentation. Everyone stayed focused and productive."
    },
    {
      id: 3,
      title: "Solo Focus",
      date: "2024-07-10", // Older (within month)
      duration: 30,
      participants: 1,
      type: "focus",
      notes: "Quick focused session to review quarterly goals and plan next steps."
    },
    {
      id: 4,
      title: "Coding Session",
      date: "2024-06-28", // Older (within month)
      duration: 120,
      participants: 2,
      type: "focus",
      notes: "Pair programming session working on the new user interface components. Fixed several bugs."
    },
    {
      id: 5,
      title: "Research Deep Dive",
      date: "2024-05-15", // Much older
      duration: 60,
      participants: 4,
      type: "focus",
      notes: "Market research session for the new product launch. Gathered valuable competitive intelligence."
    },
    {
      id: 6,
      title: "Project Planning",
      date: "2024-07-22", // Recent
      duration: 75,
      participants: 2,
      type: "focus",
      notes: "Detailed planning for the next sprint. Defined user stories and acceptance criteria."
    },
    {
      id: 7,
      title: "Brainstorming Session",
      date: "2024-06-01", // Older
      duration: 60,
      participants: 6,
      type: "focus",
      notes: "Generated new ideas for marketing campaigns. Very productive and engaging."
    }
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const [historyTimePeriod, setHistoryTimePeriod] = useState<'week' | 'month' | 'all'>('all');
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filterSessions = (sessions: typeof allSessions, period: 'week' | 'month' | 'all') => {
    const now = new Date();
    return sessions.filter(session => {
      const sessionDate = new Date(session.date);
      if (period === 'week') {
        const one WeekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        return sessionDate >= one WeekAgo;
      } else if (period === 'month') {
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        return sessionDate >= oneMonthAgo;
      }
      return true; // 'all' period
    });
  };

  const filteredByTime = useMemo(() => {
    return filterSessions(allSessions, historyTimePeriod);
  }, [allSessions, historyTimePeriod]);

  // Filtered sessions based on search query
  const filteredSessions = useMemo(() => {
    if (!searchQuery) {
      return filteredByTime;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    return filteredByTime.filter(session => 
      session.title.toLowerCase().includes(lowerCaseQuery) ||
      session.notes.toLowerCase().includes(lowerCaseQuery)
    );
  }, [filteredByTime, searchQuery]);

  const totalFocusTime = useMemo(() => {
    const totalMinutes = filteredSessions.reduce((sum, session) => sum + session.duration, 0);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  }, [filteredSessions]);

  const uniqueCoworkers = useMemo(() => {
    const coworkerIds = new Set<number>();
    filteredSessions.forEach(session => {
      // Assuming 'participants' count is unique per session, but not across sessions
      // For a real app, you'd need a list of actual participant IDs per session
      // For this mock, we'll just sum up unique participants per session
      // A more accurate count would require participant IDs in the mock data
      if (session.participants > 1) { // Only count if it's a collaborative session
        for (let i = 0; i < session.participants; i++) {
          coworkerIds.add(session.id * 1000 + i); // Create unique mock IDs
        }
      }
    });
    // This is a simplified count. In a real app, you'd track actual unique user IDs.
    return filteredSessions.reduce((sum, session) => sum + (session.participants > 1 ? session.participants : 0), 0);
  }, [filteredSessions]);


  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">History</h1>
          <p className="text-muted-foreground mt-2">Review stats from past Seshs</p>
        </div>
        <TimeFilterToggle onValueChange={setHistoryTimePeriod} />
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
                      <p className="text-2xl font-bold">{totalFocusTime}</p>
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
                    <p className="text-2xl font-bold">{filteredSessions.length}</p>
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
                      <p className="text-2xl font-bold">{uniqueCoworkers}</p>
                      <p className="text-sm text-muted-foreground"> Unique Coworkers</p>
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
                            {formatDate(session.date)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            {session.duration} mins
                          </div>
                          <div className="flex items-center gap-1">
                            <Users size={14} />
                            {session.participants} Coworker{session.participants !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary">{session.type}</Badge>
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