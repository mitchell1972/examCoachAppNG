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
        console.log('Starting fresh Mathematics question generation...');

        // Get environment variables
        const deepseekApiKey = 'sk-a2c5efa4db024d73abe9a84b5530f8fe'; // User-provided API key
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!deepseekApiKey || !serviceRoleKey || !supabaseUrl) {
            throw new Error('Required environment variables missing');
        }

        const subject = 'Mathematics';
        const deliveryDate = '2025-08-22';
        
        console.log(`Generating fresh questions for ${subject}`);

        // Enhanced Mathematics prompt
        const questionPrompt = `Generate 50 diverse and challenging mathematics JAMB questions for Nigerian students to practice. Cover these topics with varied difficulty:
        
        Topics to include:
        - Algebra (equations, inequalities, word problems)
        - Geometry (angles, areas, volumes)
        - Trigonometry (basic ratios, identities)
        - Statistics (mean, median, mode)
        - Number theory (fractions, percentages)
        - Coordinate geometry (distance, midpoint)
        - Probability (basic events)
        - Mensuration (perimeter, area)
        
        IMPORTANT: Each question must be DIFFERENT and realistic for JAMB exam. NO repetitive questions.
        
        CRITICAL REQUIREMENTS:
        1. Generate EXACTLY 50 unique, non-repetitive questions
        2. Each question must be different from all others
        3. Cover diverse topics within mathematics
        4. Use appropriate JAMB examination difficulty level
        5. Include detailed explanations for each answer
        6. Use clear, grammatically correct English
        7. Ensure all questions are academically sound
        
        RETURN ONLY valid JSON in this exact format:
        {
          "questions": [
            {
              "question_text": "Question text here",
              "option_a": "Option A text",
              "option_b": "Option B text", 
              "option_c": "Option C text",
              "option_d": "Option D text",
              "correct_answer": "A",
              "explanation": "Detailed explanation of the correct answer"
            }
          ]
        }`;

        console.log('Calling DeepSeek API...');

        // Generate questions
        const questionResponse = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${deepseekApiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [{
                    role: 'user',
                    content: questionPrompt
                }],
                max_tokens: 16000, // Large token limit for 50 questions
                temperature: 0.7
            })
        });

        if (!questionResponse.ok) {
            throw new Error(`DeepSeek API error: ${questionResponse.status} ${questionResponse.statusText}`);
        }

        const questionData = await questionResponse.json();
        const generatedText = questionData.choices[0].message.content;
        
        console.log(`Generated text length: ${generatedText.length} characters`);
        
        // Parse questions
        let allQuestions = [];
        try {
            const parsed = JSON.parse(generatedText);
            if (parsed.questions && Array.isArray(parsed.questions)) {
                allQuestions = parsed.questions;
                console.log(`Successfully parsed ${parsed.questions.length} questions`);
            }
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            console.log('Generated text sample:', generatedText.substring(0, 1000));
            
            // Try extracting JSON from text
            const jsonMatch = generatedText.match(/{[\s\S]*}/);
            if (jsonMatch) {
                try {
                    const extracted = JSON.parse(jsonMatch[0]);
                    if (extracted.questions && Array.isArray(extracted.questions)) {
                        allQuestions = extracted.questions;
                        console.log(`Successfully extracted ${extracted.questions.length} questions from fallback parse`);
                    }
                } catch (fallbackError) {
                    console.error('Fallback parse failed:', fallbackError);
                }
            }
        }

        console.log(`Total questions generated: ${allQuestions.length}`);

        if (allQuestions.length === 0) {
            throw new Error('No questions were generated');
        }

        // Delete existing Mathematics questions for today to avoid conflicts
        const existingSetResponse = await fetch(`${supabaseUrl}/rest/v1/question_sets?subject=eq.Mathematics&delivery_date=eq.${deliveryDate}`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        if (existingSetResponse.ok) {
            const existingSets = await existingSetResponse.json();
            for (const existingSet of existingSets) {
                // Mark old questions as inactive
                await fetch(`${supabaseUrl}/rest/v1/questions?question_set_id=eq.${existingSet.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ is_active: false })
                });
                
                // Delete old question set
                await fetch(`${supabaseUrl}/rest/v1/question_sets?id=eq.${existingSet.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });
            }
        }

        // Create new question set
        const questionSetData = {
            subject: subject,
            title: `${subject} - 50 Questions`,
            description: `Fresh set of ${Math.min(allQuestions.length, 50)} JAMB ${subject} questions with diverse topics and appropriate difficulty`,
            delivery_date: deliveryDate,
            is_free: true, // Mark as free
            total_questions: Math.min(allQuestions.length, 50),
            generation_source: 'DeepSeek-AI-Enhanced',
            is_active: true
        };

        const questionSetResponse = await fetch(`${supabaseUrl}/rest/v1/question_sets`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(questionSetData)
        });

        if (!questionSetResponse.ok) {
            const errorText = await questionSetResponse.text();
            throw new Error(`Failed to create question set: ${errorText}`);
        }

        const questionSet = await questionSetResponse.json();
        const questionSetId = questionSet[0].id;

        console.log(`Created question set with ID: ${questionSetId}`);

        // Save up to 50 questions
        const questionsToSave = allQuestions.slice(0, 50);
        const savedQuestions = [];

        for (let i = 0; i < questionsToSave.length; i++) {
            const q = questionsToSave[i];
            
            // Validate question
            if (!q.question_text || !q.option_a || !q.option_b || !q.option_c || !q.option_d || !q.correct_answer) {
                console.warn(`Skipping invalid question ${i + 1}:`, q);
                continue;
            }
            
            const questionData = {
                subject: subject,
                topic: 'General',
                difficulty_level: 2,
                question_text: q.question_text,
                option_a: q.option_a,
                option_b: q.option_b,
                option_c: q.option_c,
                option_d: q.option_d,
                correct_answer: q.correct_answer.toUpperCase(),
                explanation: q.explanation || `The correct answer is ${q.correct_answer}`,
                source: 'DeepSeek-AI-Enhanced',
                question_set_id: questionSetId,
                is_active: true,
                times_answered: 0,
                correct_rate: 0
            };

            try {
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
                    
                    console.log(`Saved question ${i + 1}/${questionsToSave.length}`);
                } else {
                    const errorText = await insertResponse.text();
                    console.error(`Failed to save question ${i + 1}:`, errorText);
                }
            } catch (saveError) {
                console.error(`Error saving question ${i + 1}:`, saveError);
            }
        }

        // Update question set with actual count
        await fetch(`${supabaseUrl}/rest/v1/question_sets?id=eq.${questionSetId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                total_questions: savedQuestions.length
            })
        });

        console.log(`Fresh Mathematics generation completed! Generated ${savedQuestions.length} questions`);

        return new Response(JSON.stringify({
            data: {
                success: true,
                subject: subject,
                questionSetId,
                questionsGenerated: allQuestions.length,
                questionsSaved: savedQuestions.length,
                message: `Successfully generated ${savedQuestions.length} fresh Mathematics questions`
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Fresh Mathematics generation error:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'FRESH_MATH_GENERATION_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});