import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, ThumbsUp, ThumbsDown, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExtendSuggestion {
  id: string;
  minutes: number;
  creator: string;
  votes: { userId: string; vote: 'yes' | 'no' }[];
  status: 'pending' | 'accepted' | 'rejected';
}

interface ExtendSuggestionCardProps {
  suggestion: ExtendSuggestion;
  onVote: (id: string, vote: 'yes' | 'no' | null) => void; // Updated prop type
  currentUserId: string; // To prevent self-voting and show user's vote
}

const ExtendSuggestionCard: React.FC<ExtendSuggestionCardProps> = ({ suggestion, onVote, currentUserId }) => {
  const { toast } = useToast();
  const userVote = suggestion.votes.find(v => v.userId === currentUserId)?.vote;

  const yesVotes = suggestion.votes.filter(v => v.vote === 'yes').length;
  const noVotes = suggestion.votes.filter(v => v.vote === 'no').length;
  const totalVotes = suggestion.votes.length;

  const handleVoteClick = (voteType: 'yes' | 'no') => {
    if (suggestion.status !== 'pending') {
      toast({
        title: "Voting Closed",
        description: `This suggestion has already been ${suggestion.status}.`,
        variant: "default",
      });
      return;
    }

    let newVote: 'yes' | 'no' | null = voteType;

    if (userVote === voteType) {
      // User clicked the same thumb again, so unvote
      newVote = null;
    } else {
      // User clicked a different thumb, or no thumb yet, so cast/change vote
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
              disabled={suggestion.status !== 'pending'}
              className="flex items-center gap-1 text-sm text-green-600 disabled:opacity-50"
            >
              <ThumbsUp className="h-4 w-4" fill={userVote === 'yes' ? "currentColor" : "none"} /> {yesVotes}
            </button>
            {/* Thumbs Down */}
            <button 
              onClick={() => handleVoteClick('no')} 
              disabled={suggestion.status !== 'pending'}
              className="flex items-center gap-1 text-sm text-red-600 disabled:opacity-50"
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