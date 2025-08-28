import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Clock } from "lucide-react";
import TimeFilterToggle from "@/components/TimeFilterToggle";
import { useState } from "react";

const Leaderboard = () => {
  // Sample data - in a real app this would come from a database
  const focusHoursLeaderboard = [
    { id: 1, name: "Alice", focusHours: 120 },
    { id: 2, name: "Bob", focusHours: 110 },
    { id: 3, name: "Charlie", focusHours: 95 },
    { id: 4, name: "Diana", focusHours: 80 },
    { id: 5, name: "Eve", focusHours: 75 },
  ];

  const collaboratedUsersLeaderboard = [
    { id: 1, name: "Alice", collaboratedUsers: 25 },
    { id: 2, name: "Frank", collaboratedUsers: 22 },
    { id: 3, name: "Grace", collaboratedUsers: 18 },
    { id: 4, name: "Bob", collaboratedUsers: 15 },
    { id: 5, name: "Heidi", collaboratedUsers: 12 },
  ];

  const [focusTimePeriod, setFocusTimePeriod] = useState<'week' | 'month' | 'all'>('all');
  const [collaborationTimePeriod, setCollaborationTimePeriod] = useState<'week' | 'month' | 'all'>('all');

  // In a real app, you would filter the data based on focusTimePeriod and collaborationTimePeriod
  console.log("Focus Leaderboard Period:", focusTimePeriod);
  console.log("Collaboration Leaderboard Period:", collaborationTimePeriod);

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Trophy className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Leaderboard</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Compare your focus and collaboration  with the FlowSesh community!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Focus Hours Leaderboard */}
        <Card id="focus-hours-leaderboard">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Total Focus Hours
            </CardTitle>
            <TimeFilterToggle onValueChange={setFocusTimePeriod} />
          </CardHeader>
          <CardContent className="space-y-3">
            {focusHoursLeaderboard.map((user, index) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg text-primary">{index + 1}.</span>
                  <p className="text-muted-foreground">{user.focusHours} hours</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Collaborated Users Leaderboard */}
        <Card id="collaborated-users-leaderboard">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Unique Coworkers
            </CardTitle>
            <TimeFilterToggle onValueChange={setCollaborationTimePeriod} />
          </CardHeader>
          <CardContent className="space-y-3">
            {collaboratedUsersLeaderboard.map((user, index) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg text-primary">{index + 1}.</span>
                  <p className="font-medium text-foreground">{user.name}</p>
                </div>
                <p className="text-muted-foreground">{user.collaboratedUsers} users</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Leaderboard;