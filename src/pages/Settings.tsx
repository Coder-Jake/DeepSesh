import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useState, useRef } from "react";
import { Bell, Smartphone, Volume2 } from "lucide-react";
import { useTimer } from "@/contexts/TimerContext"; // Import useTimer

const Settings = () => {
  const { hideSessionsDuringTimer, setHideSessionsDuringTimer } = useTimer(); // Use from context

  const [delay, setdelay] = useState(false);
  const [lock-in, setlock-in] = useState(false);
  const [defaultDuration, setDefaultDuration] = useState("90");
  const [breakDuration, setBreakDuration] = useState("15");
  const [maxDistance, setMaxDistance] = useState([2000]);
  
  // Notification preferences with detailed options
  const [focusNotifications, setFocusNotifications] = useState({ push: false, vibrate: false, sound: false });
  const [breakNotifications, setBreakNotifications] = useState({ push: false, vibrate: false, sound: false });
  const [sessionInvites, setSessionInvites] = useState({ push: false, vibrate: false, sound: false });
  const [friendActivity, setFriendActivity] = useState({ push: false, vibrate: false, sound: false });
  
  // Transition preferences
  const [autoTransition, setAutoTransition] = useState(false);
  
  // Verification standards
  const [verificationStandard, setVerificationStandard] = useState("anyone");
  
  // Privacy settings
  const [profileVisibility, setProfileVisibility] = useState("friends");
  const [locationSharing, setLocationSharing] = useState("approximate");
  
  const [hasChanges, setHasChanges] = useState(false);

  const [momentaryText, setMomentaryText] = useState<{ [key: string]: string | null }>({});
  const timeoutRefs = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const showMomentaryText = (key: string, text: string) => {
    setMomentaryText(prev => ({ ...prev, [key]: text }));
    if (timeoutRefs.current[key]) {
      clearTimeout(timeoutRefs.current[key]);
    }
    timeoutRefs.current[key] = setTimeout(() => {
      setMomentaryText(prev => ({ ...prev, [key]: null }));
    }, 1500); // Text visible for 1.5 seconds
  };

  const handleSave = () => {
    // Save settings logic would go here
    setHasChanges(false);
  };

  const checkForChanges = () => {
    setHasChanges(true);
  };

  const updateNotificationSetting = (type: 'focus' | 'break' | 'invites' | 'activity', key: 'push' | 'vibrate' | 'sound', value: boolean) => {
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
    
    setters[type]({ ...currentValues[type], [key]: value });
    checkForChanges();
    showMomentaryText(`${type}-${key}`, value ? 'On' : 'Off');
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
      
      <div className="flex items-center gap-4">
        <div className="relative">
          <Button
            variant="outline"
            size="icon"
            className={`w-10 h-10 rounded-full transition-colors ${value.push ? 'bg-olive text-olive-foreground' : 'text-muted-foreground hover:bg-muted'}`}
            onClick={() => updateNotificationSetting(type, 'push', !value.push)}
          >
            <Bell size={20} />
          </Button>
          {momentaryText[`${type}-push`] && (
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs bg-popover text-popover-foreground px-2 py-1 rounded-full whitespace-nowrap opacity-100 transition-opacity duration-300">
              Push {momentaryText[`${type}-push`]}
            </span>
          )}
        </div>

        <div className="relative">
          <Button
            variant="outline"
            size="icon"
            className={`w-10 h-10 rounded-full transition-colors ${value.vibrate ? 'bg-olive text-olive-foreground' : 'text-muted-foreground hover:bg-muted'}`}
            onClick={() => updateNotificationSetting(type, 'vibrate', !value.vibrate)}
          >
            <Smartphone size={20} />
          </Button>
          {momentaryText[`${type}-vibrate`] && (
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs bg-popover text-popover-foreground px-2 py-1 rounded-full whitespace-nowrap opacity-100 transition-opacity duration-300">
              Vibrate {momentaryText[`${type}-vibrate`]}
            </span>
          )}
        </div>

        <div className="relative">
          <Button
            variant="outline"
            size="icon"
            className={`w-10 h-10 rounded-full transition-colors ${value.sound ? 'bg-olive text-olive-foreground' : 'text-muted-foreground hover:bg-muted'}`}
            onClick={() => updateNotificationSetting(type, 'sound', !value.sound)}
          >
            <Volume2 size={20} />
          </Button>
          {momentaryText[`${type}-sound`] && (
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs bg-popover text-popover-foreground px-2 py-1 rounded-full whitespace-nowrap opacity-100 transition-opacity duration-300">
              Sound {momentaryText[`${type}-sound`]}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">Optimise your experience</p>
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

        {/* Behaviour */}
        <AccordionItem value="behaviour" className="border rounded-lg px-6">
          <AccordionTrigger className="text-xl font-semibold">
            Behaviour
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="hide-sessions-during-timer">Hide Sessions During Timer</Label>
                <p className="text-sm text-muted-foreground">
                  Hide Nearby and Friends sessions when your timer is active.
                </p>
              </div>
              <Switch
                id="hide-sessions-during-timer"
                checked={hideSessionsDuringTimer}
                onCheckedChange={(checked) => {
                  setHideSessionsDuringTimer(checked);
                  checkForChanges();
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-transition"> Auto/Manual Transitions</Label>
                <p className="text-sm text-muted-foreground">
                  Prompt at the end of sessions?
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
                <Label htmlFor="delay">Delay External Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Until next break
                </p>
              </div>
              <Switch
                id="delay"
                checked={delay}
                onCheckedChange={(checked) => {
                  setdelay(checked);
                  checkForChanges();
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="lock-in">Lock in</Label>
                <p className="text-sm text-muted-foreground">
                  Prevent switching apps until break
                </p>
              </div>
              <Switch
                id="lock-in"
                checked={lock-in}
                onCheckedChange={(checked) => {
                  setlock-in(checked);
                  checkForChanges();
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="focus-duration">Focus Duration (minutes)</Label>
              <Select value={defaultDuration} onValueChange={(value) => {
                setDefaultDuration(value);
                checkForChanges();
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="45">45</SelectItem>
                  <SelectItem value="60">60</SelectItem>
                  <SelectItem value="75">75</SelectItem>
                  <SelectItem value="90">90</SelectItem>
                </SelectContent>
              </Select>
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
              <Label htmlFor="focus-duration">Focus Duration (minutes)</Label>
              <Select value={defaultDuration} onValueChange={(value) => {
                setDefaultDuration(value);
                checkForChanges();
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="45">45</SelectItem>
                  <SelectItem value="60">60</SelectItem>
                  <SelectItem value="75">75</SelectItem>
                  <SelectItem value="90">90</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="break-duration">Break Duration (minutes)</Label>
              <Select value={breakDuration} onValueChange={(value) => {
                setBreakDuration(value);
                checkForChanges();
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="30">30</SelectItem>
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
                  {maxDistance[0] > 1000 && maxDistance[0] <= 2000 && "Short bike ride"}
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
              <Label>Minimum Verification Status</Label>
              <p className="text-sm text-muted-foreground">
                for users to interact with sessions you host
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