import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Calendar, FileText, Search, X, MessageSquarePlus, ThumbsUp, ThumbsDown, Minus, Circle, CheckSquare, PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import TimeFilterToggle from "@/components/TimeFilterToggle";
import { useState, useMemo, useCallback } from "react"; // Removed useRef
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
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Poll, ExtendSuggestion, ActiveAskItem } from "@/types/timer";
import { cn } from "@/lib/utils";

const History = () => {
  const { historyTimePeriod, setHistoryTimePeriod, sessions, statsData, deleteSession } = useProfile();
  const { toast } = useToast();

  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(() => new Set());
  const [showDeleteIconForSessionId, setShowDeleteIconForSessionId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sessionToDeleteId, setSessionToDeleteId] = useState<string | null>(null);

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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
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
      (session.asks && session.asks.some(ask => {
        if ('question' in ask) {
          return ask.question.toLowerCase().includes(lowerCaseQuery) ||
                 ask.options.some(option => option.text.toLowerCase().includes(lowerCaseQuery));
        } else if ('minutes' in ask) {
          return ask.creator.toLowerCase().includes(lowerCaseQuery) ||
                 `extend timer by ${ask.minutes} minutes`.toLowerCase().includes(lowerCaseQuery);
        }
        return false;
      }))
    );
  }, [sessions, searchQuery]);

  // Toggle expanded state for a session AND show/hide delete icon
  const handleCardClick = (sessionId: string) => {
    handleToggleExpand(sessionId);
    setShowDeleteIconForSessionId(prevId => (prevId === sessionId ? null : sessionId));
  };

  // Toggle expanded state for a session
  const handleToggleExpand = (sessionId: string) => {
    setExpandedSessions(prev => {
      const currentSet = prev instanceof Set ? prev : new Set<string>();
      const newSet = new Set(currentSet);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  // Direct click handler for delete icon
  const handleDeleteClick = useCallback((e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation(); // Prevent card click from being triggered
    setSessionToDeleteId(sessionId);
    setIsDeleteDialogOpen(true); // Open dialog directly
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
                  const isExpanded = expandedSessions.has(session.id.toString()) || isSearchMatch;

                  console.log("History: Session ID:", session.id, "has asks:", session.asks); // DEBUG

                  return (
                    <Card key={session.id} onClick={() => handleCardClick(session.id.toString())} className="cursor-pointer relative">
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
                                <Users size={14} />
                                {session.participants}
                              </div>
                              <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1">
                                      <Clock size={14} />
                                      {session.duration}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Start: {formatTime(session.session_start_time)}</p>
                                    <p>End: {formatTime(session.session_end_time)}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      {isExpanded && (
                        <CardContent className="space-y-4">
                          {session.notes && (
                            <div className="flex items-start gap-2">
                              <FileText size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-muted-foreground">
                                {highlightText(session.notes, searchQuery)}
                              </p>
                            </div>
                          )}

                          {session.asks && session.asks.length > 0 && (
                            <div className="space-y-3 border-t border-border pt-4">
                              <h4 className="text-base font-semibold flex items-center gap-2">
                                <MessageSquarePlus size={16} className="text-primary" />
                                Asks during session:
                              </h4>
                              {session.asks.map((ask, askIndex) => {
                                if ('question' in ask) {
                                  const poll = ask as Poll;
                                  return (
                                    <div key={askIndex} className="bg-muted/50 p-3 rounded-md space-y-2">
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
                                  );
                                } else if ('minutes' in ask) {
                                  const suggestion = ask as ExtendSuggestion;
                                  const yesVotes = suggestion.votes.filter(v => v.vote === 'yes').length;
                                  const noVotes = suggestion.votes.filter(v => v.vote === 'no').length;
                                  const neutralVotes = suggestion.votes.filter(v => v.vote === 'neutral').length;

                                  let mostPopularVote: 'yes' | 'no' | 'neutral' | null = null;
                                  let maxVotes = 0;

                                  if (yesVotes > maxVotes) {
                                    maxVotes = yesVotes;
                                    mostPopularVote = 'yes';
                                  }
                                  if (noVotes > maxVotes) {
                                    maxVotes = noVotes;
                                    mostPopularVote = 'no';
                                  }
                                  if (neutralVotes > maxVotes) {
                                    maxVotes = neutralVotes;
                                    mostPopularVote = 'neutral';
                                  }

                                  return (
                                    <div key={askIndex} className="bg-muted/50 p-3 rounded-md space-y-2">
                                      <p className="font-medium text-sm flex items-center gap-2">
                                        <PlusCircle size={16} className="text-primary" />
                                        Extend Timer by {suggestion.minutes} minutes
                                      </p>
                                      <p className="text-xs text-muted-foreground">Suggested by {highlightText(suggestion.creator, searchQuery)}</p>
                                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span className={cn("flex items-center gap-1", mostPopularVote === 'yes' && "text-green-600 font-medium")}>
                                          <ThumbsUp size={14} className="inline-block mr-1" fill={mostPopularVote === 'yes' ? "currentColor" : "none"} /> {yesVotes}
                                        </span>
                                        <span className={cn("flex items-center gap-1", mostPopularVote === 'neutral' && "text-blue-500 font-medium")}>
                                          <Minus size={14} className="inline-block mr-1" fill={mostPopularVote === 'neutral' ? "currentColor" : "none"} /> {neutralVotes}
                                        </span>
                                        <span className={cn("flex items-center gap-1", mostPopularVote === 'no' && "text-red-600 font-medium")}>
                                          <ThumbsDown size={14} className="inline-block mr-1" fill={mostPopularVote === 'no' ? "currentColor" : "none"} /> {noVotes}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              })}
                            </div>
                          )}
                        </CardContent>
                      )}

                      {/* Icons (bottom right) */}
                      {!isExpanded && (session.notes || (session.asks && session.asks.length > 0)) && (
                        <div className="absolute bottom-2 right-2 flex items-center gap-1">
                          {session.notes && (
                            <FileText 
                              size={16} 
                              className="text-muted-foreground" 
                              aria-label="Session has notes"
                            />
                          )}
                          {session.asks && session.asks.length > 0 && (
                            <MessageSquarePlus 
                              size={16} 
                              className="text-muted-foreground" 
                              aria-label="Session has asks"
                            />
                          )}
                        </div>
                      )}

                      {/* Delete Icon (X) */}
                      {showDeleteIconForSessionId === session.id.toString() && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive"
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