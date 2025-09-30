import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { MessageSquarePlus } from "lucide-react";
import { Switch } from "@/components/ui/switch"; // Import Switch

interface CreatePollFormProps {
  onClose: () => void;
  onSubmit: (question: string, pollType: PollType, options: string[], allowCustomResponses: boolean) => void; // New prop
}

type PollType = 'closed' | 'choice' | 'selection';

const CreatePollForm: React.FC<CreatePollFormProps> = ({ onClose, onSubmit }) => {
  const [question, setQuestion] = useState("");
  const [pollType, setPollType] = useState<PollType>('closed');
  const [options, setOptions] = useState(""); // Comma-separated for Choice/Selection
  const [allowCustomResponses, setAllowCustomResponses] = useState(false); // New state for custom responses
  const { toast } = useToast();

  const getOptionsPlaceholderText = (type: PollType) => {
    switch (type) {
      case 'closed':
        return "Options are fixed (Yes, No, Don't Mind)";
      case 'choice':
        return "e.g., 'Coffee Break, Tea Break, Walk Outside'";
      case 'selection':
        return "e.g., 'Feature A, Feature B, Feature C'";
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
      if (pollOptionsArray.length < 2) {
        toast({
          title: "Insufficient Options",
          description: "Please provide at least two comma-separated options for Choice/Selection polls.",
          variant: "destructive",
        });
        return;
      }
    }

    onSubmit(question, pollType, pollOptionsArray, allowCustomResponses); // Pass new setting
    onClose();
  };

  return (
    <div className="space-y-4">
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
        <RadioGroup value={pollType} onValueChange={(value: PollType) => setPollType(value)} className="flex space-x-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="closed" id="type-closed" />
            <Label htmlFor="type-closed">Closed</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="choice" id="type-choice" />
            <Label htmlFor="type-choice">Choice</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="selection" id="type-selection" />
            <Label htmlFor="type-selection">Selection</Label>
          </div>
        </RadioGroup>
      </div>

      {(pollType === 'choice' || pollType === 'selection') && (
        <div className="space-y-2">
          <Label htmlFor="poll-options">Options (comma-separated)</Label>
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
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="allow-custom-responses">Allow Custom Responses</Label>
          <Switch
            id="allow-custom-responses"
            checked={allowCustomResponses}
            onCheckedChange={setAllowCustomResponses}
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