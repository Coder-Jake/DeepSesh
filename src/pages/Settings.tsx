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
import { NotificationSettings } from "@/types/timer"; // Import NotificationSettings type

const Settings = () => {
  const { 
    showSessionsWhileActive, 
    setShowSessionsWhileActive, 
    focusMinutes, 
    setFocusMinutes, 
    breakMinutes, 
    setBreakMinutes, 
    timerIncrement, 
    setTimerIncrement, 
    shouldPlayEndSound, 
    setShouldPlayEndSound, 
    shouldShowEndToast, 
    setShouldShowEndToast, 
    isBatchNotificationsEnabled,
    setIsBatchNotificationsEnabled,
    batchNotificationPreference,
    setBatchNotificationPreference,
    customBatchMinutes,
    setCustomBatchMinutes,
    lock,
    setLock,
    exemptionsEnabled,
    setExemptionsEnabled,
    phoneCalls,
    setPhoneCalls,
    favourites,
    setFavourites,
    workApps,
    setWorkApps,
    intentionalBreaches,
    setIntentionalBreaches,
    manualTransition,
    setManualTransition,
    maxDistance,
    setMaxDistance,
    askNotifications,
    setAskNotifications,
    sessionInvites,
    setSessionInvites,
    friendActivity,
    setFriendActivity,
    breakNotificationsVibrate,
    setBreakNotificationsVibrate,
    verificationStandard,
    setVerificationStandard,
    profileVisibility,
    setProfileVisibility,
    locationSharing,
    setLocationSharing,
    isGlobalPrivate, // Renamed from isGlobalPublic
    setIsGlobalPrivate, // Renamed from setIsGlobalPublic
    openSettingsAccordions, // Get from context
    setOpenSettingsAccordions, // Get from context
  } = useTimer();

  // Local state for temporary UI interactions or derived values
  const [selectedFocusDuration, setSelectedFocusDuration] = useState<string>(focusMinutes.toString());
  const [customFocusDuration, setCustomFocusDuration] = useState<string>(
    !['15', '25', '45', '55', '75', '90'].includes(focusMinutes.toString()) ? focusMinutes.toString() : ''
  );
  const [selectedBreakDuration, setSelectedBreakDuration] = useState<string>(breakMinutes.toString());
  const [customBreakDuration, setCustomBreakDuration] = useState<string>(
    !['5', '10', '15', '20', '30'].includes(breakMinutes.toString()) ? breakMinutes.toString() : ''
  );
  const [currentTimerIncrement, setCurrentTimerIncrement] = useState(timerIncrement);

  const [hasChanges, setHasChanges] = useState(false);

  const [momentaryText, setMomentaryText] = useState<{ [key: string]: string | null }>({});
  const timeoutRefs = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Ref to store the *last saved* or *initial loaded* state for comparison
  // Initialize with current context values on first render
  const savedSettingsRef = useRef({
    showSessionsWhileActive,
    isBatchNotificationsEnabled,
    batchNotificationPreference,
    customBatchMinutes,
    lock,
    exemptionsEnabled,
    phoneCalls,
    favourites,
    workApps,
    intentionalBreaches,
    manualTransition,
    focusMinutes,
    breakMinutes,
    maxDistance,
    askNotifications,
    breakNotificationsVibrate,
    sessionInvites,
    friendActivity,
    verificationStandard,
    profileVisibility,
    locationSharing,
    isGlobalPrivate, // Renamed
    timerIncrement,
    shouldPlayEndSound,
    shouldShowEndToast,
  });

  // Effect to sync local UI states with context on initial load
  // This runs once on mount to set up local states from context.
  // It does NOT update savedSettingsRef.current after initial mount.
  useEffect(() => {
    setSelectedFocusDuration(focusMinutes.toString());
    setCustomFocusDuration(
      !['15', '25', '45', '55', '75', '90'].includes(focusMinutes.toString()) ? focusMinutes.toString() : ''
    );
    setSelectedBreakDuration(breakMinutes.toString());
    setCustomBreakDuration(
      !['5', '10', '15', '20', '30'].includes(breakMinutes.toString()) ? breakMinutes.toString() : ''
    );
    setCurrentTimerIncrement(timerIncrement);
    // No update to savedSettingsRef.current here after initial render
  }, [
    focusMinutes, breakMinutes, timerIncrement, // Only dependencies that affect local state initialization
    // Other context values are directly used in the UI and don't need local state copies for display
  ]);


  // Effect to detect changes in local UI states compared to saved settings
  useEffect(() => {
    const currentFocusVal = selectedFocusDuration === 'custom' ? (parseInt(customFocusDuration) || 0) : parseInt(selectedFocusDuration);
    const currentBreakVal = selectedBreakDuration === 'custom' ? (parseInt(customBreakDuration) || 0) : parseInt(selectedBreakDuration);

    const currentUiSettings = {
      showSessionsWhileActive,
      isBatchNotificationsEnabled,
      batchNotificationPreference,
      customBatchMinutes,
      lock,
      exemptionsEnabled,
      phoneCalls,
      favourites,
      workApps,
      intentionalBreaches,
      manualTransition,
      focusMinutes: currentFocusVal,
      breakMinutes: currentBreakVal,
      maxDistance,
      askNotifications,
      breakNotificationsVibrate,
      sessionInvites,
      friendActivity,
      verificationStandard,
      profileVisibility,
      locationSharing,
      isGlobalPrivate, // Renamed
      timerIncrement: currentTimerIncrement,
      shouldPlayEndSound,
      shouldShowEndToast,
    };

    const changed = Object.keys(currentUiSettings).some(key => {
      const currentVal = currentUiSettings[key as keyof typeof currentUiSettings];
      const savedVal = savedSettingsRef.current[key as keyof typeof savedSettingsRef.current];

      // Deep comparison for objects (like NotificationSettings)
      if (typeof currentVal === 'object' && currentVal !== null && !Array.isArray(currentVal)) {
        return JSON.stringify(currentVal) !== JSON.stringify(savedVal);
      }
      return currentVal !== savedVal;
    });
    setHasChanges(changed);
  }, [
    showSessionsWhileActive, isBatchNotificationsEnabled, batchNotificationPreference, customBatchMinutes,
    lock, exemptionsEnabled, phoneCalls, favourites, workApps, intentionalBreaches,
    manualTransition, selectedFocusDuration, customFocusDuration, selectedBreakDuration, customBreakDuration, maxDistance,
    askNotifications, breakNotificationsVibrate, sessionInvites, friendActivity,
    verificationStandard, profileVisibility, locationSharing,
    isGlobalPrivate, // Renamed
    currentTimerIncrement, shouldPlayEndSound, shouldShowEndToast,
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

  const updateNotificationSetting = (
    type: 'ask' | 'break' | 'invites' | 'activity',
    field: 'push' | 'vibrate' | 'sound',
    value: boolean
  ) => {
    const text = value ? 'Enabled' : 'Disabled';
    showMomentaryText(`${type}-${field}`, text);

    if (type === 'ask') {
      setAskNotifications((prev: NotificationSettings) => ({ ...prev, [field]: value }));
    } else if (type === 'break') {
      if (field === 'push') setShouldShowEndToast(value);
      if (field === 'vibrate') setBreakNotificationsVibrate(value);
      if (field === 'sound') setShouldPlayEndSound(value);
    } else if (type === 'invites') {
      setSessionInvites((prev: NotificationSettings) => ({ ...prev, [field]: value }));
    } else if (type === 'activity') {
      setFriendActivity((prev: NotificationSettings) => ({ ...prev, [field]: value }));
    }
  };

  const NotificationControl = ({ 
    type, 
    title, 
    description, 
    value 
  }: { 
    type: 'ask' | 'break' | 'invites' | 'activity';
    title: string;
    description?: string;
    value: { push: boolean; vibrate: boolean; sound: boolean; };
  }) => (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-medium">
          {title}
        </Label>
        {description && (
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
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

  const handleSave = () => {
    const newFocusMinutes = selectedFocusDuration === 'custom' 
      ? Math.max(1, parseInt(customFocusDuration) || 1) 
      : parseInt(selectedFocusDuration);
    const newBreakMinutes = selectedBreakDuration === 'custom' 
      ? Math.max(1, parseInt(customBreakDuration) || 1) 
      : parseInt(selectedBreakDuration);

    setFocusMinutes(newFocusMinutes);
    setBreakMinutes(newBreakMinutes);
    setTimerIncrement(currentTimerIncrement);
    setShowSessionsWhileActive(showSessionsWhileActive);
    setIsBatchNotificationsEnabled(isBatchNotificationsEnabled);
    setBatchNotificationPreference(batchNotificationPreference);
    setCustomBatchMinutes(customBatchMinutes);
    setLock(lock);
    setExemptionsEnabled(exemptionsEnabled);
    setPhoneCalls(phoneCalls);
    setFavourites(favourites);
    setWorkApps(workApps);
    setIntentionalBreaches(intentionalBreaches);
    setManualTransition(manualTransition);
    setMaxDistance(maxDistance);
    setAskNotifications(askNotifications);
    setSessionInvites(sessionInvites);
    setFriendActivity(friendActivity);
    setBreakNotificationsVibrate(breakNotificationsVibrate);
    setVerificationStandard(verificationStandard);
    setProfileVisibility(profileVisibility);
    setLocationSharing(locationSharing);
    setIsGlobalPrivate(isGlobalPrivate); // Renamed
    setShouldPlayEndSound(shouldPlayEndSound);
    setShouldShowEndToast(shouldShowEndToast);

    // After saving, update the ref to reflect the new "saved" state
    savedSettingsRef.current = {
      showSessionsWhileActive,
      isBatchNotificationsEnabled,
      batchNotificationPreference,
      customBatchMinutes,
      lock,
      exemptionsEnabled,
      phoneCalls,
      favourites,
      workApps,
      intentionalBreaches,
      manualTransition,
      focusMinutes: newFocusMinutes,
      breakMinutes: newBreakMinutes,
      maxDistance,
      askNotifications,
      breakNotificationsVibrate,
      sessionInvites,
      friendActivity,
      verificationStandard,
      profileVisibility,
      locationSharing,
      isGlobalPrivate, // Renamed
      timerIncrement: currentTimerIncrement,
      shouldPlayEndSound,
      shouldShowEndToast,
    };
    setHasChanges(false);
  };

  return (
    <main className="max-w-4xl mx-auto pt-16 px-4 pb-4 lg:pt-20 lg:px-6 lg:pb-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">Optimise your experience</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Accordion 
          type="multiple" 
          className="space-y-4" 
          value={openSettingsAccordions} // Bind to context state
          onValueChange={setOpenSettingsAccordions} // Update context state
        >
          {/* Notifications */}
          <AccordionItem value="notifications" className="border rounded-lg px-6">
            <AccordionTrigger className="text-xl font-semibold">
              Notifications
            </AccordionTrigger>
            <AccordionContent className="space-y-8 pt-4">
              <NotificationControl
                type="ask"
                title="Asks"
                value={askNotifications}
              />

              <NotificationControl
                type="ask"
                title="Joins"
                value={askNotifications}
              />
              
              <NotificationControl
                type="break"
                title="Break Reminders"
                value={{ push: shouldShowEndToast, vibrate: breakNotificationsVibrate, sound: shouldPlayEndSound }}
              />
              
              <NotificationControl
                type="invites"
                title="Session Invites"
                value={sessionInvites}
              />
              
              <NotificationControl
                type="activity"
                title="Friend Activity"
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
                  <Label htmlFor="show-sessions-while-active">Show other sessions while active</Label>
                  <p className="text-sm text-muted-foreground">
                    Keep Nearby and Friends sessions visible when your timer is active.
                  </p>
                </div>
                <Switch
                  id="show-sessions-while-active"
                  checked={showSessionsWhileActive}
                  onCheckedChange={setShowSessionsWhileActive}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="manual-transition"> Manual Transitions</Label>
                  <p className="text-sm text-muted-foreground">
                    Prompt for session ends?
                  </p>
                </div >
                <Switch
                  id="manual-transition"
                  checked={manualTransition}
                  onCheckedChange={setManualTransition}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="lock">Lock in!</Label>
                  <p className="text-sm text-muted-foreground">
                    Prevent switching apps until break
                  </p>
                </div >
                <Switch
                  id="lock"
                  checked={lock}
                  onCheckedChange={setLock}
                />
              </div>

              {/* Updated Batch Notifications Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="batch-notifications-toggle">Batch Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Group notifications to reduce interruptions.
                    </p>
                  </div>
                  <Switch
                    id="batch-notifications-toggle"
                    checked={isBatchNotificationsEnabled}
                    onCheckedChange={setIsBatchNotificationsEnabled}
                  />
                </div>

                {isBatchNotificationsEnabled && (
                  <div className="space-y-2">
                    <Label htmlFor="batch-notifications-preference">Hold until:</Label>
                    <Select value={batchNotificationPreference} onValueChange={(value: 'break' | 'sesh_end' | 'custom') => setBatchNotificationPreference(value)}>
                      <SelectTrigger id="batch-notifications-preference">
                        <SelectValue placeholder="Select when to batch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="break">Next Break</SelectItem>
                        <SelectItem value="sesh_end">Sesh End</SelectItem>
                        <SelectItem value="custom">Custom Minutes</SelectItem>
                      </SelectContent>
                    </Select>
                    {batchNotificationPreference === 'custom' && (
                      <Input
                        type="number"
                        placeholder="Enter minutes"
                        value={customBatchMinutes === 0 ? "" : customBatchMinutes}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "") {
                            setCustomBatchMinutes(0);
                          } else {
                            setCustomBatchMinutes(parseFloat(value) || 0);
                          }
                        }}
                        onBlur={() => {
                          if (customBatchMinutes === 0) {
                            setCustomBatchMinutes(timerIncrement);
                          }
                        }}
                        min={timerIncrement}
                        step={timerIncrement}
                        className="mt-2"
                        onFocus={(e) => e.target.select()}
                      />
                    )}
                  </div>
                )}
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

        <Accordion 
          type="multiple" 
          className="space-y-4"
          value={openSettingsAccordions} // Bind to context state
          onValueChange={setOpenSettingsAccordions} // Update context state
        >
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
                  onClick={() => setIsGlobalPrivate((prev: boolean) => !prev)} // Toggle isGlobalPrivate
                  className={cn(
                    "px-4 py-2 rounded-full transition-colors text-black select-none",
                    !isGlobalPrivate ? "bg-[hsl(var(--public-bg))] hover:bg-white" : "bg-[hsl(var(--private-bg))] hover:bg-white" // Display Public when false, Private when true
                  )}
                >
                  {!isGlobalPrivate ? "Public" : "Private"} {/* Display Public when false, Private when true */}
                </Button>
              </div>

              {/* New Increments Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="timer-increments-toggle">Increments</Label>
                  <p className="text-sm text-muted-foreground">
                    Adjust timers by 1 or 5 minutes.
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
                    onFocus={(e) => e.target.select()}
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
                    onFocus={(e) => e.target.select()}
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
                      value={[maxDistance]} // Slider expects an array
                      onValueChange={(val) => setMaxDistance(val[0])} // Extract single value
                      max={5000}
                      min={100}
                      step={100}
                      className="w-full"
                    />
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none select-none">
                      {maxDistance >= 1000 ? `${(maxDistance / 1000).toFixed(1)}km` : `${maxDistance}m`}
                    </div>
                  </div>
                  <div className="text-center mt-3 text-sm text-muted-foreground select-none">
                    {maxDistance <= 300 && "Very close proximity only"}
                    {maxDistance > 300 && maxDistance <= 1000 && "Walking distance"}
                    {maxDistance > 1000 && maxDistance <= 2000 && "Short bike ride"}
                    {maxDistance > 2000 && "Wider area search"}
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
                <Select 
                  value={profileVisibility} 
                  onValueChange={(value: string) => setProfileVisibility(value as 'public' | 'friends' | 'private')}
                >
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
                  <Select 
                    value={profileVisibility} // This seems to be a copy-paste error, should be a different state for 'Your Verification'
                    onValueChange={(value: string) => setProfileVisibility(value as 'public' | 'friends' | 'private')} // Assuming it's still profileVisibility for now
                  >
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
                  <Select 
                    value={verificationStandard} 
                    onValueChange={(value: string) => setVerificationStandard(value as 'anyone' | 'phone1' | 'organisation' | 'id1')}
                  >
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
      <div className={cn(
        "fixed bottom-4 right-4 z-50 transition-opacity duration-300",
        hasChanges ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}>
        <Button 
          onClick={handleSave}
          disabled={!hasChanges}
          className="shadow-lg"
        >
          Save Settings
        </Button>
      </div>
    </main>
  );
};

export default Settings;