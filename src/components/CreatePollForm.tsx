import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from 'sonner';
import { MessageSquarePlus, CheckSquare, ThumbsUp, Circle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useTimer } from '@/contexts/TimerContext';
import { useTheme } from '@/contexts/ThemeContext'; // NEW: Import useTheme

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
  const { areToastsEnabled } = useTimer();
  const { isDarkMode } = useTheme(); // NEW: Get isDarkMode

  const getOptionsPlaceholderText = (type: PollType) => {
    switch (type) {
      case 'closed':
        return "Options are fixed (Yes, No, Don't Mind)";
      case 'choice':
        return "Bear, Shark";
      case 'selection':
        return "e.g., FishBowl, Sushi, GYGs, Burgers";
      default:
        return "Enter options, comma-separated";
    }
  };

  const getQuestionPlaceholderText = (type: PollType) => {
    switch (type) {
      case 'closed':
        return "Would you be keen to grab a meal after this?";
      case 'choice':
        return "If a bear & a shark had a fight, who would win?";
      case 'selection':
        return "What would you like for Lunch?";
      default:
        return "Enter your poll question...";
    }
  };

  const handleSubmit = () => {
    if (!question.trim()) {
      if (areToastsEnabled) {
        toast.error("Missing Question", {
          description: "Please enter a question for your poll.",
        });
      }
      return;
    }

    let pollOptionsArray: string[] = [];
    if (pollType === 'choice' || pollType === 'selection') {
      pollOptionsArray = options.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0);
      
      if (!allowCustomResponses && pollOptionsArray.length < 2) {
        if (areToastsEnabled) {
          toast.error("Insufficient Options", {
            description: "Please provide at least two comma-separated options for Choice/Selection polls, or enable custom responses.",
          });
        }
        return;
      }
    }

    onSubmit(question, pollType, pollOptionsArray, allowCustomResponses);
    onClose();
  };

  const handleCustomResponsesClick = () => {
    if (areToastsEnabled) {
      toast.info("Under Construction", {
        description: "This feature is currently being developed.",
      });
    }
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
          onFocus={(e) => e.target.select()}
        />
      </div>

      <div className="space-y-2">
        <Label>Poll Type</Label>
        <div className="flex space-x-2">
          <Label
            htmlFor="type-closed"
            onClick={() => setPollType('closed')}
            className={cn(
              "flex items-center space-x-1 px-3 py-1 rounded-full border cursor-pointer transition-colors select-none",
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
              "flex items-center space-x-1 px-3 py-1 rounded-full border cursor-pointer transition-colors select-none",
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
              "flex items-center space-x-1 px-3 py-1 rounded-full border cursor-pointer transition-colors select-none",
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
            onFocus={(e) => e.target.select()}
          />
        </div>
      )}

      {(pollType === 'choice' || pollType === 'selection') && (
        <Button
          variant="outline"
          onClick={handleCustomResponsesClick} // Changed onClick handler
          disabled={true} // Disabled the button
          className={cn(
            "ml-auto h-auto px-3 py-1 rounded-full text-sm",
            allowCustomResponses && isDarkMode && "bg-gradient-to-r from-[hsl(var(--public-gradient-start-dark))] to-[hsl(var(--public-gradient-end-dark))] text-foreground border-public-bg",
            allowCustomResponses && !isDarkMode && "bg-[hsl(var(--public-bg))] text-black border-public-bg",
            !allowCustomResponses && "text-muted-foreground hover:bg-muted"
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