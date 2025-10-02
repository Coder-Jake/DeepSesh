import React from 'react';
import { useTimer } from '@/contexts/TimerContext';
import ScheduleTemplateCard from './ScheduleTemplateCard'; // NEW import
import { Card, CardContent } from '@/components/ui/card'; // Import Card and CardContent for empty state
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScheduleTemplatesProps {
  setActiveTab: (tab: string) => void;
}

const ScheduleTemplates: React.FC<ScheduleTemplatesProps> = ({ setActiveTab }) => {
  const { savedSchedules, setSchedule, setScheduleTitle, setCommenceTime, setCommenceDay, setScheduleStartOption, setIsRecurring, setRecurrenceFrequency } = useTimer();

  const handleCreateNew = () => {
    // Reset current schedule to a default empty state or initial state
    setSchedule([
      { id: crypto.randomUUID(), title: "Beginning", type: "focus", durationMinutes: 25, isCustom: false },
      { id: crypto.randomUUID(), title: "Short Break", type: "break", durationMinutes: 5, isCustom: false },
    ]);
    setScheduleTitle("My New Schedule");
    setCommenceTime("09:00");
    setCommenceDay(new Date().getDay());
    setScheduleStartOption('now');
    setIsRecurring(false);
    setRecurrenceFrequency('daily');
    setActiveTab('plan'); // Switch to plan tab
  };

  return (
    <div className="space-y-4">
      {savedSchedules.length === 0 ? (
        <Card className="p-6 text-center">
          <CardContent className="flex flex-col items-center justify-center p-0">
            <p className="text-muted-foreground mb-4">No saved schedules yet.</p>
            <Button onClick={handleCreateNew} variant="outline">
              <Plus className="mr-2 h-4 w-4" /> Create New Schedule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {savedSchedules.map(template => (
            <ScheduleTemplateCard key={template.id} template={template} setActiveTab={setActiveTab} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ScheduleTemplates;