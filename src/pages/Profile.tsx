import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useEffect, useState, useRef } from "react";
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
import { Linkedin } from "lucide-react"; // NEW: Import Linkedin icon

const Profile = () => {
  const { profile, loading, updateProfile, localFirstName, setLocalFirstName } = useProfile(); // Use profile context and localFirstName
  const { user } = useAuth(); // Get user from AuthContext
  const navigate = useNavigate(); // Initialize useNavigate
  const { toast } = useToast();

  const [bio, setBio] = useState("");
  const [intention, setIntention] = useState("");
  const [sociability, setSociability] = useState([30]);
  const [organization, setOrganization] = useState(""); // New state for organization
  const [linkedinUrl, setLinkedinUrl] = useState(""); // State for LinkedIn username (only)
  const [hasChanges, setHasChanges] = useState(false);
  const [originalValues, setOriginalValues] = useState({
    firstName: "", // This will now track localFirstName
    bio: "",
    intention: "",
    sociability: [30],
    organization: "", // Added organization to original values
    linkedinUrl: "", // Stores original LinkedIn username (only)
  });

  const [isEditingFirstName, setIsEditingFirstName] = useState(false);
  const firstNameInputRef = useRef<HTMLInputElement>(null);

  const [isOrganizationDialogOpen, setIsOrganizationDialogOpen] = useState(false); // State for organization dialog

  useEffect(() => {
    // Initialize local states from profile or defaults
    setLocalFirstName(profile?.first_name || localStorage.getItem('flowsesh_local_first_name') || "You");
    setBio(profile?.bio || "");
    setIntention(profile?.intention || "");
    setSociability([profile?.sociability || 50]);
    setOrganization(profile?.organization || ""); // Initialize organization

    // Extract username from full LinkedIn URL
    const fullLinkedinUrl = profile?.linkedin_url || "";
    const linkedinUsername = fullLinkedinUrl.startsWith("https://www.linkedin.com/in/") 
                             ? fullLinkedinUrl.substring("https://www.linkedin.com/in/".length) 
                             : "";
    setLinkedinUrl(linkedinUsername); // Initialize LinkedIn URL with just the username

    // Set original values for change detection
    setOriginalValues({
      firstName: profile?.first_name || localStorage.getItem('flowsesh_local_first_name') || "You",
      bio: profile?.bio || "",
      intention: profile?.intention || "",
      sociability: [profile?.sociability || 50],
      organization: profile?.organization || "", // Set original organization
      linkedinUrl: linkedinUsername, // Set original LinkedIn username
    });
    setHasChanges(false);
  }, [profile, setLocalFirstName]); // Depend on profile and setLocalFirstName

  useEffect(() => {
    if (isEditingFirstName && firstNameInputRef.current) {
      firstNameInputRef.current.focus();
      firstNameInputRef.current.select(); // Select the text when focused
    }
  }, [isEditingFirstName]);

  const checkForChanges = (
    newFirstName: string, 
    newBio: string, 
    newIntention: string, 
    newSociability: number[], 
    newOrganization: string,
    newLinkedinUsername: string // Now represents only the username
  ) => {
    const changed = newFirstName !== originalValues.firstName ||
                   newBio !== originalValues.bio || 
                   newIntention !== originalValues.intention || 
                   newSociability[0] !== originalValues.sociability[0] ||
                   newOrganization !== originalValues.organization ||
                   newLinkedinUsername !== originalValues.linkedinUrl; // Compare against original username
    setHasChanges(changed);
  };

  const handleFirstNameChange = (value: string) => {
    setLocalFirstName(value); // Update local state
    checkForChanges(value, bio, intention, sociability, organization, linkedinUrl); // Pass username
  };

  const handleBioChange = (value: string) => {
    setBio(value);
    checkForChanges(localFirstName, value, intention, sociability, organization, linkedinUrl); // Pass username
  };

  const handleIntentionChange = (value: string) => {
    setIntention(value);
    checkForChanges(localFirstName, bio, value, sociability, organization, linkedinUrl); // Pass username
  };

  const handleSociabilityChange = (value: number[]) => {
    setSociability(value);
    checkForChanges(localFirstName, bio, intention, value, organization, linkedinUrl); // Pass username
  };

  const handleOrganizationChange = (value: string) => {
    setOrganization(value);
    checkForChanges(localFirstName, bio, intention, sociability, value, linkedinUrl); // Pass username
  };

  const handleLinkedinUrlChange = (value: string) => { // This value is now just the username
    setLinkedinUrl(value);
    checkForChanges(localFirstName, bio, intention, sociability, organization, value);
  };

  const handleFirstNameClick = () => {
    setIsEditingFirstName(true);
  };

  const handleFirstNameInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditingFirstName(false);
      e.currentTarget.blur();
      const nameToSave = localFirstName.trim() === "" ? "You" : localFirstName.trim();
      setLocalFirstName(nameToSave); // Ensure local state is updated
      if (user) { // Only update Supabase if logged in
        await updateProfile({ first_name: nameToSave });
      }
      setOriginalValues(prev => ({ ...prev, firstName: nameToSave }));
      checkForChanges(nameToSave, bio, intention, sociability, organization, linkedinUrl); // Pass username
    }
  };

  const handleFirstNameInputBlur = async () => {
    setIsEditingFirstName(false);
    const nameToSave = localFirstName.trim() === "" ? "You" : localFirstName.trim();
    setLocalFirstName(nameToSave); // Ensure local state is updated
    if (user) { // Only update Supabase if logged in
      await updateProfile({ first_name: nameToSave });
    }
    setOriginalValues(prev => ({ ...prev, firstName: nameToSave }));
    checkForChanges(nameToSave, bio, intention, sociability, organization, linkedinUrl); // Pass username
  };

  const handleSaveOrganization = async () => {
    if (user) {
      await updateProfile({ organization: organization.trim() === "" ? null : organization.trim() });
      setIsOrganizationDialogOpen(false);
      // Update originalValues for change detection
      setOriginalValues(prev => ({ ...prev, organization: organization.trim() === "" ? null : organization.trim() }));
      checkForChanges(localFirstName, bio, intention, sociability, organization, linkedinUrl); // Pass username
    } else {
      toast({
        title: "Not Logged In",
        description: "Please log in to save your organisation.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    const nameToSave = localFirstName.trim() === "" ? "You" : localFirstName.trim();
    setLocalFirstName(nameToSave); // Ensure local state is updated

    if (user) { // Only update Supabase if logged in
      const fullLinkedinUrlToSave = linkedinUrl.trim() === "" ? null : `https://www.linkedin.com/in/${linkedinUrl.trim()}`;
      await updateProfile({
        first_name: nameToSave,
        bio,
        intention,
        sociability: sociability[0],
        organization: organization.trim() === "" ? null : organization.trim(), // Save organization
        linkedin_url: fullLinkedinUrlToSave, // Save constructed LinkedIn URL
        updated_at: new Date().toISOString(),
      });
    } else {
      // If not logged in, just update local storage (already handled by useEffect for localFirstName)
      toast({
        title: "Profile Saved Locally",
        description: "Your profile changes have been saved to this browser.",
      });
    }
    // After successful update, reset original values and hasChanges
    setOriginalValues({ firstName: nameToSave, bio, intention, sociability, organization, linkedinUrl }); // linkedinUrl here is the username
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
                    value={localFirstName} // Use localFirstName
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
                    {localFirstName || "You"} {/* Use localFirstName */}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="bio">Brief Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Share a bit about yourself..."
                  value={bio}
                  onChange={(e) => handleBioChange(e.target.value)}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label htmlFor="intention">Statement of Intention</Label>
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
                <Label htmlFor="linkedin-username">LinkedIn Username</Label>
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
              <CardTitle>Social Preferences</CardTitle>
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
                  <div className="text-center mt-3 text-sm text-muted-foreground">
                    {sociability[0] <= 20 && "Looking to collaborate/brainstorm"}
                    {sociability[0] > 20 && sociability[0] <= 40 && "Happy to chat while we work"}
                    {sociability[0] > 40 && sociability[0] <= 60 && "I don't mind"}
                    {sociability[0] > 60 && sociability[0] <= 80 && "Socialise only during breaks"}
                    {sociability[0] > 80 && "Minimal interaction even during breaks"}
                  </div>
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
            disabled={!hasChanges || loading}
            className={!hasChanges || loading ? "opacity-50 cursor-not-allowed" : ""}
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