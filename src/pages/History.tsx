import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Calendar, FileText, Search, X } from "lucide-react"; // Import Search and X icons
import { Link } from "react-router-dom";
import TimeFilterToggle from "@/components/TimeFilterToggle";
import { useState, useMemo } from "react"; // Import useMemo
import { Input } from "@/components/ui/input"; // Import Input component
import { Button } from "@/components/ui/button"; // Import Button component

const History = () => {
  // Sample data - in a real app this would come from a database
  const sessions = [
    {
      id: 1,
      title: "Deep Work Sprint",
      date: "2025-09-15",
      duration: "45 mins",
      participants: 3,
      type: "focus",
      notes: "Great session focusing on project documentation. Made significant progress on the API specs."
    },
    {
      id: 2,
      title: "Study Group Alpha",
      date: "2025-09-14",
      duration: "90 mins",
      participants: 5,
      type: "focus",
      notes: "Collaborative study session for the upcoming presentation. Everyone stayed focused and productive."
    },
    {
      id: 3,
      title: "Solo Focus",
      date: "2025-09-13",
      duration: "30 mins",
      participants: 1,
      type: "focus",
      notes: "Quick focused session to review quarterly goals and plan next steps."
    },
    {
      id: 4,
      title: "Coding Session",
      date: "2025-09-12",
      duration: "120 mins",
      participants: 2,
      type: "focus",
      notes: "Pair programming session working on the new user interface components. Fixed several bugs."
    },
    {
      id: 5,
      title: "Research Deep Dive",
      date: "2025-09-11",
      duration: "60 mins",
      participants: 4,
      type: "focus",
      notes: "Market research session for the new product launch. Gathered valuable competitive intelligence."
    }
  ];

  // Sample stats data for different time periods
  const statsData = {
    week: {
      totalFocusTime: "16h 45m",
      sessionsCompleted: 5,
      uniqueCoworkers: 8,
      focusRank: "3rd",
      coworkerRank: "4th",
    },
    month: {
      totalFocusTime: "65h 30m",
      sessionsCompleted: 22,
      uniqueCoworkers: 15,
      focusRank: "5th",
      coworkerRank: "3rd",
    },
    all: {
      totalFocusTime: "240h 15m",
      sessionsCompleted: 80,
      uniqueCoworkers: 30,
      focusRank: "4th",
      coworkerRank: "5th",
    },
  };

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

  // Get current stats based on selected time period
  const currentStats = statsData[historyTimePeriod];

  // Filtered sessions based on search query
  const filteredSessions = useMemo(() => {
    if (!searchQuery) {
      return sessions;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    return sessions.filter(session => 
      session.title.toLowerCase().includes(lowerCaseQuery) ||
      session.notes.toLowerCase().includes(lowerCaseQuery)
    );
  }, [sessions, searchQuery]);

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
                            {formatDate(session.date)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            {session.duration}
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