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
        console.log('Starting test question generation for tomorrow...');

        // Get environment variables
        const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!deepseekApiKey || !serviceRoleKey || !supabaseUrl) {
            throw new Error('Required environment variables missing');
        }

        // Test generation for tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const deliveryDate = tomorrow.toISOString().split('T')[0];

        console.log('Generating test questions for delivery date:', deliveryDate);

        // Test with just Mathematics to validate the process
        const subject = 'Mathematics';
        const questionsToGenerate = 5; // Smaller batch for testing

        // Check if question set already exists for tomorrow
        const existingSetResponse = await fetch(`${supabaseUrl}/rest/v1/question_sets?subject=eq.${encodeURIComponent(subject)}&delivery_date=eq.${deliveryDate}`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        if (existingSetResponse.ok) {
            const existingSets = await existingSetResponse.json();
            if (existingSets.length > 0) {
                return new Response(JSON.stringify({
                    data: {
                        success: true,
                        message: `Question set already exists for ${subject} on ${deliveryDate}`,
                        skipped: true
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }

        // Generate test questions using DeepSeek API
        const questionPrompt = `Generate ${questionsToGenerate} multiple-choice questions for JAMB Mathematics covering basic algebra and geometry topics.

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

Ensure all questions follow JAMB standards and use clear Nigerian English.`;

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
            throw new Error(`DeepSeek API error: ${questionResponse.status}`);
        }

        const questionData = await questionResponse.json();
        const generatedText = questionData.choices[0].message.content;
        
        console.log('DeepSeek response received:', generatedText.substring(0, 200) + '...');
        
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
                }
            }
        }

        if (questions.length === 0) {
            throw new Error('No valid questions generated from DeepSeek API');
        }

        console.log(`Generated ${questions.length} questions`);

        // Create question set
        const questionSetData = {
            subject,
            title: `Test ${subject} Questions - ${deliveryDate}`,
            description: `Test set of ${questions.length} JAMB ${subject} questions`,
            delivery_date: deliveryDate,
            is_free: false,
            total_questions: questions.length,
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

        // Save questions to database
        let savedCount = 0;
        for (const q of questions) {
            const questionData = {
                subject,
                topic: 'Algebra',
                difficulty_level: 2,
                question_text: q.question_text,
                option_a: q.option_a,
                option_b: q.option_b,
                option_c: q.option_c,
                option_d: q.option_d,
                correct_answer: q.correct_answer,
                explanation: q.explanation,
                source: 'DeepSeek-AI-Test',
                question_set_id: questionSetId
            };

            const insertResponse = await fetch(`${supabaseUrl}/rest/v1/questions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(questionData)
            });

            if (insertResponse.ok) {
                savedCount++;
            } else {
                console.error('Failed to save question:', await insertResponse.text());
            }
        }

        console.log(`Saved ${savedCount} questions successfully`);

        return new Response(JSON.stringify({
            data: {
                success: true,
                questionSetId,
                questionsGenerated: savedCount,
                deliveryDate,
                message: `Successfully generated ${savedCount} questions for ${subject} on ${deliveryDate}`,
                testRun: true
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