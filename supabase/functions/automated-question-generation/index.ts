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
        const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
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

            // User's specific prompts for each subject with enhanced instructions
            let questionPrompt;
            switch(subject) {
                case 'Mathematics':
                    questionPrompt = `Generate 50 diverse and challenging mathematics JAMB questions for Nigerian students to practice. Cover these topics with varied difficulty:
                    
                    Topics to include:
                    - Algebra (equations, inequalities, word problems)
                    - Geometry (angles, areas, volumes)
                    - Trigonometry (basic ratios, identities)
                    - Statistics (mean, median, mode)
                    - Number theory (fractions, percentages)
                    - Coordinate geometry (distance, midpoint)
                    - Probability (basic events)
                    - Mensuration (perimeter, area)
                    
                    IMPORTANT: Each question must be DIFFERENT and realistic for JAMB exam. NO repetitive questions.`;
                    break;
                case 'English Language':
                    questionPrompt = `Generate 50 comprehensive English Language JAMB questions for Nigerian students covering:
                    
                    - Grammar (tenses, concord, voice)
                    - Vocabulary (synonyms, antonyms, word meaning)
                    - Reading comprehension passages
                    - Literature (Nigerian and international authors)
                    - Oral English (pronunciation, stress)
                    - Essay writing principles
                    - Lexis and structure
                    - Summary writing techniques
                    
                    Make each question unique and appropriate for West African examination standards.`;
                    break;
                case 'Physics':
                    questionPrompt = `Generate 50 comprehensive physics JAMB questions covering:
                    
                    - Mechanics (motion, forces, energy)
                    - Heat and thermodynamics
                    - Waves and sound
                    - Light and optics
                    - Electricity and magnetism
                    - Modern physics (atomic structure)
                    - Simple harmonic motion
                    - Gravitational field
                    
                    Include numerical problems with appropriate units and realistic scenarios.`;
                    break;
                case 'Chemistry':
                    questionPrompt = `Generate 50 diverse chemistry JAMB questions covering:
                    
                    - Atomic structure and bonding
                    - Periodic table and properties
                    - Chemical equations and stoichiometry
                    - Acids, bases and salts
                    - Organic chemistry (hydrocarbons, functional groups)
                    - Electrochemistry
                    - Chemical kinetics
                    - Qualitative analysis
                    
                    Include both theoretical concepts and practical applications.`;
                    break;
                case 'Biology':
                    questionPrompt = `Generate 50 comprehensive biology JAMB questions covering:
                    
                    - Cell biology and organization
                    - Genetics and heredity
                    - Evolution and classification
                    - Plant and animal physiology
                    - Ecology and environment
                    - Human anatomy and physiology
                    - Reproduction in plants and animals
                    - Biotechnology applications
                    
                    Focus on Nigerian biological examples where relevant.`;
                    break;
                default:
                    questionPrompt = `Generate 50 diverse ${subject} JAMB questions for Nigerian students covering the full curriculum with varied difficulty levels.`;
            }

            questionPrompt += `\n\nCRITICAL REQUIREMENTS:
            1. Generate EXACTLY 50 unique, non-repetitive questions
            2. Each question must be different from all others
            3. Cover diverse topics within the subject
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

            // Generate all 50 questions in one API call instead of splitting by topics
            const allQuestions = [];

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
                        max_tokens: 16000, // Increased significantly for 50 comprehensive questions
                        temperature: 0.7
                    })
                });

                if (questionResponse.ok) {
                    const questionData = await questionResponse.json();
                    const generatedText = questionData.choices[0].message.content;
                    
                    console.log(`Generated text length: ${generatedText.length} characters`);
                    
                    // Parse JSON response
                    try {
                        const parsed = JSON.parse(generatedText);
                        if (parsed.questions && Array.isArray(parsed.questions)) {
                            allQuestions.push(...parsed.questions.map(q => ({ ...q, topic: 'General' })));
                            console.log(`Successfully parsed ${parsed.questions.length} questions`);
                        }
                    } catch (parseError) {
                        console.error('JSON parse error for questions:', parseError);
                        console.log('Generated text:', generatedText.substring(0, 500) + '...');
                        
                        // Try extracting JSON from text
                        const jsonMatch = generatedText.match(/{[\s\S]*}/);
                        if (jsonMatch) {
                            try {
                                const extracted = JSON.parse(jsonMatch[0]);
                                if (extracted.questions && Array.isArray(extracted.questions)) {
                                    allQuestions.push(...extracted.questions.map(q => ({ ...q, topic: 'General' })));
                                    console.log(`Successfully extracted ${extracted.questions.length} questions from fallback parse`);
                                }
                            } catch (fallbackError) {
                                console.error('Fallback parse failed:', fallbackError);
                            }
                        }
                    }
                } else {
                    console.error('API response not ok:', questionResponse.status, questionResponse.statusText);
                }
            } catch (error) {
                console.error(`Error generating questions for ${subject}:`, error);
            }

            // Ensure we have exactly 50 questions
            console.log(`Total questions generated: ${allQuestions.length}`);
            
            if (allQuestions.length < questionsPerSubject) {
                console.warn(`Only generated ${allQuestions.length} out of ${questionsPerSubject} questions for ${subject}`);
            }
            
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

            // Save questions to database with question_set_id
            const savedQuestions = [];
            console.log(`Saving ${finalQuestions.length} questions to database...`);
            
            for (let i = 0; i < finalQuestions.length; i++) {
                const q = finalQuestions[i];
                
                // Validate question before saving
                if (!q.question_text || !q.option_a || !q.option_b || !q.option_c || !q.option_d || !q.correct_answer) {
                    console.warn(`Skipping invalid question ${i + 1}:`, q);
                    continue;
                }
                
                const questionData = {
                    subject,
                    topic: q.topic || 'General',
                    difficulty_level: 2, // Medium difficulty
                    question_text: q.question_text,
                    option_a: q.option_a,
                    option_b: q.option_b,
                    option_c: q.option_c,
                    option_d: q.option_d,
                    correct_answer: q.correct_answer.toUpperCase(),
                    explanation: q.explanation || `The correct answer is ${q.correct_answer}`,
                    source: 'DeepSeek-AI-Automated',
                    question_set_id: questionSetId, // Link to question set
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
                        
                        // Also insert into question_set_questions for linking
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
                        
                        console.log(`Saved question ${i + 1}/${finalQuestions.length}`);
                    } else {
                        const errorText = await insertResponse.text();
                        console.error(`Failed to save question ${i + 1}:`, errorText);
                    }
                } catch (saveError) {
                    console.error(`Error saving question ${i + 1}:`, saveError);
                }
            }

            // Update the question set with the actual number of saved questions
            await fetch(`${supabaseUrl}/rest/v1/question_sets?id=eq.${questionSetId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    total_questions: savedQuestions.length,
                    updated_at: new Date().toISOString()
                })
            });

            console.log(`Successfully saved ${savedQuestions.length} questions for ${subject}`);

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