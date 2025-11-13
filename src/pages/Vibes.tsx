import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Handshake, Lightbulb, Settings, User, MessageSquare, Globe, Lock, Building2, ShieldCheck, Brain, Shield } from 'lucide-react'; // Added Shield icon for Privacy

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
              The foundation for DeepSesh's success is its users' intrinsic motivation to get things done. We believe in empowering self-discipline in this cutthroat attention economy.
            </p>
            <p>
              The tool is to strengthen your productivity.
            </p>
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
              DeepSesh is built on respecting individual focus and boundaries. We encourage you to work independently, knowing others are doing the same.
            </p>
            <p>
              Your <Link to="/profile" className="text-blue-500 hover:underline">Focus Preferences</Link> help set expectations. A higher score indicates a preference for deep focus with minimal interaction, even during breaks. A lower score suggests you're more open to collaboration and banter.
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
              While autonomy is key, DeepSesh also fosters a vibrant collaborative environment. Breaks are a great time to connect, brainstorm, and build community.
            </p>
            <p>
              Your <Link to="/profile" className="text-blue-500 hover:underline">Intention statement</Link> helps others understand your work, opening doors for relevant discussions and potential collaborations.
            </p>
            <p>
              The "Can Help With" and "Need Help With" sections on your profile signal your expertise and areas where you're seeking assistance, making it easier to find complementary coworkers.
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
              Your data privacy is paramount. You have full control over the information you share, and your data is never commodified.
            </p>
            <p>
              Use the <Link to="/settings" className="text-blue-500 hover:underline">Privacy settings</Link> to control who sees your profile details, ensuring you share only what you're comfortable with.
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><Globe className="inline-block h-4 w-4 mr-1 text-green-600" /> Public: Share broadly.</li>
              <li><Users className="inline-block h-4 w-4 mr-1 text-blue-500" /> Friends Only: Connect with trusted peers.</li>
              <li><Building2 className="inline-block h-4 w-4 mr-1 text-red-500" /> Organisation Only: Collaborate within your team.</li>
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