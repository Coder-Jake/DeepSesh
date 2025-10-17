import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useEffect, useState, useRef, useCallback } from "react";
import { useProfile } from "@/contexts/ProfileContext"; // Import useProfile
import { useToast } from "@/hooks/use-toast"; // Import useToast
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext"; // Import useAuth
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { supabase } from "@/integrations/supabase/client"; // Import supabase client
import { Linkedin, Clipboard } from "lucide-react"; // Changed Copy to Clipboard
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // Import Tooltip components
import { cn } from "@/lib/utils"; // Import cn for conditional class names
import { useTimer } from "@/contexts/TimerContext"; // NEW: Import useTimer

// Removed colors and animals arrays, and generateRandomHostCode function as they are now in ProfileContext

const Profile = () => {
  const { profile, loading, updateProfile, localFirstName, setLocalFirstName, hostCode, setHostCode } = useProfile(); // NEW: Get hostCode and setHostCode from useProfile
  const { user } = useAuth(); // Get user from AuthContext
  const navigate = useNavigate(); // Initialize useNavigate
  const { toast } = useToast();
  // NEW: Get timer states from TimerContext
  const { isRunning, isPaused, isScheduleActive, isSchedulePrepared, isSchedulePending } = useTimer();

  const [firstNameInput, setFirstNameInput] = useState(""); // Local state for first name input
  const [bio, setBio] = useState("");
  const [intention, setIntention] = useState("");
  const [sociability, setSociability] = useState([30]);
  const [organization, setOrganization] = useState(""); // New state for organization
  const [linkedinUrl, setLinkedinUrl] = useState(""); // State for LinkedIn (only)
  // Removed local hostCode state, now using context's hostCode
  const [isEditingHostCode, setIsEditingHostCode] = useState(false); // NEW: State for editing host code
  const hostCodeInputRef = useRef<HTMLInputElement>(null); // NEW: Ref for host code input
  const [isCopied, setIsCopied] = useState(false); // NEW: State for copy feedback

  const [hasChanges, setHasChanges] = useState(false);
  const [originalValues, setOriginalValues] = useState({
    firstName: "", // This will now track localFirstName
    bio: "",
    intention: "",
    sociability: [30],
    organization: "", // Added organization to original values
    linkedinUrl: "", // Stores original LinkedIn (only)
    hostCode: "", // Will be initialized from context
  });

  const [isEditingFirstName, setIsEditingFirstName] = useState(false);
  const firstNameInputRef = useRef<HTMLInputElement>(null);

  const [isOrganizationDialogOpen, setIsOrganizationDialogOpen] = useState(false); // State for organization dialog

  // NEW: Determine if any timer is active (kept for other potential uses, but not for host code)
  const isTimerActive = isRunning || isPaused || isScheduleActive || isSchedulePrepared || isSchedulePending;

  // Long press state for Sociability
  const longPressRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  // NEW: Label color states and handler
  const labelColors = ["text-green-600", "text-blue-500", "text-red-500", "text-purple-500", "text-gray-500"];
  const [bioLabelColorIndex, setBioLabelColorIndex] = useState(0);
  const [intentionLabelColorIndex, setIntentionLabelColorIndex] = useState(0);
  const [linkedinLabelColorIndex, setLinkedinLabelColorIndex] = useState(0);

  const handleLabelClick = (currentIndex: number, setter: React.Dispatch<React.SetStateAction<number>>) => {
    setter((prevIndex) => (prevIndex + 1) % labelColors.length);
  };

  const handleLongPressStart = (callback: () => void) => {
    isLongPress.current = false;
    longPressRef.current = setTimeout(() => {
      isLongPress.current = true;
      callback();
    }, 500); // 500ms for long press
  };

  const handleLongPressEnd = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
    }
    isLongPress.current = false;
  };

  const handleSociabilityLongPress = () => {
    if (isLongPress.current) {
      navigate('/profile#social-preferences');
    }
  };

  useEffect(() => {
    // Initialize local states from profile or defaults
    setFirstNameInput(profile?.first_name || localFirstName || "You"); // Initialize local input state
    setBio(profile?.bio || "");
    setIntention(profile?.intention || "");
    setSociability([profile?.sociability || 50]);
    setOrganization(profile?.organization || ""); // Initialize organization

    // Extract username from full LinkedIn URL
    const fullLinkedinUrl = profile?.linkedin_url || "";
    const linkedinUsername = fullLinkedinUrl.startsWith("https://www.linkedin.com/in/") 
                             ? fullLinkedinUrl.substring("https://www.linkedin.com/in/".length) 
                             : "";
    setLinkedinUrl(linkedinUsername); // Initialize LinkedIn URL with just the handle

    // NEW: Initialize host code from context
    setHostCode(hostCode); // Use the hostCode from context

    // Set original values for change detection
    setOriginalValues({
      firstName: profile?.first_name || localFirstName || "You", // Use context's localFirstName
      bio: profile?.bio || "",
      intention: profile?.intention || "",
      sociability: [profile?.sociability || 50],
      organization: profile?.organization || "", // Set original organization
      linkedinUrl: linkedinUsername, // Set original LinkedIn handle
      hostCode: hostCode, // Use the hostCode from context
    });
    setHasChanges(false);
  }, [profile, localFirstName, hostCode, setHostCode]); // Add localFirstName as dependency

  useEffect(() => {
    if (isEditingFirstName && firstNameInputRef.current) {
      firstNameInputRef.current.focus();
      firstNameInputRef.current.select(); // Select the text when focused
    }
  }, [isEditingFirstName]);

  // NEW: Effect to focus host code input
  useEffect(() => {
    if (isEditingHostCode && hostCodeInputRef.current) {
      hostCodeInputRef.current.focus();
      hostCodeInputRef.current.select();
    }
  }, [isEditingHostCode]);

  const checkForChanges = (
    newFirstName: string, 
    newBio: string, 
    newIntention: string, 
    newSociability: number[], 
    newOrganization: string,
    newLinkedinUsername: string, // Now represents only the handle
    newHostCode: string // NEW: Added newHostCode
  ) => {
    const changed = newFirstName !== originalValues.firstName ||
                   newBio !== originalValues.bio || 
                   newIntention !== originalValues.intention || 
                   newSociability[0] !== originalValues.sociability[0] ||
                   newOrganization !== originalValues.organization ||
                   newLinkedinUsername !== originalValues.linkedinUrl ||
                   newHostCode !== originalValues.hostCode; // NEW: Compare hostCode
    setHasChanges(changed);
  };

  const handleFirstNameChange = (value: string) => {
    setFirstNameInput(value); // Update local input state
    checkForChanges(value, bio, intention, sociability, organization, linkedinUrl, hostCode); // Pass hostCode
  };

  const handleBioChange = (value: string) => {
    setBio(value);
    checkForChanges(firstNameInput, value, intention, sociability, organization, linkedinUrl, hostCode); // Pass hostCode
  };

  const handleIntentionChange = (value: string) => {
    setIntention(value);
    checkForChanges(firstNameInput, bio, value, sociability, organization, linkedinUrl, hostCode); // Pass hostCode
  };

  const handleSociabilityChange = (value: number[]) => {
    setSociability(value);
    checkForChanges(firstNameInput, bio, intention, value, organization, linkedinUrl, hostCode); // Pass hostCode
  };

  const handleOrganizationChange = (value: string) => {
    setOrganization(value);
    checkForChanges(firstNameInput, bio, intention, sociability, value, linkedinUrl, hostCode); // Pass hostCode
  };

  const handleLinkedinUrlChange = (value: string) => { // This value is now just the handle
    setLinkedinUrl(value);
    checkForChanges(firstNameInput, bio, intention, sociability, organization, value, hostCode);
  };

  // NEW: Host code handlers
  const handleHostCodeChange = (value: string) => {
    setHostCode(value);
    checkForChanges(firstNameInput, bio, intention, sociability, organization, linkedinUrl, value);
  };

  const handleHostCodeClick = () => {
    // Host code is always editable now
    setIsEditingHostCode(true);
  };

  const handleHostCodeInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditingHostCode(false);
      e.currentTarget.blur();
      await validateAndSaveHostCode(hostCode);
    }
  };

  const handleHostCodeInputBlur = async () => {
    setIsEditingHostCode(false);
    await validateAndSaveHostCode(hostCode);
  };

  const validateAndSaveHostCode = async (code: string) => {
    const trimmedCode = code.trim();
    if (trimmedCode.length < 4 || trimmedCode.length > 20) {
      toast({
        title: "Invalid Host Code",
        description: "Host code must be between 4 and 20 characters.",
        variant: "destructive",
      });
      // Revert to original host code if invalid
      setHostCode(originalValues.hostCode);
      checkForChanges(firstNameInput, bio, intention, sociability, organization, linkedinUrl, originalValues.hostCode);
      return;
    }
    // If valid, update originalValues and trigger save
    setOriginalValues(prev => ({ ...prev, hostCode: trimmedCode }));
    checkForChanges(firstNameInput, bio, intention, sociability, organization, linkedinUrl, trimmedCode);
    if (user) {
      await updateProfile({ host_code: trimmedCode });
    } else {
      toast({
        title: "Host Code Saved Locally",
        description: "Your host code has been saved to this browser.",
      });
      localStorage.setItem('deepsesh_host_code', trimmedCode); // Ensure local storage is updated for unauthenticated users
    }
  };

  const handleFirstNameClick = () => {
    setIsEditingFirstName(true);
  };

  const handleFirstNameInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditingFirstName(false);
      e.currentTarget.blur();
      const nameToSave = firstNameInput.trim() === "" ? "You" : firstNameInput.trim();
      setFirstNameInput(nameToSave); // Update local input state
      setLocalFirstName(nameToSave); // Update context state
      if (user) { // Only update Supabase if logged in
        await updateProfile({ first_name: nameToSave });
      }
      setOriginalValues(prev => ({ ...prev, firstName: nameToSave }));
      checkForChanges(nameToSave, bio, intention, sociability, organization, linkedinUrl, hostCode); // Pass hostCode
    }
  };

  const handleFirstNameInputBlur = async () => {
    setIsEditingFirstName(false);
    const nameToSave = firstNameInput.trim() === "" ? "You" : firstNameInput.trim();
    setFirstNameInput(nameToSave); // Update local input state
    setLocalFirstName(nameToSave); // Update context state
    if (user) { // Only update Supabase if logged in
      await updateProfile({ first_name: nameToSave });
    }
    setOriginalValues(prev => ({ ...prev, firstName: nameToSave }));
    checkForChanges(nameToSave, bio, intention, sociability, organization, linkedinUrl, hostCode); // Pass hostCode
  };

  const handleSaveOrganization = async () => {
    if (user) {
      await updateProfile({ organization: organization.trim() === "" ? null : organization.trim() });
      setIsOrganizationDialogOpen(false);
      // Update originalValues for change detection
      setOriginalValues(prev => ({ ...prev, organization: organization.trim() === "" ? null : organization.trim() }));
      checkForChanges(firstNameInput, bio, intention, sociability, organization, linkedinUrl, hostCode); // Pass hostCode
    } else {
      toast({
        title: "Not Logged In",
        description: "Please log in to save your organisation.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    const nameToSave = firstNameInput.trim() === "" ? "You" : firstNameInput.trim();
    setLocalFirstName(nameToSave); // Update context state

    // Validate host code before saving entire profile
    const trimmedHostCode = hostCode.trim();
    if (trimmedHostCode.length < 4 || trimmedHostCode.length > 20) {
      toast({
        title: "Invalid Host Code",
        description: "Host code must be between 4 and 20 characters. Please correct it before saving.",
        variant: "destructive",
      });
      return; // Prevent saving if host code is invalid
    }

    // Construct the data to be saved
    const dataToUpdate = {
      first_name: nameToSave,
      bio,
      intention,
      sociability: sociability[0], // Use the current local state value
      organization: organization.trim() === "" ? null : organization.trim(),
      linkedin_url: linkedinUrl.trim() === "" ? null : `https://www.linkedin.com/in/${linkedinUrl.trim()}`,
      host_code: trimmedHostCode,
      updated_at: new Date().toISOString(),
    };

    if (user) { // Only update Supabase if logged in
      await updateProfile(dataToUpdate);
    } else {
      // If not logged in, just update local storage (already handled by useEffect for localFirstName)
      toast({
        title: "Profile Saved Locally",
        description: "Your profile changes have been saved to this browser.",
      });
      // For unauthenticated users, also save hostCode to local storage directly
      localStorage.setItem('deepsesh_host_code', trimmedHostCode);
    }
    // After successful update (or local save), update originalValues with the *new* values
    setOriginalValues({ 
      firstName: nameToSave, 
      bio, 
      intention, 
      sociability: [sociability[0]], // Use the value that was just saved
      organization: organization.trim() === "" ? "" : organization.trim(), 
      linkedinUrl, 
      hostCode: trimmedHostCode 
    }); 
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

  // NEW: Function to copy host code to clipboard
  const handleCopyHostCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(hostCode);
      setIsCopied(true); // Set copied state to true
      setTimeout(() => setIsCopied(false), 3000); // Reset after 3 seconds
      toast({
        title: "Copied to clipboard!",
        description: "Your host code has been copied.",
      });
    } catch (err) {
      console.error('Failed to copy host code: ', err);
      toast({
        title: "Copy Failed",
        description: "Could not copy host code. Please try again.",
        variant: "destructive",
      });
    }
  }, [hostCode, toast]);

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto pt-16 px-4 pb-4 lg:pt-20 lg:px-6 lg:pb-6 text-center text-muted-foreground">
        Loading profile...
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto pt-16 px-4 pb-4 lg:pt-20 lg:px-6 lg:pb-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        {!user && (
          <Button variant="outline" onClick={() => navigate('/login')}>
            Login
          </Button>
        )}
      </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bio Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1">
                <span>About</span>
                {isEditingFirstName ? (
                  <Input
                    ref={firstNameInputRef}
                    value={firstNameInput} // Use local input state
                    onChange={(e) => handleFirstNameChange(e.target.value)}
                    onKeyDown={handleFirstNameInputKeyDown}
                    onBlur={handleFirstNameInputBlur}
                    placeholder="your name"
                    className="text-lg font-semibold h-auto py-1 px-2 italic"
                  />
                ) : (
                  <span
                    className="cursor-pointer select-none"
                    onClick={handleFirstNameClick}
                  >
                    {firstNameInput || "You"} {/* Use local input state */}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label 
                  htmlFor="bio" 
                  onClick={() => handleLabelClick(bioLabelColorIndex, setBioLabelColorIndex)} 
                  className={cn("cursor-pointer select-none", labelColors[bioLabelColorIndex])}
                >
                  Brief Bio
                </Label>
                <Textarea
                  id="bio"
                  placeholder="Share a bit about yourself..."
                  value={bio}
                  onChange={(e) => handleBioChange(e.target.value)}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label 
                  htmlFor="intention" 
                  onClick={() => handleLabelClick(intentionLabelColorIndex, setIntentionLabelColorIndex)} 
                  className={cn("cursor-pointer select-none", labelColors[intentionLabelColorIndex])}
                >
                  Statement of Intention
                </Label>
                <Textarea
                  id="intention"
                  placeholder="What are you working on? Goals and intentions for upcoming sessions?"
                  value={intention}
                  onChange={(e) => handleIntentionChange(e.target.value)}
                  className="mt-2"
                />
              </div>

              {/* NEW: LinkedIn URL Input */}
              <div>
                <Label 
                  htmlFor="linkedin-username" 
                  onClick={() => handleLabelClick(linkedinLabelColorIndex, setLinkedinLabelColorIndex)} 
                  className={cn("cursor-pointer select-none", labelColors[linkedinLabelColorIndex])}
                >
                  LinkedIn Handle
                </Label>
                <div className="flex items-center gap-0 mt-2 border rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                  <span className="pl-3 pr-1 text-muted-foreground bg-input rounded-l-md py-2 text-sm">
                    linkedin.com/in/
                  </span>
                  <Input
                    id="linkedin-username"
                    type="text" // Changed to text as it's just the username
                    placeholder="yourusername"
                    value={linkedinUrl} // This now holds only the username
                    onChange={(e) => handleLinkedinUrlChange(e.target.value)}
                    className="flex-1 border-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-l-none" // Remove border and focus ring
                  />
                  {linkedinUrl && (
                    <a 
                      href={`https://www.linkedin.com/in/${linkedinUrl}`} // Construct full URL
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:text-blue-800 transition-colors p-2"
                      aria-label="Visit LinkedIn Profile"
                    >
                      <Linkedin size={20} />
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sociability Section */}
          <Card>
            <CardHeader>
              <CardTitle id="social-preferences">Social Preferences</CardTitle> {/* Added ID for navigation */}
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-6">
                  How would you prefer to balance focus vs socialising?
                </p>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Banter</span> {/* Flipped this label */}
                    <span>Deep Focus</span> {/* Flipped this label */}
                  </div>
                  <div className="relative group">
                    <Slider
                      value={sociability}
                      onValueChange={handleSociabilityChange}
                      max={100}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  <div 
                    className="text-center mt-3 text-sm text-muted-foreground cursor-pointer select-none"
                    onMouseDown={() => handleLongPressStart(handleSociabilityLongPress)}
                    onMouseUp={handleLongPressEnd}
                    onMouseLeave={handleLongPressEnd}
                    onTouchStart={() => handleLongPressStart(handleSociabilityLongPress)}
                    onTouchEnd={handleLongPressEnd}
                  >
                    {sociability[0] <= 20 && "Looking to collaborate/brainstorm"}
                    {sociability[0] > 20 && sociability[0] <= 40 && "Happy to chat while we work"}
                    {sociability[0] > 40 && sociability[0] <= 60 && "I don't mind"}
                    {sociability[0] > 60 && sociability[0] <= 80 && "Socialise only during breaks"}
                    {sociability[0] > 80 && "Minimal interaction even during breaks"}
                  </div>
                </div>
              </div>

              {/* NEW: Hosting Code Section */}
              <div className="border-t border-border pt-6 mt-6">
                <h3 className="text-lg font-semibold mb-2">
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">Hosting Code</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Others can use this code to join your sessions.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </h3>
                <div className="flex items-center gap-2"> {/* Flex container for code and icon */}
                  {isEditingHostCode ? (
                    <Input
                      ref={hostCodeInputRef}
                      value={hostCode}
                      onChange={(e) => handleHostCodeChange(e.target.value)}
                      onKeyDown={handleHostCodeInputKeyDown}
                      onBlur={handleHostCodeInputBlur}
                      placeholder="yourhostcode"
                      className="text-lg font-semibold h-auto py-1 px-2 italic flex-grow"
                      minLength={4}
                      maxLength={20}
                    />
                  ) : (
                    <span
                      className={cn(
                        "text-lg font-semibold flex-grow select-none",
                        "text-foreground cursor-pointer hover:text-primary"
                      )}
                      onClick={handleHostCodeClick}
                    >
                      {hostCode}
                    </span>
                  )}
                  {!isEditingHostCode && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCopyHostCode}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="Copy host code"
                    >
                      <Clipboard size={16} className={cn(isCopied ? "text-green-500" : "text-muted-foreground")} /> {/* Conditional class for green color */}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Organization Section */}
          <Card>
            <CardHeader>
              <CardTitle>Organisation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile?.organization ? (
                <p className="text-sm text-muted-foreground">
                  Currently affiliated with: <span className="font-medium text-foreground">{profile.organization}</span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Not currently affiliated with an organisation.
                </p>
              )}
              <Button onClick={() => setIsOrganizationDialogOpen(true)}>
                {profile?.organization ? "Edit Organisation" : "Add Organisation"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={!hasChanges || loading} // Disable save if timer is active
            className={cn(
              !hasChanges || loading ? "opacity-50 cursor-not-allowed" : ""
            )}
          >
            {loading ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      
      {/* Organization Dialog */}
      <Dialog open={isOrganizationDialogOpen} onOpenChange={setIsOrganizationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{profile?.organization ? "Edit Organisation Name" : "Add Organisation Name"}</DialogTitle>
            <DialogDescription>
              Enter the name of your organization. This will be visible to others.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="organization-name">Organisation Name</Label>
              <Input
                id="organization-name"
                value={organization}
                onChange={(e) => handleOrganizationChange(e.target.value)}
                placeholder="e.g., Acme Corp"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOrganizationDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveOrganization}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

export default Profile;