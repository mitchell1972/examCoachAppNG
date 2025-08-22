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
        const url = new URL(req.url);
        const method = req.method;
        const action = url.searchParams.get('action'); // Get action from query parameters
        
        if (!action) {
            throw new Error('Action parameter is required');
        }

        // Get environment variables
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Get user from auth header
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('No authorization header');
        }

        const token = authHeader.replace('Bearer ', '');

        // Verify token and get user
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': serviceRoleKey
            }
        });

        if (!userResponse.ok) {
            throw new Error('Invalid token');
        }

        const userData = await userResponse.json();
        const userId = userData.id;

        // Handle different actions
        if (method === 'GET' && action === 'available-sets') {
            // Get available question sets for a specific subject
            const subject = url.searchParams.get('subject');
            if (!subject) {
                throw new Error('Subject parameter is required');
            }

            // Get all question sets for the subject
            const setsResponse = await fetch(`${supabaseUrl}/rest/v1/question_sets?subject=eq.${encodeURIComponent(subject)}&is_active=eq.true&order=delivery_date.desc`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                }
            });

            if (!setsResponse.ok) {
                throw new Error('Failed to fetch question sets');
            }

            const questionSets = await setsResponse.json();

            // Check user subscription status
            const subscriptionResponse = await fetch(`${supabaseUrl}/rest/v1/jamb_coaching_subscriptions?user_id=eq.${userId}&status=eq.active`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                }
            });

            const hasActiveSubscription = subscriptionResponse.ok && (await subscriptionResponse.json()).length > 0;

            // Check user's access to question sets
            const accessResponse = await fetch(`${supabaseUrl}/rest/v1/user_question_set_access?user_id=eq.${userId}`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                }
            });

            const userAccess = accessResponse.ok ? await accessResponse.json() : [];
            const accessMap = new Map(userAccess.map(access => [access.question_set_id, access.can_access]));

            // Process question sets with access information
            const processedSets = [];
            for (let i = 0; i < questionSets.length; i++) {
                const set = questionSets[i];
                const isFirstSet = i === questionSets.length - 1; // Oldest set (first for the subject)
                const hasExistingAccess = accessMap.get(set.id);
                
                let canAccess = false;
                let accessReason = '';

                if (hasActiveSubscription) {
                    canAccess = true;
                    accessReason = 'subscription';
                } else if (isFirstSet || hasExistingAccess) {
                    canAccess = true;
                    accessReason = isFirstSet ? 'free_first_set' : 'previously_granted';
                } else {
                    canAccess = false;
                    accessReason = 'subscription_required';
                }

                // Grant access to first set if not already granted
                if (isFirstSet && !hasExistingAccess && !accessMap.has(set.id)) {
                    await fetch(`${supabaseUrl}/rest/v1/user_question_set_access`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            user_id: userId,
                            question_set_id: set.id,
                            can_access: true
                        })
                    });
                }

                processedSets.push({
                    ...set,
                    can_access: canAccess,
                    access_reason: accessReason,
                    is_first_set: isFirstSet
                });
            }

            return new Response(JSON.stringify({
                data: {
                    questionSets: processedSets,
                    hasActiveSubscription,
                    subject
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else if (method === 'GET' && action === 'questions') {
            // Get questions for a specific question set
            const questionSetId = url.searchParams.get('question_set_id');
            if (!questionSetId) {
                throw new Error('Question set ID is required');
            }

            // Check if user has access to this question set
            const accessResponse = await fetch(`${supabaseUrl}/rest/v1/user_question_set_access?user_id=eq.${userId}&question_set_id=eq.${questionSetId}&can_access=eq.true`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                }
            });

            const hasAccess = accessResponse.ok && (await accessResponse.json()).length > 0;

            // Also check if user has active subscription
            const subscriptionResponse = await fetch(`${supabaseUrl}/rest/v1/jamb_coaching_subscriptions?user_id=eq.${userId}&status=eq.active`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                }
            });

            const hasActiveSubscription = subscriptionResponse.ok && (await subscriptionResponse.json()).length > 0;

            if (!hasAccess && !hasActiveSubscription) {
                throw new Error('Access denied to this question set');
            }

            // Get questions for the question set
            const questionsResponse = await fetch(`${supabaseUrl}/rest/v1/question_set_questions?question_set_id=eq.${questionSetId}&order=position.asc`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                }
            });

            if (!questionsResponse.ok) {
                throw new Error('Failed to fetch question set questions');
            }

            const questionSetQuestions = await questionsResponse.json();
            const questionIds = questionSetQuestions.map(qsq => qsq.question_id);

            if (questionIds.length === 0) {
                return new Response(JSON.stringify({
                    data: {
                        questions: [],
                        questionSetId
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // Fetch the actual questions
            const questionsDetailResponse = await fetch(`${supabaseUrl}/rest/v1/questions?id=in.(${questionIds.join(',')})&is_active=eq.true`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                }
            });

            if (!questionsDetailResponse.ok) {
                throw new Error('Failed to fetch questions details');
            }

            const questions = await questionsDetailResponse.json();

            // Sort questions by position
            const sortedQuestions = questions.sort((a, b) => {
                const positionA = questionSetQuestions.find(qsq => qsq.question_id === a.id)?.position || 0;
                const positionB = questionSetQuestions.find(qsq => qsq.question_id === b.id)?.position || 0;
                return positionA - positionB;
            });

            return new Response(JSON.stringify({
                data: {
                    questions: sortedQuestions,
                    questionSetId
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else if (method === 'DELETE' && action === 'delete-set') {
            // Delete (soft delete) a question set
            const requestData = await req.json();
            const questionSetId = requestData.question_set_id;

            if (!questionSetId) {
                throw new Error('Question set ID is required');
            }

            // Soft delete the question set (mark as inactive)
            const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/question_sets?id=eq.${questionSetId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    is_active: false
                })
            });

            if (!deleteResponse.ok) {
                throw new Error('Failed to delete question set');
            }

            // Also remove user's access to this set
            await fetch(`${supabaseUrl}/rest/v1/user_question_set_access?user_id=eq.${userId}&question_set_id=eq.${questionSetId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                }
            });

            return new Response(JSON.stringify({
                data: {
                    success: true,
                    message: 'Question set deleted successfully'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else {
            throw new Error('Invalid action or method');
        }

    } catch (error) {
        console.error('Question set management error:', error);

        const errorResponse = {
            error: {
                code: 'QUESTION_SET_MANAGEMENT_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});