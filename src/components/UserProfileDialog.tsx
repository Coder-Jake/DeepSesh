import React, { useEffect, useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Linkedin, User, Ban, CheckCircle } from "lucide-react";
import { useProfile } from "@/contexts/ProfileContext";
import { cn } from "@/lib/utils";

interface UserProfileDialogProps {
  userId: string | null;
  userName: string | null;
  isOpen: boolean;
  onClose: () => void;
}

// Mock data for other users (to simulate public profiles)
const mockOtherProfiles = [
  {
    id: "mock-user-id-1",
    first_name: "Alice",
    bio: "Passionate about AI and machine learning. Always looking for new challenges.",
    intention: "Working on a new neural network architecture.",
    sociability: 75,
    organization: "Tech Innovators Inc.",
    linkedin_url: "https://www.linkedin.com/in/alice-smith",
    avatar_url: "https://api.dicebear.com/7.x/initials/svg?seed=Alice",
  },
  {
    id: "mock-user-id-2",
    first_name: "Bob",
    bio: "Frontend developer with a love for clean code and user-friendly interfaces.",
    intention: "Refactoring legacy JavaScript code to TypeScript.",
    sociability: 60,
    organization: "Web Solutions Co.",
    linkedin_url: "https://www.linkedin.com/in/bob-johnson",
    avatar_url: "https://api.dicebear.com/7.x/initials/svg?seed=Bob",
  },
  {
    id: "mock-user-id-3",
    first_name: "Charlie",
    bio: "Data scientist specializing in predictive analytics and data visualization.",
    intention: "Analyzing large datasets for market trends.",
    sociability: 80,
    organization: "Data Insights LLC",
    linkedin_url: "https://www.linkedin.com/in/charlie-brown",
    avatar_url: "https://api.dicebear.com/7.x/initials/svg?seed=Charlie",
  },
  {
    id: "mock-user-id-4",
    first_name: "Diana",
    bio: "UX/UI designer focused on creating intuitive and aesthetically pleasing digital experiences.",
    intention: "Designing wireframes for a new mobile application.",
    sociability: 90,
    organization: "Creative Designs Studio",
    linkedin_url: "https://www.linkedin.com/in/diana-prince",
    avatar_url: "https://api.dicebear.com/7.x/initials/svg?seed=Diana",
  },
  {
    id: "mock-user-id-5",
    first_name: "Eve",
    bio: "Backend engineer passionate about scalable systems and robust APIs.",
    intention: "Developing new microservices for cloud deployment.",
    sociability: 50,
    organization: "Cloud Builders Ltd.",
    linkedin_url: "https://www.linkedin.com/in/eve-adams",
    avatar_url: "https://api.dicebear.com/7.x/initials/svg?seed=Eve",
  },
];

const UserProfileDialog: React.FC<UserProfileDialogProps> = ({ userId, userName, isOpen, onClose }) => {
  const { profile: currentUserProfile, fetchOtherUserProfile, blockedUsers, blockUser, unblockUser, localFirstName } = useProfile();
  const [displayedProfile, setDisplayedProfile] = useState<any>(null); // Using 'any' for now due to mock data structure
  const [loading, setLoading] = useState(true);

  const isCurrentUser = userId === currentUserProfile?.id;
  const isBlocked = userName ? blockedUsers.includes(userName) : false;

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId || !userName) {
        setDisplayedProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      const fetchedProfile = await fetchOtherUserProfile(userId, userName);
      setDisplayedProfile(fetchedProfile);
      setLoading(false);
    };

    if (isOpen) {
      loadProfile();
    }
  }, [userId, userName, isOpen, fetchOtherUserProfile]);

  const handleBlockToggle = useCallback(() => {
    if (!userName) return;
    if (isBlocked) {
      unblockUser(userName);
    } else {
      blockUser(userName);
    }
  }, [userName, isBlocked, blockUser, unblockUser]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="flex flex-col items-center text-center pt-4">
          {loading ? (
            <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
              <User size={48} className="text-muted-foreground" />
            </div>
          ) : (
            <Avatar className="h-24 w-24">
              <AvatarImage src={displayedProfile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${userName}`} alt={userName || "User"} />
              <AvatarFallback className="text-4xl">{userName ? userName[0].toUpperCase() : <User />}</AvatarFallback>
            </Avatar>
          )}
          <DialogTitle className="text-2xl font-bold mt-2">
            {loading ? "Loading..." : (isCurrentUser ? `${localFirstName} (You)` : userName)}
          </DialogTitle>
          {displayedProfile?.organization && (
            <DialogDescription className="text-muted-foreground text-sm">
              {displayedProfile.organization}
            </DialogDescription>
          )}
        </DialogHeader>
        
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading profile details...</div>
        ) : (
          <div className="grid gap-4 py-4 text-sm">
            {displayedProfile?.bio && (
              <div className="space-y-1">
                <p className="font-semibold">Bio:</p>
                <p className="text-muted-foreground">{displayedProfile.bio}</p>
              </div>
            )}
            {displayedProfile?.intention && (
              <div className="space-y-1">
                <p className="font-semibold">Intention:</p>
                <p className="text-muted-foreground">{displayedProfile.intention}</p>
              </div>
            )}
            {displayedProfile?.sociability !== undefined && (
              <div className="space-y-1">
                <p className="font-semibold">Sociability:</p>
                <Badge variant="secondary" className="text-muted-foreground">
                  {displayedProfile.sociability}%
                </Badge>
              </div>
            )}
            {displayedProfile?.linkedin_url && (
              <div className="space-y-1">
                <p className="font-semibold">LinkedIn:</p>
                <a 
                  href={displayedProfile.linkedin_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-2 text-blue-600 hover:underline"
                >
                  <Linkedin size={16} />
                  {displayedProfile.linkedin_url.replace('https://www.linkedin.com/in/', '')}
                </a>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2 pt-4">
          {!isCurrentUser && userName && (
            <Button 
              variant={isBlocked ? "default" : "outline"} 
              onClick={handleBlockToggle}
              className={cn(isBlocked ? "bg-red-500 hover:bg-red-600 text-white" : "text-muted-foreground")}
            >
              {isBlocked ? <CheckCircle size={16} className="mr-2" /> : <Ban size={16} className="mr-2" />}
              {isBlocked ? "Unblock User" : "Block User"}
            </Button>
          )}
          <Button onClick={onClose} className={cn(isCurrentUser ? "w-full" : "sm:w-auto")}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileDialog;