import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Calendar, FileText, Search, X, MessageSquarePlus, ThumbsUp, ThumbsDown, Minus, Circle, CheckSquare } from "lucide-react"; // Added poll icons
import { Link } from "react-router-dom";
import TimeFilterToggle from "@/components/TimeFilterToggle";
import { useState, useMemo, useCallback, useRef } from "react"; // Added useRef
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/contexts/ProfileContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"; // Import AlertDialog components
import { useToast } from "@/hooks/use-toast"; // Import useToast
import { Poll } from "@/types/timer"; // Import Poll type

const History = () => {
  const { historyTimePeriod, setHistoryTimePeriod, sessions, statsData, deleteSession } = useProfile(); // Destructure deleteSession
  const { toast } = useToast(); // Initialize useToast

  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [showDeleteIconForSessionId, setShowDeleteIconForSessionId] = useState<string | null>(null); // State to track which session's delete icon is visible
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false); // State for delete confirmation dialog
  const [sessionToDeleteId, setSessionToDeleteId] = useState<string | null>(null); // State to hold the ID of the session to be deleted

  // Long press refs for the delete icon
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);
  const LONG_PRESS_DURATION = 500; // milliseconds

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
      session.notes.toLowerCase().includes(lowerCaseQuery) ||
      (session.polls && session.polls.some(poll => 
        poll.question.toLowerCase().includes(lowerCaseQuery) ||
        poll.options.some(option => option.text.toLowerCase().includes(lowerCaseQuery))
      ))
    );
  }, [sessions, searchQuery]);

  // Toggle expanded state for a session AND show/hide delete icon
  const handleCardClick = (sessionId: string) => {
    handleToggleExpand(sessionId); // Toggle notes visibility
    setShowDeleteIconForSessionId(prevId => (prevId === sessionId ? null : sessionId)); // Toggle delete icon visibility
  };

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

  // Long press handlers for the delete icon
  const handleDeleteLongPressStart = useCallback((sessionId: string) => {
    isLongPress.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPress.current = true;
      setSessionToDeleteId(sessionId);
      setIsDeleteDialogOpen(true); // Open dialog on long press
    }, LONG_PRESS_DURATION);
  }, []);

  const handleDeleteLongPressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    isLongPress.current = false;
  }, []);

  const handleDeleteClick = useCallback((e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation(); // Prevent card click from being triggered
    if (!isLongPress.current) {
      // If it was a short click, just toggle the delete icon visibility
      setShowDeleteIconForSessionId(prevId => (prevId === sessionId ? null : sessionId));
    }
  }, []);

  const confirmDeleteSession = useCallback(async () => {
    if (sessionToDeleteId) {
      await deleteSession(sessionToDeleteId);
      toast({
        title: "Session Deleted",
        description: "The session has been removed from your history.",
      });
      setSessionToDeleteId(null);
      setIsDeleteDialogOpen(false);
      setShowDeleteIconForSessionId(null); // Hide the delete icon after deletion
    }
  }, [sessionToDeleteId, deleteSession, toast]);

  return (
    <>
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
                    </div >
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
                    <Card key={session.id} onClick={() => handleCardClick(session.id.toString())} className="cursor-pointer relative"> {/* Added relative positioning */}
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
                      
                      {isExpanded && ( // Conditionally render CardContent
                        <CardContent className="space-y-4"> {/* Added space-y-4 for spacing between notes and polls */}
                          {session.notes && (
                            <div className="flex items-start gap-2">
                              <FileText size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-muted-foreground">
                                {highlightText(session.notes, searchQuery)}
                              </p>
                            </div>
                          )}

                          {session.polls && session.polls.length > 0 && (
                            <div className="space-y-3 border-t border-border pt-4">
                              <h4 className="text-base font-semibold flex items-center gap-2">
                                <MessageSquarePlus size={16} className="text-primary" />
                                Polls during session:
                              </h4>
                              {session.polls.map((poll, pollIndex) => (
                                <div key={pollIndex} className="bg-muted/50 p-3 rounded-md space-y-2">
                                  <p className="font-medium text-sm">{highlightText(poll.question, searchQuery)}</p>
                                  <div className="space-y-1 text-sm text-muted-foreground">
                                    {poll.options.map((option, optionIndex) => {
                                      const totalVotes = option.votes.length;
                                      let IconComponent;
                                      if (poll.type === 'closed') {
                                        if (option.id === 'closed-yes') IconComponent = ThumbsUp;
                                        else if (option.id === 'closed-no') IconComponent = ThumbsDown;
                                        else if (option.id === 'closed-dont-mind') IconComponent = Minus;
                                      } else if (poll.type === 'choice') {
                                        IconComponent = Circle;
                                      } else if (poll.type === 'selection') {
                                        IconComponent = CheckSquare;
                                      }

                                      return (
                                        <div key={optionIndex} className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            {IconComponent && <IconComponent size={14} className="text-muted-foreground" />}
                                            <span>{highlightText(option.text, searchQuery)}</span>
                                          </div>
                                          <Badge variant="secondary">{totalVotes} votes</Badge>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  {poll.allowCustomResponses && (
                                    <p className="text-xs text-muted-foreground italic mt-2">
                                      (Custom responses were allowed)
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      )}

                      {/* FileText Icon (bottom right) */}
                      {session.notes && !isExpanded && (
                        <FileText 
                          size={16} 
                          className="absolute bottom-2 right-2 text-muted-foreground" 
                          aria-label="Session has notes"
                        />
                      )}

                      {/* Delete Icon (X) */}
                      {showDeleteIconForSessionId === session.id.toString() && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive"
                          onMouseDown={(e) => handleDeleteLongPressStart(session.id.toString())}
                          onMouseUp={handleDeleteLongPressEnd}
                          onMouseLeave={handleDeleteLongPressEnd}
                          onTouchStart={(e) => handleDeleteLongPressStart(session.id.toString())}
                          onTouchEnd={handleDeleteLongPressEnd}
                          onClick={(e) => handleDeleteClick(e, session.id.toString())}
                          aria-label="Delete session"
                        >
                          <X className="h-4 w-4" />
                        </Button>
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your session from your history.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteSession}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </>
  );
};

export default History;