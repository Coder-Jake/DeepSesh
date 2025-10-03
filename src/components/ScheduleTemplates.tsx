import React from 'react';
import { useTimer } from '@/contexts/TimerContext';
import ScheduleTemplateCard from './ScheduleTemplateCard';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScheduleTemplatesProps {
  setActiveTab: (tab: string) => void;
}

const ScheduleTemplates: React.FC<ScheduleTemplatesProps> = ({ setActiveTab }) => {
  const { 
    savedSchedules, 
    setSchedule, 
    setScheduleTitle, 
    setCommenceTime, 
    setCommenceDay, 
    setScheduleStartOption, 
    setIsRecurring, 
    setRecurrenceFrequency 
  } = useTimer();

  // Defensive check for setSchedule to ensure TimerContext is fully initialized
  if (!setSchedule) {
    console.error("setSchedule is undefined in ScheduleTemplates.tsx. TimerContext might not be fully initialized.");
    return null; 
  }

  const handleCreateNew = () => {
    // Fallback for crypto.randomUUID if not available (e.g., in some test environments)
    const generateId = () => {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
      }
      // Fallback to a simple timestamp-based ID
      return Date.now().toString() + Math.random().toString(36).substring(2, 9);
    };

    setSchedule([
      { id: generateId(), title: "Beginning", type: "focus", durationMinutes: 25, isCustom: false },
      { id: generateId(), title: "Short Break", type: "break", durationMinutes: 5, isCustom: false },
    ]);
    setScheduleTitle("My New Schedule");
    setCommenceTime("09:00");
    setCommenceDay(new Date().getDay());
    setScheduleStartOption('now');
    setIsRecurring(false);
    setRecurrenceFrequency('daily');
    setActiveTab('plan'); // Switch to plan tab
  };

  // Defensive check for savedSchedules before accessing .length
  if (!savedSchedules) {
    console.error("savedSchedules is undefined in ScheduleTemplates.tsx. Rendering fallback.");
    return (
      <div className="space-y-4">
        <Card className="p-6 text-center">
          <CardContent className="flex flex-col items-center justify-center p-0">
            <p className="text-muted-foreground mb-4">Loading schedules...</p>
            <Button onClick={handleCreateNew} variant="outline">
              <Plus className="mr-2 h-4 w-4" /> Create New Schedule
            </Button>
          </CardContent>
        </Card>
        <Button variant="outline" className="w-full" disabled>Load</Button>
      </div>
    );
  }

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {/* Changed to max 2 columns */}
          {savedSchedules.map(template => (
            <ScheduleTemplateCard key={template.id} template={template} setActiveTab={setActiveTab} />
          ))}
        </div>
      )}
      <Button variant="outline" className="w-full" disabled>Load</Button>
    </div>
  );
};

export default ScheduleTemplates;