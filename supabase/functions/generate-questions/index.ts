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
        const { subject, topic, difficulty_level, count = 5 } = await req.json();

        if (!subject || !topic) {
            throw new Error('Subject and topic are required');
        }

        // Get environment variables
        const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        let questions = [];

        // Check if Gemini API key is available
        if (geminiApiKey) {
            // Use Gemini AI to generate questions
            const prompt = `Generate ${count} multiple-choice questions for JAMB ${subject} on the topic "${topic}" with difficulty level ${difficulty_level} (1=easy, 2=medium, 3=hard). 

Format the response as a JSON array with this exact structure:
[
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

Ensure questions follow JAMB standards and Nigerian curriculum.`;

            const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + geminiApiKey, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            });

            if (geminiResponse.ok) {
                const geminiData = await geminiResponse.json();
                const generatedText = geminiData.candidates[0].content.parts[0].text;
                
                // Extract JSON from the response
                const jsonMatch = generatedText.match(/\[\s*{[\s\S]*}\s*\]/);
                if (jsonMatch) {
                    questions = JSON.parse(jsonMatch[0]);
                }
            }
        }

        // If no AI key or AI failed, use mock data
        if (questions.length === 0) {
            questions = generateMockQuestions(subject, topic, difficulty_level, count);
        }

        // Save questions to database
        const savedQuestions = [];
        for (const q of questions) {
            const questionData = {
                subject,
                topic,
                difficulty_level,
                question_text: q.question_text,
                option_a: q.option_a,
                option_b: q.option_b,
                option_c: q.option_c,
                option_d: q.option_d,
                correct_answer: q.correct_answer,
                explanation: q.explanation,
                source: geminiApiKey ? 'AI-generated' : 'Mock-data',
                created_by: null // System generated
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
            }
        }

        // Log AI content generation
        if (supabaseUrl && serviceRoleKey) {
            await fetch(`${supabaseUrl}/rest/v1/ai_content_logs`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content_type: 'questions',
                    subject,
                    topic,
                    prompt_used: geminiApiKey ? 'Gemini AI prompt' : 'Mock data generation',
                    generated_content: { questions: savedQuestions },
                    quality_score: geminiApiKey ? 0.9 : 0.7
                })
            });
        }

        return new Response(JSON.stringify({
            data: {
                questions: savedQuestions,
                source: geminiApiKey ? 'AI-generated' : 'mock-data',
                count: savedQuestions.length
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Question generation error:', error);

        const errorResponse = {
            error: {
                code: 'QUESTION_GENERATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Mock question generator for when AI is not available
function generateMockQuestions(subject: string, topic: string, difficulty: number, count: number) {
    const mockQuestions = {
        'Mathematics': {
            'Algebra': [
                {
                    question_text: "If 2x + 5 = 15, what is the value of x?",
                    option_a: "5",
                    option_b: "10",
                    option_c: "7",
                    option_d: "3",
                    correct_answer: "A",
                    explanation: "2x + 5 = 15, so 2x = 10, therefore x = 5"
                },
                {
                    question_text: "Simplify: 3x² + 2x - 5x² + 4x",
                    option_a: "-2x² + 6x",
                    option_b: "8x² + 6x",
                    option_c: "-2x² - 2x",
                    option_d: "3x² + 6x",
                    correct_answer: "A",
                    explanation: "Combine like terms: (3x² - 5x²) + (2x + 4x) = -2x² + 6x"
                }
            ],
            'Geometry': [
                {
                    question_text: "What is the area of a circle with radius 7cm?",
                    option_a: "49π cm²",
                    option_b: "14π cm²",
                    option_c: "21π cm²",
                    option_d: "98π cm²",
                    correct_answer: "A",
                    explanation: "Area of circle = πr² = π × 7² = 49π cm²"
                }
            ]
        },
        'Physics': {
            'Mechanics': [
                {
                    question_text: "A car accelerates from rest at 2 m/s². What is its velocity after 5 seconds?",
                    option_a: "10 m/s",
                    option_b: "2.5 m/s",
                    option_c: "7 m/s",
                    option_d: "25 m/s",
                    correct_answer: "A",
                    explanation: "Using v = u + at, where u = 0, a = 2 m/s², t = 5s: v = 0 + 2×5 = 10 m/s"
                }
            ]
        },
        'Chemistry': {
            'Atomic Structure': [
                {
                    question_text: "What is the atomic number of Carbon?",
                    option_a: "6",
                    option_b: "12",
                    option_c: "14",
                    option_d: "8",
                    correct_answer: "A",
                    explanation: "Carbon has 6 protons, which defines its atomic number as 6"
                }
            ]
        },
        'Biology': {
            'Cell Biology': [
                {
                    question_text: "Which organelle is responsible for photosynthesis in plant cells?",
                    option_a: "Chloroplast",
                    option_b: "Mitochondria",
                    option_c: "Nucleus",
                    option_d: "Ribosome",
                    correct_answer: "A",
                    explanation: "Chloroplasts contain chlorophyll and are the sites of photosynthesis in plant cells"
                }
            ]
        },
        'English Language': {
            'Grammar': [
                {
                    question_text: "Choose the correct form: 'She _____ to the market yesterday.'",
                    option_a: "went",
                    option_b: "go",
                    option_c: "goes",
                    option_d: "going",
                    correct_answer: "A",
                    explanation: "Past tense is required for an action that happened yesterday, so 'went' is correct"
                }
            ]
        }
    };

    const subjectQuestions = mockQuestions[subject] || {};
    const topicQuestions = subjectQuestions[topic] || subjectQuestions[Object.keys(subjectQuestions)[0]] || [];
    
    // Repeat questions if needed to reach count
    const result = [];
    for (let i = 0; i < count; i++) {
        if (topicQuestions.length > 0) {
            result.push(topicQuestions[i % topicQuestions.length]);
        }
    }
    
    return result;
}