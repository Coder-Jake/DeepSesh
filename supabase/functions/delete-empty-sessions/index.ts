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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Fetch all active sessions
    const { data: sessions, error: fetchError } = await supabaseClient
      .from('active_sessions')
      .select('id, participants_data');

    if (fetchError) {
      console.error('Error fetching active sessions:', fetchError.message);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const sessionsToDelete = sessions.filter(session => 
      !session.participants_data || session.participants_data.length === 0
    );

    if (sessionsToDelete.length > 0) {
      const idsToDelete = sessionsToDelete.map(session => session.id);
      console.log(`Found ${idsToDelete.length} sessions to delete: ${idsToDelete.join(', ')}`);

      const { error: deleteError } = await supabaseClient
        .from('active_sessions')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) {
        console.error('Error deleting empty sessions:', deleteError.message);
        return new Response(JSON.stringify({ error: deleteError.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }
      console.log(`Successfully deleted ${idsToDelete.length} empty sessions.`);
    } else {
      console.log('No empty sessions found to delete.');
    }

    return new Response(JSON.stringify({ message: 'Empty sessions checked and deleted successfully.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Unexpected error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});