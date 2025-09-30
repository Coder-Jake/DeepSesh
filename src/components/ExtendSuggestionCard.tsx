import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, ThumbsUp, ThumbsDown, Minus } from "lucide-react"; // Import Minus icon
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils"; // Import cn for conditional styling

interface ExtendSuggestion {
  id: string;
  minutes: number;
  creator: string;
  votes: { userId: string; vote: 'yes' | 'no' | 'neutral' }[]; // Updated vote type
  status: 'pending' | 'accepted' | 'rejected';
}

interface ExtendSuggestionCardProps {
  suggestion: ExtendSuggestion;
  onVote: (id: string, vote: 'yes' | 'no' | 'neutral' | null) => void; // Updated prop type
  currentUserId: string; // To prevent self-voting and show user's vote
}

const ExtendSuggestionCard: React.FC<ExtendSuggestionCardProps> = ({ suggestion, onVote, currentUserId }) => {
  const { toast } = useToast();
  const userVote = suggestion.votes.find(v => v.userId === currentUserId)?.vote;

  const yesVotes = suggestion.votes.filter(v => v.vote === 'yes').length;
  const noVotes = suggestion.votes.filter(v => v.vote === 'no').length;
  const neutralVotes = suggestion.votes.filter(v => v.vote === 'neutral').length; // New: count neutral votes

  const handleVoteClick = (voteType: 'yes' | 'no' | 'neutral') => {
    // Removed the check for suggestion.status !== 'pending' to allow changing votes anytime.
    
    let newVote: 'yes' | 'no' | 'neutral' | null = voteType;

    if (userVote === voteType) {
      // User clicked the same thumb/icon again, so unvote
      newVote = null;
    } else {
      // User clicked a different thumb/icon, or no thumb yet, so cast/change vote
      newVote = voteType;
    }
    
    onVote(suggestion.id, newVote);
    
    if (newVote === null) {
      toast({
        title: "Vote Removed",
        description: `Your vote for the extension has been removed.`,
      });
    } else {
      toast({
        title: "Vote Cast",
        description: `You voted "${newVote}" on the extension suggestion.`,
      });
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <PlusCircle className="h-5 w-5 text-primary" />
          Extend Timer by {suggestion.minutes} minutes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">Suggested by {suggestion.creator}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Thumbs Up */}
            <button 
              onClick={() => handleVoteClick('yes')} 
              className={cn(
                "flex items-center gap-1 text-sm text-green-600 disabled:opacity-50",
                userVote === 'yes' && "font-bold" // Highlight if user voted yes
              )}
            >
              <ThumbsUp className="h-4 w-4" fill={userVote === 'yes' ? "currentColor" : "none"} /> {yesVotes}
            </button>
            {/* Neutral / Don't Mind */}
            <button 
              onClick={() => handleVoteClick('neutral')} 
              className={cn(
                "flex items-center gap-1 text-sm text-blue-500 disabled:opacity-50", // Blue for neutral
                userVote === 'neutral' && "font-bold" // Highlight if user voted neutral
              )}
            >
              <Minus className="h-4 w-4" fill={userVote === 'neutral' ? "currentColor" : "none"} /> {neutralVotes}
            </button>
            {/* Thumbs Down */}
            <button 
              onClick={() => handleVoteClick('no')} 
              className={cn(
                "flex items-center gap-1 text-sm text-red-600 disabled:opacity-50",
                userVote === 'no' && "font-bold" // Highlight if user voted no
              )}
            >
              <ThumbsDown className="h-4 w-4" fill={userVote === 'no' ? "currentColor" : "none"} /> {noVotes}
            </button>
          </div>
          
          {suggestion.status !== 'pending' && (
            <span className={`text-sm font-medium ${suggestion.status === 'accepted' ? 'text-green-600' : 'text-red-600'}`}>
              {suggestion.status === 'accepted' ? 'Accepted' : 'Rejected'}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExtendSuggestionCard;