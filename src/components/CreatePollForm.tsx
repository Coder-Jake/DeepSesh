import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { MessageSquarePlus, CheckSquare, ThumbsUp, Circle } from "lucide-react";
import { Switch } from "@/components/ui/switch"; // Still needed for the type, but not rendered
import { cn } from "@/lib/utils";

interface CreatePollFormProps {
  onClose: () => void;
  onSubmit: (question: string, pollType: PollType, options: string[], allowCustomResponses: boolean) => void;
}

export type PollType = 'closed' | 'choice' | 'selection';

const CreatePollForm: React.FC<CreatePollFormProps> = ({ onClose, onSubmit }) => {
  const [question, setQuestion] = useState("");
  const [pollType, setPollType] = useState<PollType>('closed');
  const [options, setOptions] = useState("");
  const [allowCustomResponses, setAllowCustomResponses] = useState(false);
  const { toast } = useToast();

  const getOptionsPlaceholderText = (type: PollType) => {
    switch (type) {
      case 'closed':
        return "Options are fixed (Yes, No, Don't Mind)";
      case 'choice':
        return "e.g., Coffee, Lunch, Walk Outside";
      case 'selection':
        return "e.g., Feature A, Feature B, Feature C";
      default:
        return "Enter options, comma-separated";
    }
  };

  const getQuestionPlaceholderText = (type: PollType) => {
    switch (type) {
      case 'closed':
        return "e.g., 'Should we extend the focus session?'";
      case 'choice':
        return "e.g., 'What should we do for our next break?'";
      case 'selection':
        return "e.g., 'Which features should we prioritize?'";
      default:
        return "Enter your poll question...";
    }
  };

  const handleSubmit = () => {
    if (!question.trim()) {
      toast({
        title: "Missing Question",
        description: "Please enter a question for your poll.",
        variant: "destructive",
      });
      return;
    }

    let pollOptionsArray: string[] = [];
    if (pollType === 'choice' || pollType === 'selection') {
      pollOptionsArray = options.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0);
      
      // Only enforce minimum options if custom responses are NOT allowed
      if (!allowCustomResponses && pollOptionsArray.length < 2) {
        toast({
          title: "Insufficient Options",
          description: "Please provide at least two comma-separated options for Choice/Selection polls, or enable custom responses.",
          variant: "destructive",
        });
        return;
      }
    }

    onSubmit(question, pollType, pollOptionsArray, allowCustomResponses);
    onClose();
  };

  return (
    <div className="space-y-4 flex flex-col flex-grow">
      <div className="space-y-2">
        <Label htmlFor="poll-question">Question</Label>
        <Input
          id="poll-question"
          placeholder={getQuestionPlaceholderText(pollType)}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label>Poll Type</Label>
        <div className="flex space-x-2">
          <Label
            htmlFor="type-closed"
            onClick={() => setPollType('closed')}
            className={cn(
              "flex items-center space-x-1 px-3 py-1 rounded-full border cursor-pointer transition-colors",
              pollType === 'closed' ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:bg-accent"
            )}
          >
            <ThumbsUp size={16} />
            <span>Closed</span>
          </Label>
          <Label
            htmlFor="type-choice"
            onClick={() => setPollType('choice')}
            className={cn(
              "flex items-center space-x-1 px-3 py-1 rounded-full border cursor-pointer transition-colors",
              pollType === 'choice' ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:bg-accent"
            )}
          >
            <Circle size={16} />
            <span>Choice</span>
          </Label>
          <Label
            htmlFor="type-selection"
            onClick={() => setPollType('selection')}
            className={cn(
              "flex items-center space-x-1 px-3 py-1 rounded-full border cursor-pointer transition-colors",
              pollType === 'selection' ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:bg-accent"
            )}
          >
            <CheckSquare size={16} />
            <span>Selection</span>
          </Label>
        </div>
      </div>

      {(pollType === 'choice' || pollType === 'selection') && (
        <div className="space-y-2">
          <Label htmlFor="poll-options">Options</Label>
          <Textarea
            id="poll-options"
            placeholder={getOptionsPlaceholderText(pollType)}
            value={options}
            onChange={(e) => setOptions(e.target.value)}
            rows={3}
            className="w-full"
          />
        </div>
      )}

      {(pollType === 'choice' || pollType === 'selection') && (
        <Button
          variant="outline"
          onClick={() => setAllowCustomResponses(prev => !prev)}
          className={cn(
            "ml-auto h-auto px-3 py-1 rounded-full text-sm", // Base styles for size and roundness
            allowCustomResponses
              ? "bg-lime-300 text-black hover:bg-lime-400 border-lime-300" // Active state: olive, black text, hover darker olive
              : "" // No specific overrides for inactive state, let variant="outline" handle colors
          )}
        >
          Custom Responses
        </Button>
      )}

      <DialogFooter className="mt-auto">
        <Button onClick={handleSubmit} className="w-full">
          <MessageSquarePlus className="mr-2 h-4 w-4" />
          Create Poll
        </Button>
      </DialogFooter>
    </div>
  );
};

export default CreatePollForm;