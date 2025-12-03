"use client";

import React, { useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  isCoworkerView?: boolean;
  initialRows?: number; // New prop for initial visible rows
  maxRows?: number; // New prop for maximum visible rows
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder,
  readOnly = false,
  isCoworkerView = false,
  initialRows = 3, // Default initial rows
  maxRows = 10, // Default max rows
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height to calculate scrollHeight correctly
      const scrollHeight = textareaRef.current.scrollHeight;
      const computedStyle = getComputedStyle(textareaRef.current);
      const lineHeight = parseFloat(computedStyle.lineHeight) || 20; // Fallback to 20px

      // Calculate min and max heights based on initialRows and maxRows
      const minCalculatedHeight = initialRows * lineHeight;
      const maxCalculatedHeight = maxRows * lineHeight;

      // Set height, clamping between min and max
      textareaRef.current.style.height = `${Math.min(Math.max(minCalculatedHeight, scrollHeight), maxCalculatedHeight)}px`;

      // Ensure overflow-y is hidden unless content truly exceeds max height
      if (scrollHeight > maxCalculatedHeight) {
        textareaRef.current.style.overflowY = 'auto';
      } else {
        textareaRef.current.style.overflowY = 'hidden';
      }
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value, initialRows, maxRows]); // Re-adjust height when value or row limits change

  // Also adjust height on window resize
  useEffect(() => {
    window.addEventListener('resize', adjustHeight);
    return () => {
      window.removeEventListener('resize', adjustHeight);
    };
  }, []);

  return (
    <Textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      className={cn(
        "resize-none", // Prevent manual resizing
        isCoworkerView && "bg-muted text-muted-foreground",
        readOnly && "cursor-default"
      )}
      style={{
        minHeight: `${initialRows * 1.5}em`, // Initial min-height based on estimated line height
        maxHeight: `${maxRows * 1.5}em`,   // Max height before scrollbar appears
      }}
    />
  );
};

export default MarkdownEditor;