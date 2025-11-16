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
      console.warn('Unauthorized: Missing Authorization header');
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Received token (first 10 chars):', token.substring(0, 10)); // Log token for debugging
    const jwtSecret = Deno.env.get('SUPABASE_JWT_SECRET');
    if (!jwtSecret) {
      console.error('SUPABASE_JWT_SECRET is not set in environment variables.');
      throw new Error('SUPABASE_JWT_SECRET is not set in environment variables.');
    }

    let authenticatedUserId: string | null = null;
    try {
      const { sub } = await verify(token, jwtSecret, 'HS256');
      authenticatedUserId = sub || null;
      console.log('Authenticated User ID:', authenticatedUserId); // Log authenticated user ID
    } catch (jwtError: any) {
      console.warn('JWT verification failed:', jwtError.message);
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid JWT' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Initialize Supabase client with the service role key for operations that bypass RLS
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
      console.warn('Bad Request: Missing sessionCode or participantData');
      return new Response(JSON.stringify({ error: 'Missing sessionCode or participantData' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // SECURITY FIX: Ensure the userId in participantData matches the authenticated user
    if (authenticatedUserId !== participantData.userId) {
      console.warn('Forbidden: Participant ID mismatch with authenticated user. Auth ID:', authenticatedUserId, 'Participant Data ID:', participantData.userId);
      return new Response(JSON.stringify({ error: 'Forbidden: Participant ID mismatch with authenticated user' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    // Fetch the joining user's profile to check their organization
    const { data: userProfile, error: userProfileError } = await supabaseServiceRoleClient
      .from('profiles')
      .select('organization')
      .eq('id', authenticatedUserId)
      .single();

    if (userProfileError && userProfileError.code !== 'PGRST116') { // PGRST116 means "no rows found"
      console.error('Error fetching joining user profile:', userProfileError.message);
      return new Response(JSON.stringify({ error: 'Failed to verify user organization.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const joiningUserOrganization = userProfile?.organization;
    console.log('Joining User Organization:', joiningUserOrganization); // Log joining user's organization

    // Fetch the session using the join_code (now using the service role client to bypass RLS for read)
    const { data: sessions, error: fetchError } = await supabaseServiceRoleClient
      .from('active_sessions')
      .select('id, participants_data, is_active, visibility, user_id, join_code, organization') // ADDED: organization
      .eq('join_code', sessionCode)
      .eq('is_active', true)
      .limit(1);

    if (fetchError) {
      console.error('Error fetching session:', fetchError.message);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!sessions || sessions.length === 0) {
      console.warn('Not Found: Session not found or not active for code:', sessionCode);
      return new Response(JSON.stringify({ error: 'Session not found or not active' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    const session = sessions[0];
    console.log('Session ID:', session.id);
    console.log('Session Visibility:', session.visibility);
    console.log('Session Organization:', session.organization); // Log session's organization

    const currentParticipants = (session.participants_data || []) as any[];

    // Enforce session visibility rules within the Edge Function
    if (session.visibility === 'private' && session.user_id !== authenticatedUserId) {
      console.warn('Forbidden: Private session access denied. Session Host ID:', session.user_id, 'Auth User ID:', authenticatedUserId); // Log specific denial
      return new Response(JSON.stringify({ error: 'Forbidden: This is a private session.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    } else if (session.visibility === 'organisation') {
      if (!session.organization || session.organization !== joiningUserOrganization) {
        console.warn('Forbidden: Organization session access denied. Session Org:', session.organization, 'Joining User Org:', joiningUserOrganization); // Log specific denial
        return new Response(JSON.stringify({ error: 'Forbidden: This is an organization-only session.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        });
      }
    }
    // For 'friends' visibility, we would need a 'friends' table or similar relationship.
    // For now, assuming 'public' and 'friends' are handled by RLS on the client side
    // or that the host explicitly invites.

    // Check if the user is already a participant
    if (currentParticipants.some(p => p.userId === participantData.userId)) {
      console.log('Already a participant:', participantData.userId);
      return new Response(JSON.stringify({ message: 'Already a participant' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Add the new participant
    const newParticipant = {
      ...participantData,
      role: 'coworker',
      joinTime: Date.now(),
    };
    const updatedParticipants = [...currentParticipants, newParticipant];

    // Perform the update using the service role client (bypasses RLS)
    const { data: updatedSession, error: updateError } = await supabaseServiceRoleClient
      .from('active_sessions')
      .update({ participants_data: updatedParticipants })
      .eq('id', session.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating participants:', updateError.message);
      return new Response(JSON.stringify({ error: updateError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log('Successfully joined session:', session.id, 'New participant:', newParticipant.userName);
    return new Response(JSON.stringify({ message: 'Successfully joined session', session: updatedSession }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Unexpected error in join-session Edge Function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});