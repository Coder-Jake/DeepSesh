import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTimer } from '@/contexts/TimerContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trash2, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ScheduledTimer } from '@/types/timer';

interface ScheduleTemplate {
  id: string;
  title: string;
  schedule_data: ScheduledTimer[];
  created_at: string;
}

interface ScheduleTemplatesProps {
  setActiveTab: (tab: string) => void;
}

const ScheduleTemplates: React.FC<ScheduleTemplatesProps> = ({ setActiveTab }) => {
  const { loadTemplate } = useTimer();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [highlightedTemplateId, setHighlightedTemplateId] = useState<string | null>(null);

  const { data: templates, isLoading, isError, error } = useQuery<ScheduleTemplate[], Error>({
    queryKey: ['scheduleTemplates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedule_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('schedule_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      toast({
        title: "Template Deleted",
        description: "The schedule template has been successfully removed.",
      });
      queryClient.invalidateQueries({ queryKey: ['scheduleTemplates'] }); // Refetch templates
      if (highlightedTemplateId === templateId) {
        setHighlightedTemplateId(null); // Clear highlight if deleted
      }
    } catch (error: any) {
      console.error("Error deleting template:", error);
      toast({
        title: "Failed to Delete Template",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleTemplateClick = (template: ScheduleTemplate) => {
    if (highlightedTemplateId === template.id) {
      // If already highlighted, load the template and switch to plan tab
      loadTemplate(template.schedule_data, template.title);
      setActiveTab('plan');
      setHighlightedTemplateId(null); // Clear highlight after loading
    } else {
      // Otherwise, just highlight it
      setHighlightedTemplateId(template.id);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading templates...</div>;
  }

  if (isError) {
    return <div className="text-center py-8 text-destructive">Error loading templates: {error?.message}</div>;
  }

  if (!templates || templates.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No saved templates yet. Save one from the Plan tab!</div>;
  }

  return (
    <div className="space-y-4">
      {templates.map((template) => (
        <Card
          key={template.id}
          className={cn(
            "relative cursor-pointer transition-all duration-200",
            highlightedTemplateId === template.id && "border-blue-500 ring-2 ring-blue-500 bg-blue-50" // Added bg-blue-50 for clearer highlighting
          )}
          onClick={() => handleTemplateClick(template)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">{template.title}</CardTitle>
            <div className="flex items-center space-x-2">
              {highlightedTemplateId === template.id && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card click from firing again
                    loadTemplate(template.schedule_data, template.title);
                    setActiveTab('plan');
                    setHighlightedTemplateId(null);
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Play className="h-5 w-5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click from firing again
                  handleDeleteTemplate(template.id);
                }}
                className="text-destructive hover:text-destructive/80"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm text-muted-foreground">
              {template.schedule_data.length} timers • Created: {new Date(template.created_at).toLocaleDateString()}
            </CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ScheduleTemplates;