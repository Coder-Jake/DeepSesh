"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FeedbackForm from './FeedbackForm';
import CollaborateForm from './CollaborateForm';
import { MessageSquare, Users } from 'lucide-react';

const FeedbackAndCollaborateSection = () => {
  return (
    <Card className="mt-8">
      <CardHeader className="p-0">
        <a
          href="https://deepsesh.com.au/#contact"
          target="_blank"
          rel="noopener noreferrer"
          className="block py-2 px-6 hover:bg-accent/50 rounded-t-lg transition-colors cursor-pointer" // Reduced py-6 to py-2
        >
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Get in Touch
          </CardTitle>
        </a>
      </CardHeader>
      <CardContent className="relative py-2 px-6"> {/* Reduced p-4 to py-2 px-6 */}
        {/* Overlay for redirection and visual disable */}
        <a
          href="https://deepsesh.com.au/#contact"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg cursor-pointer"
        >
          <div className="text-center p-4">
            <p className="text-lg font-semibold text-foreground">Feedback Form</p>
          </div>
        </a>

        {/* Original content, visually greyed out and non-interactive */}
        <div className="opacity-50 pointer-events-none">
          <Tabs defaultValue="feedback" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="feedback" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Feedback
              </TabsTrigger>
              <TabsTrigger value="collaborate" className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Collaborate
              </TabsTrigger>
            </TabsList>
            <TabsContent value="feedback" className="mt-4 space-y-4">
              <p className="text-sm text-muted-foreground">Report an idea/issue</p>
              <FeedbackForm />
            </TabsContent>
            <TabsContent value="collaborate" className="mt-4 space-y-4">
              <p className="text-sm text-muted-foreground">I need IT people</p>
              <CollaborateForm />
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeedbackAndCollaborateSection;