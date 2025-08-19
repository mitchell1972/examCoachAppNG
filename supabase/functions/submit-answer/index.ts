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
        const { user_id, question_id, selected_answer, time_spent_seconds } = await req.json();

        if (!user_id || !question_id || !selected_answer) {
            throw new Error('User ID, question ID, and selected answer are required');
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Supabase configuration missing');
        }

        // Get the question to check correct answer
        const questionResponse = await fetch(
            `${supabaseUrl}/rest/v1/questions?id=eq.${question_id}&select=*`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        if (!questionResponse.ok) {
            throw new Error('Failed to fetch question');
        }

        const questions = await questionResponse.json();
        if (questions.length === 0) {
            throw new Error('Question not found');
        }

        const question = questions[0];
        const isCorrect = selected_answer.toUpperCase() === question.correct_answer.toUpperCase();

        // Save user answer
        const answerData = {
            user_id,
            question_id,
            selected_answer: selected_answer.toUpperCase(),
            is_correct: isCorrect,
            time_spent_seconds: time_spent_seconds || 0,
            answered_at: new Date().toISOString()
        };

        const insertResponse = await fetch(`${supabaseUrl}/rest/v1/user_answers`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(answerData)
        });

        if (!insertResponse.ok) {
            throw new Error('Failed to save answer');
        }

        const savedAnswer = await insertResponse.json();

        // Update question statistics
        const newTimesAnswered = (question.times_answered || 0) + 1;
        const newCorrectAnswers = (question.times_answered || 0) * (question.correct_rate || 0) + (isCorrect ? 1 : 0);
        const newCorrectRate = newCorrectAnswers / newTimesAnswered;

        await fetch(`${supabaseUrl}/rest/v1/questions?id=eq.${question_id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                times_answered: newTimesAnswered,
                correct_rate: newCorrectRate,
                updated_at: new Date().toISOString()
            })
        });

        // Update user profile activity
        await fetch(`${supabaseUrl}/rest/v1/profiles?user_id=eq.${user_id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                last_activity_date: new Date().toISOString().split('T')[0],
                total_practice_time: `COALESCE(total_practice_time, 0) + ${time_spent_seconds || 0}`,
                updated_at: new Date().toISOString()
            })
        });

        // Log user activity
        await fetch(`${supabaseUrl}/rest/v1/user_activity`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id,
                action_type: 'answer_question',
                resource_type: 'question',
                resource_id: question_id,
                metadata: {
                    subject: question.subject,
                    topic: question.topic,
                    difficulty: question.difficulty_level,
                    is_correct: isCorrect,
                    time_spent: time_spent_seconds
                },
                created_at: new Date().toISOString()
            })
        });

        return new Response(JSON.stringify({
            data: {
                answer: savedAnswer[0],
                is_correct: isCorrect,
                correct_answer: question.correct_answer,
                explanation: question.explanation,
                question_stats: {
                    times_answered: newTimesAnswered,
                    correct_rate: Math.round(newCorrectRate * 100) / 100
                }
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Submit answer error:', error);

        const errorResponse = {
            error: {
                code: 'SUBMIT_ANSWER_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});