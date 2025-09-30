import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Clock, Award, Gift } from "lucide-react";
import TimeFilterToggle from "@/components/TimeFilterToggle";
import { useState, useMemo } from "react";

interface RawSession {
  id: string;
  userId: string; // The user who completed this session
  focusDurationMinutes: number;
  collaboratedUserIds: string[]; // IDs of users collaborated with
  createdAt: Date;
}

// Mock raw session data for Leaderboard aggregation
const allRawSessions: RawSession[] = [
  { id: "s1", userId: "Alice", focusDurationMinutes: 60, collaboratedUserIds: ["Bob", "Charlie"], createdAt: new Date("2024-07-28T10:00:00Z") },
  { id: "s2", userId: "Bob", focusDurationMinutes: 45, collaboratedUserIds: ["Alice"], createdAt: new Date("2024-07-27T11:00:00Z") },
  { id: "s3", userId: "Alice", focusDurationMinutes: 30, collaboratedUserIds: [], createdAt: new Date("2024-07-26T12:00:00Z") },
  { id: "s4", userId: "Charlie", focusDurationMinutes: 90, collaboratedUserIds: ["Alice"], createdAt: new Date("2024-07-25T13:00:00Z") },
  { id: "s5", userId: "Bob", focusDurationMinutes: 75, collaboratedUserIds: ["Charlie"], createdAt: new Date("2024-07-24T14:00:00Z") },
  { id: "s6", userId: "Alice", focusDurationMinutes: 15, collaboratedUserIds: ["Bob"], createdAt: new Date("2024-07-23T15:00:00Z") },
  { id: "s7", userId: "Diana", focusDurationMinutes: 120, collaboratedUserIds: [], createdAt: new Date("2024-07-22T16:00:00Z") },
  { id: "s8", userId: "Eve", focusDurationMinutes: 50, collaboratedUserIds: ["Diana"], createdAt: new Date("2024-07-21T17:00:00Z") },
  { id: "s9", userId: "Alice", focusDurationMinutes: 60, collaboratedUserIds: ["Eve"], createdAt: new Date("2024-07-20T18:00:00Z") },
  { id: "s10", userId: "Bob", focusDurationMinutes: 30, collaboratedUserIds: [], createdAt: new Date("2024-07-19T09:00:00Z") },
  { id: "s11", userId: "Charlie", focusDurationMinutes: 45, collaboratedUserIds: ["Bob"], createdAt: new Date("2024-07-18T10:00:00Z") },
  { id: "s12", userId: "Diana", focusDurationMinutes: 60, collaboratedUserIds: ["Alice", "Charlie"], createdAt: new Date("2024-07-17T11:00:00Z") },
  { id: "s13", userId: "Eve", focusDurationMinutes: 90, collaboratedUserIds: ["Bob"], createdAt: new Date("2024-06-15T12:00:00Z") }, // Older session
  { id: "s14", userId: "Alice", focusDurationMinutes: 100, collaboratedUserIds: ["Diana"], createdAt: new Date("2024-06-20T13:00:00Z") },
  { id: "s15", userId: "Bob", focusDurationMinutes: 80, collaboratedUserIds: ["Eve", "Alice"], createdAt: new Date("2024-06-22T14:00:00Z") },
];

const filterRawSessions = (sessions: RawSession[], period: 'week' | 'month' | 'all'): RawSession[] => {
  const now = new Date();
  let filterDate = new Date(now);

  if (period === 'week') {
    filterDate.setDate(now.getDate() - 7);
  } else if (period === 'month') {
    filterDate.setMonth(now.getMonth() - 1);
  } else {
    return sessions; // 'all' period
  }

  return sessions.filter(session => session.createdAt >= filterDate);
};

const getAggregatedFocusLeaderboard = (sessions: RawSession[]): { id: string; name: string; focusHours: number }[] => {
  const focusMap = new Map<string, number>(); // userId -> totalMinutes

  sessions.forEach(session => {
    const currentMinutes = focusMap.get(session.userId) || 0;
    focusMap.set(session.userId, currentMinutes + session.focusDurationMinutes);
  });

  return Array.from(focusMap.entries())
    .map(([userId, totalMinutes]) => ({
      id: userId,
      name: userId, // Using userId as name for mock data
      focusHours: Math.round(totalMinutes / 60), // Round to nearest hour
    }))
    .sort((a, b) => b.focusHours - a.focusHours);
};

const getAggregatedCollaborationLeaderboard = (sessions: RawSession[]): { id: string; name: string; collaboratedUsers: number }[] => {
  const collaborationMap = new Map<string, Set<string>>(); // userId -> Set<collaboratedUserIds>

  sessions.forEach(session => {
    if (!collaborationMap.has(session.userId)) {
      collaborationMap.set(session.userId, new Set<string>());
    }
    session.collaboratedUserIds.forEach(collabId => {
      // Ensure we don't count self-collaboration if userId is in collaboratedUserIds
      if (collabId !== session.userId) {
        collaborationMap.get(session.userId)?.add(collabId);
      }
    });
  });

  return Array.from(collaborationMap.entries())
    .map(([userId, collaboratedSet]) => ({
      id: userId,
      name: userId, // Using userId as name for mock data
      collaboratedUsers: collaboratedSet.size,
    }))
    .sort((a, b) => b.collaboratedUsers - a.collaboratedUsers);
};

const Leaderboard = () => {
  const [focusTimePeriod, setFocusTimePeriod] = useState<'week' | 'month' | 'all'>('all');
  const [collaborationTimePeriod, setCollaborationTimePeriod] = useState<'week' | 'month' | 'all'>('all');

  const filteredFocusSessions = useMemo(() => filterRawSessions(allRawSessions, focusTimePeriod), [allRawSessions, focusTimePeriod]);
  const focusHoursLeaderboard = useMemo(() => getAggregatedFocusLeaderboard(filteredFocusSessions), [filteredFocusSessions]);

  const filteredCollaborationSessions = useMemo(() => filterRawSessions(allRawSessions, collaborationTimePeriod), [allRawSessions, collaborationTimePeriod]);
  const collaboratedUsersLeaderboard = useMemo(() => getAggregatedCollaborationLeaderboard(filteredCollaborationSessions), [filteredCollaborationSessions]);

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
            <TimeFilterToggle onValueChange={setFocusTimePeriod} defaultValue={focusTimePeriod} />
          </CardHeader>
          <CardContent className="space-y-3">
            {focusHoursLeaderboard.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No data for this period.</p>
            ) : (
              focusHoursLeaderboard.map((user, index) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg text-primary">{index + 1}.</span>
                    <p className="font-medium text-foreground">{user.name}</p>
                  </div>
                  <p className="text-muted-foreground">{user.focusHours} hours</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Collaborated Users Leaderboard */}
        <Card id="collaborated-users-leaderboard">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Unique Coworkers
            </CardTitle>
            <TimeFilterToggle onValueChange={setCollaborationTimePeriod} defaultValue={collaborationTimePeriod} />
          </CardHeader>
          <CardContent className="space-y-3">
            {collaboratedUsersLeaderboard.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No data for this period.</p>
            ) : (
              collaboratedUsersLeaderboard.map((user, index) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg text-primary">{index + 1}.</span>
                    <p className="font-medium text-foreground">{user.name}</p>
                  </div>
                  <p className="text-muted-foreground">{user.collaboratedUsers} users</p>
                </div>
              ))
            )}
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