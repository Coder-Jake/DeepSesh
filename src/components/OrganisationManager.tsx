"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ChevronDown, ChevronUp, Globe, UserStar, Building2, HeartHandshake, Lock, Info, Check, X, Edit } from 'lucide-react'; // MODIFIED: Import Check, X, Edit
import { cn, VISIBILITY_OPTIONS_MAP, getIndexFromVisibility, getPrivacyColorClassFromIndex } from '@/lib/utils';
import { OrganisationEntry } from '@/contexts/ProfileContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { useTimer } from '@/contexts/TimerContext'; // For toasts

interface OrganisationManagerProps {
  organisations: OrganisationEntry[];
  onUpdateOrganisations: (updatedOrganisations: OrganisationEntry[]) => void;
}

const OrganisationManager: React.FC<OrganisationManagerProps> = ({ organisations, onUpdateOrganisations }) => {
  const [newOrgName, setNewOrgName] = useState('');
  const [editingOrgId, setEditingOrgId] = useState<string | null>(null); // Use index as ID for simplicity
  const [editingOrgName, setEditingOrgName] = useState('');
  const [editingOrgVisibility, setEditingOrgVisibility] = useState<("public" | "friends" | "organisation" | "private")[]>(['public']);
  const { areToastsEnabled } = useTimer();

  const getPrivacyIcon = (index: number) => {
    switch (index) {
      case 0: return Globe;
      case 1: return UserStar;
      case 2: return Building2;
      case 3: return HeartHandshake;
      case 4: return Lock;
      default: return Globe;
    }
  };

  const getDisplayVisibilityStatus = useCallback((visibility: ("public" | "friends" | "organisation" | "private")[] | null): string => {
    if (!visibility || visibility.length === 0) return 'Public';
    if (visibility.includes('private')) return 'Private';
    if (visibility.includes('public')) return 'Public';
    if (visibility.includes('friends') && visibility.includes('organisation')) return 'Friends & Organisation';
    if (visibility.includes('friends')) return 'Friends Only';
    if (visibility.includes('organisation')) return 'Organisation Only';
    return 'Public';
  }, []);

  const handleAddOrganisation = () => {
    if (newOrgName.trim() === '') {
      if (areToastsEnabled) toast.error("Organisation name cannot be empty.");
      return;
    }
    if (organisations.some(org => org.name.toLowerCase() === newOrgName.trim().toLowerCase())) {
      if (areToastsEnabled) toast.error("Organisation already exists.");
      return;
    }
    const newEntry: OrganisationEntry = { name: newOrgName.trim(), visibility: ['public'] };
    onUpdateOrganisations([...organisations, newEntry]);
    setNewOrgName('');
    if (areToastsEnabled) toast.success(`'${newOrgName.trim()}' added.`);
  };

  const handleEditOrganisation = (index: number) => {
    const orgToEdit = organisations[index];
    setEditingOrgId(index.toString());
    setEditingOrgName(orgToEdit.name);
    setEditingOrgVisibility(orgToEdit.visibility);
  };

  const handleSaveEdit = () => {
    if (editingOrgId === null) return;
    if (editingOrgName.trim() === '') {
      if (areToastsEnabled) toast.error("Organisation name cannot be empty.");
      return;
    }
    const index = parseInt(editingOrgId);
    const updatedOrganisations = organisations.map((org, i) =>
      i === index ? { name: editingOrgName.trim(), visibility: editingOrgVisibility } : org
    );
    onUpdateOrganisations(updatedOrganisations);
    setEditingOrgId(null);
    setEditingOrgName('');
    setEditingOrgVisibility(['public']);
    if (areToastsEnabled) toast.success(`'${editingOrgName.trim()}' updated.`);
  };

  const handleCancelEdit = () => {
    setEditingOrgId(null);
    setEditingOrgName('');
    setEditingOrgVisibility(['public']);
  };

  const handleRemoveOrganisation = (index: number) => {
    const removedOrgName = organisations[index].name;
    const updatedOrganisations = organisations.filter((_, i) => i !== index);
    onUpdateOrganisations(updatedOrganisations);
    if (areToastsEnabled) toast.info(`'${removedOrgName}' removed.`);
  };

  const handleVisibilityToggle = (index: number) => {
    const currentOrg = organisations[index];
    const currentIndex = getIndexFromVisibility(currentOrg.visibility);
    const nextIndex = (currentIndex + 1) % VISIBILITY_OPTIONS_MAP.length;
    const newVisibility = VISIBILITY_OPTIONS_MAP[nextIndex] as ("public" | "friends" | "organisation" | "private")[];

    const updatedOrganisations = organisations.map((org, i) =>
      i === index ? { ...org, visibility: newVisibility } : org
    );
    onUpdateOrganisations(updatedOrganisations);
    if (areToastsEnabled) toast.success(`'${currentOrg.name}' visibility set to ${getDisplayVisibilityStatus(newVisibility)}.`);
  };

  const handleEditingVisibilityToggle = () => {
    const currentIndex = getIndexFromVisibility(editingOrgVisibility);
    const nextIndex = (currentIndex + 1) % VISIBILITY_OPTIONS_MAP.length;
    const newVisibility = VISIBILITY_OPTIONS_MAP[nextIndex] as ("public" | "friends" | "organisation" | "private")[];
    setEditingOrgVisibility(newVisibility);
    if (areToastsEnabled) toast.success(`Visibility set to ${getDisplayVisibilityStatus(newVisibility)}.`);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Add new organisation"
          value={newOrgName}
          onChange={(e) => setNewOrgName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAddOrganisation(); }}
        />
        <Button onClick={handleAddOrganisation} disabled={newOrgName.trim() === ''}>
          <Plus size={16} className="mr-2" /> Add
        </Button>
      </div>

      {organisations.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No organisations added yet.</p>
      ) : (
        <div className="space-y-2">
          {organisations.map((org, index) => (
            <div key={index} className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
              {editingOrgId === index.toString() ? (
                <>
                  <Input
                    value={editingOrgName}
                    onChange={(e) => setEditingOrgName(e.target.value)}
                    className="flex-grow"
                  />
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleEditingVisibilityToggle}
                        className={cn(
                          "h-8 w-8",
                          getPrivacyColorClassFromIndex(getIndexFromVisibility(editingOrgVisibility))
                        )}
                      >
                        {React.createElement(getPrivacyIcon(getIndexFromVisibility(editingOrgVisibility)), { size: 16 })}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="select-none text-xs w-fit" side="top" align="center" sideOffset={4}>
                      {getDisplayVisibilityStatus(editingOrgVisibility)}
                    </TooltipContent>
                  </Tooltip>
                  <Button variant="ghost" size="icon" onClick={handleSaveEdit}>
                    <Check size={16} className="text-green-500" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleCancelEdit}>
                    <X size={16} className="text-red-500" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-grow font-medium">{org.name}</span>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleVisibilityToggle(index)}
                        className={cn(
                          "h-8 w-8",
                          getPrivacyColorClassFromIndex(getIndexFromVisibility(org.visibility))
                        )}
                      >
                        {React.createElement(getPrivacyIcon(getIndexFromVisibility(org.visibility)), { size: 16 })}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="select-none text-xs w-fit" side="top" align="center" sideOffset={4}>
                      {getDisplayVisibilityStatus(org.visibility)}
                    </TooltipContent>
                  </Tooltip>
                  <Button variant="ghost" size="icon" onClick={() => handleEditOrganisation(index)}>
                    <Edit size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveOrganisation(index)}>
                    <Trash2 size={16} className="text-destructive" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrganisationManager;