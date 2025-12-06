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
    const { sessionId } = await req.json();

    if (!sessionId) {
      console.warn('CLEANUP_STALE_SESSION: Bad Request: Missing sessionId.');
      return new Response(JSON.stringify({ error: 'Missing sessionId' }), {
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

    const { data: session, error: fetchError } = await supabaseServiceRoleClient
      .from('active_sessions')
      .select('id, user_id, host_name, participants_data, session_title')
      .eq('id', sessionId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') { // No rows found
        console.log(`CLEANUP_STALE_SESSION: Session ${sessionId} not found, no cleanup needed.`);
        return new Response(JSON.stringify({ message: 'Session not found, no cleanup needed.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      console.error(`CLEANUP_STALE_SESSION: Error fetching session ${sessionId}:`, fetchError.message);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const currentHostId = session.user_id;
    let participants = (session.participants_data || []) as any[];

    const hostStillPresent = participants.some(p => p.userId === currentHostId && p.role === 'host');

    if (!hostStillPresent && currentHostId !== null) { // Host is missing from participants_data, and it's not an anonymous host
      console.log(`CLEANUP_STALE_SESSION: Host ${currentHostId} is missing from participants_data for session ${sessionId}. Initiating cleanup.`);

      // Filter out the missing host (if they were somehow still in participants_data but not as host)
      participants = participants.filter(p => p.userId !== currentHostId);

      if (participants.length > 0) {
        // Promote the oldest coworker to host
        const oldestCoworker = participants.sort((a, b) => a.joinTime - b.joinTime)[0];
        const newHostId = oldestCoworker.userId;
        const newHostName = oldestCoworker.userName;

        participants = participants.map(p =>
          p.userId === newHostId ? { ...p, role: 'host' } : p
        );

        const { error: updateError } = await supabaseServiceRoleClient
          .from('active_sessions')
          .update({
            user_id: newHostId,
            host_name: newHostName,
            participants_data: participants,
            last_heartbeat: new Date().toISOString(),
          })
          .eq('id', sessionId);

        if (updateError) {
          console.error(`CLEANUP_STALE_SESSION: Error updating session ${sessionId} with new host:`, updateError.message);
          return new Response(JSON.stringify({ error: updateError.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          });
        }
        console.log(`CLEANUP_STALE_SESSION: Host role transferred to ${newHostName} (${newHostId}) for session ${sessionId}.`);
        return new Response(JSON.stringify({ message: 'Host role transferred in stale session.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      } else {
        // No other participants, delete the session
        const { error: deleteError } = await supabaseServiceRoleClient
          .from('active_sessions')
          .delete()
          .eq('id', sessionId);

        if (deleteError) {
          console.error(`CLEANUP_STALE_SESSION: Error deleting empty session ${sessionId}:`, deleteError.message);
          return new Response(JSON.stringify({ error: deleteError.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          });
        }
        console.log(`CLEANUP_STALE_SESSION: Empty session ${sessionId} deleted.`);
        return new Response(JSON.stringify({ message: 'Empty stale session deleted.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
    } else {
      console.log(`CLEANUP_STALE_SESSION: Session ${sessionId} is consistent or has an anonymous host. No cleanup needed.`);
      return new Response(JSON.stringify({ message: 'Session is consistent, no cleanup needed.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

  } catch (error: any) {
    console.error('CLEANUP_STALE_SESSION: Unexpected error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});