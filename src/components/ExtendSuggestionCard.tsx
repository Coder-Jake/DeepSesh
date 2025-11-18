import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, ThumbsUp, ThumbsDown, Minus, X } from "lucide-react"; // Import X icon
import { toast } from 'sonner'; // MODIFIED: Import toast directly from sonner
import { cn } from "@/lib/utils";
import { useTimer } from '@/contexts/TimerContext'; // NEW: Import useTimer

interface ExtendSuggestion {
  id: string;
  minutes: number;
  creator: string;
  votes: { userId: string; vote: 'yes' | 'no' | 'neutral' }[];
  status: 'pending' | 'accepted' | 'rejected';
}

interface ExtendSuggestionCardProps {
  suggestion: ExtendSuggestion;
  onVote: (id: string, vote: 'yes' | 'no' | 'neutral' | null) => void;
  currentUserId: string;
  onHide: (id: string) => void; // NEW: Prop to handle hiding the card
}

const ExtendSuggestionCard: React.FC<ExtendSuggestionCardProps> = ({ suggestion, onVote, currentUserId, onHide }) => {
  // Removed: const { toast } = useToast(); // Removed shadcn toast
  const { areToastsEnabled } = useTimer(); // NEW: Get areToastsEnabled
  const userVote = suggestion.votes.find(v => v.userId === currentUserId)?.vote;

  const yesVotes = suggestion.votes.filter(v => v.vote === 'yes').length;
  const noVotes = suggestion.votes.filter(v => v.vote === 'no').length;
  const neutralVotes = suggestion.votes.filter(v => v.vote === 'neutral').length;

  const handleVoteClick = (voteType: 'yes' | 'no' | 'neutral') => {
    let newVote: 'yes' | 'no' | 'neutral' | null = voteType;

    if (userVote === voteType) {
      newVote = null; // User clicked the same thumb/icon again, so unvote
    }
    
    onVote(suggestion.id, newVote);
    
    if (newVote === null && areToastsEnabled) { // NEW: Conditional toast
      toast.info("Vote Removed", { // MODIFIED: Changed to toast.info for sonner
        description: `Your vote for the extension has been removed.`,
      });
    } 
    // Removed the "Vote Cast" toast here
  };

  return (
    <Card className="bg-card border-border relative"> {/* Added relative for absolute positioning */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onHide(suggestion.id)}
        className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:bg-accent-hover" // NEW: Added hover effect
        aria-label="Hide ask"
      >
        <X className="h-4 w-4" />
      </Button>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <PlusCircle className="h-5 w-5 text-primary" />
          Extend Timer by {suggestion.minutes} minutes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">Suggested by {suggestion.creator}</p>
        
        <div className="flex items-center justify-center gap-4"> {/* Centered the buttons */}
          {/* Thumbs Up */}
          <button 
            onClick={() => handleVoteClick('yes')} 
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-green-600 disabled:opacity-50 w-16 h-16 rounded-lg border select-none", // Larger, centered
              userVote === 'yes' && "font-bold bg-green-100 border-green-200",
              "hover:bg-success-hover" // NEW: Added hover effect
            )}
          >
            <ThumbsUp className="h-6 w-6" fill={userVote === 'yes' ? "currentColor" : "none"} /> {yesVotes}
          </button>
          {/* Neutral / Don't Mind */}
          <button 
            onClick={() => handleVoteClick('neutral')} 
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-blue-500 disabled:opacity-50 w-16 h-16 rounded-lg border select-none", // Larger, centered
              userVote === 'neutral' && "font-bold bg-blue-100 border-blue-200",
              "hover:bg-muted-hover" // NEW: Added hover effect
            )}
          >
            <Minus className="h-6 w-6" fill={userVote === 'neutral' ? "currentColor" : "none"} /> {neutralVotes}
          </button>
          {/* Thumbs Down */}
          <button 
            onClick={() => handleVoteClick('no')} 
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-red-600 disabled:opacity-50 w-16 h-16 rounded-lg border select-none", // Larger, centered
              userVote === 'no' && "font-bold bg-red-100 border-red-200",
              "hover:bg-destructive-hover" // NEW: Added hover effect
            )}
          >
            <ThumbsDown className="h-6 w-6" fill={userVote === 'no' ? "currentColor" : "none"} /> {noVotes}
          </button>
        </div>
        
        {suggestion.status !== 'pending' && (
          <span className={`text-sm font-medium ${suggestion.status === 'accepted' ? 'text-green-600' : 'text-red-600'}`}>
            {suggestion.status === 'accepted' ? 'Accepted' : 'Rejected'}
          </span>
        )}
      </CardContent>
    </Card>
  );
};

export default ExtendSuggestionCard;