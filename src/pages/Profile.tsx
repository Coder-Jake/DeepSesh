import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Star } from "lucide-react";

const Profile = () => {
  const [bio, setBio] = useState("");
  const [intention, setIntention] = useState("");
  const [sociability, setSociability] = useState(3);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalValues, setOriginalValues] = useState({
    bio: "",
    intention: "",
    sociability: 3
  });

  const handleBioChange = (value: string) => {
    setBio(value);
    checkForChanges(value, intention, sociability);
  };

  const handleIntentionChange = (value: string) => {
    setIntention(value);
    checkForChanges(bio, value, sociability);
  };

  const handleSociabilityChange = (rating: number) => {
    setSociability(rating);
    checkForChanges(bio, intention, rating);
  };

  const checkForChanges = (newBio: string, newIntention: string, newSociability: number) => {
    const changed = newBio !== originalValues.bio || 
                   newIntention !== originalValues.intention || 
                   newSociability !== originalValues.sociability;
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
        <p className="text-muted-foreground mt-2">Customize your FlowSesh experience</p>
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
                <Label>Sociability Rating</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  How social do you prefer your focus sessions to be?
                </p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => handleSociabilityChange(rating)}
                      className={`p-2 rounded-md transition-colors ${
                        rating <= sociability
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Star
                        size={24}
                        fill={rating <= sociability ? "currentColor" : "none"}
                      />
                    </button>
                  ))}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {sociability === 1 && "Prefer solo focus"}
                  {sociability === 2 && "Mostly solo, occasional groups"}
                  {sociability === 3 && "Balanced"}
                  {sociability === 4 && "Enjoy group sessions"}
                  {sociability === 5 && "Love collaborative focus"}
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