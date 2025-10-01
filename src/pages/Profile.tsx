import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useEffect, useState, useRef } from "react";
import { useProfile } from "@/contexts/ProfileContext"; // Import useProfile
import { useToast } from "@/hooks/use-toast"; // Import useToast

const Profile = () => {
  const { profile, loading, updateProfile } = useProfile(); // Use profile context
  const { toast } = useToast();

  const [firstName, setFirstName] = useState("");
  const [bio, setBio] = useState("");
  const [intention, setIntention] = useState("");
  const [sociability, setSociability] = useState([30]);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalValues, setOriginalValues] = useState({
    firstName: "",
    bio: "",
    intention: "",
    sociability: [30]
  });

  const [isEditingFirstName, setIsEditingFirstName] = useState(false);
  const firstNameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setBio(profile.bio || "");
      setIntention(profile.intention || "");
      setSociability([profile.sociability || 50]);
      setOriginalValues({
        firstName: profile.first_name || "",
        bio: profile.bio || "",
        intention: profile.intention || "",
        sociability: [profile.sociability || 50]
      });
      setHasChanges(false);
    }
  }, [profile]);

  useEffect(() => {
    if (isEditingFirstName && firstNameInputRef.current) {
      firstNameInputRef.current.focus();
    }
  }, [isEditingFirstName]);

  const checkForChanges = (newFirstName: string, newBio: string, newIntention: string, newSociability: number[]) => {
    const changed = newFirstName !== originalValues.firstName ||
                   newBio !== originalValues.bio || 
                   newIntention !== originalValues.intention || 
                   newSociability[0] !== originalValues.sociability[0];
    setHasChanges(changed);
  };

  const handleFirstNameChange = (value: string) => {
    setFirstName(value);
    checkForChanges(value, bio, intention, sociability);
  };

  const handleBioChange = (value: string) => {
    setBio(value);
    checkForChanges(firstName, value, intention, sociability);
  };

  const handleIntentionChange = (value: string) => {
    setIntention(value);
    checkForChanges(firstName, bio, value, sociability);
  };

  const handleSociabilityChange = (value: number[]) => {
    setSociability(value);
    checkForChanges(firstName, bio, intention, value);
  };

  const handleFirstNameClick = () => {
    setIsEditingFirstName(true);
  };

  const handleFirstNameInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditingFirstName(false);
      e.currentTarget.blur();
      const nameToSave = firstName.trim() === "" ? "" : firstName.trim();
      await updateProfile({ first_name: nameToSave });
      setOriginalValues(prev => ({ ...prev, firstName: nameToSave }));
      checkForChanges(nameToSave, bio, intention, sociability);
    }
  };

  const handleFirstNameInputBlur = async () => {
    setIsEditingFirstName(false);
    const nameToSave = firstName.trim() === "" ? "" : firstName.trim();
    await updateProfile({ first_name: nameToSave });
    setOriginalValues(prev => ({ ...prev, firstName: nameToSave }));
    checkForChanges(nameToSave, bio, intention, sociability);
  };

  const handleSave = async () => {
    await updateProfile({
      first_name: firstName,
      bio,
      intention,
      sociability: sociability[0],
      updated_at: new Date().toISOString(),
    });
    // After successful update, reset original values and hasChanges
    setOriginalValues({ firstName, bio, intention, sociability });
    setHasChanges(false);
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Profile</h1>
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
                    value={firstName}
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
                    {firstName || "Me"}
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
      </main>
  );
};

export default Profile;