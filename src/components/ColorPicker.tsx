import React from 'react';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  onSelectColor: (color: string) => void;
  onClose: () => void;
  currentColor?: string;
}

const pastelColors = [
  '#FFD1DC', // Pastel Pink
  '#FFABAB', // Light Red
  '#FFC3A0', // Peach
  '#FF677D', // Coral
  '#D4A5A5', // Rosy Brown
  '#FFD700', // Gold (light)
  '#FFFACD', // Lemon Chiffon
  '#FFECB3', // Light Orange
  '#E6E6FA', // Lavender
  '#B0E0E6', // Powder Blue
  '#ADD8E6', // Light Blue
  '#87CEEB', // Sky Blue
  '#AFEEEE', // Pale Turquoise
  '#98FB98', // Pale Green
  '#C1FFC1', // Light Green
  '#F0FFF0', // Honeydew
  '#F5FFFA', // Mint Cream
  '#F0F8FF', // Alice Blue
];

const ColorPicker: React.FC<ColorPickerProps> = ({ onSelectColor, onClose, currentColor }) => {
  return (
    <div className="absolute z-10 mt-2 p-2 bg-popover border rounded-md shadow-lg" onMouseLeave={onClose}>
      <div className="grid grid-cols-4 gap-1">
        {pastelColors.map((color) => (
          <button
            key={color}
            className={cn(
              "w-6 h-6 rounded-full border-2 border-transparent hover:border-primary transition-all",
              currentColor === color && "border-primary"
            )}
            style={{ backgroundColor: color }}
            onClick={() => onSelectColor(color)}
            aria-label={`Select color ${color}`}
          />
        ))}
      </div>
      <button onClick={onClose} className="mt-2 w-full text-sm text-muted-foreground hover:text-foreground">
        Close
      </button>
    </div>
  );
};

export default ColorPicker;