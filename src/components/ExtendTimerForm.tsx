import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from 'sonner'; // MODIFIED: Import toast directly from sonner
import { PlusCircle } from "lucide-react";
import { useTimer } from "@/contexts/TimerContext"; // Import useTimer

interface ExtendTimerFormProps {
  onClose: () => void;
  onSubmit: (minutes: number) => void; // New prop
}

const ExtendTimerForm: React.FC<ExtendTimerFormProps> = ({ onClose, onSubmit }) => {
  const { timerIncrement, areToastsEnabled } = useTimer(); // Get timerIncrement and areToastsEnabled from context
  const [minutes, setMinutes] = useState(timerIncrement); // Default to timerIncrement
  // Removed: const { toast } = useToast();

  const handleSubmit = () => {
    if (minutes <= 0) { // Changed condition to be greater than 0
      if (areToastsEnabled) { // NEW: Conditional toast
        toast.error("Invalid minutes", { // MODIFIED: Changed to toast.error for sonner
          description: `Please enter a positive number of minutes to extend (minimum ${timerIncrement}).`,
        });
      }
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
          value={minutes === 0 ? "" : minutes}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "") {
              setMinutes(0);
            } else {
              setMinutes(parseFloat(value) || 0);
            }
          }}
          onBlur={() => {
            if (minutes === 0) {
              setMinutes(timerIncrement);
            }
          }}
          min={timerIncrement} // Set min to timerIncrement
          step={timerIncrement} // Set step to timerIncrement
          className="w-full"
          onFocus={(e) => e.target.select()}
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