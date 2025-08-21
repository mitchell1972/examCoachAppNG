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
        console.log('Simple 50-question generation test...');

        const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
        
        if (!deepseekApiKey) {
            throw new Error('DeepSeek API key not found');
        }

        const requestBody = await req.json();
        const testSubject = requestBody.subject || 'Mathematics';

        // Use user's exact prompt
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

        questionPrompt += `\n\nReturn as JSON: {"questions": [{"question_text": "...", "option_a": "...", "option_b": "...", "option_c": "...", "option_d": "...", "correct_answer": "A", "explanation": "..."}]}`;

        console.log('Calling DeepSeek with prompt:', questionPrompt.substring(0, 100) + '...');

        const response = await fetch('https://api.deepseek.com/chat/completions', {
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

        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const generatedText = data.choices[0].message.content;
        
        console.log(`Generated text length: ${generatedText.length}`);
        console.log('First 500 chars:', generatedText.substring(0, 500));

        // Try to parse questions
        let questions = [];
        try {
            const parsed = JSON.parse(generatedText);
            if (parsed.questions) {
                questions = parsed.questions;
            }
        } catch (parseError) {
            console.log('Parse error, trying extraction...');
            const jsonMatch = generatedText.match(/{[\s\S]*}/);
            if (jsonMatch) {
                try {
                    const extracted = JSON.parse(jsonMatch[0]);
                    if (extracted.questions) {
                        questions = extracted.questions;
                    }
                } catch (e) {
                    console.log('Extraction also failed');
                }
            }
        }

        console.log(`Parsed ${questions.length} questions`);

        return new Response(JSON.stringify({
            success: true,
            subject: testSubject,
            questionsGenerated: questions.length,
            sampleQuestion: questions.length > 0 ? questions[0] : null,
            generatedTextPreview: generatedText.substring(0, 1000)
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error:', error);
        return new Response(JSON.stringify({
            error: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});