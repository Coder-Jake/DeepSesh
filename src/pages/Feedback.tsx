import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

const Feedback = () => {
  const googleFormUrl = "https://docs.google.com/forms/d/e/1FAIpQLSfgO0G-w1AxSEUyQQ_CIeUe8pH9uKCY-u3khmwNnypHU4_xuQ/viewform?embedded=true";

  return (
    <main className="max-w-4xl mx-auto pt-16 px-4 pb-4 lg:pt-20 lg:px-6 lg:pb-6">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <MessageSquare className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Feedback</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          We'd love to hear your thoughts, suggestions, or any issues you've encountered.
        </p>
      </div>

      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-xl">Share Your Feedback</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <iframe
            src={googleFormUrl}
            width="100%"
            height="800" // Adjust height as needed
            frameBorder="0"
            marginHeight={0}
            marginWidth={0}
            className="rounded-b-lg"
            title="DeepSesh Feedback Form"
          >
            Loading...
          </iframe>
        </CardContent>
      </Card>
    </main>
  );
};

export default Feedback;