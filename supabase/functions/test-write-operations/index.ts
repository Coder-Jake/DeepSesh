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
    const { testType, payload } = await req.json();

    const supabaseServiceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    let result;
    switch (testType) {
      case 'insert':
        result = await supabaseServiceRoleClient
          .from('test_data')
          .insert({ test_value: payload.value })
          .select();
        break;
      case 'update':
        if (!payload.id) throw new Error('Update requires an ID.');
        result = await supabaseServiceRoleClient
          .from('test_data')
          .update({ test_value: payload.value })
          .eq('id', payload.id)
          .select();
        break;
      case 'delete':
        if (!payload.id) throw new Error('Delete requires an ID.');
        result = await supabaseServiceRoleClient
          .from('test_data')
          .delete()
          .eq('id', payload.id);
        break;
      case 'fetch_all':
        result = await supabaseServiceRoleClient
          .from('test_data')
          .select('*');
        break;
      default:
        return new Response(JSON.stringify({ error: 'Invalid testType' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
    }

    if (result.error) {
      console.error(`Error during ${testType} operation:`, result.error.message);
      return new Response(JSON.stringify({ error: result.error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ message: `${testType} successful`, data: result.data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Unexpected error in test-write-operations Edge Function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});