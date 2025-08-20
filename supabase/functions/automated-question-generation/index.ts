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
        console.log('Starting automated question generation...');

        // Get environment variables
        const deepseekApiKey = 'sk-a2c5efa4db024d73abe9a84b5530f8fe'; // User-provided API key
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!deepseekApiKey) {
            throw new Error('DeepSeek API key not configured');
        }

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Nigerian time calculation (UTC+1)
        const now = new Date();
        const nigerianTime = new Date(now.getTime() + (1 * 60 * 60 * 1000));
        const deliveryDate = nigerianTime.toISOString().split('T')[0];

        console.log('Generating questions for delivery date:', deliveryDate);

        // JAMB subjects to generate questions for
        const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English Language'];
        const questionsPerSubject = 50;
        const generatedSets = [];

        for (const subject of subjects) {
            console.log(`Processing subject: ${subject}`);

            // Check if question set already exists for today
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
                    console.log(`Question set already exists for ${subject} on ${deliveryDate}`);
                    continue;
                }
            }

            // Generate topics for the subject
            const topicPrompt = `Generate 3-5 diverse, important topics for JAMB ${subject} examination. Return only a JSON array of topic strings. Example: ["Quadratic Equations", "Trigonometry", "Calculus"]`;

            let topics = [];
            try {
                const topicResponse = await fetch('https://api.deepseek.com/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${deepseekApiKey}`
                    },
                    body: JSON.stringify({
                        model: 'deepseek-chat',
                        messages: [{
                            role: 'user',
                            content: topicPrompt
                        }],
                        max_tokens: 500,
                        temperature: 0.7
                    })
                });

                if (topicResponse.ok) {
                    const topicData = await topicResponse.json();
                    const topicText = topicData.choices[0].message.content;
                    topics = JSON.parse(topicText.match(/\[.*\]/)[0]);
                }
            } catch (error) {
                console.error('Error generating topics:', error);
                // Fallback topics
                topics = subject === 'Mathematics' ? ['Algebra', 'Geometry', 'Calculus'] :
                        subject === 'Physics' ? ['Mechanics', 'Thermodynamics', 'Optics'] :
                        subject === 'Chemistry' ? ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry'] :
                        subject === 'Biology' ? ['Cell Biology', 'Genetics', 'Ecology'] :
                        ['Comprehension', 'Grammar', 'Vocabulary'];
            }

            console.log(`Generated topics for ${subject}:`, topics);

            // Generate questions for each topic
            const allQuestions = [];
            const questionsPerTopic = Math.ceil(questionsPerSubject / topics.length);

            for (const topic of topics) {
                console.log(`Generating questions for topic: ${topic}`);

                const questionPrompt = `Generate ${questionsPerTopic} multiple-choice questions for JAMB ${subject} on the topic "${topic}". 

IMPORTANT REQUIREMENTS - MUST FOLLOW NIGERIAN JAMB SYLLABUS:

**For Mathematics:** Follow the JAMB Mathematics syllabus covering Number and Numeration, Algebraic Processes, Geometry and Trigonometry, Calculus, and Statistics. Use Nigerian context where applicable.

**For Physics:** Align with JAMB Physics syllabus including Mechanics, Thermal Physics, Waves and Sound, Light, Electricity and Magnetism, Modern Physics, and Space Physics. Use metric units and Nigerian examples.

**For Chemistry:** Follow JAMB Chemistry syllabus covering Separation of Mixtures, Atomic Structure, Chemical Bonding, Air, Water, Solids and Solutions, Acids/Bases/Salts, Oxidation and Reduction, Hydrocarbons, and Petrochemicals relevant to Nigeria.

**For Biology:** Align with JAMB Biology syllabus including Cell Biology, Evolution, Genetics, Ecology (with Nigerian ecosystems), Diversity of Living Things, and Applied Biology relevant to Nigerian agriculture and health.

**For English Language:** Follow JAMB English syllabus covering Comprehension, Lexis and Structure, Oral Forms, and Written Forms using Nigerian English context and examples.

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
- Use appropriate Nigerian context and examples
- Include comprehensive explanations
- Use proper grammar and clear language
- Cover core syllabus areas for the subject`;

                try {
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
                            max_tokens: 3000,
                            temperature: 0.7
                        })
                    });

                    if (questionResponse.ok) {
                        const questionData = await questionResponse.json();
                        const generatedText = questionData.choices[0].message.content;
                        
                        // Parse JSON response
                        try {
                            const parsed = JSON.parse(generatedText);
                            if (parsed.questions && Array.isArray(parsed.questions)) {
                                allQuestions.push(...parsed.questions.map(q => ({ ...q, topic })));
                            }
                        } catch (parseError) {
                            console.error('JSON parse error for questions:', parseError);
                            // Try extracting JSON from text
                            const jsonMatch = generatedText.match(/{[\s\S]*}/);    
                            if (jsonMatch) {
                                try {
                                    const extracted = JSON.parse(jsonMatch[0]);
                                    if (extracted.questions) {
                                        allQuestions.push(...extracted.questions.map(q => ({ ...q, topic })));
                                    }
                                } catch (fallbackError) {
                                    console.error('Fallback parse failed:', fallbackError);
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Error generating questions for topic ${topic}:`, error);
                }
            }

            // Ensure we have exactly 50 questions (trim or pad as needed)
            const finalQuestions = allQuestions.slice(0, questionsPerSubject);
            
            if (finalQuestions.length === 0) {
                console.error(`No questions generated for ${subject}`);
                continue;
            }

            console.log(`Generated ${finalQuestions.length} questions for ${subject}`);

            // Create question set
            const questionSetData = {
                subject,
                title: `${subject} Questions - ${nigerianTime.toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}`,
                description: `Fresh set of ${finalQuestions.length} JAMB ${subject} questions delivered on ${nigerianTime.toLocaleDateString('en-NG')}`,
                delivery_date: deliveryDate,
                is_free: false, // First set per subject will be marked as free later
                total_questions: finalQuestions.length,
                generation_source: 'DeepSeek-AI'
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
                console.error(`Failed to create question set for ${subject}:`, errorText);
                continue;
            }

            const questionSet = await questionSetResponse.json();
            const questionSetId = questionSet[0].id;

            console.log(`Created question set for ${subject} with ID: ${questionSetId}`);

            // Save questions to database
            const savedQuestions = [];
            for (const q of finalQuestions) {
                const questionData = {
                    subject,
                    topic: q.topic || 'General',
                    difficulty_level: 2, // Medium difficulty
                    question_text: q.question_text,
                    option_a: q.option_a,
                    option_b: q.option_b,
                    option_c: q.option_c,
                    option_d: q.option_d,
                    correct_answer: q.correct_answer,
                    explanation: q.explanation,
                    source: 'DeepSeek-AI-Automated'
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

            // Link questions to question set
            for (let i = 0; i < savedQuestions.length; i++) {
                const linkData = {
                    question_set_id: questionSetId,
                    question_id: savedQuestions[i].id,
                    position: i + 1
                };

                await fetch(`${supabaseUrl}/rest/v1/question_set_questions`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(linkData)
                });
            }

            generatedSets.push({
                subject,
                questionSetId,
                questionsGenerated: savedQuestions.length
            });

            console.log(`Completed processing for ${subject}`);
        }

        // Mark first question sets as free for new users (this will be handled by the frontend logic)
        console.log('Automated question generation completed successfully');

        return new Response(JSON.stringify({
            data: {
                success: true,
                generatedSets,
                deliveryDate,
                message: `Generated ${generatedSets.length} question sets for delivery on ${deliveryDate}`
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Automated question generation error:', error);

        const errorResponse = {
            error: {
                code: 'AUTOMATED_GENERATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});