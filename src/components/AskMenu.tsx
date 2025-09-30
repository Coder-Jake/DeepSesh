import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle, MessageSquarePlus, HelpCircle } from "lucide-react";
import ExtendTimerForm from "./ExtendTimerForm";
import CreatePollForm from "./CreatePollForm";

type AskOption = 'extend' | 'poll';

interface AskMenuProps {
  onExtendSubmit: (minutes: number) => void;
  onPollSubmit: (question: string, pollType: PollType, options: string[], allowCustomResponses: boolean) => void;
}

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
        <Button variant="outline" size="sm" className="absolute bottom-4 right-4">
          <HelpCircle className="mr-2 h-4 w-4" />
          Ask
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] min-h-[450px] flex flex-col">
        
        {/* Persistent tab-like buttons */}
        <div className="flex border-b"> {/* Removed justify-center, gap-2, and p-4 */}
          <Button
            variant={currentAskOption === 'extend' ? 'default' : 'ghost'}
            onClick={() => setCurrentAskOption('extend')}
            className="flex-1 rounded-none" // Added rounded-none for tab-like appearance
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Timer
          </Button>
          <Button
            variant={currentAskOption === 'poll' ? 'default' : 'ghost'}
            onClick={() => setCurrentAskOption('poll')}
            className="flex-1 rounded-none" // Added rounded-none for tab-like appearance
          >
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            Poll
          </Button>
        </div>

        {/* Form content, taking remaining space */}
        <div className="flex-grow p-4">
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