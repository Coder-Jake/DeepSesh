import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";

const Settings = () => {
  const [notifications, setNotifications] = useState(true);
  const [autoJoin, setAutoJoin] = useState(false);
  const [defaultDuration, setDefaultDuration] = useState("25");
  const [breakDuration, setBreakDuration] = useState("5");
  const [maxDistance, setMaxDistance] = useState([500]);
  
  // New notification preferences
  const [focusNotifications, setFocusNotifications] = useState(true);
  const [breakNotifications, setBreakNotifications] = useState(true);
  const [sessionInvites, setSessionInvites] = useState(true);
  const [friendActivity, setFriendActivity] = useState(false);
  
  // Transition preferences
  const [autoTransition, setAutoTransition] = useState(false);
  
  // Verification standards
  const [verificationStandard, setVerificationStandard] = useState("anyone");
  
  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = () => {
    // Save settings logic would go here
    setHasChanges(false);
  };

  const checkForChanges = () => {
    setHasChanges(true);
  };

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">Configure your FlowSesh preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="focus-notifications">Focus Session Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when focus sessions start and end
                </p>
              </div>
              <Switch
                id="focus-notifications"
                checked={focusNotifications}
                onCheckedChange={(checked) => {
                  setFocusNotifications(checked);
                  checkForChanges();
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="break-notifications">Break Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when breaks start and end
                </p>
              </div>
              <Switch
                id="break-notifications"
                checked={breakNotifications}
                onCheckedChange={(checked) => {
                  setBreakNotifications(checked);
                  checkForChanges();
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="session-invites">Session Invites</Label>
                <p className="text-sm text-muted-foreground">
                  Receive invitations to join sessions from others
                </p>
              </div>
              <Switch
                id="session-invites"
                checked={sessionInvites}
                onCheckedChange={(checked) => {
                  setSessionInvites(checked);
                  checkForChanges();
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="friend-activity">Friend Activity</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about your friends' session activity
                </p>
              </div>
              <Switch
                id="friend-activity"
                checked={friendActivity}
                onCheckedChange={(checked) => {
                  setFriendActivity(checked);
                  checkForChanges();
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Behavior Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Behavior Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-transition">Auto-transition Sessions</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically switch between focus and break periods
                </p>
              </div>
              <Switch
                id="auto-transition"
                checked={autoTransition}
                onCheckedChange={(checked) => {
                  setAutoTransition(checked);
                  checkForChanges();
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-join">Auto-join Compatible Sessions</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically join sessions that match your preferences
                </p>
              </div>
              <Switch
                id="auto-join"
                checked={autoJoin}
                onCheckedChange={(checked) => {
                  setAutoJoin(checked);
                  checkForChanges();
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Session Defaults */}
        <Card>
          <CardHeader>
            <CardTitle>Session Defaults</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="focus-duration">Default Focus Duration</Label>
              <Select value={defaultDuration} onValueChange={(value) => {
                setDefaultDuration(value);
                checkForChanges();
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="25">25 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="break-duration">Default Break Duration</Label>
              <Select value={breakDuration} onValueChange={(value) => {
                setBreakDuration(value);
                checkForChanges();
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="20">20 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Location & Discovery */}
        <Card>
          <CardHeader>
            <CardTitle>Location & Discovery</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Maximum Distance for Nearby Sessions</Label>
              <p className="text-sm text-muted-foreground mb-4">
                How far to search for local focus sessions
              </p>
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>100m</span>
                  <span>5km</span>
                </div>
                <div className="relative group">
                  <Slider
                    value={maxDistance}
                    onValueChange={(value) => {
                      setMaxDistance(value);
                      checkForChanges();
                    }}
                    max={5000}
                    min={100}
                    step={100}
                    className="w-full"
                  />
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {maxDistance[0] >= 1000 ? `${(maxDistance[0] / 1000).toFixed(1)}km` : `${maxDistance[0]}m`}
                  </div>
                </div>
                <div className="text-center mt-3 text-sm text-muted-foreground">
                  {maxDistance[0] <= 300 && "Very close proximity only"}
                  {maxDistance[0] > 300 && maxDistance[0] <= 1000 && "Walking distance"}
                  {maxDistance[0] > 1000 && maxDistance[0] <= 2000 && "Short bike ride or drive"}
                  {maxDistance[0] > 2000 && "Wider area search"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verification Standards */}
        <Card>
          <CardHeader>
            <CardTitle>Verification Standards</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Minimum verification status for engagement</Label>
              <p className="text-sm text-muted-foreground">
                Set the minimum verification level required for users to interact with you
              </p>
              <Select value={verificationStandard} onValueChange={(value) => {
                setVerificationStandard(value);
                checkForChanges();
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select verification standard" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anyone">Anyone - No verification required</SelectItem>
                  <SelectItem value="organisation">Organisation Verified - Must have verified organisation</SelectItem>
                  <SelectItem value="id">ID Verified - Must have verified government ID</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Safety */}
        <Card>
          <CardHeader>
            <CardTitle>Privacy & Safety</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Profile Visibility</Label>
              <Select defaultValue="friends">
                <SelectTrigger>
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public - Anyone can see your profile</SelectItem>
                  <SelectItem value="friends">Friends Only - Only friends can see details</SelectItem>
                  <SelectItem value="private">Private - Minimal information shared</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Location Sharing</Label>
              <Select defaultValue="approximate">
                <SelectTrigger>
                  <SelectValue placeholder="Select location sharing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exact">Exact Location</SelectItem>
                  <SelectItem value="approximate">Approximate Area</SelectItem>
                  <SelectItem value="city">City Only</SelectItem>
                  <SelectItem value="none">No Location Sharing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={!hasChanges}
          className={!hasChanges ? "opacity-50 cursor-not-allowed" : ""}
        >
          Save Settings
        </Button>
      </div>
    </main>
  );
};

export default Settings;