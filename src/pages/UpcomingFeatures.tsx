import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const UpcomingFeatures = () => {
  const features = [
    { name: "Mobile App", cost: "$12,000", description: "Native applications for iOS and Android, enabling on-the-go focus and collaboration." },
    { name: "User Verification", cost: "$6,000", description: "Implement robust identity verification to enhance trust and security within the community. Filter to only interact with verified coworkers." },
    { name: "Real-time Collaboration", cost: "$5,000", description: "Shared notes, coworker polling, and live interaction during sessions." },
    { name: "Leaderboard", cost: "$3,500", description: "Weekly, Monthly, and All Time leaderboards. Including gamified elements to track and display user achievements, streaks, and focus hours." },
    { name: "Personal Statistics", cost: "$3,000", description: "Detailed analytics and insights into individual focus patterns, productivity, and session history." },
    { name: "Stake Accountability", cost: "$7,500", description: "Allow users to set stakes (e.g., donate to charity) for meeting their focus goals, with automated tracking." },
    { name: "Advanced Scheduling", cost: "$4,000", description: "More flexible and powerful scheduling options, including recurring events and calendar integrations." },
    { name: "Customizable Workspaces", cost: "$2,500", description: "Personalize your digital workspace with themes, backgrounds, and custom soundscapes." },
    { name: "Integrations (Calendar, To-Do Apps)", cost: "$4,500", description: "Seamlessly connect DeepSesh with popular productivity tools like Google Calendar, Todoist, and Notion." },
  ];

  return (
    <main className="max-w-4xl mx-auto pt-16 px-4 pb-4 lg:pt-20 lg:px-6 lg:pb-6">
      <div className="mb-8 flex items-center justify-between">
        <Button variant="ghost" onClick={() => window.history.back()} className="flex items-center gap-2">
          <ChevronLeft className="h-5 w-5" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Lightbulb className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Upcoming Features</h1>
        </div>
        <div></div> {/* Spacer for alignment */}
      </div>

      <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-center mb-8">
        Here's a glimpse into what's next for DeepSesh. Your contributions help bring these ideas to life!
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{feature.name}</span>
                <span className="text-base font-medium text-primary">{feature.cost}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-muted-foreground">
          Have an idea for a new feature? <Link to="/chip-in" className="text-blue-500 hover:underline">Chip in</Link> and let us know!
        </p>
      </div>
    </main>
  );
};

export default UpcomingFeatures;