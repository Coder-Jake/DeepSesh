"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Share2, Copy } from "lucide-react";
import { toast } from 'sonner';

interface ShareSessionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  seshTitle: string;
  setSeshTitle: (title: string) => void;
  onCopyLink: (title: string) => void;
}

const ShareSessionDialog: React.FC<ShareSessionDialogProps> = ({
  isOpen,
  onOpenChange,
  seshTitle,
  setSeshTitle,
  onCopyLink,
}) => {
  const [localSeshTitle, setLocalSeshTitle] = useState(seshTitle);

  // Sync local state with prop when dialog opens
  useEffect(() => {
    if (isOpen) {
      setLocalSeshTitle(seshTitle);
    }
  }, [isOpen, seshTitle]);

  const handleSaveDescription = () => {
    setSeshTitle(localSeshTitle);
    toast.success("Sesh description updated!");
  };

  const handleCopy = () => {
    onCopyLink(localSeshTitle);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 size={20} /> Share Sesh
          </DialogTitle>
          <DialogDescription>
            Share your current sesh with others or set a public description.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sesh-description" className="text-right">
              Description
            </Label>
            <Input
              id="sesh-description"
              value={localSeshTitle}
              onChange={(e) => setLocalSeshTitle(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Deep work on project X"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="share-link" className="text-right">
              Link
            </Label>
            <div className="col-span-3 flex">
              <Input
                id="share-link"
                value={`https://deepsesh.com/join?code=ABCDEF&title=${encodeURIComponent(localSeshTitle)}`} // Placeholder link
                readOnly
                className="flex-grow"
              />
              <Button variant="outline" size="icon" onClick={handleCopy} className="ml-2">
                <Copy size={16} />
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSaveDescription}>Save Description</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareSessionDialog;