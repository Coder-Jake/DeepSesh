import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type TimePeriod = 'week' | 'month' | 'all';

interface TimeFilterToggleProps {
  defaultValue?: TimePeriod;
  onValueChange?: (value: TimePeriod) => void;
  className?: string;
}

const TimeFilterToggle = ({
  defaultValue = 'all',
  onValueChange,
  className,
}: TimeFilterToggleProps) => {
  const [activePeriod, setActivePeriod] = useState<TimePeriod>(defaultValue);

  const handleSelect = (period: TimePeriod) => {
    setActivePeriod(period);
    onValueChange?.(period);
  };

  return (
    <div className={cn("flex space-x-1 rounded-md bg-muted p-1", className)}>
      <Button
        variant={activePeriod === 'week' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleSelect('week')}
        className="h-8 px-3 text-xs"
      >
        Week
      </Button>
      <Button
        variant={activePeriod === 'month' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleSelect('month')}
        className="h-8 px-3 text-xs"
      >
        Month
      </Button>
      <Button
        variant={activePeriod === 'all' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleSelect('all')}
        className="h-8 px-3 text-xs"
      >
        All Time
      </Button>
    </div>
  );
};

export default TimeFilterToggle;