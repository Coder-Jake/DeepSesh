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
  '#FFECB3', // Light Orange
  '#FFFACD', // Lemon Chiffon
  '#E0FFFF', // Light Cyan
  '#ADD8E6', // Light Blue
  '#B0E0E6', // Powder Blue
  '#AFEEEE', // Pale Turquoise
  '#98FB98', // Pale Green
  '#C1FFC1', // Light Green
  '#F0FFF0', // Honeydew
  '#E6E6FA', // Lavender
  '#DDA0DD', // Plum (light)
  '#FFB6C1', // Light Coral
  '#FFDAB9', // Peach Puff
  '#FFE4E1', // Misty Rose
  '#F0E68C', // Khaki (light)
  '#FAFAD2', // Light Goldenrod Yellow
  '#D8BFD8', // Thistle
  '#BAE8E8', // Light Teal
  '#CDEAC0', // Mint Green
  '#F5DEB3', // Wheat
  '#FFEFD5', // Papaya Whip
  '#D3F8E2', // Mint Cream
  '#FADADD', // Cherry Blossom Pink
  '#E2F0CB', // Light Sage
  '#BEE9E4', // Aqua Haze
  '#FCE8D5', // Apricot Wash
  '#D4E2FC', // Periwinkle Blue
  '#F0E0F0', // Lavender Blush
  '#C8E6C9', // Light Greenish Gray
  '#FFF0F5', // Lavender Rose
  '#D7EEFF', // Sky Blue Light
  '#F5F5DC', // Beige
  '#E0BBE4', // Mauve
  '#957DAD', // Medium Purple
  '#D291BC', // Light Magenta
  '#FFC72C', // Goldenrod (light)
  '#A7DBD8', // Light Teal Blue
  '#E8D3FF', // Light Violet
  '#C9E4DE', // Light Seafoam
  '#F7CAC9', // Rose Quartz
  '#B5EAD7', // Mint Green Pastel
];

const ColorPicker: React.FC<ColorPickerProps> = ({ onSelectColor, onClose, currentColor }) => {
  return (
    <div className="absolute z-10 mt-2 p-2 bg-popover border rounded-md shadow-lg w-1/4 min-w-[280px]" onMouseLeave={onClose}>
      <div className="grid grid-cols-10 gap-1"> {/* Changed to grid-cols-10 for more horizontal spread */}
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