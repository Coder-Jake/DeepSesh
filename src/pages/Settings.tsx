import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useState } from "react";

const Settings = () => {
  const [autoJoin, setAutoJoin] = useState(false);
  const [defaultDuration, setDefaultDuration] = useState("25");
  const [breakDuration, setBreakDuration] = useState("5");
  const [maxDistance, setMaxDistance] = useState([500]);
  
  // Notification preferences with detailed options
  const [focusNotifications, setFocusNotifications] = useState({ enabled: false, push: false, vibrate: false, sound: false });
  const [breakNotifications, setBreakNotifications] = useState({ enabled: false, push: false, vibrate: false, sound: false });
  const [sessionInvites, setSessionInvites] = useState({ enabled: false, push: false, vibrate: false, sound: false });
  const [friendActivity, setFriendActivity] = useState({ enabled: false, push: false, vibrate: false, sound: false });
  
  // Transition preferences
  const [autoTransition, setAutoTransition] = useState(false);
  
  // Verification standards
  const [verificationStandard, setVerificationStandard] = useState("anyone");
  
  // Privacy settings
  const [profileVisibility, setProfileVisibility] = useState("friends");
  const [locationSharing, setLocationSharing] = useState("approximate");
  
  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = () => {
    // Save settings logic would go here
    setHasChanges(false);
  };

  const checkForChanges = () => {
    setHasChanges(true);
  };

  const updateNotificationSetting = (type: 'focus' | 'break' | 'invites' | 'activity', updates: Partial<typeof focusNotifications>) => {
    const setters = {
      focus: setFocusNotifications,
      break: setBreakNotifications,
      invites: setSessionInvites,
      activity: setFriendActivity
    };
    
    const currentValues = {
      focus: focusNotifications,
      break: breakNotifications,
      invites: sessionInvites,
      activity: friendActivity
    };
    
    setters[type]({ ...currentValues[type], ...updates });
    checkForChanges();
  };

  const NotificationControl = ({ 
    type, 
    title, 
    description, 
    value 
  }: { 
    type: 'focus' | 'break' | 'invites' | 'activity';
    title: string;
    description: string;
    value: typeof focusNotifications;
  }) => (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-medium">{title}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`${type}-off`}
              checked={!value.enabled}
              onCheckedChange={(checked) => {
                if (checked) {
                  updateNotificationSetting(type, { enabled: false, push: false, vibrate: false, sound: false });
                }
              }}
            />
            <Label htmlFor={`${type}-off`} className="text-sm">Off</Label>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`${type}-enabled`}
              checked={value.enabled}
              onCheckedChange={(checked) => {
                updateNotificationSetting(type, { enabled: !!checked });
              }}
            />
            <Label htmlFor={`${type}-enabled`} className="text-sm">Enable notifications</Label>
          </div>
          
          {value.enabled && (
            <div className="ml-6 space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`${type}-push`}
                  checked={value.push}
                  onCheckedChange={(checked) => {
                    updateNotificationSetting(type, { push: !!checked });
                  }}
                />
                <Label htmlFor={`${type}-push`} className="text-sm">Push</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`${type}-vibrate`}
                  checked={value.vibrate}
                  onCheckedChange={(checked) => {
                    updateNotificationSetting(type, { vibrate: !!checked });
                  }}
                />
                <Label htmlFor={`${type}-vibrate`} className="text-sm">Vibrate</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`${type}-sound`}
                  checked={value.sound}
                  onCheckedChange={(checked) => {
                    updateNotificationSetting(type, { sound: !!checked });
                  }}
                />
                <Label htmlFor={`${type}-sound`} className="text-sm">Sound</Label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
      </div>

      <Accordion type="multiple" className="space-y-4">
        {/* Notifications */}
        <AccordionItem value="notifications" className="border rounded-lg px-6">
          <AccordionTrigger className="text-xl font-semibold">
            Notifications
          </AccordionTrigger>
          <AccordionContent className="space-y-8 pt-4">
            <NotificationControl
              type="focus"
              title="Focus Session Alerts"
              description="Get notified when focus sessions start and end"
              value={focusNotifications}
            />
            
            <NotificationControl
              type="break"
              title="Break Reminders"
              description="Get notified when breaks start and end"
              value={breakNotifications}
            />
            
            <NotificationControl
              type="invites"
              title="Session Invites"
              description="Receive invitations to join sessions from others"
              value={sessionInvites}
            />
            
            <NotificationControl
              type="activity"
              title="Friend Activity"
              description="Get notified about your friends' session activity"
              value={friendActivity}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Behavior */}
        <AccordionItem value="behavior" className="border rounded-lg px-6">
          <AccordionTrigger className="text-xl font-semibold">
            Behavior
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pt-4">
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
          </AccordionContent>
        </AccordionItem>

        {/* Session Defaults */}
        <AccordionItem value="session-defaults" className="border rounded-lg px-6">
          <AccordionTrigger className="text-xl font-semibold">
            Session Defaults
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pt-4">
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
          </AccordionContent>
        </AccordionItem>

        {/* Location & Discovery */}
        <AccordionItem value="location" className="border rounded-lg px-6">
          <AccordionTrigger className="text-xl font-semibold">
            Location & Discovery
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
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
          </AccordionContent>
        </AccordionItem>

        {/* Privacy & Safety */}
        <AccordionItem value="privacy" className="border rounded-lg px-6">
          <AccordionTrigger className="text-xl font-semibold">
            Privacy & Safety
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label>Profile Visibility</Label>
              <Select value={profileVisibility} onValueChange={(value) => {
                setProfileVisibility(value);
                checkForChanges();
              }}>
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
              <Select value={locationSharing} onValueChange={(value) => {
                setLocationSharing(value);
                checkForChanges();
              }}>
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

            <div className="space-y-2">
              <Label>Minimum Verification Status for Engagement</Label>
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>

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