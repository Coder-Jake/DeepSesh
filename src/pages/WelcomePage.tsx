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
import { OrganisationEntry } from '@/contexts/ProfileContext'; // NEW: Import OrganisationEntry

interface WelcomePageProps {
  nextStep?: () => void; // Made optional
  areToastsEnabled: boolean;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ nextStep, areToastsEnabled }) => {
  const { profile, loading: profileLoading, updateProfile, joinCode, localFirstName, focusPreference, organisation: contextOrganisation, setFocusPreference, setOrganisation } = useProfile(); // MODIFIED: Get organisation as OrganisationEntry[]

  const [firstNameInput, setFirstNameInput] = useState("");
  const [focusPreferenceInput, setFocusPreferenceInput] = useState(50);
  const [organisationInput, setOrganisationInput] = useState<string | null>(null); // Keep as string for input

  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);

  useEffect(() => {
    if (!profileLoading && profile) {
      setFirstNameInput(profile.first_name || profile.join_code || "Coworker");
      setFocusPreferenceInput(profile.focus_preference || 50);
      // MODIFIED: Join organisation names for input display
      setOrganisationInput(profile.profile_data?.organisation?.map(org => org.name).join('; ') || null);
    }
  }, [profileLoading, profile]);

  const handleSaveAndNext = async () => {
    if (!profile) {
      if (areToastsEnabled) toast.error("Profile not loaded.", { description: "Please try again." });
      return;
    }

    const trimmedFirstName = firstNameInput.trim();
    const nameToSave = (trimmedFirstName === (profile.join_code || "Coworker")) ? null : trimmedFirstName;
    
    // MODIFIED: Convert organisation input string to array of OrganisationEntry with default public visibility
    const trimmedOrganisationString = organisationInput?.trim() || "";
    const organisationEntries: OrganisationEntry[] = trimmedOrganisationString.split(';')
      .map(org => org.trim())
      .filter(org => org.length > 0)
      .map(orgName => ({ name: orgName, visibility: ['public'] })); // Default to public visibility

    try {
      await updateProfile({
        first_name: nameToSave,
        focus_preference: focusPreferenceInput,
        organisation: organisationEntries, // MODIFIED: Update organisation as OrganisationEntry[]
      }, "Profile details saved!");
      nextStep?.();
    } catch (error: any) {
      console.error("Error saving welcome page data:", error);
      if (areToastsEnabled) toast.error("Failed to save details.", { description: error.message || "Please try again." });
    }
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

  // NEW: Memoized list of organisations
  const organisationsList = useMemo(() => {
    if (!organisationInput) return [];
    return organisationInput.split(';').map(org => org.trim()).filter(org => org.length > 0);
  }, [organisationInput]);

  if (profileLoading) {
    return <div className="text-center text-muted-foreground">Loading profile...</div>;
  }

  return (
    <div className="space-y-6 flex flex-col flex-grow">
      <div className="flex flex-col items-center justify-center mb-8">
        <div className="flex items-center">
          <img
            src="/ds-logo.png"
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
            name="firstName"
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
          <Label htmlFor="organisation-name-input">Organisation (Optional)</Label>
          <Input
            id="organisation-name-input"
            name="organisation"
            placeholder="e.g. Unimelb; StartSpace"
            value={organisationInput || ""}
            onChange={(e) => setOrganisationInput(e.target.value)}
            className="flex-grow"
          />
          {organisationsList.length > 0 && (
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm mt-2">
              {organisationsList.map((org, index) => (
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
    </div>
  );
};

export default WelcomePage;