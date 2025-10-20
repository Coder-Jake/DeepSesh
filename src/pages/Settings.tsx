import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useState, useRef, useEffect } => "react";
import { MessageSquareWarning, Vibrate, Volume2, UserX, X, Info } from "lucide-react"; // Changed Bell to MessageSquareWarning
import { useTimer } from "@/contexts/TimerContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { NotificationSettings } from "@/types/timer";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import { useProfile } from "@/contexts/ProfileContext";

const Settings = () => {
  const { 
    showSessionsWhileActive, 
    setShowSessionsWhileActive, 
    defaultFocusMinutes, 
    setDefaultFocusMinutes, 
    defaultBreakMinutes, 
    setDefaultBreakMinutes, 
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
    joinNotifications, 
    setJoinNotifications, 
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
    isGlobalPrivate,
    setIsGlobalPrivate,
    openSettingsAccordions,
    setOpenSettingsAccordions,
    is24HourFormat,
    setIs24HourFormat,
    areToastsEnabled,
    setAreToastsEnabled,
  } = useTimer();

  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { blockedUsers, blockUser, unblockUser, recentCoworkers } = useProfile();

  const [currentTimerIncrement, setCurrentTimerIncrement] = useState(timerIncrement);
  const [userNameToBlock, setUserNameToBlock] = useState("");
  const [selectedCoworkerToBlock, setSelectedCoworkerToBlock] = useState<string | undefined>(undefined);

  const [hasChanges, setHasChanges] = useState(false);

  const [momentaryText, setMomentaryText] = useState<{ [key: string]: string | null }>({});
  const timeoutRefs = useRef<Record<string, NodeJS.Timeout>>({});

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
    focusMinutes: defaultFocusMinutes,
    breakMinutes: defaultBreakMinutes,
    maxDistance,
    askNotifications,
    joinNotifications, 
    breakNotificationsVibrate,
    sessionInvites,
    friendActivity,
    verificationStandard,
    profileVisibility,
    locationSharing,
    isGlobalPrivate,
    timerIncrement,
    shouldPlayEndSound,
    shouldShowEndToast,
    isDarkMode,
    is24HourFormat,
    areToastsEnabled,
    blockedUsers,
  });

  useEffect(() => {
    setCurrentTimerIncrement(timerIncrement);
  }, [timerIncrement]);

  useEffect(() => {
    const currentFocusVal = defaultFocusMinutes;
    const currentBreakVal = defaultBreakMinutes;

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
      joinNotifications, 
      breakNotificationsVibrate,
      sessionInvites,
      friendActivity,
      verificationStandard,
      profileVisibility,
      locationSharing,
      isGlobalPrivate,
      timerIncrement: currentTimerIncrement,
      shouldPlayEndSound,
      shouldShowEndToast,
      isDarkMode,
      is24HourFormat,
      areToastsEnabled,
      blockedUsers,
    };

    const changed = Object.keys(currentUiSettings).some(key => {
      const currentVal = currentUiSettings[key as keyof typeof currentUiSettings];
      const savedVal = savedSettingsRef.current[key as keyof typeof savedSettingsRef.current];

      if (typeof currentVal === 'object' && currentVal !== null) {
        return JSON.stringify(currentVal) !== JSON.stringify(savedVal);
      }
      return currentVal !== savedVal;
    });
    setHasChanges(changed);
  }, [
    showSessionsWhileActive, isBatchNotificationsEnabled, batchNotificationPreference, customBatchMinutes,
    lock, exemptionsEnabled, phoneCalls, favourites, workApps, intentionalBreaches,
    manualTransition, defaultFocusMinutes, defaultBreakMinutes, maxDistance,
    askNotifications, joinNotifications, breakNotificationsVibrate, sessionInvites, friendActivity, 
    verificationStandard, profileVisibility, locationSharing,
    isGlobalPrivate,
    currentTimerIncrement, shouldPlayEndSound, shouldShowEndToast,
    isDarkMode,
    is24HourFormat,
    areToastsEnabled,
    blockedUsers,
  ]);

  const showMomentaryText = (key: string, text: string) => {
    setMomentaryText(prev => ({ ...prev, [key]: text }));
    if (timeoutRefs.current[key]) {
      clearTimeout(timeoutRefs.current[key]);
    }
    timeoutRefs.current[key] = setTimeout(() => {
      setMomentaryText(prev => ({ ...prev, [key]: null }));
    }, 1500);
  };

  const updateNotificationSetting = (
    type: 'ask' | 'break' | 'invites' | 'activity' | 'joins', 
    field: 'push' | 'vibrate' | 'sound',
    value: boolean
  ) => {
    const text = value ? 'Enabled' : 'Disabled';
    showMomentaryText(`${type}-${field}`, text);

    if (type === 'ask') {
      setAskNotifications((prev: NotificationSettings) => ({ ...prev, [field]: value }));
    } else if (type === 'joins') { 
      setJoinNotifications((prev: NotificationSettings) => ({ ...prev, [field]: value }));
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
    type: 'ask' | 'break' | 'invites' | 'activity' | 'joins'; 
    title: string;
    description?: string;
    value: { push: boolean; vibrate: boolean; sound: boolean; };
  }) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2"> {/* Flex container for Label and Info icon */}
        <Label className="text-base font-medium">
          {title}
        </Label>
        {description && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                <Info size={16} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 text-sm">
              {description}
            </PopoverContent>
          </Popover>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative min-w-[100px]"> {/* Added min-w-[100px] here */}
          <Button
            variant="outline"
            size="icon"
            className={`w-10 h-10 rounded-full transition-colors ${value.push ? 'bg-olive text-olive-foreground' : 'text-muted-foreground hover:bg-muted'}`}
            onClick={() => updateNotificationSetting(type, 'push', !value.push)}
          >
            <MessageSquareWarning size={20} /> {/* Changed Bell to MessageSquareWarning */}
          </Button>
          {momentaryText[`${type}-push`] && (
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs bg-popover text-popover-foreground px-2 py-1 rounded-full whitespace-nowrap opacity-100 transition-opacity duration-300 z-50 select-none">
              Push {momentaryText[`${type}-push`]}
            </span>
          )}
        </div>

        <div className="relative min-w-[100px]"> {/* Added min-w-[100px] here */}
          <Button
            variant="outline"
            size="icon"
            className={`w-10 h-10 rounded-full transition-colors ${value.vibrate ? 'bg-olive text-olive-foreground' : 'text-muted-foreground hover:bg-muted'}`}
            onClick={() => updateNotificationSetting(type, 'vibrate', !value.vibrate)}
          >
            <Vibrate size={20} /> 
          </Button>
          {momentaryText[`${type}-vibrate`] && (
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs bg-popover text-popover-foreground px-2 py-1 rounded-full whitespace-nowrap opacity-100 transition-opacity duration-300 z-50 select-none">
              Vibrate {momentaryText[`${type}-vibrate`]}
            </span>
          )}
        </div>

        <div className="relative min-w-[100px]"> {/* Added min-w-[100px] here */}
          <Button
            variant="outline"
            size="icon"
            className={`w-10 h-10 rounded-full transition-colors ${value.sound ? 'bg-olive text-olive-foreground' : 'text-muted-foreground hover:bg-muted'}`}
            onClick={() => updateNotificationSetting(type, 'sound', !value.sound)}
          >
            <Volume2 size={20} />
          </Button>
          {momentaryText[`${type}-sound`] && (
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs bg-popover text-popover-foreground px-2 py-1 rounded-full whitespace-nowrap opacity-100 transition-opacity duration-300 z-50 select-none">
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
          newVisibility = ['private'];
        } else {
          newVisibility = ['public']; 
        }
      } else {
        if (newVisibility.includes('private')) {
          newVisibility = newVisibility.filter(v => v !== 'private');
        }

        if (checked) {
          if (!newVisibility.includes(option)) {
            newVisibility.push(option);
          }
        } else {
          newVisibility = newVisibility.filter(v => v !== option);
        }

        if (newVisibility.length === 0 && !newVisibility.includes('private')) {
          newVisibility = ['public'];
        }
      }
      return newVisibility;
    });
  };

  const handleBlockUser = () => {
    if (userNameToBlock.trim()) {
      blockUser(userNameToBlock.trim());
      setUserNameToBlock("");
    } else if (selectedCoworkerToBlock) {
      blockUser(selectedCoworkerToBlock);
      setSelectedCoworkerToBlock(undefined);
    }
  };

  const handleSave = () => {
    setDefaultFocusMinutes(defaultFocusMinutes);
    setDefaultBreakMinutes(defaultBreakMinutes);

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
    setJoinNotifications(joinNotifications); 
    setSessionInvites(sessionInvites);
    setFriendActivity(friendActivity);
    setBreakNotificationsVibrate(breakNotificationsVibrate);
    setVerificationStandard(verificationStandard);
    setLocationSharing(locationSharing);
    setIsGlobalPrivate(isGlobalPrivate);
    setShouldPlayEndSound(shouldPlayEndSound);
    setShouldShowEndToast(shouldShowEndToast);
    setAreToastsEnabled(areToastsEnabled);

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
      focusMinutes: defaultFocusMinutes,
      breakMinutes: defaultBreakMinutes,
      maxDistance,
      askNotifications,
      joinNotifications, 
      breakNotificationsVibrate,
      sessionInvites,
      friendActivity,
      verificationStandard,
      profileVisibility,
      locationSharing,
      isGlobalPrivate,
      timerIncrement: currentTimerIncrement,
      shouldPlayEndSound,
      shouldShowEndToast,
      isDarkMode,
      is24HourFormat,
      areToastsEnabled,
      blockedUsers,
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
      navigate('/');
    }
  };

  return (
    <main className="max-w-4xl mx-auto pt-16 px-4 pb-[100px] lg:pt-20 lg:px-6 lg:pb-[100px]">
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
          value={openSettingsAccordions}
          onValueChange={setOpenSettingsAccordions}
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
                      <TooltipContent className="select-none">
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
                        <Label htmlFor="lock" className="cursor-help text-muted-foreground">Lock in!</Label>
                      </TooltipTrigger>
                      <TooltipContent className="select-none">
                        <p>Disable other apps during Focus.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div >
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                      <TooltipTrigger asChild>
                        <Switch
                          id="lock"
                          checked={lock}
                          onCheckedChange={setLock}
                        />
                      </TooltipTrigger>
                      <TooltipContent className="select-none">
                          <p>Requires App development</p>
                      </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Label htmlFor="batch-notifications-toggle" className="cursor-help text-muted-foreground">Batch Notifications</Label>
                        </TooltipTrigger>
                        <TooltipContent className="select-none">
                          <p>Notifications will be delayed and delivered as a group at specified times. Exemptions apply.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Switch
                          id="batch-notifications-toggle"
                          checked={isBatchNotificationsEnabled}
                          onCheckedChange={setIsBatchNotificationsEnabled}
                        />
                      </TooltipTrigger>
                      <TooltipContent className="select-none">
                        <p>Requires App development</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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


              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="exemptions" className="text-muted-foreground">Exemptions</Label>
                  </div>
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Switch
                          id="exemptions"
                          checked={exemptionsEnabled}
                          onCheckedChange={setExemptionsEnabled}
                        />
                      </TooltipTrigger>
                      <TooltipContent className="select-none">
                        <p>Requires App development</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {exemptionsEnabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-4 pt-2 border-l border-border ml-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="phonecalls"
                        checked={phoneCalls}
                        onCheckedChange={(checked) => setPhoneCalls(!!checked)}
                      />
                      <Label htmlFor="phonecalls" className="text-sm font-normal text-muted-foreground">
                        Phone Calls
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="favourites"
                        checked={favourites}
                        onCheckedChange={(checked) => setFavourites(!!checked)}
                      />
                      <Label htmlFor="favourites" className="text-sm font-normal text-muted-foreground">
                        Favourites
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="work-apps"
                        checked={workApps}
                        onCheckedChange={(checked) => setWorkApps(!!checked)}
                      />
                      <Label htmlFor="work-apps" className="text-sm font-normal text-muted-foreground">
                        Work Apps
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="intentional-breaches"
                        checked={intentionalBreaches}
                        onCheckedChange={(checked) => setIntentionalBreaches(!!checked)}
                      />
                      <Label htmlFor="intentional-breaches" className="text-sm font-normal text-muted-foreground">
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

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="global-visibility-toggle">Visibility</Label>
                </div >
                <Button
                  id="global-visibility-toggle"
                  variant="outline"
                  onClick={() => setIsGlobalPrivate((prev: boolean) => !prev)}
                  className={cn(
                    "px-3 py-1 rounded-full transition-colors select-none text-foreground hover:bg-muted"
                  )}
                >
                  {!isGlobalPrivate ? "Public" : "Private"}
                </Button>
              </div>

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

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Label htmlFor="timer-increments-toggle" className="cursor-help">Increments</Label>
                      </TooltipTrigger>
                      <TooltipContent className="select-none">
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="focus-duration">Focus</Label>
                  <Input
                    id="focus-duration"
                    type="number"
                    placeholder="Minutes"
                    value={defaultFocusMinutes}
                    onChange={(e) => setDefaultFocusMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                    onBlur={(e) => {
                      if (parseInt(e.target.value) === 0 || e.target.value === '') {
                        setDefaultFocusMinutes(currentTimerIncrement);
                      }
                    }}
                    min={currentTimerIncrement}
                    step={currentTimerIncrement}
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
                    value={defaultBreakMinutes}
                    onChange={(e) => setDefaultBreakMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                    onBlur={(e) => {
                      if (parseInt(e.target.value) === 0 || e.target.value === '') {
                        setDefaultBreakMinutes(timerIncrement);
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
          value={openSettingsAccordions}
          onValueChange={setOpenSettingsAccordions}
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
                      value={[maxDistance]}
                      onValueChange={(val) => setMaxDistance(val[0])}
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
                        <TooltipContent className="select-none">
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
                        <TooltipContent className="select-none">
                          <p>Only members of your organisation can see details</p>
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
                        <TooltipContent className="select-none">
                          <p>Minimal information shared</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                </div>
              </div>

              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="border-t border-border pt-6 mt-6 opacity-50 pointer-events-none"> {/* Added opacity and pointer-events-none */}
                      <h3 className="text-lg font-semibold mb-4">Verification</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <p className="text-sm text-muted-foreground">
                          Get security clearance
                        </p>
                        <p className="text-sm text-muted-foreground">Access exclusive sessions</p>
                        <p className="text-sm text-muted-foreground">Build trust with peers</p>
                        <p className="text-sm text-muted-foreground">Compete for prizes!</p>
                      </div>
                        <Label className="mt-4 block">Your Verification</Label>
                        <Select 
                          value={verificationStandard}
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
                            <TooltipContent className="select-none">
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
                  </TooltipTrigger>
                  <TooltipContent className="select-none">
                    <p>Requires App development</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="border-t border-border pt-6 mt-6">
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <h3 className="text-lg font-semibold mb-4 cursor-help">Block Users</h3>
                    </TooltipTrigger>
                    <TooltipContent className="select-none">
                      <p>Blocked users will not be able to see sessions you host or join.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter username to block"
                      value={userNameToBlock}
                      onChange={(e) => setUserNameToBlock(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleBlockUser();
                        }
                      }}
                    />
                    <Button onClick={handleBlockUser} disabled={!userNameToBlock.trim() && !selectedCoworkerToBlock}>
                      <UserX className="h-4 w-4 mr-2" /> Block
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="block-coworker-select">Or select from recent coworkers:</Label>
                    <Select
                      value={selectedCoworkerToBlock}
                      onValueChange={(value) => setSelectedCoworkerToBlock(value)}
                    >
                      <SelectTrigger id="block-coworker-select">
                        <SelectValue placeholder="Select a coworker" />
                      </SelectTrigger>
                      <SelectContent>
                        {recentCoworkers.length === 0 ? (
                          <SelectItem value="no-coworkers" disabled>No recent coworkers</SelectItem>
                        ) : (
                          recentCoworkers.map(coworker => (
                            <SelectItem key={coworker} value={coworker} disabled={blockedUsers.includes(coworker)}>
                              {coworker} {blockedUsers.includes(coworker) && "(Blocked)"}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {blockedUsers.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <h4 className="font-medium text-foreground">Currently Blocked:</h4>
                    <ul className="space-y-1">
                      {blockedUsers.map((user, index) => (
                        <li key={index} className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{user}</span>
                          <Button variant="ghost" size="sm" onClick={() => unblockUser(user)} className="h-auto px-2 py-1 text-red-500 hover:text-red-700">
                            <X className="h-3 w-3 mr-1" /> Unblock
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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
                description="Notifications when a coworker creates an Ask."
                value={askNotifications}
              />

              <NotificationControl
                type="joins"
                title="Joins"
                description="Notifications when a coworker joins a session you are in."
                value={joinNotifications}
              />
              
              <NotificationControl
                type="break"
                title="Break Reminders"
                description="Notifications when the timer starts, ends, or switches between focus/break."
                value={{ push: shouldShowEndToast, vibrate: breakNotificationsVibrate, sound: shouldPlayEndSound }}
              />
              
              <NotificationControl
                type="invites"
                title="Session Invites"
                description="Notifications when you are invited to a session."
                value={sessionInvites}
              />
              
              <NotificationControl
                type="activity"
                title="Friend Activity"
                description="Notifications when friends start/end a session, or they start a break."
                value={friendActivity}
              />

              <div className="flex items-center justify-between border-t border-border pt-6 mt-6">
                <div className="space-y-0.5">
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Label htmlFor="toasts-toggle" className="cursor-help">Toasts</Label>
                      </TooltipTrigger>
                      <TooltipContent className="select-none">
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