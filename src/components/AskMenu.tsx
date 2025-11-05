import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader, // Added DialogHeader
  DialogTitle,  // Added DialogTitle
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle, MessageSquarePlus, HelpCircle } from "lucide-react";
import ExtendTimerForm from "./ExtendTimerForm";
import CreatePollForm, { PollType } from "./CreatePollForm";

interface AskMenuProps {
  onExtendSubmit: (minutes: number) => void;
  onPollSubmit: (question: string, pollType: PollType, options: string[], allowCustomResponses: boolean) => void;
}

type AskOption = 'extend' | 'poll'; // Defined AskOption type

const AskMenu: React.FC<AskMenuProps> = ({ onExtendSubmit, onPollSubmit }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentAskOption, setCurrentAskOption] = useState<AskOption>('extend');

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setCurrentAskOption('extend');
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full mt-4"> {/* Changed positioning and added margin-top */}
          <HelpCircle className="mr-2 h-4 w-4" />
          Ask
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[425px] max-h-[90vh] overflow-y-auto top-[5%] translate-y-0 flex flex-col">
        {/* Persistent tab-like buttons */}
        <div className="flex border-b">
          <Button
            variant={currentAskOption === 'extend' ? 'default' : 'ghost'}
            onClick={() => setCurrentAskOption('extend')}
            className="flex-1 rounded-none"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Timer
          </Button>
          <Button
            variant={currentAskOption === 'poll' ? 'default' : 'ghost'}
            onClick={() => setCurrentAskOption('poll')}
            className="flex-1 rounded-none"
          >
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            Poll
          </Button>
        </div>

        {/* Form content, taking remaining space */}
        <div className="flex-grow p-0 overflow-auto">
          {currentAskOption === 'extend' && (
            <ExtendTimerForm onClose={handleCloseDialog} onSubmit={onExtendSubmit} />
          )}

          {currentAskOption === 'poll' && (
            <CreatePollForm onClose={handleCloseDialog} onSubmit={onPollSubmit} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AskMenu;