import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Share2, Copy, Users, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTimer } from "@/contexts/TimerContext"; // Import useTimer

interface ShareTimerDialogProps {
  sessionId?: string; // Optional session ID if applicable
}

const ShareTimerDialog: React.FC<ShareTimerDialogProps> = ({ sessionId }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { scheduleTitle, isScheduleActive } = useTimer(); // Get scheduleTitle and isScheduleActive

  // For demonstration, let's create a mock shareable link
  const currentSessionLink = sessionId 
    ? `https://flows.sh/join/${sessionId}` 
    : `https://flows.sh/join/current-session`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentSessionLink);
    toast({
      title: "Link Copied!",
      description: "The session link has been copied to your clipboard.",
    });
    setIsDialogOpen(false);
  };

  const handleShareToFriends = () => {
    // In a real application, this would open a list of friends to share with
    toast({
      title: "Share to Friends",
      description: "This would open a friend selector to share the session.",
    });
    setIsDialogOpen(false);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2 px-3 py-1 rounded-full border border-border hover:bg-muted transition-colors"
        >
          <Share2 size={16} />
          <span className="text-sm font-medium">Share</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center">Share Session</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {isScheduleActive && scheduleTitle && (
            <p className="text-center text-muted-foreground text-sm mb-2">
              Sharing: <span className="font-medium text-foreground">{scheduleTitle}</span>
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="session-link" className="sr-only">Session Link</Label>
            <div className="flex space-x-2">
              <Input id="session-link" value={currentSessionLink} readOnly className="flex-1" />
              <Button variant="outline" size="icon" onClick={handleCopyLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button variant="outline" className="justify-start" onClick={handleShareToFriends}>
            <Users className="mr-2 h-4 w-4" />
            Share to Friends
          </Button>
          <Button variant="outline" className="justify-start" onClick={handleCopyLink}>
            <LinkIcon className="mr-2 h-4 w-4" />
            Copy Join Link
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareTimerDialog;