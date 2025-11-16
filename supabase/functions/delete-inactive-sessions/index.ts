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
    // Create a Supabase client with the service role key
    // This is necessary for performing delete operations that might bypass RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Calculate the timestamp for 90 minutes ago
    const ninetyMinutesAgo = new Date(Date.now() - 90 * 60 * 1000).toISOString();

    // Fetch sessions that haven't been updated in the last 90 minutes
    const { data: sessionsToDelete, error: fetchError } = await supabaseClient
      .from('active_sessions')
      .select('id, session_title, last_heartbeat')
      .lt('last_heartbeat', ninetyMinutesAgo);

    if (fetchError) {
      console.error('Error fetching inactive sessions:', fetchError.message);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (sessionsToDelete && sessionsToDelete.length > 0) {
      const idsToDelete = sessionsToDelete.map(session => session.id);
      console.log(`Found ${idsToDelete.length} inactive sessions to delete: ${idsToDelete.map(s => s.session_title).join(', ')}`);

      const { error: deleteError } = await supabaseClient
        .from('active_sessions')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) {
        console.error('Error deleting inactive sessions:', deleteError.message);
        return new Response(JSON.stringify({ error: deleteError.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }
      console.log(`Successfully deleted ${idsToDelete.length} inactive sessions.`);
    } else {
      console.log('No inactive sessions found to delete.');
    }

    return new Response(JSON.stringify({ message: 'Inactive sessions checked and deleted successfully.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Unexpected error in delete-inactive-sessions Edge Function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});