import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MessageSquarePlus, Users, ThumbsUp, ThumbsDown, Minus, Circle, CheckSquare, X } from "lucide-react";
import { toast } from 'sonner';
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTimer } from '@/contexts/TimerContext';

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
  // Modified onVote signature to explicitly pass custom option state
  onVote: (pollId: string, optionIds: string[], customOptionText?: string, isCustomOptionSelected?: boolean) => void;
  currentUserId: string;
  onHide: (id: string) => void;
}

const PollCard: React.FC<PollCardProps> = ({ poll, onVote, currentUserId, onHide }) => {
  const { areToastsEnabled } = useTimer();
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
  const [isCustomOptionChecked, setIsCustomOptionChecked] = useState(false); // State for custom option checkbox

  // Effect to initialize customResponse and isCustomOptionChecked from poll data
  useEffect(() => {
    if (poll.allowCustomResponses) {
      const userCustomVoteOption = poll.options.find(
        option => option.id.startsWith('custom-') && option.votes.some(vote => vote.userId === currentUserId)
      );
      setCustomResponse(userCustomVoteOption ? userCustomVoteOption.text : "");
      setIsCustomOptionChecked(!!userCustomVoteOption); // Check if user has a custom option with a vote
    } else {
      setCustomResponse("");
      setIsCustomOptionChecked(false);
    }
  }, [poll, currentUserId]);

  // Update selectedOption for closed/choice polls
  useEffect(() => {
    if (poll.type === 'closed' || poll.type === 'choice') {
      const votedOption = poll.options.find(option => option.votes.some(vote => vote.userId === currentUserId));
      setSelectedOption(votedOption ? votedOption.id : null);
    } else {
      setSelectedOption(null);
    }
  }, [poll, currentUserId]);

  // Update selectedOptions for selection polls
  useEffect(() => {
    if (poll.type === 'selection') {
      setSelectedOptions(
        poll.options
          .filter(option => option.votes.some(vote => vote.userId === currentUserId))
          .map(option => option.id)
      );
    } else {
      setSelectedOptions([]);
    }
  }, [poll, currentUserId]);

  const submitVote = (
    newSelectedOption: string | null,
    newSelectedOptions: string[],
    newCustomResponseText: string,
    customOptionIsChecked: boolean
  ) => {
    let votesToSend: string[] = [];
    
    if (poll.type === 'closed' || poll.type === 'choice') {
      if (newSelectedOption) {
        votesToSend = [newSelectedOption];
      }
    } else if (poll.type === 'selection') {
      votesToSend = [...newSelectedOptions];
    }

    // Pass all necessary info to parent, let parent handle custom option ID generation/management
    onVote(poll.id, votesToSend, newCustomResponseText.trim() || undefined, customOptionIsChecked);
  };

  const handleClosedPollVote = (optionId: string) => {
    let newVoteId: string | null = optionId;
    if (selectedOption === optionId) {
      newVoteId = null; // Unselect if already selected
    }
    setSelectedOption(newVoteId);
    submitVote(newVoteId, selectedOptions, customResponse, isCustomOptionChecked);
  };

  const handleChoiceChange = (newOptionId: string) => {
    setSelectedOption(newOptionId);
    submitVote(newOptionId, selectedOptions, customResponse, isCustomOptionChecked);
  };

  const handleSelectionChange = (optionId: string, checked: boolean | 'indeterminate') => {
    const isChecked = !!checked;
    const newSelectedOptions = isChecked
      ? [...selectedOptions, optionId]
      : selectedOptions.filter(id => id !== optionId);
    setSelectedOptions(newSelectedOptions);
    submitVote(selectedOption, newSelectedOptions, customResponse, isCustomOptionChecked);
  };

  const handleCustomResponseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCustomResponse = e.target.value;
    setCustomResponse(newCustomResponse);

    const hasText = newCustomResponse.trim().length > 0;

    if (poll.type === 'selection') {
      // For selection polls, if text is present, automatically check the box and submit vote
      // If text is cleared, uncheck the box and submit vote
      setIsCustomOptionChecked(hasText);
      submitVote(selectedOption, selectedOptions, newCustomResponse, hasText);
    } else if (poll.type === 'choice') {
      // For choice polls, typing a custom response should implicitly select it
      // and deselect any other radio option.
      // If text is cleared, it should deselect itself.
      if (hasText) {
        setSelectedOption(null); // Deselect other radio options
        submitVote(null, selectedOptions, newCustomResponse, true); // Treat as selected
      } else {
        submitVote(null, selectedOptions, newCustomResponse, false); // Treat as unselected
      }
    }
  };

  const handleCustomOptionCheckboxChange = (checked: boolean | 'indeterminate') => {
    const isChecked = !!checked;
    setIsCustomOptionChecked(isChecked);
    // If unchecked, clear custom response text as well and submit vote to remove it
    if (!isChecked) {
      setCustomResponse("");
      submitVote(selectedOption, selectedOptions, "", false);
    } else {
      // If checked, and there's text, submit vote to ensure it's registered
      // If checked, but no text, don't submit a vote for an empty custom option
      if (customResponse.trim()) {
        submitVote(selectedOption, selectedOptions, customResponse, true);
      }
    }
  };

  const handleCustomResponseBlur = () => {
    // Only submit if custom response is checked or has text (to clear it)
    if (isCustomOptionChecked || customResponse.trim()) {
      submitVote(selectedOption, selectedOptions, customResponse, isCustomOptionChecked);
    }
  };

  const handleCustomResponseKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCustomResponseBlur();
    }
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

  const filteredOptions = poll.options.filter(option => {
    const isCustomOption = option.id.startsWith('custom-');
    const hasVotes = getTotalVotes(option.id) > 0;
    const isUserVotedCustomOption = isCustomOption && option.votes.some(vote => vote.userId === currentUserId);
    
    // Always show non-custom options
    if (!isCustomOption) return true;
    // Always show custom options that have votes
    if (hasVotes) return true;
    // Always show the current user's custom response, even if it has 0 votes (so they can edit/remove it)
    if (isUserVotedCustomOption) return true;
    
    return false;
  });

  return (
    <Card className="bg-card border-border relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onHide(poll.id)}
        className="absolute top-2 right-2 h-6 w-6 text-muted-foreground"
        aria-label="Hide ask"
      >
        <X className="h-4 w-4" />
      </Button>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquarePlus className="h-5 w-5 text-primary" />
          {poll.question}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">Asked by {poll.creator}</p>

        {poll.status === 'active' && (
          <div className="space-y-3">
            {poll.type === 'closed' && (
              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => handleClosedPollVote('closed-yes')} 
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 text-green-600 disabled:opacity-50 w-16 h-16 rounded-lg border select-none",
                    selectedOption === 'closed-yes' && "font-bold bg-green-100 border-green-200"
                  )}
                >
                  <ThumbsUp className="h-6 w-6" fill={selectedOption === 'closed-yes' ? "currentColor" : "none"} /> {yesVotes}
                </button>
                <button 
                  onClick={() => handleClosedPollVote('closed-dont-mind')} 
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 text-blue-500 disabled:opacity-50 w-16 h-16 rounded-lg border select-none",
                    selectedOption === 'closed-dont-mind' && "font-bold bg-blue-100 border-blue-200"
                  )}
                >
                  <Minus className="h-6 w-6" fill={selectedOption === 'closed-dont-mind' ? "currentColor" : "none"} /> {neutralVotes}
                </button>
                <button 
                  onClick={() => handleClosedPollVote('closed-no')} 
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 text-red-600 disabled:opacity-50 w-16 h-16 rounded-lg border select-none",
                    selectedOption === 'closed-no' && "font-bold bg-red-100 border-red-200"
                  )}
                >
                  <ThumbsDown className="h-6 w-6" fill={selectedOption === 'closed-no' ? "currentColor" : "none"} /> {noVotes}
                </button>
              </div>
            )}

            {poll.allowCustomResponses && (poll.type === 'choice' || poll.type === 'selection') && (
              <div className="space-y-2">
                <Label htmlFor={`${poll.id}-custom-response`}>Your Custom Response</Label>
                <div className="flex items-center gap-2"> {/* NEW: Flex container for input and checkbox */}
                  {(poll.type === 'selection') && ( // Only show checkbox for selection type
                    <Checkbox
                      id={`${poll.id}-custom-response-checkbox`}
                      checked={isCustomOptionChecked}
                      onCheckedChange={handleCustomOptionCheckboxChange}
                      disabled={!customResponse.trim()} // Disable checkbox if no text
                    />
                  )}
                  <Input
                    id={`${poll.id}-custom-response`}
                    placeholder="Type your own option..."
                    value={customResponse}
                    onChange={handleCustomResponseChange}
                    onBlur={handleCustomResponseBlur}
                    onKeyDown={handleCustomResponseKeyDown}
                    onFocus={(e) => e.target.select()}
                    className="flex-grow"
                  />
                </div>
              </div>
            )}

            {poll.type === 'choice' && (
              <RadioGroup 
                value={selectedOption || ''} 
                onValueChange={handleChoiceChange}
              >
                {filteredOptions.map(option => (
                  <div key={option.id} className="flex items-center justify-between space-x-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={option.id} id={`${poll.id}-${option.id}`} />
                      <Label htmlFor={`${poll.id}-${option.id}`}>{option.text}</Label>
                    </div>
                    <span className="text-muted-foreground text-sm select-none">{getTotalVotes(option.id)} votes</span>
                  </div>
                ))}
              </RadioGroup>
            )}

            {poll.type === 'selection' && (
              <div className="space-y-2">
                {filteredOptions.map(option => (
                  <div key={option.id} className="flex items-center justify-between space-x-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${poll.id}-${option.id}`}
                        checked={selectedOptions.includes(option.id)}
                        onCheckedChange={(checked) => handleSelectionChange(option.id, checked)}
                      />
                      <Label htmlFor={`${poll.id}-${option.id}`}>{option.text}</Label>
                    </div>
                    <span className="text-muted-foreground text-sm select-none">{getTotalVotes(option.id)} votes</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PollCard;