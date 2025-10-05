import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  onSelectColor: (color: string) => void;
  onClose: () => void;
  currentColor?: string;
}

const LOCAL_STORAGE_RECENT_COLORS_KEY = 'deepsesh_recent_colors';
const MAX_RECENT_COLORS = 10; // Limit the number of recently chosen colors

// The original set of colors with new blue and green, grouped
const fixedColors = [
  '#ffadad', // Melon
  '#ffd6a5', // Sunset
  '#fdffb6', // Cream
  '#caffbf', // Tea Green
  '#90EE90', // Light Green (New Green)
  '#9bf6ff', // Electric Blue
  '#a0c4ff', // Jordy Blue
  '#87CEEB', // Sky Blue (New Blue)
  '#bdb2ff', // Periwinkle
  '#ffc6ff', // Mauve
  '#fffffc', // Baby Powder
];

// A lighter version of the fixed colors with new blue and green, grouped
const lighterFixedColors = [
  '#ffe0e0', // Lighter Melon
  '#ffedda', // Lighter Sunset
  '#feffdd', // Lighter Cream
  '#e0ffdf', // Lighter Tea Green
  '#C1FFC1', // Lighter Light Green
  '#d0faff', // Lighter Electric Blue
  '#d4e3ff', // Lighter Jordy Blue
  '#ADD8E6', // Lighter Sky Blue
  '#e0daff', // Lighter Periwinkle
  '#ffeaff', // Lighter Mauve
  '#ffffff', // Lighter Baby Powder (pure white)
];

// A darker version of the fixed colors with new blue and green, grouped
const darkerFixedColors = [
  '#cc8a8a', // Darker Melon
  '#ccac84', // Darker Sunset
  '#c9cc92', // Darker Cream
  '#9fcc98', // Darker Tea Green
  '#6BCC6B', // Darker Light Green
  '#7ab7cc', // Darker Electric Blue
  '#7f9ccb', // Darker Jordy Blue
  '#6A9ACD', // Darker Sky Blue
  '#968fcc', // Darker Periwinkle
  '#cc9fcc', // Darker Mauve
  '#ccccca', // Darker Baby Powder (light grey)
];

const ColorPicker: React.FC<ColorPickerProps> = ({ onSelectColor, onClose, currentColor }) => {
  const [recentColors, setRecentColors] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const storedColors = localStorage.getItem(LOCAL_STORAGE_RECENT_COLORS_KEY);
      const initialColors = storedColors ? JSON.parse(storedColors) : [];
      // Filter out any old recent colors that are not in the new fixed palette (all three versions)
      const allAvailableColors = [...fixedColors, ...lighterFixedColors, ...darkerFixedColors];
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
    <div className="p-2 bg-popover border rounded-md shadow-lg w-[50px] h-[300px] overflow-y-auto" onMouseLeave={onClose}>
      {recentColors.length > 0 && (
        <div className="mb-3">
          <div className="grid grid-cols-1 gap-1">
            {recentColors.map((color) => (
              <button
                key={color}
                className={cn(
                  "w-6 h-6 rounded-full border-2 border-transparent hover:border-primary transition-all mx-auto",
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

      <div className="mb-3">
        <div className="grid grid-cols-1 gap-1">
          {darkerFixedColors.map((color) => (
            <button
              key={color}
              className={cn(
                "w-6 h-6 rounded-full border-2 border-transparent hover:border-primary transition-all mx-auto",
                currentColor === color && "border-primary"
              )}
              style={{ backgroundColor: color }}
              onClick={() => handleColorSelection(color)}
              aria-label={`Select darker color ${color}`}
            />
          ))}
        </div>
      </div>

      <div className="mb-3">
        <div className="grid grid-cols-1 gap-1">
          {fixedColors.map((color) => (
            <button
              key={color}
              className={cn(
                "w-6 h-6 rounded-full border-2 border-transparent hover:border-primary transition-all mx-auto",
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
        <div className="grid grid-cols-1 gap-1">
          {lighterFixedColors.map((color) => (
            <button
              key={color}
              className={cn(
                "w-6 h-6 rounded-full border-2 border-transparent hover:border-primary transition-all mx-auto",
                currentColor === color && "border-primary"
              )}
              style={{ backgroundColor: color }}
              onClick={() => handleColorSelection(color)}
              aria-label={`Select lighter color ${color}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;