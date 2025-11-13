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
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const jwtSecret = Deno.env.get('SUPABASE_JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('SUPABASE_JWT_SECRET is not set in environment variables.');
    }

    let authenticatedUserId: string | null = null; // Renamed to avoid confusion with payload.userId
    try {
      const { sub } = await verify(token, jwtSecret, 'HS256');
      authenticatedUserId = sub || null;
    } catch (jwtError) {
      console.warn('JWT verification failed:', jwtError.message);
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid JWT' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role key for RLS bypass
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const { sessionCode, participantData } = await req.json();

    if (!sessionCode || !participantData || !participantData.userId || !participantData.userName) {
      return new Response(JSON.stringify({ error: 'Missing sessionCode or participantData' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // SECURITY FIX: Ensure the userId in participantData matches the authenticated user
    if (authenticatedUserId !== participantData.userId) {
      return new Response(JSON.stringify({ error: 'Forbidden: Participant ID mismatch with authenticated user' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    // Fetch the session using the host_code
    const { data: sessions, error: fetchError } = await supabaseClient
      .from('active_sessions')
      .select('id, participants_data, is_active, visibility')
      .eq('host_code', sessionCode)
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
      return new Response(JSON.stringify({ error: 'Session not found or not active' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    const session = sessions[0];
    const currentParticipants = (session.participants_data || []) as any[];

    // Check if the user is already a participant
    if (currentParticipants.some(p => p.userId === participantData.userId)) {
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

    const { data: updatedSession, error: updateError } = await supabaseClient
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

    return new Response(JSON.stringify({ message: 'Successfully joined session', session: updatedSession }), {
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