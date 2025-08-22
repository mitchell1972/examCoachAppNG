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
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Supabase configuration missing');
        }

        const today = new Date().toISOString().split('T')[0];
        const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English Language'];
        
        console.log('Starting daily question rotation for date:', today);

        // Check if today's questions already exist
        const existingResponse = await fetch(`${supabaseUrl}/rest/v1/daily_questions?date=eq.${today}&select=*`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        const existingQuestions = await existingResponse.json();
        
        if (existingQuestions.length > 0) {
            return new Response(JSON.stringify({
                data: {
                    message: 'Daily questions already exist for today',
                    date: today,
                    subjects_updated: []
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const newDailyQuestions = [];

        // Generate 20 questions per subject
        for (const subject of subjects) {
            console.log(`Selecting questions for ${subject}`);
            
            // Get available questions for this subject
            const questionsResponse = await fetch(
                `${supabaseUrl}/rest/v1/questions?subject=eq.${encodeURIComponent(subject)}&is_active=eq.true&select=id&limit=100&order=created_at.desc`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );

            if (!questionsResponse.ok) {
                console.error(`Failed to fetch questions for ${subject}`);
                continue;
            }

            const availableQuestions = await questionsResponse.json();
            console.log(`Found ${availableQuestions.length} questions for ${subject}`);

            if (availableQuestions.length === 0) {
                console.log(`No questions available for ${subject}, skipping`);
                continue;
            }

            // Randomly select 20 questions (or all if less than 20)
            const selectedCount = Math.min(20, availableQuestions.length);
            const shuffled = availableQuestions.sort(() => 0.5 - Math.random());
            const selectedQuestions = shuffled.slice(0, selectedCount);
            const questionIds = selectedQuestions.map(q => q.id);

            // Create daily question entry
            const dailyQuestionData = {
                date: today,
                subject: subject,
                question_ids: questionIds,
                is_active: true
            };

            const insertResponse = await fetch(`${supabaseUrl}/rest/v1/daily_questions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(dailyQuestionData)
            });

            if (insertResponse.ok) {
                const savedDailyQuestion = await insertResponse.json();
                newDailyQuestions.push(savedDailyQuestion[0]);
                console.log(`Created daily questions for ${subject} with ${questionIds.length} questions`);
            } else {
                console.error(`Failed to create daily questions for ${subject}`);
            }
        }

        // Deactivate questions older than 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        await fetch(`${supabaseUrl}/rest/v1/daily_questions?date=lt.${sevenDaysAgo}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ is_active: false })
        });

        console.log('Daily question rotation completed successfully');

        return new Response(JSON.stringify({
            data: {
                message: 'Daily questions rotated successfully',
                date: today,
                subjects_updated: newDailyQuestions.map(q => q.subject),
                total_assignments: newDailyQuestions.length
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Daily question rotation error:', error);

        const errorResponse = {
            error: {
                code: 'DAILY_ROTATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});