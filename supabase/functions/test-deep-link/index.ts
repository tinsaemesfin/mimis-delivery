// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.com/manual/examples/supabase-functions

import { serve } from "https://deno.land/std@0.191.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { redirectUrl } = await req.json()
    
    console.log('Testing deep link:', redirectUrl)
    
    // Verify that the URL is properly formatted for deep linking
    const isValidUrl = redirectUrl && 
      (redirectUrl.startsWith('http://') || 
       redirectUrl.startsWith('https://') || 
       redirectUrl.startsWith('mimisdelivery://'))
    
    // Check if the URL contains the expected parameters for password recovery
    const hasRecoveryParams = redirectUrl && redirectUrl.includes('type=recovery')
    
    return new Response(
      JSON.stringify({
        status: 'success',
        isValidUrl,
        hasRecoveryParams,
        url: redirectUrl,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'error',
        message: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
}) 