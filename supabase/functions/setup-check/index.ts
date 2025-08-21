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
        // Get environment variables
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const deepseekApiKey = 'sk-a2c5efa4db024d73abe9a84b5530f8fe'; // User-provided API key

        console.log('Environment check:');
        console.log('SUPABASE_URL:', supabaseUrl ? 'Present' : 'Missing');
        console.log('SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? 'Present' : 'Missing');
        console.log('DEEPSEEK_API_KEY:', deepseekApiKey ? 'Present' : 'Missing');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Test DeepSeek API
        const testResponse = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${deepseekApiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [{
                    role: 'user',
                    content: 'Say "API connection successful" in JSON format: {"message": "your response"}'
                }],
                max_tokens: 50,
                temperature: 0.1
            })
        });

        let deepseekStatus = 'Failed';
        let deepseekResponse = '';
        if (testResponse.ok) {
            const data = await testResponse.json();
            deepseekStatus = 'Success';
            deepseekResponse = data.choices[0]?.message?.content || 'No content';
        } else {
            deepseekResponse = `Status: ${testResponse.status}, ${testResponse.statusText}`;
        }

        // Test Supabase connection
        const supabaseTestResponse = await fetch(`${supabaseUrl}/rest/v1/question_sets?limit=1`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        const supabaseStatus = supabaseTestResponse.ok ? 'Success' : 'Failed';

        return new Response(JSON.stringify({
            data: {
                environment: {
                    supabase_url: supabaseUrl ? 'Present' : 'Missing',
                    service_role_key: serviceRoleKey ? 'Present' : 'Missing',
                    deepseek_api_key: deepseekApiKey ? 'Present' : 'Missing'
                },
                tests: {
                    deepseek_api: {
                        status: deepseekStatus,
                        response: deepseekResponse
                    },
                    supabase_connection: {
                        status: supabaseStatus
                    }
                },
                ready_for_automation: deepseekStatus === 'Success' && supabaseStatus === 'Success'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Setup check error:', error);

        const errorResponse = {
            error: {
                code: 'SETUP_CHECK_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});