"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Eye, Edit } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownEditorProps {
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  readOnly?: boolean;
  className?: string;
  isCoworkerView?: boolean; // NEW: Prop to indicate if it's a coworker viewing (read-only, no edit toggle)
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = "Type your notes here...",
  rows = 5,
  readOnly = false,
  className,
  isCoworkerView = false,
}) => {
  const [isEditing, setIsEditing] = useState(true);

  // If it's a coworker view, always show preview and disable editing
  useEffect(() => {
    if (isCoworkerView) {
      setIsEditing(false);
    }
  }, [isCoworkerView]);

  const handleToggleEdit = useCallback(() => {
    if (!readOnly && !isCoworkerView) {
      setIsEditing(prev => !prev);
    }
  }, [readOnly, isCoworkerView]);

  const markdownContent = value || '';

  return (
    <div className={cn("relative flex flex-col", className)}>
      {!readOnly && !isCoworkerView && (
        <div className="flex justify-end mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleEdit}
            className="flex items-center gap-1 text-muted-foreground hover:bg-accent-hover"
          >
            {isEditing ? <Eye size={16} /> : <Edit size={16} />}
            <span className="text-xs">{isEditing ? 'Preview' : 'Edit'}</span>
          </Button>
        </div>
      )}

      {isEditing && !isCoworkerView ? (
        <Textarea
          value={markdownContent}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          readOnly={readOnly}
          className="resize-none overflow-hidden min-h-[100px]"
        />
      ) : (
        <div
          className={cn(
            "prose dark:prose-invert max-w-none p-3 border rounded-md min-h-[100px] overflow-auto",
            "prose-sm sm:prose lg:prose-lg xl:prose-xl", // Tailwind Typography classes for styling markdown
            markdownContent.trim() === '' && "text-muted-foreground italic"
          )}
        >
          {markdownContent.trim() === '' ? (
            <p>{placeholder}</p>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {markdownContent}
            </ReactMarkdown>
          )}
        </div>
      )}
    </div>
  );
};

export default MarkdownEditor;