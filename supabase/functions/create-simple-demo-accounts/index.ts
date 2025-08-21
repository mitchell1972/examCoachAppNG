// Create simple demo accounts without complex logic
// This function creates basic demo accounts for testing authentication

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Get Supabase service role key from environment
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseServiceRoleKey) {
      throw new Error('Service role key not found');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    if (!supabaseUrl) {
      throw new Error('Supabase URL not found');
    }

    // Demo accounts to create
    const demoAccounts = [
      {
        email: 'student@demo.com',
        password: 'password123',
        fullName: 'Demo Student',
        role: 'student'
      },
      {
        email: 'admin@demo.com', 
        password: 'password123',
        fullName: 'Demo Admin',
        role: 'admin'
      }
    ];

    const results = [];
    
    for (const account of demoAccounts) {
      try {
        // Create user using Auth Admin API
        const createUserResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceRoleKey}`,
            'Content-Type': 'application/json',
            'apikey': supabaseServiceRoleKey
          },
          body: JSON.stringify({
            email: account.email,
            password: account.password,
            email_confirm: true, // Skip email verification
            user_metadata: {
              full_name: account.fullName
            }
          })
        });

        if (createUserResponse.ok) {
          const userData = await createUserResponse.json();
          
          // Create profile
          const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseServiceRoleKey}`,
              'Content-Type': 'application/json',
              'apikey': supabaseServiceRoleKey,
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              user_id: userData.user.id,
              email: account.email,
              full_name: account.fullName,
              role: account.role
            })
          });

          if (profileResponse.ok) {
            results.push({ email: account.email, status: 'created', message: 'Account and profile created successfully' });
          } else {
            const profileError = await profileResponse.text();
            results.push({ email: account.email, status: 'user_created_profile_failed', message: `User created but profile failed: ${profileError}` });
          }
        } else {
          const createError = await createUserResponse.text();
          
          // Check if user already exists
          if (createError.includes('already registered') || createError.includes('email_address_invalid')) {
            results.push({ email: account.email, status: 'exists', message: 'Account already exists' });
          } else {
            results.push({ email: account.email, status: 'failed', message: `Failed to create user: ${createError}` });
          }
        }
      } catch (error) {
        results.push({ email: account.email, status: 'error', message: error.message });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Demo account creation completed',
        results 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error creating demo accounts:', error);
    return new Response(
      JSON.stringify({ 
        error: {
          code: 'DEMO_ACCOUNT_CREATION_ERROR',
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
