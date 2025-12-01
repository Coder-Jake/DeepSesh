"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTimer } from '@/contexts/TimerContext';
import { MOCK_SESSIONS } from '@/lib/mock-data';
import { toast } from 'sonner';
import { getEdgeFunctionErrorMessage } from '@/utils/error-utils';

const LOCAL_STORAGE_MOCK_SEED_KEY = 'deepsesh_mock_sessions_seeded';

const MockSessionSeeder: React.FC = () => {
  const { user, session } = useAuth();
  const { areToastsEnabled, showDemoSessions } = useTimer();
  const [hasSeeded, setHasSeeded] = useState(false);

  useEffect(() => {
    const seedMockSessions = async () => {
      if (!user || !session || hasSeeded || !showDemoSessions) {
        return;
      }

      // Check local storage to prevent re-seeding on every app load
      const seededLocally = localStorage.getItem(LOCAL_STORAGE_MOCK_SEED_KEY);
      if (seededLocally === 'true') {
        setHasSeeded(true);
        return;
      }

      console.log("Attempting to seed mock sessions...");

      try {
        const response = await supabase.functions.invoke('seed-mock-sessions', {
          body: JSON.stringify({ mockSessions: MOCK_SESSIONS }),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (response.error) throw response.error;
        if (response.data.error) throw new Error(response.data.error);

        const { insertedCount, skippedCount } = response.data;

        if (insertedCount > 0 && areToastsEnabled) {
          toast.success("Mock Sessions Added!", {
            description: `${insertedCount} demo sessions have been added.`,
          });
        } else if (skippedCount > 0 && areToastsEnabled) {
          toast.info("Mock Sessions Already Exist", {
            description: "Demo sessions are already present in your environment.",
          });
        } else if (areToastsEnabled) {
          toast.info("No Mock Sessions Added", {
            description: "No new demo sessions were added.",
          });
        }

        localStorage.setItem(LOCAL_STORAGE_MOCK_SEED_KEY, 'true');
        setHasSeeded(true);

      } catch (error: any) {
        console.error("Error seeding mock sessions:", error);
        if (areToastsEnabled) {
          toast.error("Failed to Seed Mock Sessions", {
            description: `An error occurred: ${await getEdgeFunctionErrorMessage(error)}.`,
          });
        }
      }
    };

    seedMockSessions();
  }, [user, session, hasSeeded, areToastsEnabled, showDemoSessions]);

  return null; // This component doesn't render anything
};

export default MockSessionSeeder;