import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle } from "lucide-react";

interface ExtendTimerFormProps {
  onClose: () => void;
  onSubmit: (minutes: number) => void; // New prop
}

const ExtendTimerForm: React.FC<ExtendTimerFormProps> = ({ onClose, onSubmit }) => {
  const [minutes, setMinutes] = useState(10);
  const { toast } = useToast();

  const handleSubmit = () => {
    if (minutes <= 0) {
      toast({
        title: "Invalid minutes",
        description: "Please enter a positive number of minutes to extend.",
        variant: "destructive",
      });
      return;
    }
    onSubmit(minutes); // Call the onSubmit prop
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="extend-minutes">Minutes to Add</Label>
        <Input
          id="extend-minutes"
          type="number"
          value={minutes}
          onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
          min="1"
          className="w-full"
        />
      </div>
      <DialogFooter>
        <Button onClick={handleSubmit} className="w-full">
          <PlusCircle className="mr-2 h-4 w-4" />
          Suggest
        </Button>
      </DialogFooter>
    </div>
  );
};

export default ExtendTimerForm;