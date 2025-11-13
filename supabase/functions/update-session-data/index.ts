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

    let userId: string | null = null;
    try {
      const { sub } = await verify(token, jwtSecret, 'HS256');
      userId = sub || null;
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

    const { sessionId, actionType, payload } = await req.json();

    if (!sessionId || !actionType || !payload) {
      return new Response(JSON.stringify({ error: 'Missing sessionId, actionType, or payload' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Fetch the session
    const { data: session, error: fetchError } = await supabaseClient
      .from('active_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (fetchError) {
      console.error('Error fetching session:', fetchError.message);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!session) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    let updatedParticipants = (session.participants_data || []) as any[];
    let updatedAsks = (session.active_asks || []) as any[];
    let newHostId = session.user_id;
    let newHostName = session.host_name;
    let newHostCode = session.host_code; // Keep track of host_code

    const isHost = session.user_id === userId;
    const isParticipant = updatedParticipants.some(p => p.userId === userId);

    if (!isHost && !isParticipant) {
      return new Response(JSON.stringify({ error: 'Forbidden: Not a participant or host of this session' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    switch (actionType) {
      case 'vote_extend': {
        if (!isParticipant) {
          return new Response(JSON.stringify({ error: 'Forbidden: Only participants can vote' }), { status: 403, headers: corsHeaders });
        }
        const { askId, voteType } = payload; // voteType can be 'yes', 'no', 'neutral', or null (for unvote)
        const askIndex = updatedAsks.findIndex((ask: any) => ask.id === askId);

        if (askIndex === -1 || !('minutes' in updatedAsks[askIndex])) {
          return new Response(JSON.stringify({ error: 'Ask not found or not an extend suggestion' }), { status: 404, headers: corsHeaders });
        }

        let currentAsk = updatedAsks[askIndex];
        let updatedVotes = currentAsk.votes.filter((v: any) => v.userId !== userId);

        if (voteType !== null) {
          updatedVotes.push({ userId: userId, vote: voteType });
        }
        currentAsk.votes = updatedVotes;

        // Recalculate status based on votes and total participants
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
        break;
      }
      case 'vote_poll': {
        if (!isParticipant) {
          return new Response(JSON.stringify({ error: 'Forbidden: Only participants can vote' }), { status: 403, headers: corsHeaders });
        }
        const { pollId, optionIds, customOptionText, isCustomOptionSelected } = payload;
        const pollIndex = updatedAsks.findIndex((ask: any) => ask.id === pollId);

        if (pollIndex === -1 || !('question' in updatedAsks[pollIndex])) {
          return new Response(JSON.stringify({ error: 'Poll not found' }), { status: 404, headers: corsHeaders });
        }

        let currentPoll = updatedAsks[pollIndex];
        let finalOptionIdsToVote: string[] = [...optionIds];
        const trimmedCustomText = customOptionText?.trim();
        let userCustomOptionId: string | null = null;

        const existingUserCustomOption = currentPoll.options.find(
          (opt: any) => opt.id.startsWith('custom-') && opt.votes.some((vote: any) => vote.userId === userId)
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
          let newVotes = option.votes.filter((v: any) => v.userId !== userId);
          if (finalOptionIdsToVote.includes(option.id)) {
            newVotes.push({ userId: userId });
          }
          return { ...option, votes: newVotes };
        });

        currentPoll.options = currentPoll.options.filter((option: any) =>
          !option.id.startsWith('custom-') || option.votes.length > 0 || (option.id === userCustomOptionId && isCustomOptionSelected)
        );

        updatedAsks[pollIndex] = currentPoll;
        break;
      }
      case 'add_ask': {
        if (!isParticipant) { // Only participants can add asks
          return new Response(JSON.stringify({ error: 'Forbidden: Only participants can add asks' }), { status: 403, headers: corsHeaders });
        }
        const newAsk = payload.ask;
        if (!newAsk || !newAsk.id || !newAsk.creator) {
          return new Response(JSON.stringify({ error: 'Invalid ask payload' }), { status: 400, headers: corsHeaders });
        }
        // Ensure the creator matches the authenticated user
        if (newAsk.creatorId !== userId) {
          return new Response(JSON.stringify({ error: 'Forbidden: Creator ID mismatch' }), { status: 403, headers: corsHeaders });
        }
        updatedAsks.push(newAsk);
        break;
      }
      case 'update_ask': {
        if (!isParticipant) { // Only participants can update asks they created
          return new Response(JSON.stringify({ error: 'Forbidden: Only participants can update asks' }), { status: 403, headers: corsHeaders });
        }
        const updatedAsk = payload.ask;
        if (!updatedAsk || !updatedAsk.id) {
          return new Response(JSON.stringify({ error: 'Invalid updated ask payload' }), { status: 400, headers: corsHeaders });
        }
        const askIndex = updatedAsks.findIndex((ask: any) => ask.id === updatedAsk.id);
        if (askIndex === -1) {
          return new Response(JSON.stringify({ error: 'Ask not found' }), { status: 404, headers: corsHeaders });
        }
        // Ensure the user updating is the creator of the ask, or the host for status changes
        const existingAsk = updatedAsks[askIndex];
        if (existingAsk.creatorId !== userId && !isHost) {
             return new Response(JSON.stringify({ error: 'Forbidden: Not the creator of the ask or host' }), { status: 403, headers: corsHeaders });
        }
        updatedAsks[askIndex] = updatedAsk;
        break;
      }
      case 'update_participant_profile': {
        const { participantId, updates } = payload;
        if (participantId !== userId) {
          return new Response(JSON.stringify({ error: 'Forbidden: Cannot update another user\'s profile data' }), { status: 403, headers: corsHeaders });
        }
        const participantIndex = updatedParticipants.findIndex((p: any) => p.userId === participantId);
        if (participantIndex === -1) {
          return new Response(JSON.stringify({ error: 'Participant not found in session' }), { status: 404, headers: corsHeaders });
        }
        updatedParticipants[participantIndex] = { ...updatedParticipants[participantIndex], ...updates };
        break;
      }
      case 'transfer_host': {
        if (!isHost) {
          return new Response(JSON.stringify({ error: 'Forbidden: Only the host can transfer host role' }), { status: 403, headers: corsHeaders });
        }
        const { newHostId, newHostName } = payload;
        const newHostParticipant = updatedParticipants.find((p: any) => p.userId === newHostId);
        if (!newHostParticipant) {
          return new Response(JSON.stringify({ error: 'New host not found among participants' }), { status: 404, headers: corsHeaders });
        }

        updatedParticipants = updatedParticipants.map((p: any) => {
          if (p.userId === userId) { // Current host becomes coworker
            return { ...p, role: 'coworker' };
          }
          if (p.userId === newHostId) { // New host
            return { ...p, role: 'host' };
          }
          return p;
        });
        newHostId = newHostId;
        newHostName = newHostName;
        newHostCode = newHostId === userId ? session.host_code : null; // Only keep host_code if current user is new host
        break;
      }
      case 'leave_session': {
        if (!isParticipant) {
          return new Response(JSON.stringify({ error: 'Forbidden: Not a participant of this session' }), { status: 403, headers: corsHeaders });
        }
        if (isHost) {
          // If host leaves, transfer role or end session
          const otherCoworkers = updatedParticipants.filter((p: any) => p.role === 'coworker' && p.userId !== userId);
          if (otherCoworkers.length > 0) {
            const newHost = otherCoworkers[0];
            updatedParticipants = updatedParticipants.map((p: any) => {
              if (p.userId === userId) { // Current host becomes non-participant
                return null;
              }
              if (p.userId === newHost.userId) { // New host
                return { ...p, role: 'host' };
              }
              return p;
            }).filter(Boolean); // Remove null entry
            newHostId = newHost.userId;
            newHostName = newHost.userName;
            newHostCode = newHostId === userId ? session.host_code : null; // Only keep host_code if current user is new host
          } else {
            // No other participants, delete the session
            const { error: deleteError } = await supabaseClient
              .from('active_sessions')
              .delete()
              .eq('id', sessionId);
            if (deleteError) throw deleteError;
            return new Response(JSON.stringify({ message: 'Session ended as host left and no other participants' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            });
          }
        } else {
          // Coworker leaves
          updatedParticipants = updatedParticipants.filter((p: any) => p.userId !== userId);
        }
        break;
      }
      default:
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
        host_code: newHostCode,
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating session data:', updateError.message);
      return new Response(JSON.stringify({ error: updateError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ message: 'Session data updated successfully', session: updatedSession }), {
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