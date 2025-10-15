import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Calendar, FileText, Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import TimeFilterToggle from "@/components/TimeFilterToggle";
import { useState, useMemo, useCallback } from "react"; // Added useCallback
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/contexts/ProfileContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const History = () => {
  const { historyTimePeriod, setHistoryTimePeriod, sessions, statsData } = useProfile();
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set()); // State to track expanded sessions

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const currentYear = new Date().getFullYear();
    const sessionYear = date.getFullYear();

    if (sessionYear !== currentYear) {
      return date.toLocaleDateString('en-US', { year: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Helper function to highlight text
  const highlightText = useCallback((text: string, query: string) => {
    if (!query || !text) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={index} className="bg-blue-200 dark:bg-blue-700 rounded px-0.5">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
  }, []);

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

  // Toggle expanded state for a session
  const handleToggleExpand = (sessionId: string) => {
    setExpandedSessions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  return (
    <main className="max-w-4xl mx-auto pt-16 px-6 pb-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">History</h1>
          <p className="text-muted-foreground mt-2">Review stats from past Sessions</p>
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
              <h2 className="text-xl font-semibold text-foreground">Sessions</h2>
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
                  onFocus={(e) => e.target.select()}
                />
              </div>
            )}
            
            {filteredSessions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No sessions found matching your search.</p>
            ) : (
              filteredSessions.map((session) => {
                const isSearchMatch = searchQuery && (
                  session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  session.notes.toLowerCase().includes(searchQuery.toLowerCase())
                );
                const isExpanded = expandedSessions.has(session.id.toString()) || isSearchMatch; // Convert id to string

                return (
                  <Card key={session.id} onClick={() => handleToggleExpand(session.id.toString())} className="cursor-pointer">
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
                      </div>
                    </CardHeader>
                    
                    {session.notes && isExpanded && ( // Conditionally render CardContent
                      <CardContent>
                        <div className="flex items-start gap-2">
                          <FileText size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-muted-foreground">
                            {highlightText(session.notes, searchQuery)}
                          </p>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </div>
        {/* Export link at the bottom */}
        <div className="mt-8 text-center">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-sm text-muted-foreground hover:underline cursor-default">
                  Export
                </p>
              </TooltipTrigger>
              <TooltipContent>
                <p>Activates after <Link to="/chip-in" className="text-blue-500 hover:underline">donation</Link></p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </main>
  );
};

export default History;