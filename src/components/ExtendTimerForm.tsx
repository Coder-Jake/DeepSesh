import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle } from "lucide-react";
import { useTimer } from "@/contexts/TimerContext"; // Import useTimer

interface ExtendTimerFormProps {
  onClose: () => void;
  onSubmit: (minutes: number) => void; // New prop
}

const ExtendTimerForm: React.FC<ExtendTimerFormProps> = ({ onClose, onSubmit }) => {
  const { timerIncrement } = useTimer(); // Get timerIncrement from context
  const [minutes, setMinutes] = useState(timerIncrement); // Default to timerIncrement
  const { toast } = useToast();

  const handleSubmit = () => {
    if (minutes <= 0) { // Changed condition to be greater than 0
      toast({
        title: "Invalid minutes",
        description: `Please enter a positive number of minutes to extend (minimum ${timerIncrement}).`,
        variant: "destructive",
      });
      return;
    }
    onSubmit(minutes); // Call the onSubmit prop
    onClose();
  };

  return (
    <div className="space-y-4 flex flex-col flex-grow"> {/* Added flex flex-col flex-grow */}
      <div className="space-y-2">
        <Label htmlFor="extend-minutes">Minutes to Add</Label>
        <Input
          id="extend-minutes"
          type="number"
          value={minutes}
          onChange={(e) => {
            const value = parseInt(e.target.value) || timerIncrement;
            const roundedValue = Math.max(timerIncrement, Math.round(value / timerIncrement) * timerIncrement);
            setMinutes(roundedValue);
          }}
          min={timerIncrement} // Set min to timerIncrement
          step={timerIncrement} // Set step to timerIncrement
          className="w-full"
        />
      </div>
      <DialogFooter className="mt-auto"> {/* Added mt-auto to push to bottom */}
        <Button onClick={handleSubmit} className="w-full">
          <PlusCircle className="mr-2 h-4 w-4" />
          Suggest
        </Button>
      </DialogFooter>
    </div>
  );
};

export default ExtendTimerForm;