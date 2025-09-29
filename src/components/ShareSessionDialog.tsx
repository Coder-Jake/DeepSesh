import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Share2, Link as LinkIcon, Users, Code, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareSessionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  sessionLink: string;
  sessionTitle: string;
}

const ShareSessionDialog: React.FC<ShareSessionDialogProps> = ({
  isOpen,
  onOpenChange,
  sessionLink,
  sessionTitle,
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(sessionLink);
    setCopied(true);
    toast({
      title: "Link Copied!",
      description: "The session link has been copied to your clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareToFriends = () => {
    // In a real application, this would open an in-app friends list or a social sharing dialog
    toast({
      title: "Share to Friends",
      description: "This would open your in-app friends list to share the session.",
    });
  };

  const handleEmbedCode = () => {
    // In a real application, this would provide an embeddable iframe code
    const embedCode = `<iframe src="${sessionLink}" width="600" height="400" frameborder="0" allowfullscreen></iframe>`;
    navigator.clipboard.writeText(embedCode);
    toast({
      title: "Embed Code Copied!",
      description: "The embed code has been copied to your clipboard.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" /> Share Session
          </DialogTitle>
          <DialogDescription>
            Share your "{sessionTitle}" session with others.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="session-link">Session Link</Label>
            <div className="flex space-x-2">
              <Input id="session-link" readOnly value={sessionLink} />
              <Button variant="outline" size="icon" onClick={handleCopyLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button variant="outline" className="justify-start" onClick={handleShareToFriends}>
            <Users className="mr-2 h-4 w-4" />
            Share to Friends
          </Button>

          <Button variant="outline" className="justify-start" onClick={handleEmbedCode}>
            <Code className="mr-2 h-4 w-4" />
            Get Embed Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareSessionDialog;