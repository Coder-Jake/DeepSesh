import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { verify } from 'https://deno.land/x/djwt@v2.8/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('UPDATE_SESSION_DATA_EDGE_FUNCTION: Function invoked.');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    console.log('UPDATE_SESSION_DATA_EDGE_FUNCTION: Received Authorization header:', authHeader ? authHeader.substring(0, 30) + '...' : 'None'); // Log partial header
    if (!authHeader) {
      console.error('UPDATE_SESSION_DATA_EDGE_FUNCTION: Error: Missing Authorization header. Status: 401');
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('UPDATE_SESSION_DATA_EDGE_FUNCTION: Extracted token (first 30 chars):', token.substring(0, 30) + '...'); // Log partial token
    const jwtSecret = Deno.env.get('JWT_SECRET');
    console.log('UPDATE_SESSION_DATA_EDGE_FUNCTION: JWT_SECRET is set:', !!jwtSecret); // Log if secret is present
    if (!jwtSecret) {
      console.error('UPDATE_SESSION_DATA_EDGE_FUNCTION: Error: JWT_SECRET is not set.');
      throw new Error('JWT_SECRET is not set in environment variables.');
    }

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(jwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      true,
      ["verify"]
    );

    let authenticatedUserId: string | null = null;
    try {
      const { sub } = await verify(token, key);
      authenticatedUserId = sub || null;
      console.log('UPDATE_SESSION_DATA_EDGE_FUNCTION: JWT verified. Authenticated User ID:', authenticatedUserId);
    } catch (jwtError: any) {
      console.error('UPDATE_SESSION_DATA_EDGE_FUNCTION: Error: JWT verification failed. Message:', jwtError.message, 'Status: 401');
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid JWT' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
        auth: {
          persistSession: false,
        },
      }
    );

    const supabaseServiceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const { sessionId, actionType, payload } = await req.json();
    console.log('UPDATE_SESSION_DATA_EDGE_FUNCTION: Received:', { sessionId, actionType, payload });

    if (!sessionId || !actionType || !payload) {
      console.error('UPDATE_SESSION_DATA_EDGE_FUNCTION: Error: Missing sessionId, actionType, or payload. Status: 400. Payload:', payload);
      return new Response(JSON.stringify({ error: 'Missing sessionId, actionType, or payload' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { data: session, error: fetchError } = await supabaseClient
      .from('active_sessions')
      .select('*, is_mock')
      .eq('id', sessionId)
      .single();

    if (fetchError) {
      console.error('UPDATE_SESSION_DATA_EDGE_FUNCTION: Error fetching session. Message:', fetchError.message, 'Status: 500. Session ID:', sessionId);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!session) {
      console.warn('UPDATE_SESSION_DATA_EDGE_FUNCTION: Warning: Session not found. Status: 404. Session ID:', sessionId);
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    let updatedParticipants = (session.participants_data || []) as any[];
    let newHostId = session.user_id;
    let newHostName = session.host_name;
    const originalJoinCode = session.join_code;
    const originalOrganisation = session.organisation;
    const originalIsMock = session.is_mock;

    const isHost = session.user_id === authenticatedUserId;
    const isParticipant = updatedParticipants.some(p => p.userId === authenticatedUserId);

    console.log(`UPDATE_SESSION_DATA_EDGE_FUNCTION: Debugging Auth Check for Session ID: ${sessionId}`);
    console.log(`  Authenticated User ID: ${authenticatedUserId}`);
    console.log(`  Session Host ID (from DB): ${session.user_id}`);
    console.log(`  Is Host: ${isHost}`);
    console.log(`  Is Participant: ${isParticipant}`);
    console.log(`  Action Type: ${actionType}`);

    if (!isHost && !isParticipant && actionType !== 'update_full_session_state') {
      console.warn(`UPDATE_SESSION_DATA_EDGE_FUNCTION: Warning: Forbidden attempt by user ${authenticatedUserId} on session ${sessionId}. Not participant or host for action ${actionType}. Status: 403.`);
      return new Response(JSON.stringify({ error: 'Forbidden: Not a participant or host of this session' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    switch (actionType) {
      case 'update_participant_profile': {
        const { participantId, updates } = payload;
        if (participantId !== authenticatedUserId) {
          console.warn(`UPDATE_PARTICIPANT_PROFILE: Warning: Forbidden attempt by user ${authenticatedUserId} to update profile of ${participantId} in session ${sessionId}. Status: 403.`);
          return new Response(JSON.stringify({ error: 'Forbidden: Cannot update another user\'s profile data' }), { status: 403, headers: corsHeaders });
        }
        const participantIndex = updatedParticipants.findIndex((p: any) => p.userId === participantId);
        if (participantIndex === -1) {
          console.warn(`UPDATE_PARTICIPANT_PROFILE: Warning: Participant ${participantId} not found in session ${sessionId}. Status: 404.`);
          return new Response(JSON.stringify({ error: 'Participant not found in session' }), { status: 404, headers: corsHeaders });
        }
        updatedParticipants[participantIndex] = { ...updatedParticipants[participantIndex], ...updates };
        console.log(`UPDATE_PARTICIPANT_PROFILE: User ${authenticatedUserId} updated their profile data in session ${sessionId}.`);
        break;
      }
      case 'transfer_host': {
        if (!isHost) {
          console.warn(`TRANSFER_HOST: Warning: Forbidden attempt by user ${authenticatedUserId} on session ${sessionId}. Not host. Status: 403.`);
          return new Response(JSON.stringify({ error: 'Forbidden: Only the host can transfer host role' }), { status: 403, headers: corsHeaders });
        }
        const { newHostId, newHostName } = payload;
        const newHostParticipant = updatedParticipants.find((p: any) => p.userId === newHostId);
        if (!newHostParticipant) {
          console.warn(`TRANSFER_HOST: Warning: New host ${newHostId} not found among participants in session ${sessionId}. Status: 404.`);
          return new Response(JSON.stringify({ error: 'New host not found among participants' }), { status: 404, headers: corsHeaders });
        }

        updatedParticipants = updatedParticipants.map((p: any) => {
          if (p.userId === authenticatedUserId) {
            return { ...p, role: 'coworker' };
          }
          if (p.userId === newHostId) {
            return { ...p, role: 'host' };
          }
          return p;
        });
        newHostId = newHostId;
        newHostName = newHostName;
        console.log(`TRANSFER_HOST: Host role transferred from ${authenticatedUserId} to ${newHostId} in session ${sessionId}.`);
        break;
      }
      case 'leave_session': {
        if (!isParticipant) {
          console.warn(`LEAVE_SESSION: Warning: Forbidden attempt by user ${authenticatedUserId} on session ${sessionId}. Not participant. Status: 403.`);
          return new Response(JSON.stringify({ error: 'Forbidden: Not a participant of this session' }), { status: 403, headers: corsHeaders });
        }
        if (isHost) {
          const otherCoworkers = updatedParticipants.filter((p: any) => p.role === 'coworker' && p.userId !== authenticatedUserId);
          if (otherCoworkers.length > 0) {
            const newHost = otherCoworkers[0];
            updatedParticipants = updatedParticipants.map((p: any) => {
              if (p.userId === authenticatedUserId) {
                return null;
              }
              if (p.userId === newHost.userId) {
                return { ...p, role: 'host' };
              }
              return p;
            }).filter(Boolean);
            newHostId = newHost.userId;
            newHostName = newHost.userName;
            console.log(`LEAVE_SESSION: Host ${authenticatedUserId} left session ${sessionId}. Host role transferred to ${newHostId}.`);
          } else {
            console.log(`LEAVE_SESSION: Host ${authenticatedUserId} left session ${sessionId} and no other participants. Deleting session.`);
            const { error: deleteError } = await supabaseServiceRoleClient // Use service role client for deletion
              .from('active_sessions')
              .delete()
              .eq('id', sessionId);
            if (deleteError) {
              console.error(`LEAVE_SESSION: Error deleting session ${sessionId} after host ${authenticatedUserId} left and no other participants. Message:`, deleteError.message, 'Status: 500.');
              throw deleteError; // Re-throw to be caught by outer catch
            }
            console.log(`LEAVE_SESSION: Session ${sessionId} ended as host ${authenticatedUserId} left and no other participants.`);
            return new Response(JSON.stringify({ message: 'Session ended as host left and no other participants' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            });
          }
        } else {
          updatedParticipants = updatedParticipants.filter((p: any) => p.userId !== authenticatedUserId);
          console.log(`LEAVE_SESSION: Participant ${authenticatedUserId} left session ${sessionId}.`);
        }
        break;
      }
      case 'heartbeat': {
        console.log(`HEARTBEAT: Heartbeat received from user ${authenticatedUserId} for session ${sessionId}.`);
        break;
      }
      case 'update_full_session_state': {
        if (!isHost) {
          console.warn(`UPDATE_FULL_SESSION_STATE: Warning: Forbidden attempt by user ${authenticatedUserId} on session ${sessionId}. Not host. Status: 403.`);
          return new Response(JSON.stringify({ error: 'Forbidden: Only the host can perform a full session state update' }), { status: 403, headers: corsHeaders });
        }
        const fullSessionState = payload;
        const { id, created_at, ...updatableFields } = fullSessionState; 

        console.log(`UPDATE_FULL_SESSION_STATE: Host ${authenticatedUserId} updating session ${sessionId} with payload:`, updatableFields);

        const { data: updatedSession, error: updateError } = await supabaseClient
          .from('active_sessions')
          .update({
            ...updatableFields,
            last_heartbeat: new Date().toISOString(),
          })
          .eq('id', sessionId)
          .select()
          .single();

        if (updateError) {
          console.error('UPDATE_FULL_SESSION_STATE: Error updating full session state. Message:', updateError.message, 'Status: 500. Session ID:', sessionId);
          return new Response(JSON.stringify({ error: updateError.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          });
        }
        console.log('UPDATE_FULL_SESSION_STATE: Full session state updated successfully for session:', sessionId);
        return new Response(JSON.stringify({ message: 'Full session state updated successfully', session: updatedSession }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      default:
        console.warn(`UPDATE_SESSION_DATA_EDGE_FUNCTION: Warning: Invalid actionType received: ${actionType} for session ${sessionId}. Status: 400.`);
        return new Response(JSON.stringify({ error: 'Invalid actionType' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
    }

    const { data: updatedSession, error: updateError } = await supabaseClient
      .from('active_sessions')
      .update({
        participants_data: updatedParticipants,
        user_id: newHostId,
        host_name: newHostName,
        join_code: originalJoinCode,
        organisation: originalOrganisation,
        last_heartbeat: new Date().toISOString(),
        is_mock: originalIsMock,
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (updateError) {
      console.error('UPDATE_SESSION_DATA_EDGE_FUNCTION: Error updating session data. Message:', updateError.message, 'Status: 500. Session ID:', sessionId);
      return new Response(JSON.stringify({ error: updateError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log('UPDATE_SESSION_DATA_EDGE_FUNCTION: Session data updated successfully for session:', sessionId);
    return new Response(JSON.stringify({ message: 'Session data updated successfully', session: updatedSession }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('UPDATE_SESSION_DATA_EDGE_FUNCTION: Unexpected error. Message:', error.message, 'Status: 500.');
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});