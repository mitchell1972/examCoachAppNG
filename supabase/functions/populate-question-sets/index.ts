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
        console.log('Populating question sets with 50 questions each...');

        // Get environment variables
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        const requestBody = await req.json();
        const questionSetId = requestBody.question_set_id;
        const subject = requestBody.subject;

        if (!questionSetId || !subject) {
            throw new Error('question_set_id and subject are required');
        }

        console.log(`Populating ${subject} question set: ${questionSetId}`);

        // Generate 50 sample questions for the subject
        const sampleQuestions = [];
        
        // Create questions based on subject
        for (let i = 1; i <= 50; i++) {
            let questionData;
            
            switch(subject) {
                case 'Mathematics':
                    questionData = {
                        subject,
                        topic: 'General Mathematics',
                        difficulty_level: 2,
                        question_text: `Mathematics Question ${i}: If 2x + 3 = ${7 + (i % 10)}, what is the value of x?`,
                        option_a: `${2 + (i % 4)}`,
                        option_b: `${3 + (i % 4)}`,
                        option_c: `${4 + (i % 4)}`,
                        option_d: `${5 + (i % 4)}`,
                        correct_answer: 'A',
                        explanation: `To solve 2x + 3 = ${7 + (i % 10)}, subtract 3 from both sides: 2x = ${4 + (i % 10)}, then divide by 2: x = ${2 + (i % 4)}`
                    };
                    break;
                case 'Physics':
                    questionData = {
                        subject,
                        topic: 'General Physics',
                        difficulty_level: 2,
                        question_text: `Physics Question ${i}: A ball is thrown vertically upward with an initial velocity of ${10 + (i % 5)} m/s. What is its acceleration?`,
                        option_a: '9.8 m/s² downward',
                        option_b: '9.8 m/s² upward',
                        option_c: `${10 + (i % 5)} m/s² upward`,
                        option_d: '0 m/s²',
                        correct_answer: 'A',
                        explanation: 'The acceleration due to gravity is always 9.8 m/s² downward, regardless of the initial velocity.'
                    };
                    break;
                case 'Chemistry':
                    questionData = {
                        subject,
                        topic: 'General Chemistry',
                        difficulty_level: 2,
                        question_text: `Chemistry Question ${i}: What is the atomic number of Carbon?`,
                        option_a: '6',
                        option_b: '12',
                        option_c: '14',
                        option_d: '8',
                        correct_answer: 'A',
                        explanation: 'Carbon has 6 protons, which defines its atomic number as 6.'
                    };
                    break;
                case 'Biology':
                    questionData = {
                        subject,
                        topic: 'General Biology',
                        difficulty_level: 2,
                        question_text: `Biology Question ${i}: Which organelle is responsible for photosynthesis in plant cells?`,
                        option_a: 'Chloroplast',
                        option_b: 'Mitochondria',
                        option_c: 'Nucleus',
                        option_d: 'Ribosome',
                        correct_answer: 'A',
                        explanation: 'Chloroplasts contain chlorophyll and are the sites of photosynthesis in plant cells.'
                    };
                    break;
                case 'English Language':
                    questionData = {
                        subject,
                        topic: 'General English',
                        difficulty_level: 2,
                        question_text: `English Question ${i}: Choose the correct form: 'She _____ to the market yesterday.'`,
                        option_a: 'went',
                        option_b: 'go',
                        option_c: 'goes',
                        option_d: 'going',
                        correct_answer: 'A',
                        explanation: 'Past tense is required for an action that happened yesterday, so "went" is correct.'
                    };
                    break;
                default:
                    throw new Error(`Unknown subject: ${subject}`);
            }
            
            questionData.question_set_id = questionSetId;
            questionData.source = 'System-Generated-Fixed';
            questionData.is_active = true;
            questionData.times_answered = 0;
            questionData.correct_rate = 0;
            
            sampleQuestions.push(questionData);
        }

        console.log(`Generated ${sampleQuestions.length} sample questions`);

        // Save all questions to database
        const savedQuestions = [];
        
        for (let i = 0; i < sampleQuestions.length; i++) {
            const questionData = sampleQuestions[i];
            
            // Insert question
            const insertResponse = await fetch(`${supabaseUrl}/rest/v1/questions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(questionData)
            });

            if (insertResponse.ok) {
                const savedQuestion = await insertResponse.json();
                savedQuestions.push(savedQuestion[0]);
                
                // Link to question set
                await fetch(`${supabaseUrl}/rest/v1/question_set_questions`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        question_set_id: questionSetId,
                        question_id: savedQuestion[0].id,
                        position: i + 1
                    })
                });
                
                if ((i + 1) % 10 === 0) {
                    console.log(`Saved ${i + 1}/${sampleQuestions.length} questions`);
                }
            } else {
                const errorText = await insertResponse.text();
                console.error(`Failed to save question ${i + 1}:`, errorText);
            }
        }

        console.log(`Successfully populated ${subject} with ${savedQuestions.length} questions`);

        return new Response(JSON.stringify({
            success: true,
            subject,
            questionSetId,
            questionsSaved: savedQuestions.length,
            message: `Successfully populated ${subject} with ${savedQuestions.length} questions`
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Population error:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'POPULATION_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});