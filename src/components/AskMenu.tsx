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

type AskOption = 'none' | 'extend' | 'poll';

const AskMenu: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentAskOption, setCurrentAskOption] = useState<AskOption>('none');

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
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
        <DialogHeader>
          <DialogTitle>
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
          <ExtendTimerForm onClose={handleCloseDialog} />
        )}

        {currentAskOption === 'poll' && (
          <CreatePollForm onClose={handleCloseDialog} />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AskMenu;