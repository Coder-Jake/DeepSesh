import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MessageSquarePlus, Users, ThumbsUp, ThumbsDown, Minus } from "lucide-react"; // Import ThumbsUp, ThumbsDown, Minus
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input"; // Import Input for custom responses
import { cn } from "@/lib/utils"; // Import cn for conditional styling

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
  allowCustomResponses: boolean; // New prop
}

interface PollCardProps {
  poll: Poll;
  onVote: (pollId: string, optionIds: string[], customOptionText?: string) => void; // Updated prop
  currentUserId: string;
}

const PollCard: React.FC<PollCardProps> = ({ poll, onVote, currentUserId }) => {
  const { toast } = useToast();
  const [selectedOption, setSelectedOption] = useState<string | null>(() => {
    // Initialize selectedOption if user has already voted for a single-choice poll
    if (poll.type === 'closed' || poll.type === 'choice') {
      const votedOption = poll.options.find(option => option.votes.some(vote => vote.userId === currentUserId));
      return votedOption ? votedOption.id : null;
    }
    return null;
  });
  const [selectedOptions, setSelectedOptions] = useState<string[]>(() => {
    // Initialize selectedOptions if user has already voted for a multi-selection poll
    if (poll.type === 'selection') {
      return poll.options
        .filter(option => option.votes.some(vote => vote.userId === currentUserId))
        .map(option => option.id);
    }
    return [];
  });
  const [customResponse, setCustomResponse] = useState("");

  const userHasVotedForExistingOption = poll.options.some(option => 
    option.votes.some(vote => vote.userId === currentUserId)
  );

  const handleVote = () => {
    let votesToSend: string[] = [];
    let customTextToSend: string | undefined;

    if (poll.type === 'selection') {
      votesToSend = selectedOptions;
    } else if (selectedOption) {
      votesToSend = [selectedOption];
    }

    if (poll.allowCustomResponses && customResponse.trim()) {
      customTextToSend = customResponse.trim();
      // If custom response is the only thing, ensure it's sent
      if (votesToSend.length === 0 && customTextToSend) {
        // We'll handle adding this as a new option in Index.tsx
      }
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
    toast({
      title: "Vote Submitted!",
      description: `Your vote for "${poll.question}" has been recorded.`,
    });
    setCustomResponse(""); // Clear custom response after submission
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

        {poll.status === 'active' && (
          <div className="space-y-3">
            {poll.type === 'closed' && (
              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "rounded-full w-12 h-12",
                    selectedOption === "closed-yes" && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => setSelectedOption("closed-yes")}
                >
                  <ThumbsUp className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "rounded-full w-12 h-12",
                    selectedOption === "closed-dont-mind" && "bg-blue-500 text-white" // Neutral blue
                  )}
                  onClick={() => setSelectedOption("closed-dont-mind")}
                >
                  <Minus className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "rounded-full w-12 h-12",
                    selectedOption === "closed-no" && "bg-destructive text-destructive-foreground"
                  )}
                  onClick={() => setSelectedOption("closed-no")}
                >
                  <ThumbsDown className="h-5 w-5" />
                </Button>
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