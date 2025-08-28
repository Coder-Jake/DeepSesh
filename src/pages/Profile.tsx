import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useEffect, useState } from "react";
import { useProfile } from "@/contexts/ProfileContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const Profile = () => {
  const { profile, loading, updateProfile } = useProfile();
  const { toast } = useToast();

  const [bio, setBio] = useState("");
  const [intention, setIntention] = useState("");
  const [sociability, setSociability] = useState([50]);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalValues, setOriginalValues] = useState({
    bio: "",
    intention: "",
    sociability: [50]
  });
  const [displayName, setDisplayName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      setBio(profile.bio || "");
      setIntention(profile.intention || "");
      setSociability([profile.sociability || 50]);
      setDisplayName(profile.first_name || ""); // Set display name from profile
      setOriginalValues({
        bio: profile.bio || "",
        intention: profile.intention || "",
        sociability: [profile.sociability || 50]
      });
      setHasChanges(false);
    }
  }, [profile]);

  const checkForChanges = (newBio: string, newIntention: string, newSociability: number[]) => {
    const changed = newBio !== originalValues.bio || 
                   newIntention !== originalValues.intention || 
                   newSociability[0] !== originalValues.sociability[0];
    setHasChanges(changed);
  };

  const handleBioChange = (value: string) => {
    setBio(value);
    checkForChanges(value, intention, sociability);
  };

  const handleIntentionChange = (value: string) => {
    setIntention(value);
    checkForChanges(bio, value, sociability);
  };

  const handleSociabilityChange = (value: number[]) => {
    setSociability(value);
    checkForChanges(bio, intention, value);
  };

  const handleSave = async () => {
    await updateProfile({
      bio,
      intention,
      sociability: sociability[0],
      updated_at: new Date().toISOString(),
    });
    // After successful update, reset original values and hasChanges
    setOriginalValues({ bio, intention, sociability });
    setHasChanges(false);
  };

  const handleSaveDisplayName = async () => {
    if (displayName.trim() === "") {
      toast({
        title: "Name required",
        description: "Please enter a display name.",
        variant: "destructive",
      });
      return;
    }
    await updateProfile({ first_name: displayName.trim() });
    setIsDialogOpen(false);
  };

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto p-6 text-center text-muted-foreground">
        Loading profile...
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">Set Display Name</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Set Your Display Name</DialogTitle>
              <DialogDescription>
                This name will be visible to other users.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  First Name
                </Label>
                <Input
                  id="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleSaveDisplayName}>Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bio Section */}
          <Card>
            <CardHeader>
              <CardTitle>About {profile?.first_name || "Me"}</CardTitle>
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
                    <span>Deep Focus</span>
                    <span>Banter</span>
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
                    {sociability[0] <= 20 && "Minimal interaction even during breaks"}
                    {sociability[0] > 20 && sociability[0] <= 40 && "Socialise only during breaks"}
                    {sociability[0] > 40 && sociability[0] <= 60 && "I don't mind"}
                    {sociability[0] > 60 && sociability[0] <= 80 && "Happy to chat while we work"}
                    {sociability[0] > 80 && "Looking to collaborate/brainstorm"}
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