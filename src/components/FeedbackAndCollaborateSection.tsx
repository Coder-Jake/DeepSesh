"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FeedbackForm from './FeedbackForm';
import CollaborateForm from './CollaborateForm';
import { MessageSquare, Users } from 'lucide-react';
import { Link } from 'react-router-dom'; // Import Link

const FeedbackAndCollaborateSection = () => {
  return (
    <Card className="mt-8">
      <Link // Moved Link to wrap CardHeader
        to="/feedback" // Link to the new Feedback page
        className="block p-0 rounded-t-lg transition-colors cursor-pointer"
      >
        <CardHeader className="p-6"> {/* Adjusted padding here */}
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Get in Touch
          </CardTitle>
        </CardHeader>
      </Link>
      {/* CardContent removed as requested */}
    </Card>
  );
};

export default FeedbackAndCollaborateSection;