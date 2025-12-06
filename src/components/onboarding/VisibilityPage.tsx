"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CardTitle } from '@/components/ui/card';
import { useProfile } from '@/contexts/ProfileContext';
import { useTimer } from '@/contexts/TimerContext';
import { cn } from '@/lib/utils';
import { Globe, Lock, ChevronLeft, ChevronRight, MapPin, Info, Building2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

interface VisibilityPageProps {
  nextStep?: () => void; // Made optional
  prevStep?: () => void; // Made optional
  areToastsEnabled: boolean;
}

const VisibilityPage: React.FC<VisibilityPageProps> = ({ nextStep, prevStep, areToastsEnabled }) => {
  const { profile, loading: profileLoading } = useProfile();
  const {
    sessionVisibility, setSessionVisibility,
    getLocation, geolocationPermissionStatus,
    isDiscoveryActivated, setIsDiscoveryActivated,
  } = useTimer();

  const [selectedVisibility, setSelectedVisibility] = useState<'public' | 'private' | 'organisation'>(sessionVisibility);
  const [isLocationEnabled, setIsLocationEnabled] = useState(geolocationPermissionStatus === 'granted');

  useEffect(() => {
    setSelectedVisibility(sessionVisibility);
    setIsLocationEnabled(geolocationPermissionStatus === 'granted');
  }, [sessionVisibility, geolocationPermissionStatus]);

  const handleLocationButtonClick = async () => {
    await getLocation();
    // getLocation updates geolocationPermissionStatus, which will then update isLocationEnabled via useEffect
  };

  const handleSaveAndNext = async () => {
    if (selectedVisibility === 'public' && geolocationPermissionStatus !== 'granted') {
      if (areToastsEnabled) {
        toast.error("Location Required", {
          description: "Public sessions require location access. Please enable it or choose 'Private'.",
        });
      }
      return;
    }

    setSessionVisibility(selectedVisibility);
    setIsDiscoveryActivated(true); // Activate discovery when onboarding is complete

    if (areToastsEnabled) {
      toast.success("Default Visibility Set!", {
        description: `Your default session visibility is now '${selectedVisibility}'.`,
      });
    }
    nextStep?.(); // Call optionally
  };

  if (profileLoading) {
    return <div className="text-center text-muted-foreground">Loading profile...</div>;
  }

  return (
    <div className="space-y-6 flex flex-col flex-grow">
      <CardTitle className="text-2xl font-bold text-center">Default Session Visibility</CardTitle>
      <p className="text-muted-foreground text-center mb-4">
        Choose who can discover and join your sessions by default.
      </p>

      <div className="space-y-4 flex-grow">
        <div className="space-y-2">
          <Label>Choose a default:</Label>
          <div className="grid grid-cols-1 gap-3">
            <Button
              variant="outline"
              className={cn(
                "h-auto py-3 flex items-center justify-start gap-3 text-lg",
                selectedVisibility === 'public' && "bg-public-bg text-public-bg-foreground border-public-bg-hover hover:bg-public-bg-hover"
              )}
              onClick={() => setSelectedVisibility('public')}
              name="visibilityPublic"
              id="visibility-public"
            >
              <Globe size={20} />
              Public
              <span className="ml-auto text-sm text-muted-foreground">Open to all</span>
            </Button>

            {profile?.profile_data?.organisation?.value && (profile.profile_data.organisation.value as string[]).length > 0 && ( // MODIFIED: Check profile.profile_data.organisation.value
              <Button
                variant="outline"
                className={cn(
                  "h-auto py-3 flex items-center justify-start gap-3 text-lg",
                  selectedVisibility === 'organisation' && "bg-organisation-bg text-organisation-bg-foreground border-organisation-bg-hover hover:bg-organisation-bg-hover"
                )}
                onClick={() => setSelectedVisibility('organisation')}
                name="visibilityOrganisation"
                id="visibility-organisation"
              >
                <Building2 size={20} />
                Organisation
                <span className="ml-auto text-sm text-muted-foreground">Members Only</span>
              </Button>
            )}

            <Button
              variant="outline"
              className={cn(
                "h-auto py-3 flex items-center justify-start gap-3 text-lg",
                selectedVisibility === 'private' && "bg-private-bg text-private-bg-foreground border-private-bg-hover hover:bg-private-bg-hover"
              )}
              onClick={() => setSelectedVisibility('private')}
              name="visibilityPrivate"
              id="visibility-private"
            >
              <Lock size={20} />
              Private
              <span className="ml-auto text-sm text-muted-foreground">Invite only</span>
            </Button>
          </div>
        </div>

        {/* Location Sharing section is now always visible */}
        <div className="space-y-2 mt-6">
          <Tooltip>
            <TooltipTrigger asChild>
              <Label className="flex items-center gap-2">
                <MapPin size={16} /> Location Sharing
                <Info size={16} className="text-muted-foreground" />
              </Label>
            </TooltipTrigger>
            <TooltipContent className="select-none">
              Public sessions require location to be discoverable by others.
            </TooltipContent>
          </Tooltip>
          <Button
            variant="outline"
            className={cn(
              "w-full flex items-center gap-2",
              geolocationPermissionStatus === 'granted' && "bg-success text-success-foreground border-success hover:bg-success-hover hover:text-success-foreground",
              geolocationPermissionStatus === 'denied' && "bg-error text-error-foreground border-error hover:bg-error-hover",
              geolocationPermissionStatus === 'prompt' && "bg-muted text-muted-foreground hover:bg-muted-hover"
            )}
            onClick={handleLocationButtonClick}
            name="locationSharingButton"
            id="location-sharing-button"
          >
            <MapPin size={16} />
            {geolocationPermissionStatus === 'granted' && "Enabled"}
            {geolocationPermissionStatus === 'denied' && "Enable Location"}
            {geolocationPermissionStatus === 'prompt' && "Enable Location"}
          </Button>
        </div>
      </div>

      <div className="flex justify-between mt-auto">
        <Button variant="outline" onClick={prevStep}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={handleSaveAndNext}>
          Finish <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default VisibilityPage;