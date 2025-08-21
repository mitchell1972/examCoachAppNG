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
        console.log('Starting test question generation...');

        // Get environment variables
        const deepseekApiKey = 'sk-a2c5efa4db024d73abe9a84b5530f8fe'; // User-provided API key
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Nigerian time calculation (UTC+1)
        const now = new Date();
        const nigerianTime = new Date(now.getTime() + (1 * 60 * 60 * 1000));
        const deliveryDate = nigerianTime.toISOString().split('T')[0];

        console.log('Generating test questions for delivery date:', deliveryDate);

        // Test with just Mathematics
        const subject = 'Mathematics';
        const topic = 'Algebra';
        const questionsToGenerate = 5; // Small number for testing

        console.log(`Testing generation for ${subject} - ${topic}`);

        const questionPrompt = `Generate ${questionsToGenerate} multiple-choice questions for JAMB ${subject} on the topic "${topic}". 

RETURN ONLY VALID JSON with this exact structure:
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
}

Ensure all questions:
- Follow current JAMB examination standards and format
- Include comprehensive explanations
- Use proper grammar and clear language`;

        console.log('Calling DeepSeek API...');

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
                max_tokens: 2000,
                temperature: 0.7
            })
        });

        if (!questionResponse.ok) {
            const errorText = await questionResponse.text();
            throw new Error(`DeepSeek API error: ${errorText}`);
        }

        const questionData = await questionResponse.json();
        const generatedText = questionData.choices[0].message.content;
        
        console.log('Raw API response:', generatedText);

        // Parse JSON response
        let questions = [];
        try {
            const parsed = JSON.parse(generatedText);
            if (parsed.questions && Array.isArray(parsed.questions)) {
                questions = parsed.questions;
            }
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            // Try extracting JSON from text
            const jsonMatch = generatedText.match(/{[\s\S]*}/);
            if (jsonMatch) {
                try {
                    const extracted = JSON.parse(jsonMatch[0]);
                    if (extracted.questions) {
                        questions = extracted.questions;
                    }
                } catch (fallbackError) {
                    console.error('Fallback parse failed:', fallbackError);
                    throw new Error('Could not parse questions from API response');
                }
            } else {
                throw new Error('No valid JSON found in API response');
            }
        }

        console.log(`Parsed ${questions.length} questions`);

        if (questions.length === 0) {
            throw new Error('No questions generated');
        }

        // Create test question set
        const questionSetData = {
            subject,
            title: `Test ${subject} Questions - ${nigerianTime.toLocaleDateString('en-NG')}`,
            description: `Test set of ${questions.length} JAMB ${subject} questions`,
            delivery_date: deliveryDate,
            is_free: false,
            total_questions: questions.length,
            generation_source: 'DeepSeek-AI-Test'
        };

        console.log('Creating question set...');

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

        // Save questions to database
        const savedQuestions = [];
        for (const q of questions) {
            const questionData = {
                subject,
                topic,
                difficulty_level: 2,
                question_text: q.question_text,
                option_a: q.option_a,
                option_b: q.option_b,
                option_c: q.option_c,
                option_d: q.option_d,
                correct_answer: q.correct_answer,
                explanation: q.explanation,
                source: 'DeepSeek-AI-Test'
            };

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
            } else {
                console.error('Failed to save question:', await insertResponse.text());
            }
        }

        console.log(`Saved ${savedQuestions.length} questions`);

        // Link questions to question set
        for (let i = 0; i < savedQuestions.length; i++) {
            const linkData = {
                question_set_id: questionSetId,
                question_id: savedQuestions[i].id,
                position: i + 1
            };

            const linkResponse = await fetch(`${supabaseUrl}/rest/v1/question_set_questions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(linkData)
            });

            if (!linkResponse.ok) {
                console.error('Failed to link question:', await linkResponse.text());
            }
        }

        console.log('Test generation completed successfully');

        return new Response(JSON.stringify({
            data: {
                success: true,
                questionSetId,
                questionsGenerated: savedQuestions.length,
                subject,
                deliveryDate,
                message: `Successfully generated ${savedQuestions.length} test questions for ${subject}`
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Test generation error:', error);

        const errorResponse = {
            error: {
                code: 'TEST_GENERATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});