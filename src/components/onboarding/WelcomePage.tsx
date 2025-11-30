"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useProfile } from '@/contexts/ProfileContext';
import { cn, getSociabilityGradientColor } from '@/lib/utils';
import { Users, Building2, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface WelcomePageProps {
  nextStep?: () => void;
  areToastsEnabled: boolean;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ nextStep, areToastsEnabled }) => {
  const { profile, loading: profileLoading, updateProfile, joinCode, localFirstName, focusPreference, organization, setFocusPreference, setOrganization } = useProfile();

  const [firstNameInput, setFirstNameInput] = useState("");
  const [focusPreferenceInput, setFocusPreferenceInput] = useState(50);
  const [organizationInput, setOrganizationInput] = useState<string | null>(null); // MODIFIED: Keep as string for input
  const [isOrganizationDialogOpen, setIsOrganizationDialogOpen] = useState(false);

  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);

  useEffect(() => {
    if (!profileLoading && profile) {
      setFirstNameInput(profile.first_name || profile.join_code || "Coworker");
      setFocusPreferenceInput(profile.focus_preference || 50);
      setOrganizationInput(profile.organization?.join('; ') || null); // MODIFIED: Join array for input display
    }
  }, [profileLoading, profile]);

  const handleSaveAndNext = async () => {
    if (!profile) {
      if (areToastsEnabled) toast.error("Profile not loaded.", { description: "Please try again." });
      return;
    }

    const trimmedFirstName = firstNameInput.trim();
    const nameToSave = (trimmedFirstName === (profile.join_code || "Coworker")) ? null : trimmedFirstName;
    
    // MODIFIED: Convert organization input string to array
    const trimmedOrganizationString = organizationInput?.trim() || "";
    const organizationArray = trimmedOrganizationString.split(';').map(org => org.trim()).filter(org => org.length > 0);

    try {
      await updateProfile({
        first_name: nameToSave,
        focus_preference: focusPreferenceInput,
        organization: organizationArray.length > 0 ? organizationArray : null, // MODIFIED: Pass array
      }, "Profile details saved!");
      nextStep?.();
    } catch (error: any) {
      console.error("Error saving welcome page data:", error);
      if (areToastsEnabled) toast.error("Failed to save details.", { description: error.message || "Please try again." });
    }
  };

  const handleSaveOrganization = () => {
    // This function is now only for closing the dialog, actual saving happens in handleSaveAndNext
    setIsOrganizationDialogOpen(false);
  };

  const handleSliderDrag = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!sliderContainerRef.current) return;

    const rect = sliderContainerRef.current.getBoundingClientRect();
    const clientX = event.clientX;

    let relativeX = clientX - rect.left;
    relativeX = Math.max(0, Math.min(relativeX, rect.width));

    const newValue = Math.round((relativeX / rect.width) * 100);
    setFocusPreferenceInput(newValue);
  }, []);

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    setIsDraggingSlider(true);
    handleSliderDrag(event);
    event.currentTarget.setPointerCapture(event.pointerId);
  }, [handleSliderDrag]);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingSlider) {
      handleSliderDrag(event);
    }
  }, [isDraggingSlider, handleSliderDrag]);

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    setIsDraggingSlider(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  // NEW: Memoized list of organizations
  const organizationsList = useMemo(() => {
    if (!organizationInput) return [];
    return organizationInput.split(';').map(org => org.trim()).filter(org => org.length > 0);
  }, [organizationInput]);

  if (profileLoading) {
    return <div className="text-center text-muted-foreground">Loading profile...</div>;
  }

  return (
    <div className="space-y-6 flex flex-col flex-grow">
      <div className="flex flex-col items-center justify-center mb-8">
        <div className="flex items-center">
          <img
            src="/ds-logo.
png"
            alt="DeepSesh Logo"
            className="h-12 w-12 mr-2 rotate-45"
          />
          <h1 className="text-4xl font-bold select-none bg-gradient-to-r from-[#1a8cff] to-[#8c25f4] text-transparent bg-clip-text">
            DeepSesh
          </h1>
        </div>
      </div>

      <div className="space-y-4 flex-grow">
        <div className="space-y-2">
          <Label htmlFor="first-name">Your Name</Label>
          <Input
            id="first-name"
            placeholder={joinCode || "Coworker"}
            value={firstNameInput}
            onChange={(e) => setFirstNameInput(e.target.value)}
            onFocus={(e) => e.target.select()}
          />
    </div>

        <div className="space-y-4">
          <Label>Focus Preference</Label>
          <div
            ref={sliderContainerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="space-y-4 cursor-ew-resize p-2 -m-2 rounded-md"
          >
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Banter</span>
              <span>Deep Focus</span>
            </div>
            <div className="relative group">
              <Slider
                value={[focusPreferenceInput]}
                onValueChange={(val) => setFocusPreferenceInput(val[0])}
                max={100}
                min={0}
                step={1}
                className="w-full"
              />
            </div>
            <div className="text-center mt-3 text-sm text-muted-foreground select-none">
              {focusPreferenceInput <= 20 && "Looking to collaborate/brainstorm"}
              {focusPreferenceInput > 20 && focusPreferenceInput <= 40 && "Happy to chat while we work"}
              {focusPreferenceInput > 40 && focusPreferenceInput <= 60 && "I don't mind"}
              {focusPreferenceInput > 60 && focusPreferenceInput <= 80 && "Socialise only during breaks"}
              {focusPreferenceInput > 80 && "Minimal interaction even during breaks"}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="organization-name-input">Organisation (Optional)</Label>
          <Input
            id="organization-name-input"
            placeholder="e.g. Unimelb; StartSpace"
            value={organizationInput || ""}
            onChange={(e) => setOrganizationInput(e.target.value)}
            readOnly
            onClick={() => setIsOrganizationDialogOpen(true)}
            className="flex-grow cursor-pointer"
          />
          {organizationsList.length > 0 && (
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm mt-2">
              {organizationsList.map((org, index) => (
                <span key={index} className="font-bold text-foreground">
                  {org}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <Button onClick={handleSaveAndNext} className="w-full mt-auto">
        Next <ChevronRight className="ml-2 h-4 w-4" />
      </Button>

      <Dialog open={isOrganizationDialogOpen} onOpenChange={setIsOrganizationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{organizationInput ? "Edit Organisation Name(s)" : "Add Organisation Name(s)"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="organization-dialog-input">Organisation Name(s)</Label>
              <Input
                id="organization-dialog-input"
                value={organizationInput || ""}
                onChange={(e) => setOrganizationInput(e.target.value)}
                placeholder="e.g. Unimelb; StartSpace"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOrganizationDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveOrganization}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WelcomePage;