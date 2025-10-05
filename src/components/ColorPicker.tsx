import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  onSelectColor: (color: string) => void;
  onClose: () => void;
  currentColor?: string;
}

const LOCAL_STORAGE_RECENT_COLORS_KEY = 'deepsesh_recent_colors';
const MAX_RECENT_COLORS = 10; // Limit the number of recently chosen colors

// Helper function to convert Hex to HSL
const hexToHsl = (hex: string) => {
  let r = 0, g = 0, b = 0;
  // Handle different hex formats
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }

  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
};

const unsortedPastelColors = [
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

// Sort pastelColors by HSL values for visual similarity
const pastelColors = [...unsortedPastelColors].sort((a, b) => {
  const hslA = hexToHsl(a);
  const hslB = hexToHsl(b);

  // Primary sort by Hue
  if (hslA.h !== hslB.h) {
    return hslA.h - hslB.h;
  }
  // Secondary sort by Saturation
  if (hslA.s !== hslB.s) {
    return hslA.s - hslB.s;
  }
  // Tertiary sort by Lightness
  return hslA.l - hslB.l;
});

const ColorPicker: React.FC<ColorPickerProps> = ({ onSelectColor, onClose, currentColor }) => {
  const [recentColors, setRecentColors] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const storedColors = localStorage.getItem(LOCAL_STORAGE_RECENT_COLORS_KEY);
      return storedColors ? JSON.parse(storedColors) : [];
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
      return [color, ...filtered].slice(0, MAX_RECENT_COLORS);
    });
  }, [onSelectColor]);

  return (
    <div className="absolute z-10 mt-2 p-2 bg-popover border rounded-md shadow-lg w-1/4 min-w-[280px]" onMouseLeave={onClose}>
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

      <div className="grid grid-cols-10 gap-1">
        {pastelColors.map((color) => (
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
      <button onClick={onClose} className="mt-2 w-full text-sm text-muted-foreground hover:text-foreground">
        Close
      </button>
    </div>
  );
};

export default ColorPicker;