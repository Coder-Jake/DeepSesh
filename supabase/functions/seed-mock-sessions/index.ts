import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to generate a UUID (since crypto.randomUUID is not available in Deno for this context)
const generateUuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseServiceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const mockSessions = [
      {
        id: generateUuid(),
        session_title: "Deep Work @ StartSpace",
        created_at: new Date().toISOString(),
        location_long: 144.9631, // Mock longitude for Melbourne
        location_lat: -37.8136,  // Mock latitude for Melbourne
        focus_duration: 50, // Total focus minutes
        break_duration: 10, // Total break minutes
        user_id: "a1b2c3d4-e5f6-4789-8012-34567890abcd", // Sam Altman's mock ID
        host_name: "Sam Altman",
        current_phase_type: 'focus',
        current_phase_end_time: new Date(Date.now() + 20 * 60 * 1000).toISOString(), // 20 mins remaining
        total_session_duration_seconds: 60 * 60, // 60 minutes total
        schedule_id: null,
        schedule_data: [
          { id: generateUuid(), title: "Focus", type: "focus", durationMinutes: 25, isCustom: false },
          { id: generateUuid(), title: "Short Break", type: "break", durationMinutes: 5, isCustom: false },
          { id: generateUuid(), title: "Focus", type: "focus", durationMinutes: 25, isCustom: false },
          { id: generateUuid(), title: "Short Break", type: "break", durationMinutes: 5, isCustom: false },
        ],
        is_active: true,
        is_paused: false,
        current_schedule_index: 0,
        visibility: 'public',
        participants_data: [
          { userId: "a1b2c3d4-e5f6-4789-8012-34567890abcd", userName: "Sam Altman", joinTime: Date.now(), role: 'host', focusPreference: 20, intention: "Focusing on AGI." },
          { userId: "b2c3d4e5-f6a7-4890-8123-4567890abcdef0", userName: "Musk", joinTime: Date.now() + 5000, role: 'coworker', focusPreference: 10, intention: "Innovating space travel." },
        ],
        join_code: "StartSpace",
        organisation: ["OpenAI", "SpaceX"],
        host_notes: "Working on the next big thing in AI. Feel free to join and collaborate!",
        active_asks: [],
        is_mock: true,
      },
      {
        id: generateUuid(),
        session_title: "Psych101 Study Sesh",
        created_at: new Date().toISOString(),
        location_long: 144.9615, // Mock longitude for Melbourne Uni
        location_lat: -37.7962,  // Mock latitude for Melbourne Uni
        focus_duration: 90, // Total focus minutes
        break_duration: 15, // Total break minutes
        user_id: "c3d4e5f6-a7b8-4901-8234-567890abcdef01", // Freud's mock ID
        host_name: "Freud",
        current_phase_type: 'focus',
        current_phase_end_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 mins remaining
        total_session_duration_seconds: 105 * 60, // 105 minutes total
        schedule_id: null,
        schedule_data: [
          { id: generateUuid(), title: "Focus", type: "focus", durationMinutes: 45, isCustom: false },
          { id: generateUuid(), title: "Break", type: "break", durationMinutes: 15, isCustom: false },
          { id: generateUuid(), title: "Focus", type: "focus", durationMinutes: 45, isCustom: false },
        ],
        is_active: true,
        is_paused: false,
        current_schedule_index: 0,
        visibility: 'private',
        participants_data: [
          { userId: "c3d4e5f6-a7b8-4901-8234-567890abcdef01", userName: "Freud", joinTime: Date.now(), role: 'host', focusPreference: 60, intention: "Unraveling human behavior." },
          { userId: "g7h8i9j0-k1l2-4345-8678-90abcdef012345", userName: "Rogers", joinTime: Date.now() + 10000, role: 'coworker', focusPreference: 75, intention: "Promoting self-actualization." },
          { userId: "a0b1c2d3-e4f5-4678-9012-34567890abcd", userName: "Jake", joinTime: Date.now() + 15000, role: 'coworker', focusPreference: 85, intention: "put WeWork out of business" },
        ],
        join_code: "Psych101",
        organisation: ["Psychology Dept.", "Humanistic Psychology", "DeepSesh"],
        host_notes: "Reviewing core concepts for Psych101. Open to questions during break!",
        active_asks: [],
        is_mock: true,
      },
    ];

    for (const sessionData of mockSessions) {
      const { data: existingSessions, error: fetchError } = await supabaseServiceRoleClient
        .from('active_sessions')
        .select('id')
        .eq('session_title', sessionData.session_title)
        .eq('is_mock', true);

      if (fetchError) {
        console.error(`Error checking for existing mock session '${sessionData.session_title}':`, fetchError.message);
        continue;
      }

      if (existingSessions && existingSessions.length === 0) {
        const { error: insertError } = await supabaseServiceRoleClient
          .from('active_sessions')
          .insert(sessionData);

        if (insertError) {
          console.error(`Error inserting mock session '${sessionData.session_title}':`, insertError.message);
        } else {
          console.log(`Successfully inserted mock session: ${sessionData.session_title}`);
        }
      } else {
        console.log(`Mock session '${sessionData.session_title}' already exists. Skipping insertion.`);
      }
    }

    return new Response(JSON.stringify({ message: 'Mock sessions seeding process completed.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Unexpected error in seed-mock-sessions Edge Function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});