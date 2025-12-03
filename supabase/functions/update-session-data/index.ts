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
    if (!authHeader) {
      console.warn('UPDATE_SESSION_DATA_EDGE_FUNCTION: Unauthorized: Missing Authorization header');
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const jwtSecret = Deno.env.get('SUPABASE_JWT_SECRET');
    if (!jwtSecret) {
      console.error('UPDATE_SESSION_DATA_EDGE_FUNCTION: SUPABASE_JWT_SECRET is not set.');
      throw new Error('SUPABASE_JWT_SECRET is not set in environment variables.');
    }

    let authenticatedUserId: string | null = null;
    try {
      const { sub } = await verify(token, jwtSecret, 'HS256');
      authenticatedUserId = sub || null;
      console.log('UPDATE_SESSION_DATA_EDGE_FUNCTION: JWT verified. Authenticated User ID:', authenticatedUserId);
    } catch (jwtError: any) {
      console.warn('UPDATE_SESSION_DATA_EDGE_FUNCTION: JWT verification failed:', jwtError.message);
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

    const { sessionId, actionType, payload } = await req.json();
    console.log('UPDATE_SESSION_DATA_EDGE_FUNCTION: Received:', { sessionId, actionType, payload });

    if (!sessionId || !actionType || !payload) {
      console.warn('UPDATE_SESSION_DATA_EDGE_FUNCTION: Bad Request: Missing sessionId, actionType, or payload');
      return new Response(JSON.stringify({ error: 'Missing sessionId, actionType, or payload' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Fetch the session
    const { data: session, error: fetchError } = await supabaseClient
      .from('active_sessions')
      .select('*, is_mock')
      .eq('id', sessionId)
      .single();

    if (fetchError) {
      console.error('UPDATE_SESSION_DATA_EDGE_FUNCTION: Error fetching session:', fetchError.message);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!session) {
      console.warn('UPDATE_SESSION_DATA_EDGE_FUNCTION: Not Found: Session not found for ID:', sessionId);
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    let updatedParticipants = (session.participants_data || []) as any[];
    let updatedAsks = (session.active_asks || []) as any[];
    let newHostId = session.user_id;
    let newHostName = session.host_name;
    const originalJoinCode = session.join_code;
    const originalOrganisation = session.organisation;
    const originalIsMock = session.is_mock;

    const isHost = session.user_id === authenticatedUserId;
    const isParticipant = updatedParticipants.some(p => p.userId === authenticatedUserId);
    console.log('UPDATE_SESSION_DATA_EDGE_FUNCTION: Session Host ID:', session.user_id, 'Auth User ID:', authenticatedUserId, 'Is Host:', isHost, 'Is Participant:', isParticipant);

    if (!isHost && !isParticipant && actionType !== 'update_full_session_state') {
      console.warn(`UPDATE_SESSION_DATA_EDGE_FUNCTION: Forbidden attempt by user ${authenticatedUserId} on session ${sessionId}. Not participant or host for action ${actionType}.`);
      return new Response(JSON.stringify({ error: 'Forbidden: Not a participant or host of this session' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    switch (actionType) {
      case 'vote_extend': {
        if (!isParticipant) {
          console.warn(`VOTE_EXTEND: Forbidden attempt by user ${authenticatedUserId} on session ${sessionId}. Not participant.`);
          return new Response(JSON.stringify({ error: 'Forbidden: Only participants can vote' }), { status: 403, headers: corsHeaders });
        }
        const { askId, voteType } = payload;
        const askIndex = updatedAsks.findIndex((ask: any) => ask.id === askId);

        if (askIndex === -1 || !('minutes' in updatedAsks[askIndex])) {
          console.warn(`VOTE_EXTEND: Ask not found or not an extend suggestion for askId ${askId} in session ${sessionId}.`);
          return new Response(JSON.stringify({ error: 'Ask not found or not an extend suggestion' }), { status: 404, headers: corsHeaders });
        }

        let currentAsk = updatedAsks[askIndex];
        let updatedVotes = currentAsk.votes.filter((v: any) => v.userId !== authenticatedUserId);

        if (voteType !== null) {
          updatedVotes.push({ userId: authenticatedUserId, vote: voteType });
        }
        currentAsk.votes = updatedVotes;

        const totalParticipants = updatedParticipants.length;
        const yesVotes = updatedVotes.filter((v: any) => v.vote === 'yes').length;
        const noVotes = updatedVotes.filter((v: any) => v.vote === 'no').length;
        const threshold = Math.ceil(totalParticipants / 2);

        let newStatus = 'pending';
        if (yesVotes >= threshold) {
          newStatus = 'accepted';
        } else if (noVotes >= threshold) {
          newStatus = 'rejected';
        }
        currentAsk.status = newStatus;

        updatedAsks[askIndex] = currentAsk;
        console.log(`VOTE_EXTEND: User ${authenticatedUserId} voted on ask ${askId}. New status: ${newStatus}.`);
        break;
      }
      case 'vote_poll': {
        if (!isParticipant) {
          console.warn(`VOTE_POLL: Forbidden attempt by user ${authenticatedUserId} on session ${sessionId}. Not participant.`);
          return new Response(JSON.stringify({ error: 'Forbidden: Only participants can vote' }), { status: 403, headers: corsHeaders });
        }
        const { pollId, optionIds, customOptionText, isCustomOptionSelected } = payload;
        const pollIndex = updatedAsks.findIndex((ask: any) => ask.id === pollId);

        if (pollIndex === -1 || !('question' in updatedAsks[pollIndex])) {
          console.warn(`VOTE_POLL: Poll not found for pollId ${pollId} in session ${sessionId}.`);
          return new Response(JSON.stringify({ error: 'Poll not found' }), { status: 404, headers: corsHeaders });
        }

        let currentPoll = updatedAsks[pollIndex];
        let finalOptionIdsToVote: string[] = [...optionIds];
        const trimmedCustomText = customOptionText?.trim();
        let userCustomOptionId: string | null = null;

        const existingUserCustomOption = currentPoll.options.find(
          (opt: any) => opt.id.startsWith('custom-') && opt.votes.some((vote: any) => vote.userId === authenticatedUserId)
        );

        if (trimmedCustomText && isCustomOptionSelected) {
          if (existingUserCustomOption) {
            if (existingUserCustomOption.text !== trimmedCustomText) {
              currentPoll.options = currentPoll.options.map((opt: any) =>
                opt.id === existingUserCustomOption.id ? { ...opt, text: trimmedCustomText } : opt
              );
            }
            userCustomOptionId = existingUserCustomOption.id;
          } else {
            const newCustomOption = {
              id: `custom-${Date.now()}-${Math.random().toString(36).substring(7)}`,
              text: trimmedCustomText,
              votes: [],
            };
            currentPoll.options.push(newCustomOption);
            userCustomOptionId = newCustomOption.id;
          }
          if (userCustomOptionId && !finalOptionIdsToVote.includes(userCustomOptionId)) {
            finalOptionIdsToVote.push(userCustomOptionId);
          }
        } else {
          if (existingUserCustomOption) {
            finalOptionIdsToVote = finalOptionIdsToVote.filter(id => id !== existingUserCustomOption.id);
          }
        }

        currentPoll.options = currentPoll.options.map((option: any) => {
          let newVotes = option.votes.filter((v: any) => v.userId !== authenticatedUserId);
          if (finalOptionIdsToVote.includes(option.id)) {
            newVotes.push({ userId: authenticatedUserId });
          }
          return { ...option, votes: newVotes };
        });

        currentPoll.options = currentPoll.options.filter((option: any) =>
          !option.id.startsWith('custom-') || option.votes.length > 0 || (option.id === userCustomOptionId && isCustomOptionSelected)
        );

        updatedAsks[pollIndex] = currentPoll;
        console.log(`VOTE_POLL: User ${authenticatedUserId} voted on poll ${pollId}.`);
        break;
      }
      case 'add_ask': {
        if (!isParticipant) {
          console.warn(`ADD_ASK: Forbidden attempt by user ${authenticatedUserId} on session ${sessionId}. Not participant.`);
          return new Response(JSON.stringify({ error: 'Forbidden: Only participants can add asks' }), { status: 403, headers: corsHeaders });
        }
        const newAsk = payload.ask;
        if (!newAsk || !newAsk.id || !newAsk.creatorId) {
          console.warn(`ADD_ASK: Invalid ask payload for session ${sessionId}.`);
          return new Response(JSON.stringify({ error: 'Invalid ask payload' }), { status: 400, headers: corsHeaders });
        }
        if (newAsk.creatorId !== authenticatedUserId) {
          console.warn(`ADD_ASK: Forbidden: Creator ID mismatch for user ${authenticatedUserId} and ask creator ${newAsk.creatorId}.`);
          return new Response(JSON.stringify({ error: 'Forbidden: Creator ID mismatch' }), { status: 403, headers: corsHeaders });
        }
        updatedAsks.push(newAsk);
        console.log(`ADD_ASK: User ${authenticatedUserId} added ask ${newAsk.id} to session ${sessionId}.`);
        break;
      }
      case 'update_ask': {
        if (!isParticipant) {
          console.warn(`UPDATE_ASK: Forbidden attempt by user ${authenticatedUserId} on session ${sessionId}. Not participant.`);
          return new Response(JSON.stringify({ error: 'Forbidden: Only participants can update asks' }), { status: 403, headers: corsHeaders });
        }
        const updatedAsk = payload.ask;
        if (!updatedAsk || !updatedAsk.id || !updatedAsk.creatorId) {
          console.warn(`UPDATE_ASK: Invalid updated ask payload for session ${sessionId}.`);
          return new Response(JSON.stringify({ error: 'Invalid updated ask payload' }), { status: 400, headers: corsHeaders });
        }
        const askIndex = updatedAsks.findIndex((ask: any) => ask.id === updatedAsk.id);
        if (askIndex === -1) {
          console.warn(`UPDATE_ASK: Ask not found for askId ${updatedAsk.id} in session ${sessionId}.`);
          return new Response(JSON.stringify({ error: 'Ask not found' }), { status: 404, headers: corsHeaders });
        }
        const existingAsk = updatedAsks[askIndex];
        if (existingAsk.creatorId !== authenticatedUserId && !isHost) {
             console.warn(`UPDATE_ASK: Forbidden: User ${authenticatedUserId} is not the creator of ask ${updatedAsk.id} or host of session ${sessionId}.`);
             return new Response(JSON.stringify({ error: 'Forbidden: Not the creator of the ask or host' }), { status: 403, headers: corsHeaders });
        }
        updatedAsks[askIndex] = updatedAsk;
        console.log(`UPDATE_ASK: User ${authenticatedUserId} updated ask ${updatedAsk.id} in session ${sessionId}.`);
        break;
      }
      case 'update_participant_profile': {
        const { participantId, updates } = payload;
        if (participantId !== authenticatedUserId) {
          console.warn(`UPDATE_PARTICIPANT_PROFILE: Forbidden attempt by user ${authenticatedUserId} to update profile of ${participantId} in session ${sessionId}.`);
          return new Response(JSON.stringify({ error: 'Forbidden: Cannot update another user\'s profile data' }), { status: 403, headers: corsHeaders });
        }
        const participantIndex = updatedParticipants.findIndex((p: any) => p.userId === participantId);
        if (participantIndex === -1) {
          console.warn(`UPDATE_PARTICIPANT_PROFILE: Participant ${participantId} not found in session ${sessionId}.`);
          return new Response(JSON.stringify({ error: 'Participant not found in session' }), { status: 404, headers: corsHeaders });
        }
        updatedParticipants[participantIndex] = { ...updatedParticipants[participantIndex], ...updates };
        console.log(`UPDATE_PARTICIPANT_PROFILE: User ${authenticatedUserId} updated their profile data in session ${sessionId}.`);
        break;
      }
      case 'transfer_host': {
        if (!isHost) {
          console.warn(`TRANSFER_HOST: Forbidden attempt by user ${authenticatedUserId} on session ${sessionId}. Not host.`);
          return new Response(JSON.stringify({ error: 'Forbidden: Only the host can transfer host role' }), { status: 403, headers: corsHeaders });
        }
        const { newHostId, newHostName } = payload;
        const newHostParticipant = updatedParticipants.find((p: any) => p.userId === newHostId);
        if (!newHostParticipant) {
          console.warn(`TRANSFER_HOST: New host ${newHostId} not found among participants in session ${sessionId}.`);
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
          console.warn(`LEAVE_SESSION: Forbidden attempt by user ${authenticatedUserId} on session ${sessionId}. Not participant.`);
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
            const { error: deleteError } = await supabaseClient
              .from('active_sessions')
              .delete()
              .eq('id', sessionId);
            if (deleteError) {
              console.error(`LEAVE_SESSION: Error deleting session ${sessionId} after host ${authenticatedUserId} left and no other participants:`, deleteError.message);
              throw deleteError;
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
        // The `last_heartbeat` will be updated by the general update statement below.
        // No specific data manipulation for participants_data or active_asks for a simple heartbeat.
        console.log(`HEARTBEAT: Heartbeat received from user ${authenticatedUserId} for session ${sessionId}.`);
        break;
      }
      case 'update_full_session_state': {
        if (!isHost) {
          console.warn(`UPDATE_FULL_SESSION_STATE: Forbidden attempt by user ${authenticatedUserId} on session ${sessionId}. Not host.`);
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
          console.error('UPDATE_FULL_SESSION_STATE: Error updating full session state:', updateError.message);
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
        console.warn(`UPDATE_SESSION_DATA_EDGE_FUNCTION: Invalid actionType received: ${actionType} for session ${sessionId}.`);
        return new Response(JSON.stringify({ error: 'Invalid actionType' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
    }

    const { data: updatedSession, error: updateError } = await supabaseClient
      .from('active_sessions')
      .update({
        participants_data: updatedParticipants,
        active_asks: updatedAsks,
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
      console.error('UPDATE_SESSION_DATA_EDGE_FUNCTION: Error updating session data:', updateError.message);
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
    console.error('UPDATE_SESSION_DATA_EDGE_FUNCTION: Unexpected error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});