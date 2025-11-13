import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Handshake, Lightbulb, Settings, User, MessageSquare, Globe, Lock, Building2, ShieldCheck, Brain, Shield, UserStar, HeartHandshake } from 'lucide-react'; // Added UserStar and HeartHandshake icons

const Vibes = () => {
  return (
    <main className="max-w-4xl mx-auto pt-16 px-4 pb-4 lg:pt-20 lg:px-6 lg:pb-6">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Users className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">DeepSesh Vibes</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Cultivating a respectful, independent, and collaborative environment for all DeepSesh coworkers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8"> {/* Changed to 2 columns for large screens for a 2x2 layout */}
        {/* Card: Autonomy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Autonomy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              The foundation for DeepSesh's success is your intrinsic motivation to get sh*t done.
            </p>
            <p>DeepSesh is your tool to strengthen productivity in this cutthroat attention economy. </p>
          </CardContent>
        </Card>

        {/* Card: Respect */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Respect
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              DeepSesh makes it simple to share expectations and establish boundaries.
            </p>
            <p>
              <Link to="/profile" className="text-blue-500 hover:underline">Focus Preferences</Link> help indicate your sociability to create aligned coworking.
            </p>
          </CardContent>
        </Card>

        {/* Card: Collaboration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Handshake className="h-5 w-5" />
              Collaboration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Breaks are a great time to network, brainstorm, and build community.
            </p>
            <p>
              Your <Link to="/profile" className="text-blue-500 hover:underline">Profile</Link> shares details to help coworkers understand your work, opening doors for deeper conversations and potential collaborations.
            </p>
            <p>
              The "Can Help" and "Need Help" sections signal your expertise and areas where you're seeking assistance.
            </p>
            <p>
              Don't hesitate to use the <Link to="/" className="text-blue-500 hover:underline">Ask menu</Link> during sessions to suggest extending a timer or create a poll for group decisions.
            </p>
          </CardContent>
        </Card>

        {/* New Card: Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" /> {/* New icon for Privacy */}
              Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              You have full control over the information you share. Your data is not for sale.
            </p>
            <p>
              Click the <Link to="/profile" className="text-blue-500 hover:underline">headings</Link> for each profile field to control who sees those details.
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><Globe className="inline-block h-4 w-4 mr-1 text-green-600" /> Public: Share broadly.</li>
              <li><UserStar className="inline-block h-4 w-4 mr-1 text-blue-500" /> Friends Only: Connect with trusted peers.</li>
              <li><Building2 className="inline-block h-4 w-4 mr-1 text-red-500" /> Organisation Only: Collaborate within your team.</li>
              <li><HeartHandshake className="inline-block h-4 w-4 mr-1 text-purple-500" /> Friends & Organisation: Connect with trusted peers and within your team.</li>
              <li><Lock className="inline-block h-4 w-4 mr-1 text-gray-500" /> Private: Keep details to yourself.</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 text-center">
        <p className="text-muted-foreground">
          By embracing these vibes, we can all achieve deeper focus and stronger connections.
        </p>
      </div>
    </main>
  );
};

export default Vibes;