import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Clock, Award, Gift } from "lucide-react";
import TimeFilterToggle from "@/components/TimeFilterToggle";
import { useState, useCallback } from "react"; // Added useCallback
import { useProfile } from "@/contexts/ProfileContext"; // Import useProfile
import { cn } from "@/lib/utils"; // Import cn for conditional class names
import { TimePeriod } from "@/contexts/ProfileContext"; // Import TimePeriod type
import { useProfilePopUp } from "@/contexts/ProfilePopUpContext"; // NEW: Import useProfilePopUp
import { useToast } from "@/hooks/use-toast"; // Corrected import

const Leaderboard = () => {
  const { 
    profile, // Get profile from context
    localFirstName, // Get localFirstName from context
    historyTimePeriod, // Use historyTimePeriod from context
    setHistoryTimePeriod, // Use setHistoryTimePeriod from context
    statsData // Get statsData from ProfileContext
  } = useProfile(); // Use persistent states from context
  const { openProfilePopUp } = useProfilePopUp(); // NEW: Use ProfilePopUpContext
  const { toast } = useToast(); // Corrected usage

  const currentUserName = profile?.first_name || localFirstName || "You"; // Prioritize Supabase, then local, then default
  const currentUserId = profile?.id || "mock-user-id-999"; // Use a consistent mock ID if not logged in

  console.log("Leaderboard rendering. currentUserName:", currentUserName, "profile:", profile);

  // Helper function to parse "XXh YYm" to total hours (number)
  const parseFocusTime = (timeString: string): number => {
    const match = timeString.match(/(\d+)h\s*(\d+)m/);
    if (match) {
      const hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      return Math.round(hours + (minutes / 60)); // Round to nearest integer
    }
    return 0; // Default to 0 if format is unexpected
  };

  // Base data for Focus Hours Leaderboard (excluding current user initially)
  const baseFocusHoursLeaderboardData = {
    week: [
      { id: "mock-user-id-1", name: "Alice", focusHours: 30 },
      { id: "mock-user-id-2", name: "Bob", focusHours: 25 },
      { id: "mock-user-id-3", name: "Charlie", focusHours: 20 },
      { id: "mock-user-id-4", name: "Diana", focusHours: 18 },
    ],
    month: [
      { id: "mock-user-id-1", name: "Alice", focusHours: 120 },
      { id: "mock-user-id-2", name: "Bob", focusHours: 110 },
      { id: "mock-user-id-4", name: "Diana", focusHours: 95 },
      { id: "mock-user-id-3", name: "Charlie", focusHours: 80 },
    ],
    all: [
      { id: "mock-user-id-1", name: "Alice", focusHours: 500 },
      { id: "mock-user-id-2", name: "Bob", focusHours: 450 },
      { id: "mock-user-id-3", name: "Charlie", focusHours: 400 },
      { id: "mock-user-id-4", name: "Diana", focusHours: 350 },
    ],
  };

  // Base data for Coworkers Leaderboard (excluding current user initially)
  const baseCoworkersLeaderboardData = {
    week: [
      { id: "mock-user-id-1", name: "Alice", coworkers: 8 },
      { id: "mock-user-id-6", name: "Frank", coworkers: 7 },
      { id: "mock-user-id-7", name: "Grace", coworkers: 6 },
      { id: "mock-user-id-8", name: "Heidi", coworkers: 4 }, 
    ],
    month: [
      { id: "mock-user-id-1", name: "Alice", coworkers: 25 },
      { id: "mock-user-id-9", name: "Ivan", coworkers: 22 }, 
      { id: "mock-user-id-10", name: "Judy", coworkers: 17 }, 
      { id: "mock-user-id-2", name: "Bob", coworkers: 15 }, 
    ],
    all: [
      { id: "mock-user-id-1", name: "Alice", coworkers: 100 },
      { id: "mock-user-id-6", name: "Frank", coworkers: 90 }, 
      { id: "mock-user-id-7", name: "Grace", coworkers: 80 }, 
      { id: "mock-user-id-8", name: "Heidi", coworkers: 70 }, 
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

  // Function to generate dynamic leaderboard for coworkers, including the current user
  const getCoworkersLeaderboard = (period: TimePeriod) => {
    const userCoworkers = statsData[period].coworkers;
    const leaderboard = [...baseCoworkersLeaderboardData[period]];

    // Add or update current user's entry
    const existingUserIndex = leaderboard.findIndex(user => user.id === currentUserId);
    if (existingUserIndex !== -1) {
      leaderboard[existingUserIndex] = { id: currentUserId, name: currentUserName, coworkers: userCoworkers };
    } else {
      leaderboard.push({ id: currentUserId, name: currentUserName, coworkers: userCoworkers });
    }

    return leaderboard.sort((a, b) => b.coworkers - a.coworkers);
  };

  const currentFocusHoursLeaderboard = getFocusHoursLeaderboard(historyTimePeriod); // Use historyTimePeriod
  const currentCoworkersLeaderboard = getCoworkersLeaderboard(historyTimePeriod); // Use historyTimePeriod

  // NEW: Handle name click for profile pop-up
  const handleNameClick = useCallback((userId: string, userName: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent parent click handlers
    openProfilePopUp(userId, userName, event.clientX, event.clientY);
  }, [openProfilePopUp]);

  return (
    <main className="max-w-4xl mx-auto pt-16 px-4 pb-4 lg:pt-20 lg:px-6 lg:pb-6">
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Trophy className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Leaderboard</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Compare your focus and collaboration with the DeepSesh community!
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
            <TimeFilterToggle onValueChange={setHistoryTimePeriod} defaultValue={historyTimePeriod} /> {/* Use historyTimePeriod */}
          </CardHeader>
          <CardContent className="space-y-3">
            {currentFocusHoursLeaderboard.map((user, index) => (
              <div 
                key={user.id} 
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg",
                  user.id === currentUserId ? "bg-primary text-primary-foreground" : "bg-muted",
                  user.id !== currentUserId && "cursor-pointer hover:bg-muted/80" // Make clickable if not current user
                )}
                onClick={(e) => user.id !== currentUserId && handleNameClick(user.id, user.name, e)} // NEW: Make clickable
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

        {/* Coworkers Leaderboard */}
        <Card id="collaborated-users-leaderboard">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Coworkers
            </CardTitle>
            <TimeFilterToggle onValueChange={setHistoryTimePeriod} defaultValue={historyTimePeriod} /> {/* Use historyTimePeriod */}
          </CardHeader>
          <CardContent className="space-y-3">
            {currentCoworkersLeaderboard.map((user, index) => (
              <div 
                key={user.id} 
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg",
                  user.id === currentUserId ? "bg-primary text-primary-foreground" : "bg-muted",
                  user.id !== currentUserId && "cursor-pointer hover:bg-muted/80" // Make clickable if not current user
                )}
                onClick={(e) => user.id !== currentUserId && handleNameClick(user.id, user.name, e)} // NEW: Make clickable
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg">{index + 1}.</span>
                  <p className="font-medium">{user.name}</p>
                </div>
                <p className={user.id === currentUserId ? "text-primary-foreground" : "text-muted-foreground"}>{user.coworkers} coworkers</p>
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