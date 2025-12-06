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
      return new Response(JSON.stringify({ error: 'Missing oldUserId or newUserId' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
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

    // Check if a profile already exists for the new user ID
    const { data: existingNewProfile, error: fetchNewError } = await supabaseServiceRoleClient
      .from('profiles')
      .select('id')
      .eq('id', newUserId)
      .single();

    if (fetchNewError && fetchNewError.code !== 'PGRST116') { // PGRST116 means "no rows found"
      console.error('Error checking for existing new profile:', fetchNewError.message);
      return new Response(JSON.stringify({ error: 'Failed to check for existing new profile.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (existingNewProfile) {
      // If a profile already exists for the new user, delete the old one.
      // This prioritizes existing authenticated profiles over anonymous ones.
      console.log(`Profile already exists for new user ${newUserId}. Deleting old profile ${oldUserId}.`);
      const { error: deleteOldError } = await supabaseServiceRoleClient
        .from('profiles')
        .delete()
        .eq('id', oldUserId);

      if (deleteOldError) {
        console.error('Error deleting old profile when new profile exists:', deleteOldError.message);
        return new Response(JSON.stringify({ error: 'Failed to delete old profile.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }
      return new Response(JSON.stringify({ message: 'Profile already exists for new user, old profile deleted.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Update the old profile's ID to the new user ID
    const { data: updatedProfile, error: updateError } = await supabaseServiceRoleClient
      .from('profiles')
      .update({ id: newUserId, updated_at: new Date().toISOString() })
      .eq('id', oldUserId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile ID:', updateError.message);
      return new Response(JSON.stringify({ error: updateError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ message: 'Profile ID migrated successfully.', profile: updatedProfile }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Unexpected error in migrate-profile-id Edge Function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});