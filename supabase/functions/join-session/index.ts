import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { verify } from 'https://deno.land/x/djwt@v2.8/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.warn('JOIN_SESSION_EDGE_FUNCTION: Unauthorized: Missing Authorization header');
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('JOIN_SESSION_EDGE_FUNCTION: Received token (first 10 chars):', token.substring(0, 10));
    const jwtSecret = Deno.env.get('SUPABASE_JWT_SECRET');
    if (!jwtSecret) {
      console.error('JOIN_SESSION_EDGE_FUNCTION: SUPABASE_JWT_SECRET is not set in environment variables.');
      throw new Error('SUPABASE_JWT_SECRET is not set in environment variables.');
    }

    let authenticatedUserId: string | null = null;
    try {
      const { sub } = await verify(token, jwtSecret, 'HS256');
      authenticatedUserId = sub || null;
      console.log('JOIN_SESSION_EDGE_FUNCTION: Authenticated User ID:', authenticatedUserId);
    } catch (jwtError: any) {
      console.warn('JOIN_SESSION_EDGE_FUNCTION: JWT verification failed:', jwtError.message);
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid JWT' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
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

    const { sessionCode, participantData } = await req.json();

    if (!sessionCode || !participantData || !participantData.userId || !participantData.userName) {
      console.warn('JOIN_SESSION_EDGE_FUNCTION: Bad Request: Missing sessionCode or participantData');
      return new Response(JSON.stringify({ error: 'Missing sessionCode or participantData' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    if (authenticatedUserId !== participantData.userId) {
      console.warn('JOIN_SESSION_EDGE_FUNCTION: Forbidden: Participant ID mismatch with authenticated user. Auth ID:', authenticatedUserId, 'Participant Data ID:', participantData.userId);
      return new Response(JSON.stringify({ error: 'Forbidden: Participant ID mismatch with authenticated user' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    const { data: userProfile, error: userProfileError } = await supabaseServiceRoleClient
      .from('profiles')
      .select('organization')
      .eq('id', authenticatedUserId)
      .single();

    if (userProfileError && userProfileError.code !== 'PGRST116') {
      console.error('JOIN_SESSION_EDGE_FUNCTION: Error fetching joining user profile:', userProfileError.message);
      return new Response(JSON.stringify({ error: 'Failed to verify user organization.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const joiningUserOrganization = userProfile?.organization;
    console.log('JOIN_SESSION_EDGE_FUNCTION: Joining User Organization:', joiningUserOrganization);

    const { data: sessions, error: fetchError } = await supabaseServiceRoleClient
      .from('active_sessions')
      .select('id, participants_data, is_active, visibility, user_id, join_code, organization')
      .eq('join_code', sessionCode)
      .eq('is_active', true)
      .limit(1);

    if (fetchError) {
      console.error('JOIN_SESSION_EDGE_FUNCTION: Error fetching session:', fetchError.message);
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
    console.log('JOIN_SESSION_EDGE_FUNCTION: Session Organization:', session.organization);

    const currentParticipants = (session.participants_data || []) as any[];

    if (session.visibility === 'private' && session.user_id !== authenticatedUserId) {
      console.warn('JOIN_SESSION_EDGE_FUNCTION: Forbidden: Private session access denied. Session Host ID:', session.user_id, 'Auth User ID:', authenticatedUserId);
      return new Response(JSON.stringify({ error: 'Forbidden: This is a private session.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    } else if (session.visibility === 'organisation') {
      if (!session.organization || session.organization !== joiningUserOrganization) {
        console.warn('JOIN_SESSION_EDGE_FUNCTION: Forbidden: Organization session access denied. Session Org:', session.organization, 'Joining User Org:', joiningUserOrganization);
        return new Response(JSON.stringify({ error: 'Forbidden: This is an organization-only session.' }), {
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
      console.error('JOIN_SESSION_EDGE_FUNCTION: Error updating participants:', updateError.message);
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
    console.error('JOIN_SESSION_EDGE_FUNCTION: Unexpected error in join-session Edge Function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});