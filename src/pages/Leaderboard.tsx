import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Clock, Award, Gift } from "lucide-react";
import TimeFilterToggle from "@/components/TimeFilterToggle";
import { useState } from "react";
import { useProfile } from "@/contexts/ProfileContext"; // Import useProfile
import { cn } from "@/lib/utils"; // Import cn for conditional class names

const Leaderboard = () => {
  const { 
    profile, // Get profile from context
    leaderboardFocusTimePeriod, 
    setLeaderboardFocusTimePeriod, 
    leaderboardCollaborationTimePeriod, 
    setLeaderboardCollaborationTimePeriod,
    statsData // Get statsData from ProfileContext
  } = useProfile(); // Use persistent states from context

  const currentUserName = profile?.first_name || "You";
  const currentUserId = profile?.id || "mock-user-id-999"; // Use a consistent mock ID if not logged in

  console.log("Leaderboard rendering. currentUserName:", currentUserName, "profile:", profile);

  // Helper function to parse "XXh YYm" to total hours (number)
  const parseFocusTime = (timeString: string): number => {
    const match = timeString.match(/(\d+)h\s*(\d+)m/);
    if (match) {
      const hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      return hours + (minutes / 60);
    }
    return 0; // Default to 0 if format is unexpected
  };

  // Base data for Focus Hours Leaderboard (excluding current user initially)
  const baseFocusHoursLeaderboardData = {
    week: [
      { id: "angie-id-1", name: "Angie", focusHours: 30 },
      { id: "bob-id-1", name: "Bob", focusHours: 25 },
      { id: "charlie-id-1", name: "Charlie", focusHours: 20 },
      { id: "diana-id-1", name: "Diana", focusHours: 18 },
    ],
    month: [
      { id: "angie-id-2", name: "Angie", focusHours: 120 },
      { id: "bob-id-2", name: "Bob", focusHours: 110 },
      { id: "diana-id-2", name: "Diana", focusHours: 95 },
      { id: "charlie-id-2", name: "Charlie", focusHours: 80 },
    ],
    all: [
      { id: "angie-id-3", name: "Angie", focusHours: 500 },
      { id: "bob-id-3", name: "Bob", focusHours: 450 },
      { id: "charlie-id-3", name: "Charlie", focusHours: 400 },
      { id: "diana-id-3", name: "Diana", focusHours: 350 },
    ],
  };

  // Base data for Collaborated Users Leaderboard (excluding current user initially)
  const baseCollaboratedUsersLeaderboardData = {
    week: [
      { id: "angie-id-4", name: "Angie", collaboratedUsers: 8 },
      { id: "frank-id-4", name: "Frank", collaboratedUsers: 7 },
      { id: "grace-id-4", name: "Grace", collaboratedUsers: 6 },
      { id: "heidi-id-4", name: "Heidi", collaboratedUsers: 4 }, 
    ],
    month: [
      { id: "angie-id-5", name: "Angie", collaboratedUsers: 25 },
      { id: "liam-id-5", name: "Liam", collaboratedUsers: 22 }, 
      { id: "mia-id-5", name: "Mia", collaboratedUsers: 17 }, 
      { id: "noah-id-5", name: "Noah", collaboratedUsers: 15 }, 
    ],
    all: [
      { id: "angie-id-6", name: "Angie", collaboratedUsers: 100 },
      { id: "peter-id-6", name: "Peter", collaboratedUsers: 90 }, 
      { id: "quinn-id-6", name: "Quinn", collaboratedUsers: 80 }, 
      { id: "rachel-id-6", name: "Rachel", collaboratedUsers: 70 }, 
    ],
  };

  // Function to generate dynamic leaderboard for focus hours, including the current user
  const getFocusHoursLeaderboard = (period: TimePeriod) => {
    const userFocusHours = parseFocusTime(statsData[period].totalFocusTime);
    const leaderboard = [...baseFocusHoursLeaderboardData[period]];
    
    // Add or update current user's entry
    const existingUserIndex = leaderboard.findIndex(user => user.id === currentUserId);
    if (existingUserIndex !== -1) {
      leaderboard[existingUserIndex] = { id: currentUserId, name: currentUserName, focusHours: userFocusHours };
    } else {
      leaderboard.push({ id: currentUserId, name: currentUserName, focusHours: userFocusHours });
    }
    
    return leaderboard.sort((a, b) => b.focusHours - a.focusHours);
  };

  // Function to generate dynamic leaderboard for collaborated users, including the current user
  const getCollaboratedUsersLeaderboard = (period: TimePeriod) => {
    const userCoworkers = statsData[period].uniqueCoworkers;
    const leaderboard = [...baseCollaboratedUsersLeaderboardData[period]];

    // Add or update current user's entry
    const existingUserIndex = leaderboard.findIndex(user => user.id === currentUserId);
    if (existingUserIndex !== -1) {
      leaderboard[existingUserIndex] = { id: currentUserId, name: currentUserName, collaboratedUsers: userCoworkers };
    } else {
      leaderboard.push({ id: currentUserId, name: currentUserName, collaboratedUsers: userCoworkers });
    }

    return leaderboard.sort((a, b) => b.collaboratedUsers - a.collaboratedUsers);
  };

  const currentFocusHoursLeaderboard = getFocusHoursLeaderboard(leaderboardFocusTimePeriod);
  const currentCollaboratedUsersLeaderboard = getCollaboratedUsersLeaderboard(leaderboardCollaborationTimePeriod);

  return (
    <main className="max-w-4xl mx-auto pt-16 px-4 pb-4 lg:pt-20 lg:px-6 lg:pb-6">
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
            <TimeFilterToggle onValueChange={setLeaderboardFocusTimePeriod} defaultValue={leaderboardFocusTimePeriod} />
          </CardHeader>
          <CardContent className="space-y-3">
            {currentFocusHoursLeaderboard.map((user, index) => (
              <div 
                key={user.id} 
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg",
                  user.id === currentUserId ? "bg-primary text-primary-foreground" : "bg-muted"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg">{index + 1}.</span>
                  <p className="font-medium">{user.name}</p>
                </div>
                <p className={user.id === currentUserId ? "text-primary-foreground" : "text-muted-foreground"}>{user.focusHours} hours</p>
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
            <TimeFilterToggle onValueChange={setLeaderboardCollaborationTimePeriod} defaultValue={leaderboardCollaborationTimePeriod} />
          </CardHeader>
          <CardContent className="space-y-3">
            {currentCollaboratedUsersLeaderboard.map((user, index) => (
              <div 
                key={user.id} 
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg",
                  user.id === currentUserId ? "bg-primary text-primary-foreground" : "bg-muted"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg">{index + 1}.</span>
                  <p className="font-medium">{user.name}</p>
                </div>
                <p className={user.id === currentUserId ? "text-primary-foreground" : "text-muted-foreground"}>{user.collaboratedUsers} users</p>
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
            <p>Sponsored by <span className="font-medium text-foreground">StartSpace Melbourne</span>.</p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default Leaderboard;