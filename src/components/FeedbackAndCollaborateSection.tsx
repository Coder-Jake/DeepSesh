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
          className="block p-6 hover:bg-accent/50 rounded-t-lg transition-colors cursor-pointer"
        >
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Get in Touch
          </CardTitle>
        </a>
      </CardHeader>
      <CardContent className="relative">
        {/* Original content, now fully interactive */}
        <div>
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