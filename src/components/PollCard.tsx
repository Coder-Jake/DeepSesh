import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MessageSquarePlus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PollOption {
  id: string;
  text: string;
  votes: { userId: string }[];
}

interface Poll {
  id: string;
  question: string;
  type: 'closed' | 'choice' | 'selection';
  creator: string;
  options: PollOption[];
  status: 'active' | 'closed';
}

interface PollCardProps {
  poll: Poll;
  onVote: (pollId: string, optionIds: string[]) => void;
  currentUserId: string;
}

const PollCard: React.FC<PollCardProps> = ({ poll, onVote, currentUserId }) => {
  const { toast } = useToast();
  const [selectedOption, setSelectedOption] = useState<string | null>(null); // For 'choice' and 'closed'
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]); // For 'selection'

  const userHasVoted = poll.options.some(option => 
    option.votes.some(vote => vote.userId === currentUserId)
  );

  const handleVote = () => {
    if (userHasVoted) {
      toast({
        title: "Already Voted",
        description: "You have already voted on this poll.",
        variant: "default",
      });
      return;
    }

    let votesToSend: string[] = [];
    if (poll.type === 'selection') {
      votesToSend = selectedOptions;
    } else if (selectedOption) {
      votesToSend = [selectedOption];
    }

    if (votesToSend.length === 0) {
      toast({
        title: "No Option Selected",
        description: "Please select an option before submitting your vote.",
        variant: "destructive",
      });
      return;
    }

    onVote(poll.id, votesToSend);
    toast({
      title: "Vote Submitted!",
      description: `Your vote for "${poll.question}" has been recorded.`,
    });
  };

  const getTotalVotes = (optionId: string) => {
    return poll.options.find(opt => opt.id === optionId)?.votes.length || 0;
  };

  const getOverallTotalVotes = () => {
    const uniqueVoters = new Set<string>();
    poll.options.forEach(option => {
      option.votes.forEach(vote => uniqueVoters.add(vote.userId));
    });
    return uniqueVoters.size;
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquarePlus className="h-5 w-5 text-primary" />
          {poll.question}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">Created by {poll.creator}</p>

        {poll.status === 'active' && !userHasVoted && (
          <div className="space-y-3">
            {poll.type === 'closed' && (
              <RadioGroup value={selectedOption || ''} onValueChange={setSelectedOption}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id={`${poll.id}-yes`} />
                  <Label htmlFor={`${poll.id}-yes`}>Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id={`${poll.id}-no`} />
                  <Label htmlFor={`${poll.id}-no`}>No</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dont-mind" id={`${poll.id}-dont-mind`} />
                  <Label htmlFor={`${poll.id}-dont-mind`}>Don't Mind</Label>
                </div>
              </RadioGroup>
            )}

            {poll.type === 'choice' && (
              <RadioGroup value={selectedOption || ''} onValueChange={setSelectedOption}>
                {poll.options.map(option => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.id} id={`${poll.id}-${option.id}`} />
                    <Label htmlFor={`${poll.id}-${option.id}`}>{option.text}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {poll.type === 'selection' && (
              <div className="space-y-2">
                {poll.options.map(option => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${poll.id}-${option.id}`}
                      checked={selectedOptions.includes(option.id)}
                      onCheckedChange={(checked) => {
                        setSelectedOptions(prev =>
                          checked ? [...prev, option.id] : prev.filter(id => id !== option.id)
                        );
                      }}
                    />
                    <Label htmlFor={`${poll.id}-${option.id}`}>{option.text}</Label>
                  </div>
                ))}
              </div>
            )}
            <Button onClick={handleVote} className="w-full mt-4">Submit Vote</Button>
          </div>
        )}

        {/* Display Results */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" /> {getOverallTotalVotes()} total votes
          </div>
          {poll.options.map(option => (
            <div key={option.id} className="flex items-center justify-between text-sm">
              <span className="font-medium">{option.text}</span>
              <span className="text-muted-foreground">{getTotalVotes(option.id)} votes</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PollCard;