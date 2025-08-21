Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        // Create demo accounts
        const demoAccounts = [
            {
                email: 'student@demo.com',
                password: 'password123',
                userData: {
                    full_name: 'Demo Student',
                    role: 'student'
                }
            },
            {
                email: 'admin@demo.com',
                password: 'password123',
                userData: {
                    full_name: 'Demo Admin',
                    role: 'admin'
                }
            }
        ];

        const results = [];
        
        for (const account of demoAccounts) {
            try {
                // Check if account already exists
                const existingCheck = await fetch(
                    `${Deno.env.get('SUPABASE_URL')}/auth/v1/admin/users`,
                    {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                            'Content-Type': 'application/json',
                            'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
                        }
                    }
                );

                if (existingCheck.ok) {
                    const users = await existingCheck.json();
                    const userExists = users.users?.some((u: any) => u.email === account.email);
                    
                    if (!userExists) {
                        // Create the user
                        const createResponse = await fetch(
                            `${Deno.env.get('SUPABASE_URL')}/auth/v1/admin/users`,
                            {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                                    'Content-Type': 'application/json',
                                    'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
                                },
                                body: JSON.stringify({
                                    email: account.email,
                                    password: account.password,
                                    email_confirm: true,
                                    user_metadata: account.userData
                                })
                            }
                        );

                        if (createResponse.ok) {
                            results.push({ email: account.email, status: 'created' });
                        } else {
                            const error = await createResponse.text();
                            results.push({ email: account.email, status: 'failed', error });
                        }
                    } else {
                        results.push({ email: account.email, status: 'exists' });
                    }
                }
            } catch (accountError) {
                results.push({ 
                    email: account.email, 
                    status: 'error', 
                    error: accountError.message 
                });
            }
        }

        return new Response(JSON.stringify({ 
            success: true, 
            message: 'Demo account creation process completed',
            results 
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        const errorResponse = {
            error: {
                code: 'DEMO_ACCOUNT_CREATION_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});