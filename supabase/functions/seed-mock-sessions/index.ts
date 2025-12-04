import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mockSessions } = await req.json();

    if (!mockSessions || !Array.isArray(mockSessions) || mockSessions.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid or empty mockSessions array provided' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseServiceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const insertedSessionIds: string[] = [];
    const skippedSessionTitles: string[] = [];

    for (const session of mockSessions) {
      // Check if a session with the same title and is_mock=true already exists
      const { data: existingSessions, error: fetchError } = await supabaseServiceRoleClient
        .from('active_sessions')
        .select('id')
        .eq('session_title', session.title)
        .eq('is_mock', true);

      if (fetchError) {
        console.error(`Error checking for existing session '${session.title}':`, fetchError.message);
        continue;
      }

      if (existingSessions && existingSessions.length > 0) {
        console.log(`Skipping existing mock session: '${session.title}'`);
        skippedSessionTitles.push(session.title);
        continue;
      }

      // Prepare data for insertion, mapping DemoSession to SupabaseSessionData structure
      const sessionToInsert = {
        id: session.id,
        session_title: session.title,
        created_at: new Date(session.startTime).toISOString(),
        location_long: session.location_long,
        location_lat: session.location_lat,
        focus_duration: session.fullSchedule.filter(s => s.type === 'focus').reduce((sum, s) => sum + s.durationMinutes, 0),
        break_duration: session.fullSchedule.filter(s => s.type === 'break').reduce((sum, s) => sum + s.durationMinutes, 0),
        user_id: session.user_id,
        host_name: session.participants.find(p => p.role === 'host')?.userName || "Unknown Host",
        current_phase_type: session.fullSchedule[0]?.type || 'focus',
        current_phase_end_time: new Date(session.startTime + (session.fullSchedule[0]?.durationMinutes || 0) * 60 * 1000).toISOString(),
        total_session_duration_seconds: session.fullSchedule.reduce((sum, item) => sum + item.durationMinutes, 0) * 60,
        schedule_id: null, // Mock sessions don't necessarily have a schedule_id
        schedule_data: session.fullSchedule,
        is_active: true,
        is_paused: false,
        current_schedule_index: 0,
        visibility: session.visibility,
        participants_data: session.participants,
        join_code: session.join_code,
        organisation: session.organisation,
        host_notes: session.host_notes,
        is_mock: true, // Mark as mock session
        last_heartbeat: new Date().toISOString(),
      };

      const { error: insertError } = await supabaseServiceRoleClient
        .from('active_sessions')
        .insert([sessionToInsert]);

      if (insertError) {
        console.error(`Error inserting mock session '${session.title}':`, insertError.message);
      } else {
        insertedSessionIds.push(session.id);
        console.log(`Successfully inserted mock session: '${session.title}'`);
      }
    }

    return new Response(JSON.stringify({
      message: 'Mock sessions seeding attempt complete.',
      insertedCount: insertedSessionIds.length,
      skippedCount: skippedSessionTitles.length,
      insertedIds: insertedSessionIds,
      skippedTitles: skippedSessionTitles,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Unexpected error in seed-mock-sessions Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});