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
      {/* CardContent removed as requested */}
    </Card>
  );
};

export default FeedbackAndCollaborateSection;