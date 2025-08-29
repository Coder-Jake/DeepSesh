import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Code, Heart, Star } from "lucide-react";

const Credits = () => {
  const developers = [
    { name: "Jacob Vernon", role: "Founder", bio: "Passionate about building connections.", github: "coder-jake" },
    { name: "Amanda Hugnkiss", role: "UI/UX Designer", bio: "Focusing on intuitive and beautiful user experiences.", github: "AmandaHugnkiss" },
    { name: "Theresa Green", role: "Backend Engineer", bio: "Specializing in robust and efficient server-side logic.", github: "TheresaGreen" },
  ];

  const supporters = [
    { name: "Generous Giver", amount: "$100" },
    { name: "Community Champion", amount: "$75" },
    { name: "FlowSesh Fan", amount: "$60" },
    { name: "Anonymous Supporter", amount: "$55" },
  ];

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Star className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Credits & Acknowledgements</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Developers Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Developers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {developers.map((dev, index) => (
              <div key={index} className="flex items-start gap-4">
                <Users className="h-6 w-6 text-muted-foreground mt-1" />
                <div>
                  <h3 className="font-medium text-foreground">{dev.name}</h3>
                  <p className="text-sm text-primary">{dev.role}</p>
                  <p className="text-sm text-muted-foreground mt-1">{dev.bio}</p>
                  {dev.github && (
                    <a 
                      href={`https://github.com/${dev.github}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs text-blue-500 hover:underline mt-1 block"
                    >
                      GitHub: {dev.github}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Acknowledgements Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Special Thanks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium text-foreground mb-2">Our Generous Supporters (Donations over $50)</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {supporters.map((supporter, index) => (
                  <li key={index}>{supporter.name} ({supporter.amount})</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-2">Libraries & Tools</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Carrd, Lovable, Dyad</li>
                <li>React, Vite, TypeScript</li>
                <li>shadcn/ui, Tailwind CSS</li>
                <li>Supabase, TanStack Query</li>
                <li>Lucide React, Sonner</li>
                <li>React Router, React Hook Form, Zod</li>
                <li>...and many more open-source projects!</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Thank you to everyone who contributed to making FlowSesh possible!
        </p>
    </main>
  );
};

export default Credits;