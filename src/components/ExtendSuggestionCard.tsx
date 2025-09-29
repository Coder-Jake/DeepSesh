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
  onVote: (id: string, vote: 'yes' | 'no') => void;
  currentUserId: string; // To prevent self-voting and show user's vote
}

const ExtendSuggestionCard: React.FC<ExtendSuggestionCardProps> = ({ suggestion, onVote, currentUserId }) => {
  const { toast } = useToast();
  const userVote = suggestion.votes.find(v => v.userId === currentUserId)?.vote;

  const yesVotes = suggestion.votes.filter(v => v.vote === 'yes').length;
  const noVotes = suggestion.votes.filter(v => v.vote === 'no').length;
  const totalVotes = suggestion.votes.length;

  const handleVote = (vote: 'yes' | 'no') => {
    if (userVote) {
      toast({
        title: "Already Voted",
        description: `You have already voted "${userVote}" on this suggestion.`,
        variant: "default",
      });
      return;
    }
    onVote(suggestion.id, vote);
    toast({
      title: "Vote Cast",
      description: `You voted "${vote}" on the extension suggestion.`,
    });
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
            <div className="flex items-center gap-1 text-sm text-green-600">
              <ThumbsUp className="h-4 w-4" /> {yesVotes}
            </div>
            <div className="flex items-center gap-1 text-sm text-red-600">
              <ThumbsDown className="h-4 w-4" /> {noVotes}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-4 w-4" /> {totalVotes} votes
            </div>
          </div>
          
          {suggestion.status === 'pending' ? (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleVote('yes')} 
                disabled={!!userVote}
                className={userVote === 'yes' ? 'bg-green-100 dark:bg-green-900' : ''}
              >
                Yes
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleVote('no')} 
                disabled={!!userVote}
                className={userVote === 'no' ? 'bg-red-100 dark:bg-red-900' : ''}
              >
                No
              </Button>
            </div>
          ) : (
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