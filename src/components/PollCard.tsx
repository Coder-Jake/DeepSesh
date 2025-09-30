import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MessageSquarePlus, Users, ThumbsUp, ThumbsDown, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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
  allowCustomResponses: boolean;
}

interface PollCardProps {
  poll: Poll;
  onVote: (pollId: string, optionIds: string[], customOptionText?: string) => void;
  currentUserId: string;
}

const PollCard: React.FC<PollCardProps> = ({ poll, onVote, currentUserId }) => {
  const { toast } = useToast();
  const [selectedOption, setSelectedOption] = useState<string | null>(() => {
    if (poll.type === 'closed' || poll.type === 'choice') {
      const votedOption = poll.options.find(option => option.votes.some(vote => vote.userId === currentUserId));
      return votedOption ? votedOption.id : null;
    }
    return null;
  });
  const [selectedOptions, setSelectedOptions] = useState<string[]>(() => {
    if (poll.type === 'selection') {
      return poll.options
        .filter(option => option.votes.some(vote => vote.userId === currentUserId))
        .map(option => option.id);
    }
    return [];
  });
  const [customResponse, setCustomResponse] = useState("");

  const handleClosedPollVote = (optionId: string) => {
    let newVoteId: string | null = optionId;

    if (selectedOption === optionId) {
      newVoteId = null; // User clicked the same option again, so unvote
    }

    setSelectedOption(newVoteId); // Update local state immediately for visual feedback
    onVote(poll.id, newVoteId ? [newVoteId] : [], undefined); // Call parent onVote

    let newVoteText = "";
    if (newVoteId === 'closed-yes') newVoteText = 'yes';
    else if (newVoteId === 'closed-no') newVoteText = 'no';
    else if (newVoteId === 'closed-dont-mind') newVoteText = 'neutral';

    if (newVoteId === null) {
      toast({
        title: "Vote Removed",
        description: `Your vote for the poll has been removed.`,
      });
    } else {
      toast({
        title: "Vote Cast",
        description: `You voted "${newVoteText}" on the poll suggestion.`,
      });
    }
  };

  const handleChoiceOrSelectionVote = () => {
    let votesToSend: string[] = [];
    let customTextToSend: string | undefined;

    if (poll.type === 'selection') {
      votesToSend = selectedOptions;
    } else if (selectedOption) {
      votesToSend = [selectedOption];
    }

    if (poll.allowCustomResponses && customResponse.trim()) {
      customTextToSend = customResponse.trim();
    }

    if (votesToSend.length === 0 && !customTextToSend) {
      toast({
        title: "No Option Selected",
        description: "Please select an option or type a custom response before submitting your vote.",
        variant: "destructive",
      });
      return;
    }

    onVote(poll.id, votesToSend, customTextToSend);
    
    let newVoteText = "";
    if (poll.type === 'choice' && selectedOption) {
      newVoteText = poll.options.find(opt => opt.id === selectedOption)?.text || "";
    } else if (poll.type === 'selection' && votesToSend.length > 0) {
      newVoteText = votesToSend.map(id => poll.options.find(opt => opt.id === id)?.text || "").join(', ');
    } else if (customTextToSend) {
      newVoteText = customTextToSend;
    }

    toast({
      title: "Vote Cast",
      description: `You voted "${newVoteText}" on the poll suggestion.`,
    });
    setCustomResponse("");
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

  const yesVotes = getTotalVotes('closed-yes');
  const noVotes = getTotalVotes('closed-no');
  const neutralVotes = getTotalVotes('closed-dont-mind');

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

        {poll.status === 'active' && (
          <div className="space-y-3">
            {poll.type === 'closed' && (
              <div className="flex justify-center gap-4">
                {/* Thumbs Up */}
                <button 
                  onClick={() => handleClosedPollVote('closed-yes')} 
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 text-green-600 disabled:opacity-50 w-16 h-16 rounded-lg border", // Larger, centered
                    selectedOption === 'closed-yes' && "font-bold bg-green-100 border-green-200"
                  )}
                >
                  <ThumbsUp className="h-6 w-6" fill={selectedOption === 'closed-yes' ? "currentColor" : "none"} /> {yesVotes}
                </button>
                {/* Neutral / Don't Mind */}
                <button 
                  onClick={() => handleClosedPollVote('closed-dont-mind')} 
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 text-blue-500 disabled:opacity-50 w-16 h-16 rounded-lg border", // Larger, centered
                    selectedOption === 'closed-dont-mind' && "font-bold bg-blue-100 border-blue-200"
                  )}
                >
                  <Minus className="h-6 w-6" fill={selectedOption === 'closed-dont-mind' ? "currentColor" : "none"} /> {neutralVotes}
                </button>
                {/* Thumbs Down */}
                <button 
                  onClick={() => handleClosedPollVote('closed-no')} 
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 text-red-600 disabled:opacity-50 w-16 h-16 rounded-lg border", // Larger, centered
                    selectedOption === 'closed-no' && "font-bold bg-red-100 border-red-200"
                  )}
                >
                  <ThumbsDown className="h-6 w-6" fill={selectedOption === 'closed-no' ? "currentColor" : "none"} /> {noVotes}
                </button>
              </div>
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

            {poll.allowCustomResponses && (poll.type === 'choice' || poll.type === 'selection') && (
              <div className="space-y-2">
                <Label htmlFor={`${poll.id}-custom-response`}>Your Custom Response</Label>
                <Input
                  id={`${poll.id}-custom-response`}
                  placeholder="Type your own option..."
                  value={customResponse}
                  onChange={(e) => setCustomResponse(e.target.value)}
                />
              </div>
            )}

            {(poll.type === 'choice' || poll.type === 'selection' || (poll.allowCustomResponses && customResponse.trim())) && (
              <Button onClick={handleChoiceOrSelectionVote} className="w-full mt-4">Submit Vote</Button>
            )}
          </div>
        )}

        {/* Display Results - Only show for 'choice' and 'selection' polls */}
        {(poll.type === 'choice' || poll.type === 'selection') && (
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
        )}
      </CardContent>
    </Card>
  );
};

export default PollCard;