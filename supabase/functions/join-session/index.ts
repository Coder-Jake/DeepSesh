import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('JOIN_SESSION_EDGE_FUNCTION: Function invoked.');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionCode, participantData } = await req.json();

    if (!sessionCode || !participantData || !participantData.userId || !participantData.userName) {
      console.warn('JOIN_SESSION_EDGE_FUNCTION: Bad Request: Missing sessionCode or participantData');
      return new Response(JSON.stringify({ error: 'Missing sessionCode or participantData' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const authenticatedUserId = participantData.userId;
    console.log('JOIN_SESSION_EDGE_FUNCTION: Authenticated User ID (bypassed JWT):', authenticatedUserId);

    const supabaseServiceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );
    console.log('JOIN_SESSION_EDGE_FUNCTION: SUPABASE_SERVICE_ROLE_KEY (first 10 chars):', (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '').substring(0, 10));


    const { data: userProfile, error: userProfileError } = await supabaseServiceRoleClient
      .from('profiles')
      .select('organisation')
      .eq('id', authenticatedUserId)
      .single();

    if (userProfileError && userProfileError.code !== 'PGRST116') {
      console.error('JOIN_SESSION_EDGE_FUNCTION: Error fetching joining user profile:', userProfileError);
      return new Response(JSON.stringify({ error: 'Failed to verify user organisation.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const joiningUserOrganisations: string[] = userProfile?.organisation || [];
    console.log('JOIN_SESSION_EDGE_FUNCTION: Joining User Organizations:', joiningUserOrganisations);

    const { data: sessions, error: fetchError } = await supabaseServiceRoleClient
      .from('active_sessions')
      .select('id, participants_data, is_active, visibility, user_id, join_code, organisation') // Corrected 'organization' to 'organisation'
      .eq('join_code', sessionCode)
      .eq('is_active', true)
      .limit(1);

    if (fetchError) {
      console.error('JOIN_SESSION_EDGE_FUNCTION: Error fetching session:', fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!sessions || sessions.length === 0) {
      console.warn('JOIN_SESSION_EDGE_FUNCTION: Not Found: Session not found or not active for code:', sessionCode);
      return new Response(JSON.stringify({ error: 'Session not found or not active' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    const session = sessions[0];
    console.log('JOIN_SESSION_EDGE_FUNCTION: Session ID:', session.id);
    console.log('JOIN_SESSION_EDGE_FUNCTION: Session Visibility:', session.visibility);
    console.log('JOIN_SESSION_EDGE_FUNCTION: Session Organisation (from DB):', session.organisation);

    const currentParticipants = (session.participants_data || []) as any[];

    if (session.visibility === 'private' && session.user_id !== authenticatedUserId) {
      console.warn('JOIN_SESSION_EDGE_FUNCTION: Forbidden: Private session access denied. Session Host ID:', session.user_id, 'Auth User ID:', authenticatedUserId);
      return new Response(JSON.stringify({ error: 'Forbidden: This is a private session.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    } else if (session.visibility === 'organisation') {
      const sessionOrganisations: string[] = session.organisation || []; // Ensure it's an array
      const hasSharedOrganisation = sessionOrganisations.some(sessionOrg => joiningUserOrganisations.includes(sessionOrg));

      if (!hasSharedOrganisation) {
        console.warn('JOIN_SESSION_EDGE_FUNCTION: Forbidden: Organization session access denied. Session Orgs:', sessionOrganisations, 'Joining User Orgs:', joiningUserOrganisations);
        return new Response(JSON.stringify({ error: 'Forbidden: This is an organisation-only session.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        });
      }
    }

    if (currentParticipants.some(p => p.userId === participantData.userId)) {
      console.log('JOIN_SESSION_EDGE_FUNCTION: Already a participant:', participantData.userId);
      return new Response(JSON.stringify({ message: 'Already a participant' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const newParticipant = {
      ...participantData,
      role: 'coworker',
      joinTime: Date.now(),
    };
    const updatedParticipants = [...currentParticipants, newParticipant];

    const { data: updatedSession, error: updateError } = await supabaseServiceRoleClient
      .from('active_sessions')
      .update({ participants_data: updatedParticipants })
      .eq('id', session.id)
      .select()
      .single();

    if (updateError) {
      console.error('JOIN_SESSION_EDGE_FUNCTION: Error updating participants:', updateError);
      return new Response(JSON.stringify({ error: updateError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log('JOIN_SESSION_EDGE_FUNCTION: Successfully joined session:', session.id, 'New participant:', newParticipant.userName);
    return new Response(JSON.stringify({ message: 'Successfully joined session', session: updatedSession }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('JOIN_SESSION_EDGE_FUNCTION: Unexpected error in join-session Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});