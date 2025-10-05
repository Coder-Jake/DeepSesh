import React from 'react';
import { useGlobalTooltip } from '@/contexts/GlobalTooltipContext';

const GlobalTooltip: React.FC = () => {
  const { tooltipContent, tooltipPosition, isTooltipVisible } = useGlobalTooltip();

  if (!isTooltipVisible || !tooltipContent || !tooltipPosition) {
    return null;
  }

  // Adjust position to be slightly offset from the cursor
  const style: React.CSSProperties = {
    position: 'fixed',
    left: tooltipPosition.x + 15, // 15px offset to the right
    top: tooltipPosition.y + 15,  // 15px offset downwards
    zIndex: 9999, // Ensure it's on top of everything
    pointerEvents: 'none', // Make it not interfere with mouse events
  };

  return (
    <div
      style={style}
      className="bg-popover text-popover-foreground px-3 py-1.5 rounded-md shadow-lg text-sm whitespace-nowrap border border-border"
    >
      {tooltipContent}
    </div>
  );
};

export default GlobalTooltip;