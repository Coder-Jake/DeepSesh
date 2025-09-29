import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Play, X } from "lucide-react";
import { useTimer } from "@/contexts/TimerContext";
import { ScheduledTimer } from "@/types/timer";
import { useToast } from "@/hooks/use-toast";

const ScheduleForm: React.FC = () => {
  const { setSchedule, setIsSchedulingMode, startSchedule } = useTimer();
  const { toast } = useToast();

  const [localSchedule, setLocalSchedule] = useState<ScheduledTimer[]>([
    { id: crypto.randomUUID(), title: "Deep Focus", type: "focus", durationMinutes: 25 },
    { id: crypto.randomUUID(), title: "Short Break", type: "break", durationMinutes: 5 },
  ]);

  const handleAddTimer = () => {
    setLocalSchedule(prev => [
      ...prev,
      { id: crypto.randomUUID(), title: "New Timer", type: "focus", durationMinutes: 25 }
    ]);
  };

  const handleUpdateTimer = (id: string, field: keyof ScheduledTimer, value: any) => {
    setLocalSchedule(prev =>
      prev.map(timer =>
        timer.id === id ? { ...timer, [field]: value } : timer
      )
    );
  };

  const handleRemoveTimer = (id: string) => {
    setLocalSchedule(prev => prev.filter(timer => timer.id !== id));
  };

  const handleCommenceSchedule = () => {
    if (localSchedule.length === 0) {
      toast({
        title: "No Timers in Schedule",
        description: "Please add at least one timer to your schedule.",
        variant: "destructive",
      });
      return;
    }
    if (localSchedule.some(timer => timer.durationMinutes <= 0)) {
      toast({
        title: "Invalid Duration",
        description: "All timers must have a duration greater than 0 minutes.",
        variant: "destructive",
      });
      return;
    }
    setSchedule(localSchedule);
    startSchedule();
  };

  return (
    <Card className="p-6">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-2xl font-bold">Create Schedule</CardTitle>
        <Button variant="ghost" size="icon" onClick={() => setIsSchedulingMode(false)}>
          <X className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {localSchedule.map((timer, index) => (
            <div key={timer.id} className="flex items-center gap-4 p-3 border rounded-md bg-muted/50">
              <span className="font-semibold text-lg text-primary">{index + 1}.</span>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <Input
                  placeholder="Timer Title"
                  value={timer.title}
                  onChange={(e) => handleUpdateTimer(timer.id, 'title', e.target.value)}
                  className="col-span-full sm:col-span-1"
                />
                <Input
                  type="number"
                  placeholder="Minutes"
                  value={timer.durationMinutes}
                  onChange={(e) => handleUpdateTimer(timer.id, 'durationMinutes', parseInt(e.target.value) || 0)}
                  min="1"
                  className="col-span-full sm:col-span-1"
                />
                <div className="flex items-center justify-between col-span-full sm:col-span-1">
                  <Label htmlFor={`timer-type-${timer.id}`} className="text-sm">
                    {timer.type === 'focus' ? 'Focus' : 'Break'}
                  </Label>
                  <Switch
                    id={`timer-type-${timer.id}`}
                    checked={timer.type === 'break'}
                    onCheckedChange={(checked) => handleUpdateTimer(timer.id, 'type', checked ? 'break' : 'focus')}
                  />
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleRemoveTimer(timer.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>

        <Button onClick={handleAddTimer} variant="outline" className="w-full">
          <Plus className="mr-2 h-4 w-4" /> Add Timer
        </Button>

        <Button onClick={handleCommenceSchedule} className="w-full h-12 text-lg">
          <Play className="mr-2 h-5 w-5" /> Commence Schedule
        </Button>
      </CardContent>
    </Card>
  );
};

export default ScheduleForm;