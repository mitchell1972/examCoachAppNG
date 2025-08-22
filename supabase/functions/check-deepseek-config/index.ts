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
        // Check if environment variable is set
        const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
        
        const status = {
            environment_variable_set: !!deepseekApiKey,
            api_key_length: deepseekApiKey ? deepseekApiKey.length : 0,
            expected_key_format: deepseekApiKey ? deepseekApiKey.startsWith('sk-') : false,
            timestamp: new Date().toISOString()
        };

        // If key is set, test it
        if (deepseekApiKey) {
            try {
                const testResponse = await fetch('https://api.deepseek.com/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${deepseekApiKey}`
                    },
                    body: JSON.stringify({
                        model: 'deepseek-chat',
                        messages: [{ role: 'user', content: 'Test' }],
                        max_tokens: 5
                    })
                });
                
                status.api_test_successful = testResponse.ok;
                status.api_response_status = testResponse.status;
            } catch (error) {
                status.api_test_error = error.message;
            }
        }

        return new Response(JSON.stringify({ data: status }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});