"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTimer } from "@/contexts/TimerContext";
import { ScheduledTimer } from "@/types/timer";
import { Plus, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ScheduleTemplate {
  id: string;
  title: string;
  description: string;
  schedule: ScheduledTimer[];
}

const dummyTemplates: ScheduleTemplate[] = [
  {
    id: "template-1",
    title: "Classic Pomodoro",
    description: "25 min focus, 5 min break, repeat.",
    schedule: [
      { id: crypto.randomUUID(), title: "Focus", type: "focus", durationMinutes: 25, isCustom: false },
      { id: crypto.randomUUID(), title: "Short Break", type: "break", durationMinutes: 5, isCustom: false },
      { id: crypto.randomUUID(), title: "Focus", type: "focus", durationMinutes: 25, isCustom: false },
      { id: crypto.randomUUID(), title: "Short Break", type: "break", durationMinutes: 5, isCustom: false },
      { id: crypto.randomUUID(), title: "Focus", type: "focus", durationMinutes: 25, isCustom: false },
      { id: crypto.randomUUID(), title: "Short Break", type: "break", durationMinutes: 5, isCustom: false },
      { id: crypto.randomUUID(), title: "Focus", type: "focus", durationMinutes: 25, isCustom: false },
      { id: crypto.randomUUID(), title: "Long Break", type: "break", durationMinutes: 15, isCustom: false },
    ],
  },
  {
    id: "template-2",
    title: "Deep Work Session",
    description: "Long focus blocks with short, frequent breaks.",
    schedule: [
      { id: crypto.randomUUID(), title: "Deep Focus", type: "focus", durationMinutes: 60, isCustom: false },
      { id: crypto.randomUUID(), title: "Stretch Break", type: "break", durationMinutes: 10, isCustom: false },
      { id: crypto.randomUUID(), title: "Deep Focus", type: "focus", durationMinutes: 60, isCustom: false },
      { id: crypto.randomUUID(), title: "Hydrate Break", type: "break", durationMinutes: 10, isCustom: false },
      { id: crypto.randomUUID(), title: "Deep Focus", type: "focus", durationMinutes: 60, isCustom: false },
      { id: crypto.randomUUID(), title: "Lunch Break", type: "break", durationMinutes: 45, isCustom: false },
    ],
  },
  {
    id: "template-3",
    title: "Meeting Marathon",
    description: "Short breaks between back-to-back meetings.",
    schedule: [
      { id: crypto.randomUUID(), title: "Meeting Prep", type: "focus", durationMinutes: 15, isCustom: false },
      { id: crypto.randomUUID(), title: "Meeting 1", type: "focus", durationMinutes: 30, isCustom: false },
      { id: crypto.randomUUID(), title: "Quick Break", type: "break", durationMinutes: 5, isCustom: false },
      { id: crypto.randomUUID(), title: "Meeting 2", type: "focus", durationMinutes: 45, isCustom: false },
      { id: crypto.randomUUID(), title: "Coffee Break", type: "break", durationMinutes: 10, isCustom: false },
    ],
  },
];

const ScheduleTemplates: React.FC = () => {
  const { setSchedule, setScheduleTitle, setIsSchedulingMode, startSchedule } = useTimer();
  const { toast } = useToast();

  const handleLoadTemplate = (template: ScheduleTemplate) => {
    setSchedule(template.schedule);
    setScheduleTitle(template.title);
    toast({
      title: "Template Loaded",
      description: `"${template.title}" schedule loaded successfully.`,
    });
    // Optionally switch back to the 'New' tab or directly start the schedule
    // For now, we'll just load it and let the user decide to start from the 'New' tab.
  };

  const handleCommenceTemplate = (template: ScheduleTemplate) => {
    setSchedule(template.schedule);
    setScheduleTitle(template.title);
    startSchedule(); // Directly start the schedule
  };

  return (
    <div className="space-y-4">
      {dummyTemplates.map((template) => (
        <Card key={template.id} className="p-4">
          <CardHeader className="flex flex-row items-center justify-between p-0 pb-2">
            <CardTitle className="text-lg">{template.title}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleLoadTemplate(template)}>
                <Plus className="mr-2 h-4 w-4" /> Load
              </Button>
              <Button size="sm" onClick={() => handleCommenceTemplate(template)}>
                <Play className="mr-2 h-4 w-4" /> Commence
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 text-sm text-muted-foreground">
            {template.description}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ScheduleTemplates;