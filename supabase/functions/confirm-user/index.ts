// Auto-confirm user accounts to enable instant registration without email verification

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Get Supabase service role key from environment
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseServiceRoleKey) {
      throw new Error('Service role key not found');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    if (!supabaseUrl) {
      throw new Error('Supabase URL not found');
    }

    // Confirm the user account using Admin API
    const confirmResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseServiceRoleKey
      },
      body: JSON.stringify({
        email_confirm: true
      })
    });

    if (!confirmResponse.ok) {
      const errorText = await confirmResponse.text();
      throw new Error(`Failed to confirm user: ${errorText}`);
    }

    const confirmData = await confirmResponse.json();

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'User account confirmed successfully',
        user: confirmData.user
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error confirming user:', error);
    return new Response(
      JSON.stringify({ 
        error: {
          code: 'USER_CONFIRMATION_ERROR',
          message: error.message
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
