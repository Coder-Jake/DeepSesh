import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Calendar, FileText, Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import TimeFilterToggle from "@/components/TimeFilterToggle";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface HistorySession {
  id: number;
  title: string;
  createdAt: Date; // Use Date object for easier comparison
  durationMinutes: number; // Store duration in minutes
  participantsCount: number;
  type: "focus" | "break";
  notes: string;
  participantIds: number[]; // To count unique coworkers
}

// Helper to parse duration string (if needed, but we'll use durationMinutes directly)
const parseDuration = (durationStr: string): number => {
  const match = durationStr.match(/(\d+)\s*mins?/);
  return match ? parseInt(match[1], 10) : 0;
};

// Sample data - in a real app this would come from a database
const allHistorySessions: HistorySession[] = [
  {
    id: 1,
    title: "Deep Work Sprint",
    createdAt: new Date("2024-07-28T10:00:00Z"), // Recent
    durationMinutes: 45,
    participantsCount: 3,
    type: "focus",
    notes: "Great session focusing on project documentation. Made significant progress on the API specs.",
    participantIds: [101, 102, 103]
  },
  {
    id: 2,
    title: "Study Group Alpha",
    createdAt: new Date("2024-07-27T14:30:00Z"), // Recent
    durationMinutes: 90,
    participantsCount: 5,
    type: "focus",
    notes: "Collaborative study session for the upcoming presentation. Everyone stayed focused and productive.",
    participantIds: [101, 104, 105, 106, 107]
  },
  {
    id: 3,
    title: "Solo Focus",
    createdAt: new Date("2024-07-26T09:00:00Z"), // Recent
    durationMinutes: 30,
    participantsCount: 1,
    type: "focus",
    notes: "Quick focused session to review quarterly goals and plan next steps.",
    participantIds: [108]
  },
  {
    id: 4,
    title: "Coding Session",
    createdAt: new Date("2024-07-20T16:00:00Z"), // Last week
    durationMinutes: 120,
    participantsCount: 2,
    type: "focus",
    notes: "Pair programming session working on the new user interface components. Fixed several bugs.",
    participantIds: [109, 110]
  },
  {
    id: 5,
    title: "Research Deep Dive",
    createdAt: new Date("2024-07-15T11:00:00Z"), // Last month
    durationMinutes: 60,
    participantsCount: 4,
    type: "focus",
    notes: "Market research session for the new product launch. Gathered valuable competitive intelligence.",
    participantIds: [101, 111, 112, 113]
  },
  {
    id: 6,
    title: "Project Planning",
    createdAt: new Date("2024-06-25T13:00:00Z"), // Older
    durationMinutes: 75,
    participantsCount: 3,
    type: "focus",
    notes: "Initial planning for Q3 initiatives. Defined key milestones and responsibilities.",
    participantIds: [102, 103, 109]
  },
  {
    id: 7,
    title: "Brainstorming Session",
    createdAt: new Date("2024-06-10T10:00:00Z"), // Even older
    durationMinutes: 60,
    participantsCount: 6,
    type: "focus",
    notes: "Generated new ideas for marketing campaigns. Lots of creative input from the team.",
    participantIds: [104, 105, 106, 110, 111, 112]
  }
];

const filterHistorySessions = (sessions: HistorySession[], period: 'week' | 'month' | 'all'): HistorySession[] => {
  const now = new Date();
  let filterDate = new Date(now);

  if (period === 'week') {
    filterDate.setDate(now.getDate() - 7);
  } else if (period === 'month') {
    filterDate.setMonth(now.getMonth() - 1);
  } else {
    return sessions; // 'all' period
  }

  return sessions.filter(session => session.createdAt >= filterDate);
};

const calculateTotalFocusTime = (sessions: HistorySession[]): string => {
  const totalMinutes = sessions.reduce((sum, session) => sum + session.durationMinutes, 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
};

const calculateUniqueCoworkers = (sessions: HistorySession[]): number => {
  const uniqueIds = new Set<number>();
  sessions.forEach(session => {
    session.participantIds.forEach(id => uniqueIds.add(id));
  });
  return uniqueIds.size;
};

const History = () => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const [historyTimePeriod, setHistoryTimePeriod] = useState<'week' | 'month' | 'all'>('all');
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredByTimeSessions = useMemo(() => {
    return filterHistorySessions(allHistorySessions, historyTimePeriod);
  }, [allHistorySessions, historyTimePeriod]);

  const filteredSessions = useMemo(() => {
    if (!searchQuery) {
      return filteredByTimeSessions;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    return filteredByTimeSessions.filter(session => 
      session.title.toLowerCase().includes(lowerCaseQuery) ||
      session.notes.toLowerCase().includes(lowerCaseQuery)
    );
  }, [filteredByTimeSessions, searchQuery]);

  const totalFocusTime = useMemo(() => calculateTotalFocusTime(filteredSessions), [filteredSessions]);
  const sessionsCompleted = useMemo(() => filteredSessions.length, [filteredSessions]);
  const uniqueCoworkers = useMemo(() => calculateUniqueCoworkers(filteredSessions), [filteredSessions]);

  return (
    <main className="max-w-4xl mx-auto p-6">
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
                    <p className="text-2xl font-bold">{sessionsCompleted}</p>
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
              <p className="text-muted-foreground text-center py-8">No sessions found matching your criteria.</p>
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
                            {formatDate(session.createdAt)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            {session.durationMinutes} mins
                          </div>
                          <div className="flex items-center gap-1">
                            <Users size={14} />
                            {session.participantsCount} Coworker{session.participantsCount !== 1 ? 's' : ''}
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