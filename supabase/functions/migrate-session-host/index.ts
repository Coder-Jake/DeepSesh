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
    const { oldUserId, newUserId } = await req.json();

    if (!oldUserId || !newUserId) {
      console.error('MIGRATE_SESSION_HOST_EDGE_FUNCTION: Error: Missing oldUserId or newUserId. Status: 400');
      return new Response(JSON.stringify({ error: 'Missing oldUserId or newUserId' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Use the service role key to bypass RLS and update the user_id
    const supabaseServiceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Find any active sessions hosted by the oldUserId
    const { data: sessionsToMigrate, error: fetchError } = await supabaseServiceRoleClient
      .from('active_sessions')
      .select('id')
      .eq('user_id', oldUserId); // Removed .eq('is_active', true)

    if (fetchError) {
      console.error('MIGRATE_SESSION_HOST_EDGE_FUNCTION: Error fetching sessions to migrate:', fetchError.message);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (sessionsToMigrate && sessionsToMigrate.length > 0) {
      const sessionIdsToUpdate = sessionsToMigrate.map(s => s.id);
      console.log(`MIGRATE_SESSION_HOST_EDGE_FUNCTION: Found ${sessionIdsToUpdate.length} sessions to migrate from ${oldUserId} to ${newUserId}.`);

      const { error: updateError } = await supabaseServiceRoleClient
        .from('active_sessions')
        .update({ user_id: newUserId, last_heartbeat: new Date().toISOString() })
        .in('id', sessionIdsToUpdate);

      if (updateError) {
        console.error('MIGRATE_SESSION_HOST_EDGE_FUNCTION: Error updating sessions during migration:', updateError.message);
        return new Response(JSON.stringify({ error: updateError.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }
      console.log(`MIGRATE_SESSION_HOST_EDGE_FUNCTION: Successfully migrated ${sessionIdsToUpdate.length} sessions.`);
    } else {
      console.log(`MIGRATE_SESSION_HOST_EDGE_FUNCTION: No active sessions found for old user ID ${oldUserId} to migrate.`);
    }

    return new Response(JSON.stringify({ message: 'Session host migration complete.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('MIGRATE_SESSION_HOST_EDGE_FUNCTION: Unexpected error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});