import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";

const Profile = () => {
  const [bio, setBio] = useState("");
  const [intention, setIntention] = useState("");
  const [sociability, setSociability] = useState([50]);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalValues, setOriginalValues] = useState({
    bio: "",
    intention: "",
    sociability: [50]
  });

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

  const checkForChanges = (newBio: string, newIntention: string, newSociability: number[]) => {
    const changed = newBio !== originalValues.bio || 
                   newIntention !== originalValues.intention || 
                   newSociability[0] !== originalValues.sociability[0];
    setHasChanges(changed);
  };

  const handleSave = () => {
    // Save logic would go here
    setOriginalValues({ bio, intention, sociability });
    setHasChanges(false);
  };

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Profile</h1>
      </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bio Section */}
          <Card>
            <CardHeader>
              <CardTitle>About Me</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="bio">Brief Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us a bit about yourself..."
                  value={bio}
                  onChange={(e) => handleBioChange(e.target.value)}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label htmlFor="intention">Statement of Intention</Label>
                <Textarea
                  id="intention"
                  placeholder="What are your goals and intentions for focus sessions?"
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
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      {sociability[0]}
                    </div>
                  </div>
                  <div className="text-center mt-3 text-sm text-muted-foreground">
                    {sociability[0] <= 20 && "Solo focus with minimal interaction"}
                    {sociability[0] > 20 && sociability[0] <= 40 && "Solo work, interact only during breaks"}
                    {sociability[0] > 40 && sociability[0] <= 60 && "Balanced mix of solo and group work"}
                    {sociability[0] > 60 && sociability[0] <= 80 && "Enjoy collaborative sessions with discussion"}
                    {sociability[0] > 80 && "Love highly interactive and social focus sessions"}
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
            disabled={!hasChanges}
            className={!hasChanges ? "opacity-50 cursor-not-allowed" : ""}
          >
            Save Profile
          </Button>
        </div>
      </main>
  );
};

export default Profile;