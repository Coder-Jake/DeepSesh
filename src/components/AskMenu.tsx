import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle, MessageSquarePlus, HelpCircle, ArrowLeft } from "lucide-react"; // Import ArrowLeft
import ExtendTimerForm from "./ExtendTimerForm";
import CreatePollForm from "./CreatePollForm";

type AskOption = 'none' | 'extend' | 'poll';
type PollType = 'closed' | 'choice' | 'selection'; // Define PollType here for consistency

interface AskMenuProps {
  onExtendSubmit: (minutes: number) => void;
  onPollSubmit: (question: string, pollType: PollType, options: string[]) => void;
}

const AskMenu: React.FC<AskMenuProps> = ({ onExtendSubmit, onPollSubmit }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentAskOption, setCurrentAskOption] = useState<AskOption>('none');

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setCurrentAskOption('none');
  };

  const handleBack = () => {
    setCurrentAskOption('none');
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="absolute bottom-4 right-4">
          <HelpCircle className="mr-2 h-4 w-4" />
          Ask
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="relative">
          {currentAskOption !== 'none' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <DialogTitle className="text-center">
            {currentAskOption === 'extend' ? 'Suggest Timer Extension' :
             currentAskOption === 'poll' ? 'Create a New Poll' :
             'What would you like to ask?'}
          </DialogTitle>
        </DialogHeader>
        
        {currentAskOption === 'none' && (
          <div className="grid gap-4 py-4">
            <Button 
              variant="outline" 
              className="justify-start" 
              onClick={() => setCurrentAskOption('extend')}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Extend Timer
            </Button>
            <Button 
              variant="outline" 
              className="justify-start" 
              onClick={() => setCurrentAskOption('poll')}
            >
              <MessageSquarePlus className="mr-2 h-4 w-4" />
              Create Poll
            </Button>
          </div>
        )}

        {currentAskOption === 'extend' && (
          <ExtendTimerForm onClose={handleCloseDialog} onSubmit={onExtendSubmit} />
        )}

        {currentAskOption === 'poll' && (
          <CreatePollForm onClose={handleCloseDialog} onSubmit={onPollSubmit} />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AskMenu;