import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useState, useRef, useEffect } from "react";
import { Bell, Smartphone, Volume2 } from "lucide-react";
import { useTimer } from "@/contexts/TimerContext";
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox
import { Input } from "@/components/ui/input"; // Import Input
import { cn } from "@/lib/utils"; // Import cn for conditional class names

const Settings = () => {
  const { 
    hideSessionsDuringTimer, 
    setHideSessionsDuringTimer,
    focusMinutes, // Get current focusMinutes from context
    setFocusMinutes, // Setter for focusMinutes
    breakMinutes, // Setter for breakMinutes
    setBreakMinutes, // Setter for breakMinutes
    timerIncrement, // Get current timerIncrement from context
    setTimerIncrement, // Setter for timerIncrement
  } = useTimer();

  const [delay, setdelay] = useState(false);
  const [lock, setlock] = useState(false);
  const [exemptionsEnabled, setExemptionsEnabled] = useState(false);
  const [phoneCalls, setPhoneCalls] = useState(false);
  const [favourites, setFavourites] = useState(false);
  const [workApps, setWorkApps] = useState(false);
  const [intentionalBreaches, setIntentionalBreaches] = useState(false);

  const [selectedFocusDuration, setSelectedFocusDuration] = useState<string>(focusMinutes.toString());
  const [customFocusDuration, setCustomFocusDuration] = useState<string>(
    !['15', '25', '45', '55', '75', '90'].includes(focusMinutes.toString()) ? focusMinutes.toString() : ''
  );
  const [selectedBreakDuration, setSelectedBreakDuration] = useState<string>(breakMinutes.toString());
  const [customBreakDuration, setCustomBreakDuration] = useState<string>(
    !['5', '10', '15', '20', '30'].includes(breakMinutes.toString()) ? breakMinutes.toString() : ''
  );

  const [maxDistance, setMaxDistance] = useState([2000]);
  
  // Notification preferences with detailed options
  const [askNotifications, setaskNotifications] = useState({ push: false, vibrate: false, sound: false });
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

  // New state for global visibility toggle
  const [isGlobalPublic, setIsGlobalPublic] = useState(true); 
  
  // New state for timer increments
  const [currentTimerIncrement, setCurrentTimerIncrement] = useState(timerIncrement);

  const [hasChanges, setHasChanges] = useState(false);

  const [momentaryText, setMomentaryText] = useState<{ [key: string]: string | null }>({});
  const timeoutRefs = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Initial state for comparison to detect changes
  const initialSettings = useRef({
    hideSessionsDuringTimer,
    delay,
    lock,
    exemptionsEnabled,
    phoneCalls,
    favourites,
    workApps,
    intentionalBreaches,
    autoTransition,
    focusMinutes, // Use actual focusMinutes from context
    breakMinutes, // Use actual breakMinutes from context
    maxDistance: maxDistance[0],
    askNotifications,
    breakNotifications,
    sessionInvites,
    friendActivity,
    verificationStandard,
    profileVisibility,
    locationSharing,
    isGlobalPublic, // Add new state here
    timerIncrement, // Add new state here
  });

  useEffect(() => {
    const currentFocusVal = selectedFocusDuration === 'custom' ? (parseInt(customFocusDuration) || 0) : parseInt(selectedFocusDuration);
    const currentBreakVal = selectedBreakDuration === 'custom' ? (parseInt(customBreakDuration) || 0) : parseInt(selectedBreakDuration);

    const currentSettings = {
      hideSessionsDuringTimer,
      delay,
      lock,
      exemptionsEnabled,
      phoneCalls,
      favourites,
      workApps,
      intentionalBreaches,
      autoTransition,
      focusMinutes: currentFocusVal,
      breakMinutes: currentBreakVal,
      maxDistance: maxDistance[0],
      askNotifications,
      breakNotifications,
      sessionInvites,
      friendActivity,
      verificationStandard,
      profileVisibility,
      locationSharing,
      isGlobalPublic, // Add new state here
      timerIncrement: currentTimerIncrement, // Add new state here
    };

    const changed = Object.keys(currentSettings).some(key => {
      const currentVal = currentSettings[key as keyof typeof currentSettings];
      const initialVal = initialSettings.current[key as keyof typeof initialSettings.current];

      if (typeof currentVal === 'object' && currentVal !== null && !Array.isArray(currentVal)) {
        return JSON.stringify(currentVal) !== JSON.stringify(initialVal);
      }
      return currentVal !== initialVal;
    });
    setHasChanges(changed);
  }, [
    hideSessionsDuringTimer, delay, lock, exemptionsEnabled, phoneCalls, favourites, workApps, intentionalBreaches,
    autoTransition, selectedFocusDuration, customFocusDuration, selectedBreakDuration, customBreakDuration, maxDistance,
    askNotifications, breakNotifications, sessionInvites, friendActivity,
    verificationStandard, profileVisibility, locationSharing,
    isGlobalPublic, // Add new state to dependencies
    currentTimerIncrement, // Add new state to dependencies
  ]);

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
    const newFocusMinutes = selectedFocusDuration === 'custom' 
      ? Math.max(1, parseInt(customFocusDuration) || 1) 
      : parseInt(selectedFocusDuration);
    const newBreakMinutes = selectedBreakDuration === 'custom' 
      ? Math.max(1, parseInt(customBreakDuration) || 1) 
      : parseInt(selectedBreakDuration);

    setFocusMinutes(newFocusMinutes);
    setBreakMinutes(newBreakMinutes);
    setTimerIncrement(currentTimerIncrement); // Save the new timer increment

    // Update initial settings for change detection
    initialSettings.current = {
      hideSessionsDuringTimer,
      delay,
      lock,
      exemptionsEnabled,
      phoneCalls,
      favourites,
      workApps,
      intentionalBreaches,
      autoTransition,
      focusMinutes: newFocusMinutes,
      breakMinutes: newBreakMinutes,
      maxDistance: maxDistance[0],
      askNotifications,
      breakNotifications,
      sessionInvites,
      friendActivity,
      verificationStandard,
      profileVisibility,
      locationSharing,
      isGlobalPublic, // Update initial state here
      timerIncrement: currentTimerIncrement, // Update initial state here
    };
    setHasChanges(false);
  };

  const updateNotificationSetting = (type: 'ask' | 'break' | 'invites' | 'activity', key: 'push' | 'vibrate' | 'sound', value: boolean) => {
    const setters = {
      ask: setaskNotifications,
      break: setBreakNotifications,
      invites: setSessionInvites,
      activity: setFriendActivity
    };
    
    const currentValues = {
      ask: askNotifications,
      break: breakNotifications,
      invites: sessionInvites,
      activity: friendActivity
    };
    
    setters[type]({ ...currentValues[type], [key]: value });
    showMomentaryText(`${type}-${key}`, value ? 'On' : 'Off');
  };

  const NotificationControl = ({ 
    type, 
    title, 
    description, 
    value 
  }: { 
    type: 'ask' | 'break' | 'invites' | 'activity';
    title: string;
    description: string;
    value: typeof askNotifications;
  }) => (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-medium">
          {title}
        </Label>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
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
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs bg-popover text-popover-foreground px-2 py-1 rounded-full whitespace-nowrap opacity-100 transition-opacity duration-300 select-none">
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
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs bg-popover text-popover-foreground px-2 py-1 rounded-full whitespace-nowrap opacity-100 transition-opacity duration-300 select-none">
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
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs bg-popover text-popover-foreground px-2 py-1 rounded-full whitespace-nowrap opacity-100 transition-opacity duration-300 select-none">
              Sound {momentaryText[`${type}-sound`]}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <main className="max-w-4xl mx-auto p-4 lg:p-6"> {/* Adjusted padding */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">Optimise your experience</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4"> {/* Added grid for two columns */}
        <Accordion type="multiple" className="space-y-4">
          {/* Notifications */}
          <AccordionItem value="notifications" className="border rounded-lg px-6">
            <AccordionTrigger className="text-xl font-semibold">
              Notifications
            </AccordionTrigger>
            <AccordionContent className="space-y-8 pt-4">
              <NotificationControl
                type="ask"
                title="Asks"
                description="Get notified when coworkers Ask"
                value={askNotifications}
              />

              <NotificationControl
                type="ask" // This was 'join' but the type is 'ask'
                title="Joins"
                description="Get notified when newcomers Join"
                value={askNotifications}
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
                  onCheckedChange={setHideSessionsDuringTimer}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-transition"> Manual Transitions</Label>
                  <p className="text-sm text-muted-foreground">
                    Prompt for session ends?
                  </p>
                </div>
                <Switch
                  id="auto-transition"
                  checked={autoTransition}
                  onCheckedChange={setAutoTransition}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="lock">Lock in!</Label>
                  <p className="text-sm text-muted-foreground">
                    Prevent switching apps until break
                  </p>
                </div>
                <Switch
                  id="lock"
                  checked={lock}
                  onCheckedChange={setlock}
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
                  onCheckedChange={setdelay}
                />
              </div>



              {/* New Exemptions Switch */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="exemptions">Exemptions</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow specific interruptions during locked-in sessions.
                    </p>
                  </div>
                  <Switch
                    id="exemptions"
                    checked={exemptionsEnabled}
                    onCheckedChange={setExemptionsEnabled}
                  />
                </div>

                {/* Checkboxes for Exemptions (conditionally rendered) */}
                {exemptionsEnabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-4 pt-2 border-l border-border ml-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="phonecalls"
                        checked={phoneCalls}
                        onCheckedChange={(checked) => setPhoneCalls(!!checked)}
                      />
                      <Label htmlFor="phonecalls" className="text-sm font-normal">
                        Phone Calls
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="favourites"
                        checked={favourites}
                        onCheckedChange={(checked) => setFavourites(!!checked)}
                      />
                      <Label htmlFor="favourites" className="text-sm font-normal">
                        Favourites
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="work-apps"
                        checked={workApps}
                        onCheckedChange={(checked) => setWorkApps(!!checked)}
                      />
                      <Label htmlFor="work-apps" className="text-sm font-normal">
                        Work Apps
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="intentional-breaches"
                        checked={intentionalBreaches}
                        onCheckedChange={(checked) => setIntentionalBreaches(!!checked)}
                      />
                      <Label htmlFor="intentional-breaches" className="text-sm font-normal">
                        Intentional Breaches
                      </Label>
                    </div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Accordion type="multiple" className="space-y-4"> {/* New Accordion for the second column */}
          {/* Session Defaults */}
          <AccordionItem value="session-defaults" className="border rounded-lg px-6">
            <AccordionTrigger className="text-xl font-semibold">
              Session Defaults
            </AccordionTrigger>
            <AccordionContent className="space-y-6 pt-4">
              {/* Global Session Visibility - Moved here */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="global-visibility-toggle">Visibility</Label>
                </div >
                <Button
                  id="global-visibility-toggle"
                  onClick={() => setIsGlobalPublic(prev => !prev)}
                  className={cn(
                    "px-4 py-2 rounded-full transition-colors text-black select-none",
                    isGlobalPublic ? "bg-[hsl(var(--public-bg))] hover:bg-white" : "bg-[hsl(var(--private-bg))] hover:bg-white"
                  )}
                >
                  {isGlobalPublic ? "Public" : "Private"}
                </Button>
              </div>

              {/* New Increments Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="timer-increments-toggle">Increments</Label>
                  <p className="text-sm text-muted-foreground">
                    Adjust timer by 1 or 5 minutes.
                  </p>
                </div>
                <Button
                  id="timer-increments-toggle"
                  onClick={() => setCurrentTimerIncrement(prev => prev === 1 ? 5 : 1)}
                  className={cn(
                    "px-4 py-2 rounded-full transition-colors text-foreground bg-muted hover:bg-muted/80 select-none"
                  )}
                >
                  {currentTimerIncrement}
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="focus-duration">Focus </Label>
                <Select value={selectedFocusDuration} onValueChange={setSelectedFocusDuration}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="45">45</SelectItem>
                    <SelectItem value="55">55</SelectItem>
                    <SelectItem value="75">75</SelectItem>
                    <SelectItem value="90">90</SelectItem>
                    <SelectItem value="custom">Other (Custom)</SelectItem>
                  </SelectContent>
                </Select>
                {selectedFocusDuration === 'custom' && (
                  <Input
                    type="number"
                    placeholder="Enter custom minutes"
                    value={customFocusDuration}
                    onChange={(e) => setCustomFocusDuration(e.target.value)}
                    min="1"
                    className="mt-2"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="break-duration">Break</Label>
                <Select value={selectedBreakDuration} onValueChange={setSelectedBreakDuration}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                    <SelectItem value="custom">Other (Custom)</SelectItem>
                  </SelectContent>
                </Select>
                {selectedBreakDuration === 'custom' && (
                  <Input
                    type="number"
                    placeholder="Enter custom minutes"
                    value={customBreakDuration}
                    onChange={(e) => setCustomBreakDuration(e.target.value)}
                    min="1"
                    className="mt-2"
                  />
                )}
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
                  <div className="flex justify-between text-sm text-muted-foreground select-none">
                    <span>100m</span>
                    <span>5km</span>
                  </div>
                  <div className="relative group">
                    <Slider
                      value={maxDistance}
                      onValueChange={setMaxDistance}
                      max={5000}
                      min={100}
                      step={100}
                      className="w-full"
                    />
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none select-none">
                      {maxDistance[0] >= 1000 ? `${(maxDistance[0] / 1000).toFixed(1)}km` : `${maxDistance[0]}m`}
                    </div>
                  </div>
                  <div className="text-center mt-3 text-sm text-muted-foreground select-none">
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
                <Select value={profileVisibility} onValueChange={setProfileVisibility}>
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

              {/* Verification Subheading */}
              <div className="border-t border-border pt-6 mt-6">
                <h3 className="text-lg font-semibold mb-4">Verification</h3>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Get security clearance
                  </p>
                  <p className="text-sm text-muted-foreground">Access exclusive sessions</p>
                  <p className="text-sm text-muted-foreground">Build trust with peers</p>
                  <p className="text-sm text-muted-foreground">Compete for prizes! <br /> <br /> <br />  </p>
                  <Label>Your Verification</Label>
                  <Select value={profileVisibility} onValueChange={setProfileVisibility}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select verification status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Anon">None</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="organisation">Enterprise</SelectItem>
                      <SelectItem value="id">ID Verified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 mt-6">
                  <Label>Minimum Verification Status</Label>
                  <p className="text-sm text-muted-foreground">
                    for users to interact with sessions you host
                  </p>
                  <Select value={verificationStandard} onValueChange={setVerificationStandard}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select verification standard" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anyone">Anyone - No verification required</SelectItem>
                      <SelectItem value="phone1">Phone - Number verified</SelectItem>
                      <SelectItem value="organisation">Enterprise - verified organisation email</SelectItem>
                      <SelectItem value="id1">ID Verified - verified government ID</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
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