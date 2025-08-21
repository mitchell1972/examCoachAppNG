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
        console.log('Testing 50-question generation for all subjects...');

        // Get environment variables
        const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!deepseekApiKey || !serviceRoleKey || !supabaseUrl) {
            throw new Error('Required environment variables missing');
        }

        const requestBody = await req.json();
        const testSubject = requestBody.subject || 'Mathematics'; // Default to Mathematics for testing

        // Test delivery date (future date to avoid conflicts)
        const testDate = '2025-08-22';

        console.log(`Testing generation for ${testSubject}`);

        // User's specific prompts for each subject
        let questionPrompt;
        switch(testSubject) {
            case 'Mathematics':
                questionPrompt = 'Give me 50 mathematics Jamb questions for Nigerian students to practice';
                break;
            case 'English Language':
                questionPrompt = 'Give me 50 English Jamb questions for Nigerian students to practice';
                break;
            case 'Physics':
                questionPrompt = 'Give me 50 physics Jamb questions for Nigerian students to practice';
                break;
            case 'Chemistry':
                questionPrompt = 'Give me 50 Chemistry Jamb questions for Nigerian students to practice';
                break;
            case 'Biology':
                questionPrompt = 'Give me 50 Biology Jamb questions for Nigerian students to practice';
                break;
            default:
                questionPrompt = `Give me 50 ${testSubject} Jamb questions for Nigerian students to practice`;
        }

        questionPrompt += `\n\nIMPORTANT: Return ONLY valid JSON in this exact format:\n{\n  "questions": [\n    {\n      "question_text": "Question text here",\n      "option_a": "Option A text",\n      "option_b": "Option B text", \n      "option_c": "Option C text",\n      "option_d": "Option D text",\n      "correct_answer": "A",\n      "explanation": "Detailed explanation of the correct answer"\n    }\n  ]\n}`;

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
                max_tokens: 8000,
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

        // Create question set
        const questionSetData = {
            subject: testSubject,
            title: `Test ${testSubject} - 50 Questions - ${new Date().toLocaleDateString('en-NG')}`,
            description: `Test generation of 50 JAMB ${testSubject} questions using user's specific prompts`,
            delivery_date: testDate,
            is_free: false,
            total_questions: Math.min(allQuestions.length, 50),
            generation_source: 'DeepSeek-AI-Test'
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
                subject: testSubject,
                topic: 'General',
                difficulty_level: 2,
                question_text: q.question_text,
                option_a: q.option_a,
                option_b: q.option_b,
                option_c: q.option_c,
                option_d: q.option_d,
                correct_answer: q.correct_answer.toUpperCase(),
                explanation: q.explanation || `The correct answer is ${q.correct_answer}`,
                source: 'DeepSeek-AI-Test',
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

        console.log(`Test completed! Generated ${savedQuestions.length} questions for ${testSubject}`);

        return new Response(JSON.stringify({
            data: {
                success: true,
                subject: testSubject,
                questionSetId,
                questionsGenerated: allQuestions.length,
                questionsSaved: savedQuestions.length,
                message: `Successfully generated ${savedQuestions.length} questions for ${testSubject}`
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Test generation error:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'TEST_GENERATION_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});