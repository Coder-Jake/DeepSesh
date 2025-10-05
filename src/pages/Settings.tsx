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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // Import Tooltip components
import { useAuth } from "@/contexts/AuthContext"; // Import useAuth
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { supabase } from "@/integrations/supabase/client"; // Import supabase client
import { useToast } from "@/hooks/use-toast"; // Import useToast
import { useTheme } from "@/contexts/ThemeContext"; // Import useTheme

const Settings = () => {
  const { 
    showSessionsWhileActive, 
    setShowSessionsWhileActive, 
    focusMinutes, 
    setFocusMinutes, 
    breakMinutes, 
    setBreakMinutes, 
    timerIncrement, 
    setTimerIncrement, // Use the setter from context
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
    profileVisibility, // Now an array
    setProfileVisibility, // Now handles array
    locationSharing,
    setLocationSharing,
    isGlobalPrivate, // Renamed from isGlobalPublic
    setIsGlobalPrivate, // Renamed from setIsGlobalPublic
    openSettingsAccordions, // Get from context
    setOpenSettingsAccordions, // Get from context
    is24HourFormat, // NEW: Get from context
    setIs24HourFormat, // NEW: Get from context
    areToastsEnabled, // NEW: Get from context
    setAreToastsEnabled, // NEW: Get from context
  } = useTimer();

  const { user } = useAuth(); // Get user from AuthContext
  const navigate = useNavigate(); // Initialize useNavigate
  const { toast } = useToast(); // Use shadcn toast for UI feedback
  const { isDarkMode, toggleDarkMode } = useTheme(); // Use theme context

  // Local state for temporary UI interactions or derived values
  const [currentTimerIncrement, setCurrentTimerIncrement] = useState(timerIncrement);

  const [hasChanges, setHasChanges] = useState(false);

  const [momentaryText, setMomentaryText] = useState<{ [key: string]: string | null }>({});
  const timeoutRefs = useRef<Record<string, NodeJS.Timeout>>({});

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
    profileVisibility, // Now an array
    locationSharing,
    isGlobalPrivate, // Renamed
    timerIncrement,
    shouldPlayEndSound,
    shouldShowEndToast,
    isDarkMode, // Added isDarkMode to saved settings
    is24HourFormat, // NEW: Added is24HourFormat
    areToastsEnabled, // NEW: Added areToastsEnabled
  });

  // Effect to sync local UI states with context on initial load
  // This runs once on mount to set up local states from context.
  // It does NOT update savedSettingsRef.current after initial mount.
  useEffect(() => {
    setCurrentTimerIncrement(timerIncrement);
    // No update to savedSettingsRef.current here after initial render
  }, [
    timerIncrement, // Only dependencies that affect local state initialization
    // Other context values are directly used in the UI and don't need local state copies for display
  ]);


  // Effect to detect changes in local UI states compared to saved settings
  useEffect(() => {
    // Directly use context values for comparison
    const currentFocusVal = focusMinutes;
    const currentBreakVal = breakMinutes;

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
      profileVisibility, // Compare array
      locationSharing,
      isGlobalPrivate, // Renamed
      timerIncrement: currentTimerIncrement,
      shouldPlayEndSound,
      shouldShowEndToast,
      isDarkMode, // Added isDarkMode to current UI settings
      is24HourFormat, // NEW: Added is24HourFormat
      areToastsEnabled, // NEW: Added areToastsEnabled
    };

    const changed = Object.keys(currentUiSettings).some(key => {
      const currentVal = currentUiSettings[key as keyof typeof currentUiSettings];
      const savedVal = savedSettingsRef.current[key as keyof typeof savedSettingsRef.current];

      // Deep comparison for objects/arrays (like NotificationSettings and profileVisibility)
      if (typeof currentVal === 'object' && currentVal !== null) {
        return JSON.stringify(currentVal) !== JSON.stringify(savedVal);
      }
      return currentVal !== savedVal;
    });
    setHasChanges(changed);
  }, [
    showSessionsWhileActive, isBatchNotificationsEnabled, batchNotificationPreference, customBatchMinutes,
    lock, exemptionsEnabled, phoneCalls, favourites, workApps, intentionalBreaches,
    manualTransition, focusMinutes, breakMinutes, maxDistance, // Updated dependencies
    askNotifications, breakNotificationsVibrate, sessionInvites, friendActivity,
    verificationStandard, profileVisibility, locationSharing,
    isGlobalPrivate, // Renamed
    currentTimerIncrement, shouldPlayEndSound, shouldShowEndToast,
    isDarkMode, // Added isDarkMode dependency
    is24HourFormat, // NEW: Added is24HourFormat dependency
    areToastsEnabled, // NEW: Added areToastsEnabled dependency
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

  const handleProfileVisibilityChange = (
    option: 'public' | 'friends' | 'organisation' | 'private',
    checked: boolean
  ) => {
    setProfileVisibility(prevVisibility => {
      let newVisibility = [...prevVisibility];

      if (option === 'private') {
        if (checked) {
          // If 'private' is checked, it becomes the only option
          newVisibility = ['private'];
        } else {
          // If 'private' is unchecked, default to 'public'
          newVisibility = ['public']; 
        }
      } else {
        // If a non-private option is toggled
        if (newVisibility.includes('private')) {
          // If 'private' was active, deselect it first
          newVisibility = newVisibility.filter(v => v !== 'private');
        }

        if (checked) {
          // Add the option if checked and not already present
          if (!newVisibility.includes(option)) {
            newVisibility.push(option);
          }
        } else {
          // Remove the option if unchecked
          newVisibility = newVisibility.filter(v => v !== option);
        }

        // Ensure at least one non-private option is selected if not private
        if (newVisibility.length === 0 && !newVisibility.includes('private')) {
          newVisibility = ['public']; // Default to public if nothing else is selected
        }
      }
      return newVisibility;
    });
  };

  const handleSave = () => {
    // Focus and Break minutes are now updated directly by their input fields
    // No need for newFocusMinutes/newBreakMinutes parsing here
    setTimerIncrement(currentTimerIncrement); // Corrected type here
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
    // profileVisibility is already updated via handleProfileVisibilityChange
    setLocationSharing(locationSharing);
    setIsGlobalPrivate(isGlobalPrivate); // Renamed
    setShouldPlayEndSound(shouldPlayEndSound);
    setShouldShowEndToast(shouldShowEndToast);
    // isDarkMode is handled by ThemeContext and its useEffect
    // is24HourFormat is handled by its own button
    setAreToastsEnabled(areToastsEnabled); // NEW: Save areToastsEnabled

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
      focusMinutes: focusMinutes, // Directly use current context value
      breakMinutes: breakMinutes, // Directly use current context value
      maxDistance,
      askNotifications,
      breakNotificationsVibrate,
      sessionInvites,
      friendActivity,
      verificationStandard,
      profileVisibility, // Save the array
      locationSharing,
      isGlobalPrivate, // Renamed
      timerIncrement: currentTimerIncrement,
      shouldPlayEndSound,
      shouldShowEndToast,
      isDarkMode, // Save current dark mode state
      is24HourFormat, // NEW: Save current time format state
      areToastsEnabled, // NEW: Save areToastsEnabled
    };
    setHasChanges(false);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Logout Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      navigate('/'); // Redirect to home or login page after logout
    }
  };

  return (
    <main className="max-w-4xl mx-auto pt-16 px-4 pb-4 lg:pt-20 lg:px-6 lg:pb-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        {!user && (
          <Button variant="outline" onClick={() => navigate('/login')}>
            Login
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Accordion 
          type="multiple" 
          className="space-y-4" 
          value={openSettingsAccordions} // Bind to context state
          onValueChange={setOpenSettingsAccordions} // Update context state
        >

          {/* Behaviour */}
          <AccordionItem value="behaviour" className="border rounded-lg px-6">
            <AccordionTrigger className="text-xl font-semibold">
              Behaviour
            </AccordionTrigger>
            <AccordionContent className="space-y-6 pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-sessions-while-active">Show other sessions while active</Label>
                </div>
                <Switch
                  id="show-sessions-while-active"
                  checked={showSessionsWhileActive}
                  onCheckedChange={setShowSessionsWhileActive}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Label htmlFor="manual-transition" className="cursor-help">Manual Transitions</Label>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Require confirmation to move between Focus/Break.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div >
                <Switch
                  id="manual-transition"
                  checked={manualTransition}
                  onCheckedChange={setManualTransition}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Label htmlFor="lock" className="cursor-help">Lock in!</Label>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Disable other apps during Focus.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Label htmlFor="batch-notifications-toggle" className="cursor-help">Batch Notifications</Label>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Notifications will be delayed and delivered as a group at specified times. Exemptions apply.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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
                        <SelectItem value="custom">Every X Minutes</SelectItem>
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

          {/* Session Defaults */}
          <AccordionItem value="session-defaults" className="border rounded-lg px-6">
            <AccordionTrigger className="text-xl font-semibold">
              Session Defaults
            </AccordionTrigger>
            <AccordionContent className="space-y-6 pt-4">
              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode-toggle">Dark Mode</Label>
                </div>
                <Switch
                  id="dark-mode-toggle"
                  checked={isDarkMode}
                  onCheckedChange={toggleDarkMode}
                />
              </div>

              {/* Global Session Visibility - Moved here */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="global-visibility-toggle">Visibility</Label>
                </div >
                <Button
                  id="global-visibility-toggle"
                  variant="outline" // Use outline variant for transparent background and border
                  onClick={() => setIsGlobalPrivate((prev: boolean) => !prev)} // Toggle isGlobalPrivate
                  className={cn(
                    "px-3 py-1 rounded-full transition-colors select-none text-foreground hover:bg-muted" // Apply homepage button styles
                  )}
                >
                  {!isGlobalPrivate ? "Public" : "Private"} {/* Display Public when false, Private when true */}
                </Button>
              </div>

              {/* Time Format Toggle Button */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="time-format-toggle">Time Format</Label>
                </div>
                <Button
                  id="time-format-toggle"
                  onClick={() => setIs24HourFormat(prev => !prev)}
                  className={cn(
                    "px-4 py-2 rounded-full transition-colors text-foreground bg-muted hover:bg-muted/80 select-none"
                  )}
                >
                  {is24HourFormat ? "24hr" : "AM/PM"}
                </Button>
              </div>

              {/* New Increments Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Label htmlFor="timer-increments-toggle" className="cursor-help">Increments</Label>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Adjust timers by 1 or 5 minutes.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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

              {/* Focus and Break Duration Inputs - Now side-by-side */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="focus-duration">Focus</Label>
                  <Input
                    id="focus-duration"
                    type="number"
                    placeholder="Minutes"
                    value={focusMinutes}
                    onChange={(e) => setFocusMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                    onBlur={(e) => {
                      if (parseInt(e.target.value) === 0 || e.target.value === '') {
                        setFocusMinutes(currentTimerIncrement); // Default to timerIncrement
                      }
                    }}
                    min={currentTimerIncrement} // Use currentTimerIncrement
                    step={currentTimerIncrement} // Use currentTimerIncrement
                    className="mt-2"
                    onFocus={(e) => e.target.select()}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="break-duration">Break</Label>
                  <Input
                    id="break-duration"
                    type="number"
                    placeholder="Minutes"
                    value={breakMinutes}
                    onChange={(e) => setBreakMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                    onBlur={(e) => {
                      if (parseInt(e.target.value) === 0 || e.target.value === '') {
                        setBreakMinutes(timerIncrement);
                      }
                    }}
                    min={timerIncrement}
                    step={timerIncrement}
                    className="mt-2"
                    onFocus={(e) => e.target.select()}
                  />
                </div>
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
                    {maxDistance > 300 && maxDistance > 1000 && "Walking distance"}
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
              Safety
            </AccordionTrigger>
            <AccordionContent className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label>Profile Visibility</Label>
                <div className="space-y-2">
                  <TooltipProvider delayDuration={0}>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="profile-public"
                        checked={profileVisibility.includes('public')}
                        onCheckedChange={(checked) => handleProfileVisibilityChange('public', !!checked)}
                      />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Label htmlFor="profile-public" className="text-sm font-normal cursor-help">
                            Public
                          </Label>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Anyone can see your profile</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="profile-friends"
                        checked={profileVisibility.includes('friends')}
                        onCheckedChange={(checked) => handleProfileVisibilityChange('friends', !!checked)}
                      />
                      <Label htmlFor="profile-friends" className="text-sm font-normal">
                        Friends Only
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="profile-organisation"
                        checked={profileVisibility.includes('organisation')}
                        onCheckedChange={(checked) => handleProfileVisibilityChange('organisation', !!checked)}
                      />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Label htmlFor="profile-organisation" className="text-sm font-normal cursor-help">
                            Organisation
                          </Label>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Members of your organisation can see details</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="profile-private"
                        checked={profileVisibility.includes('private')}
                        onCheckedChange={(checked) => handleProfileVisibilityChange('private', !!checked)}
                      />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Label htmlFor="profile-private" className="text-sm font-normal cursor-help">
                            Private
                          </Label>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Minimal information shared</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                </div>
              </div>

              {/* Verification Subheading */}
              <div className="border-t border-border pt-6 mt-6">
                <h3 className="text-lg font-semibold mb-4">Verification</h3>
                <div className="grid grid-cols-2 gap-4"> {/* Changed to grid layout */}
                  <p className="text-sm text-muted-foreground">
                    Get security clearance
                  </p>
                  <p className="text-sm text-muted-foreground">Access exclusive sessions</p>
                  <p className="text-sm text-muted-foreground">Build trust with peers</p>
                  <p className="text-sm text-muted-foreground">Compete for prizes!</p>
                </div>
                  <Label className="mt-4 block">Your Verification</Label> {/* Added mt-4 block for spacing */}
                  <Select 
                    value={verificationStandard} // Corrected to use verificationStandard
                    onValueChange={(value: string) => setVerificationStandard(value as 'anyone' | 'phone1' | 'organisation' | 'id1')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select verification status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anyone">None</SelectItem>
                      <SelectItem value="phone1">Phone</SelectItem>
                      <SelectItem value="organisation">Enterprise</SelectItem>
                      <SelectItem value="id1">ID Verified</SelectItem>
                    </SelectContent>
                  </Select>
                

                <div className="space-y-2 mt-6">
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Label className="block cursor-help">Minimum Verification Status</Label>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>for users to interact with sessions you host</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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

              {/* NEW: Toasts Switch */}
              <div className="flex items-center justify-between border-t border-border pt-6 mt-6">
                <div className="space-y-0.5">
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Label htmlFor="toasts-toggle" className="cursor-help">Toasts</Label>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Gives context to what the app is doing. Activate if encountering errors.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Switch
                  id="toasts-toggle"
                  checked={areToastsEnabled}
                  onCheckedChange={setAreToastsEnabled}
                />
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

      {user && (
        <div className="fixed bottom-4 left-4 z-50">
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      )}
    </main>
  );
};

export default Settings;