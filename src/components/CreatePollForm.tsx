import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { MessageSquarePlus } from "lucide-react";

interface CreatePollFormProps {
  onClose: () => void;
}

type PollType = 'closed' | 'choice' | 'selection';

const CreatePollForm: React.FC<CreatePollFormProps> = ({ onClose }) => {
  const [question, setQuestion] = useState("");
  const [pollType, setPollType] = useState<PollType>('closed');
  const [options, setOptions] = useState(""); // Comma-separated for Choice/Selection
  const { toast } = useToast();

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
      if (pollOptionsArray.length < 2) {
        toast({
          title: "Insufficient Options",
          description: "Please provide at least two comma-separated options for Choice/Selection polls.",
          variant: "destructive",
        });
        return;
      }
    }

    // In a real application, this would send a request to other users
    toast({
      title: "Poll Created!",
      description: `Your "${question}" poll (${pollType}) has been submitted to the group.`,
    });
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="poll-question">Poll Question</Label>
        <Input
          id="poll-question"
          placeholder="e.g., 'Should we take a longer break?'"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label>Poll Type</Label>
        <RadioGroup value={pollType} onValueChange={(value: PollType) => setPollType(value)} className="flex space-x-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="closed" id="type-closed" />
            <Label htmlFor="type-closed">Closed (Yes/No/Don't Mind)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="choice" id="type-choice" />
            <Label htmlFor="type-choice">Choice (Select One)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="selection" id="type-selection" />
            <Label htmlFor="type-selection">Selection (Select Multiple)</Label>
          </div>
        </RadioGroup>
      </div>

      {(pollType === 'choice' || pollType === 'selection') && (
        <div className="space-y-2">
          <Label htmlFor="poll-options">Options (comma-separated)</Label>
          <Textarea
            id="poll-options"
            placeholder="e.g., 'Option A, Option B, Option C'"
            value={options}
            onChange={(e) => setOptions(e.target.value)}
            rows={3}
            className="w-full"
          />
        </div>
      )}

      <DialogFooter>
        <Button onClick={handleSubmit} className="w-full">
          <MessageSquarePlus className="mr-2 h-4 w-4" />
          Create Poll
        </Button>
      </DialogFooter>
    </div>
  );
};

export default CreatePollForm;