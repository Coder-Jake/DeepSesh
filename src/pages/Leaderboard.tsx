import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Clock, Award, Gift } from "lucide-react";
import TimeFilterToggle from "@/components/TimeFilterToggle";
import { useState, useMemo } from "react";

const Leaderboard = () => {
  // Sample data - in a real app this would come from a database
  const allFocusHoursLeaderboard = [
    { id: 1, name: "Alice", focusHours: 120 },
    { id: 2, name: "Bob", focusHours: 110 },
    { id: 3, name: "Charlie", focusHours: 95 },
    { id: 4, name: "Diana", focusHours: 80 },
    { id: 5, name: "Eve", focusHours: 75 },
    { id: 6, name: "Frank", focusHours: 60 },
    { id: 7, name: "Grace", focusHours: 50 },
  ];

  const allCollaboratedUsersLeaderboard = [
    { id: 1, name: "Alice", collaboratedUsers: 25 },
    { id: 2, name: "Frank", collaboratedUsers: 22 },
    { id: 3, name: "Grace", collaboratedUsers: 18 },
    { id: 4, name: "Bob", collaboratedUsers: 15 },
    { id: 5, name: "Heidi", collaboratedUsers: 12 },
    { id: 6, name: "Ivan", collaboratedUsers: 10 },
    { id: 7, name: "Judy", collaboratedUsers: 8 },
  ];

  const [focusTimePeriod, setFocusTimePeriod] = useState<'week' | 'month' | 'all'>('all');
  const [collaborationTimePeriod, setCollaborationTimePeriod] = useState<'week' | 'month' | 'all'>('all');

  const getFilteredLeaderboardData = (data: typeof allFocusHoursLeaderboard, period: 'week' | 'month' | 'all') => {
    if (period === 'week') {
      return data.slice(0, 2); // Show top 2 for 'Week'
    } else if (period === 'month') {
      return data.slice(0, 4); // Show top 4 for 'Month'
    }
    return data; // Show all for 'All Time'
  };

  const filteredFocusHoursLeaderboard = useMemo(() => {
    return getFilteredLeaderboardData(allFocusHoursLeaderboard, focusTimePeriod);
  }, [allFocusHoursLeaderboard, focusTimePeriod]);

  const filteredCollaboratedUsersLeaderboard = useMemo(() => {
    return getFilteredLeaderboardData(allCollaboratedUsersLeaderboard, collaborationTimePeriod);
  }, [allCollaboratedUsersLeaderboard, collaborationTimePeriod]);

  return (
    <main className="max-w-4xl mx-auto p-4 lg:p-6">
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Trophy className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Leaderboard</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Compare your focus and collaboration with the FlowSesh community!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
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
            {filteredFocusHoursLeaderboard.map((user, index) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg text-primary">{index + 1}.</span>
                  <p className="font-medium text-foreground">{user.name}</p>
                </div>
                <p className="text-muted-foreground">{user.focusHours} hours</p>
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
            {filteredCollaboratedUsersLeaderboard.map((user, index) => (
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

      {/* Weekly Competition Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Award className="h-6 w-6 text-primary" />
            Weekly Competition
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            Compete weekly for small prizes!
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Points for productivity and collaboration</li>
            <li>Prize: <span className="font-medium text-foreground">$50 voucher!</span></li>
          </ul>
          <div className="flex items-center gap-2 text-sm">
            <Gift className="h-4 w-4 text-primary" />
            <p>Sponsored by <span className="font-medium text-foreground">Airwall X</span>.</p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default Leaderboard;