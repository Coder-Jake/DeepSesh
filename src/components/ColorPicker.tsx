import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  onSelectColor: (color: string) => void;
  onClose: () => void;
  currentColor?: string;
}

const LOCAL_STORAGE_RECENT_COLORS_KEY = 'deepsesh_recent_colors';
const MAX_RECENT_COLORS = 10; // Limit the number of recently chosen colors

// The original set of colors
const fixedColors = [
  '#ffadad', // Melon
  '#ffd6a5', // Sunset
  '#fdffb6', // Cream
  '#caffbf', // Tea Green
  '#9bf6ff', // Electric Blue
  '#a0c4ff', // Jordy Blue
  '#bdb2ff', // Periwinkle
  '#ffc6ff', // Mauve
  '#fffffc', // Baby Powder
];

// A lighter version of the fixed colors
const lighterFixedColors = [
  '#ffe0e0', // Lighter Melon
  '#ffedda', // Lighter Sunset
  '#feffdd', // Lighter Cream
  '#e0ffdf', // Lighter Tea Green
  '#d0faff', // Lighter Electric Blue
  '#d4e3ff', // Lighter Jordy Blue
  '#e0daff', // Lighter Periwinkle
  '#ffeaff', // Lighter Mauve
  '#ffffff', // Lighter Baby Powder (pure white)
];

const ColorPicker: React.FC<ColorPickerProps> = ({ onSelectColor, onClose, currentColor }) => {
  const [recentColors, setRecentColors] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const storedColors = localStorage.getItem(LOCAL_STORAGE_RECENT_COLORS_KEY);
      const initialColors = storedColors ? JSON.parse(storedColors) : [];
      // Filter out any old recent colors that are not in the new fixed palette (both original and lighter)
      const allAvailableColors = [...fixedColors, ...lighterFixedColors];
      const filteredInitialColors = initialColors.filter((color: string) => allAvailableColors.includes(color));
      return filteredInitialColors;
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_RECENT_COLORS_KEY, JSON.stringify(recentColors));
    }
  }, [recentColors]);

  const handleColorSelection = useCallback((color: string) => {
    onSelectColor(color);
    setRecentColors(prevColors => {
      // Remove the color if it already exists to move it to the front
      const filtered = prevColors.filter(c => c !== color);
      // Add the new color to the front and limit the array size
      const newRecentColors = [color, ...filtered].slice(0, MAX_RECENT_COLORS);
      return newRecentColors;
    });
  }, [onSelectColor]);

  return (
    <div className="p-2 bg-popover border rounded-md shadow-lg w-[300px]" onMouseLeave={onClose}>
      {recentColors.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-muted-foreground mb-1">Recently Used</p>
          <div className="grid grid-cols-10 gap-1">
            {recentColors.map((color) => (
              <button
                key={color}
                className={cn(
                  "w-6 h-6 rounded-full border-2 border-transparent hover:border-primary transition-all",
                  currentColor === color && "border-primary"
                )}
                style={{ backgroundColor: color }}
                onClick={() => handleColorSelection(color)}
                aria-label={`Select recent color ${color}`}
              />
            ))}
          </div>
          <div className="border-b border-border my-3" /> {/* Separator */}
        </div>
      )}

      <div className="mb-3"> {/* Added mb-3 for spacing between rows */}
        <p className="text-xs text-muted-foreground mb-1">Original</p>
        <div className="grid grid-cols-10 gap-1">
          {fixedColors.map((color) => (
            <button
              key={color}
              className={cn(
                "w-6 h-6 rounded-full border-2 border-transparent hover:border-primary transition-all",
                currentColor === color && "border-primary"
              )}
              style={{ backgroundColor: color }}
              onClick={() => handleColorSelection(color)}
              aria-label={`Select color ${color}`}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs text-muted-foreground mb-1">Lighter</p>
        <div className="grid grid-cols-10 gap-1">
          {lighterFixedColors.map((color) => (
            <button
              key={color}
              className={cn(
                "w-6 h-6 rounded-full border-2 border-transparent hover:border-primary transition-all",
                currentColor === color && "border-primary"
              )}
              style={{ backgroundColor: color }}
              onClick={() => handleColorSelection(color)}
              aria-label={`Select lighter color ${color}`}
            />
          ))}
        </div>
      </div>
      
      <button onClick={onClose} className="mt-2 w-full text-sm text-muted-foreground hover:text-foreground">
        Close
      </button>
    </div>
  );
};

export default ColorPicker;