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
        console.log('Starting Mathematics question insertion with 50 high-quality questions...');

        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        const subject = 'Mathematics';
        const deliveryDate = '2025-08-22';
        
        // High-quality diverse Mathematics questions
        const mathQuestions = [
            {
                question_text: "If x² - 5x + 6 = 0, find the values of x.",
                option_a: "x = 2 or x = 3",
                option_b: "x = 1 or x = 6",
                option_c: "x = -2 or x = -3",
                option_d: "x = 0 or x = 5",
                correct_answer: "A",
                explanation: "Factoring x² - 5x + 6 = 0 gives (x-2)(x-3) = 0, so x = 2 or x = 3"
            },
            {
                question_text: "Find the area of a triangle with base 8cm and height 6cm.",
                option_a: "24 cm²",
                option_b: "48 cm²",
                option_c: "14 cm²",
                option_d: "28 cm²",
                correct_answer: "A",
                explanation: "Area of triangle = ½ × base × height = ½ × 8 × 6 = 24 cm²"
            },
            {
                question_text: "What is 30% of 150?",
                option_a: "45",
                option_b: "50",
                option_c: "35",
                option_d: "40",
                correct_answer: "A",
                explanation: "30% of 150 = 0.30 × 150 = 45"
            },
            {
                question_text: "Simplify: 2x + 3x - x",
                option_a: "4x",
                option_b: "6x",
                option_c: "5x",
                option_d: "3x",
                correct_answer: "A",
                explanation: "2x + 3x - x = (2 + 3 - 1)x = 4x"
            },
            {
                question_text: "If sin θ = 3/5, find cos θ (where θ is acute).",
                option_a: "4/5",
                option_b: "3/4",
                option_c: "5/4",
                option_d: "5/3",
                correct_answer: "A",
                explanation: "Using Pythagorean identity: cos²θ = 1 - sin²θ = 1 - 9/25 = 16/25, so cos θ = 4/5"
            },
            {
                question_text: "Find the mean of 4, 7, 9, 12, 8.",
                option_a: "8",
                option_b: "9",
                option_c: "7",
                option_d: "10",
                correct_answer: "A",
                explanation: "Mean = (4+7+9+12+8)/5 = 40/5 = 8"
            },
            {
                question_text: "What is the probability of getting a head when tossing a fair coin?",
                option_a: "1/2",
                option_b: "1/3",
                option_c: "2/3",
                option_d: "1/4",
                correct_answer: "A",
                explanation: "A fair coin has 2 equally likely outcomes (head or tail), so P(head) = 1/2"
            },
            {
                question_text: "Find the perimeter of a rectangle with length 12cm and width 8cm.",
                option_a: "40cm",
                option_b: "20cm",
                option_c: "96cm",
                option_d: "32cm",
                correct_answer: "A",
                explanation: "Perimeter = 2(length + width) = 2(12 + 8) = 2(20) = 40cm"
            },
            {
                question_text: "Solve for y: 3y - 7 = 14",
                option_a: "7",
                option_b: "5",
                option_c: "6",
                option_d: "8",
                correct_answer: "A",
                explanation: "3y - 7 = 14, so 3y = 21, therefore y = 7"
            },
            {
                question_text: "What is the volume of a cube with side length 4cm?",
                option_a: "64 cm³",
                option_b: "16 cm³",
                option_c: "48 cm³",
                option_d: "32 cm³",
                correct_answer: "A",
                explanation: "Volume of cube = side³ = 4³ = 64 cm³"
            },
            {
                question_text: "Find the distance between points (1,2) and (4,6).",
                option_a: "5",
                option_b: "4",
                option_c: "6",
                option_d: "7",
                correct_answer: "A",
                explanation: "Distance = √[(4-1)² + (6-2)²] = √[9 + 16] = √25 = 5"
            },
            {
                question_text: "If log₂ 8 = x, find x.",
                option_a: "3",
                option_b: "2",
                option_c: "4",
                option_d: "8",
                correct_answer: "A",
                explanation: "log₂ 8 = x means 2ˣ = 8. Since 2³ = 8, x = 3"
            },
            {
                question_text: "Find the nth term of the sequence 3, 7, 11, 15, ...",
                option_a: "4n - 1",
                option_b: "3n + 4",
                option_c: "4n + 3",
                option_d: "n + 3",
                correct_answer: "A",
                explanation: "This is an arithmetic sequence with first term 3 and common difference 4. So nth term = 3 + (n-1)4 = 4n - 1"
            },
            {
                question_text: "Simplify: (x + 3)(x - 2)",
                option_a: "x² + x - 6",
                option_b: "x² - x + 6",
                option_c: "x² + 5x - 6",
                option_d: "x² - 5x + 6",
                correct_answer: "A",
                explanation: "(x + 3)(x - 2) = x² - 2x + 3x - 6 = x² + x - 6"
            },
            {
                question_text: "Find the median of 2, 8, 5, 11, 3, 9, 7.",
                option_a: "7",
                option_b: "6",
                option_c: "8",
                option_d: "5",
                correct_answer: "A",
                explanation: "Arranging in order: 2, 3, 5, 7, 8, 9, 11. The median is the middle value = 7"
            },
            {
                question_text: "Convert 0.75 to a fraction in lowest terms.",
                option_a: "3/4",
                option_b: "75/100",
                option_c: "15/20",
                option_d: "6/8",
                correct_answer: "A",
                explanation: "0.75 = 75/100 = 3/4 (dividing by 25)"
            },
            {
                question_text: "If 2ˣ = 32, find x.",
                option_a: "5",
                option_b: "4",
                option_c: "6",
                option_d: "16",
                correct_answer: "A",
                explanation: "2ˣ = 32 = 2⁵, so x = 5"
            },
            {
                question_text: "Find the circumference of a circle with radius 7cm. (Use π = 22/7)",
                option_a: "44cm",
                option_b: "22cm",
                option_c: "28cm",
                option_d: "14cm",
                correct_answer: "A",
                explanation: "Circumference = 2πr = 2 × (22/7) × 7 = 44cm"
            },
            {
                question_text: "Solve: |x - 3| = 5",
                option_a: "x = 8 or x = -2",
                option_b: "x = 8 or x = 2",
                option_c: "x = -8 or x = 2",
                option_d: "x = 3 or x = 5",
                correct_answer: "A",
                explanation: "|x - 3| = 5 means x - 3 = 5 or x - 3 = -5, so x = 8 or x = -2"
            },
            {
                question_text: "What is the slope of the line passing through (2,1) and (6,9)?",
                option_a: "2",
                option_b: "1/2",
                option_c: "4",
                option_d: "1/4",
                correct_answer: "A",
                explanation: "Slope = (y₂-y₁)/(x₂-x₁) = (9-1)/(6-2) = 8/4 = 2"
            }
        ];
        
        // Add 30 more questions to reach exactly 50
        const additionalQuestions = [
            {
                question_text: "Find the value of x in 2x + 5 = 17.",
                option_a: "6",
                option_b: "11",
                option_c: "7",
                option_d: "5",
                correct_answer: "A",
                explanation: "2x + 5 = 17, so 2x = 12, therefore x = 6"
            },
            {
                question_text: "What is 25% of 80?",
                option_a: "20",
                option_b: "25",
                option_c: "15",
                option_d: "30",
                correct_answer: "A",
                explanation: "25% of 80 = 0.25 × 80 = 20"
            },
            {
                question_text: "Find the area of a square with side length 9cm.",
                option_a: "81 cm²",
                option_b: "36 cm²",
                option_c: "18 cm²",
                option_d: "45 cm²",
                correct_answer: "A",
                explanation: "Area of square = side² = 9² = 81 cm²"
            },
            {
                question_text: "Simplify: 3(x + 4) - 2x",
                option_a: "x + 12",
                option_b: "5x + 12",
                option_c: "x + 6",
                option_d: "3x + 8",
                correct_answer: "A",
                explanation: "3(x + 4) - 2x = 3x + 12 - 2x = x + 12"
            },
            {
                question_text: "If cos 60° = 1/2, find sin 60°.",
                option_a: "√3/2",
                option_b: "1/2",
                option_c: "√2/2",
                option_d: "1",
                correct_answer: "A",
                explanation: "Using sin²θ + cos²θ = 1: sin²60° = 1 - (1/2)² = 3/4, so sin 60° = √3/2"
            },
            {
                question_text: "Find the mode of: 3, 7, 3, 9, 3, 5, 7",
                option_a: "3",
                option_b: "7",
                option_c: "5",
                option_d: "9",
                correct_answer: "A",
                explanation: "The mode is the most frequently occurring value. 3 appears 3 times, more than any other number"
            },
            {
                question_text: "What is the probability of rolling a 4 on a fair six-sided die?",
                option_a: "1/6",
                option_b: "1/4",
                option_c: "4/6",
                option_d: "1/3",
                correct_answer: "A",
                explanation: "There is 1 favorable outcome (rolling a 4) out of 6 possible outcomes, so P = 1/6"
            },
            {
                question_text: "Find the diagonal of a rectangle with length 12cm and width 5cm.",
                option_a: "13cm",
                option_b: "17cm",
                option_c: "10cm",
                option_d: "7cm",
                correct_answer: "A",
                explanation: "Using Pythagorean theorem: diagonal = √(12² + 5²) = √(144 + 25) = √169 = 13cm"
            },
            {
                question_text: "Solve for z: 4z - 9 = 23",
                option_a: "8",
                option_b: "9",
                option_c: "7",
                option_d: "6",
                correct_answer: "A",
                explanation: "4z - 9 = 23, so 4z = 32, therefore z = 8"
            },
            {
                question_text: "What is the surface area of a cube with side length 3cm?",
                option_a: "54 cm²",
                option_b: "27 cm²",
                option_c: "36 cm²",
                option_d: "18 cm²",
                correct_answer: "A",
                explanation: "Surface area of cube = 6 × side² = 6 × 3² = 6 × 9 = 54 cm²"
            },
            {
                question_text: "Find the midpoint of the line segment joining (1,3) and (7,11).",
                option_a: "(4,7)",
                option_b: "(3,5)",
                option_c: "(6,8)",
                option_d: "(8,14)",
                correct_answer: "A",
                explanation: "Midpoint = ((1+7)/2, (3+11)/2) = (8/2, 14/2) = (4,7)"
            },
            {
                question_text: "If log₁₀ 100 = x, find x.",
                option_a: "2",
                option_b: "10",
                option_c: "100",
                option_d: "1",
                correct_answer: "A",
                explanation: "log₁₀ 100 = x means 10ˣ = 100. Since 10² = 100, x = 2"
            },
            {
                question_text: "Find the sum of the first 5 terms of the series 2, 6, 10, 14, ...",
                option_a: "50",
                option_b: "40",
                option_c: "60",
                option_d: "45",
                correct_answer: "A",
                explanation: "This is arithmetic series with a₁=2, d=4. Terms: 2,6,10,14,18. Sum = 2+6+10+14+18 = 50"
            },
            {
                question_text: "Expand: (2x - 3)²",
                option_a: "4x² - 12x + 9",
                option_b: "4x² + 9",
                option_c: "4x² - 6x + 9",
                option_d: "2x² - 12x + 9",
                correct_answer: "A",
                explanation: "(2x - 3)² = (2x)² - 2(2x)(3) + 3² = 4x² - 12x + 9"
            },
            {
                question_text: "Find the range of: 8, 3, 12, 7, 15, 2, 10",
                option_a: "13",
                option_b: "10",
                option_c: "8",
                option_d: "15",
                correct_answer: "A",
                explanation: "Range = maximum - minimum = 15 - 2 = 13"
            },
            {
                question_text: "Convert 7/8 to a decimal.",
                option_a: "0.875",
                option_b: "0.78",
                option_c: "0.87",
                option_d: "0.8",
                correct_answer: "A",
                explanation: "7 ÷ 8 = 0.875"
            },
            {
                question_text: "If 3ˣ = 81, find x.",
                option_a: "4",
                option_b: "3",
                option_c: "27",
                option_d: "5",
                correct_answer: "A",
                explanation: "3ˣ = 81 = 3⁴, so x = 4"
            },
            {
                question_text: "Find the area of a circle with diameter 14cm. (Use π = 22/7)",
                option_a: "154 cm²",
                option_b: "44 cm²",
                option_c: "22 cm²",
                option_d: "77 cm²",
                correct_answer: "A",
                explanation: "Radius = 14/2 = 7cm. Area = πr² = (22/7) × 7² = (22/7) × 49 = 154 cm²"
            },
            {
                question_text: "Solve: |2x + 1| = 7",
                option_a: "x = 3 or x = -4",
                option_b: "x = 3 or x = 4",
                option_c: "x = -3 or x = 4",
                option_d: "x = 2 or x = -3",
                correct_answer: "A",
                explanation: "|2x + 1| = 7 means 2x + 1 = 7 or 2x + 1 = -7, so x = 3 or x = -4"
            },
            {
                question_text: "What is the y-intercept of the line y = 3x - 5?",
                option_a: "-5",
                option_b: "3",
                option_c: "5",
                option_d: "0",
                correct_answer: "A",
                explanation: "The y-intercept occurs when x = 0. Substituting: y = 3(0) - 5 = -5"
            },
            {
                question_text: "If f(x) = 2x + 3, find f(4).",
                option_a: "11",
                option_b: "8",
                option_c: "9",
                option_d: "7",
                correct_answer: "A",
                explanation: "f(4) = 2(4) + 3 = 8 + 3 = 11"
            },
            {
                question_text: "Find the value of x in the equation x/3 + 2 = 7.",
                option_a: "15",
                option_b: "21",
                option_c: "9",
                option_d: "12",
                correct_answer: "A",
                explanation: "x/3 + 2 = 7, so x/3 = 5, therefore x = 15"
            },
            {
                question_text: "What is 15% of 200?",
                option_a: "30",
                option_b: "25",
                option_c: "35",
                option_d: "20",
                correct_answer: "A",
                explanation: "15% of 200 = 0.15 × 200 = 30"
            },
            {
                question_text: "Find the area of a parallelogram with base 10cm and height 7cm.",
                option_a: "70 cm²",
                option_b: "17 cm²",
                option_c: "35 cm²",
                option_d: "34 cm²",
                correct_answer: "A",
                explanation: "Area of parallelogram = base × height = 10 × 7 = 70 cm²"
            },
            {
                question_text: "Simplify: 5x - 2x + 3x",
                option_a: "6x",
                option_b: "10x",
                option_c: "0",
                option_d: "3x",
                correct_answer: "A",
                explanation: "5x - 2x + 3x = (5 - 2 + 3)x = 6x"
            },
            {
                question_text: "If tan 45° = 1, find sec 45°.",
                option_a: "√2",
                option_b: "1",
                option_c: "1/√2",
                option_d: "2",
                correct_answer: "A",
                explanation: "Since tan 45° = 1 and sin 45° = cos 45° = 1/√2, sec 45° = 1/cos 45° = 1/(1/√2) = √2"
            },
            {
                question_text: "Find the variance of the data set: 2, 4, 6, 8.",
                option_a: "5",
                option_b: "4",
                option_c: "6",
                option_d: "3",
                correct_answer: "A",
                explanation: "Mean = (2+4+6+8)/4 = 5. Variance = [(2-5)²+(4-5)²+(6-5)²+(8-5)²]/4 = [9+1+1+9]/4 = 5"
            },
            {
                question_text: "What is the probability of drawing a red card from a standard 52-card deck?",
                option_a: "1/2",
                option_b: "1/4",
                option_c: "26/52",
                option_d: "13/52",
                correct_answer: "A",
                explanation: "There are 26 red cards (13 hearts + 13 diamonds) out of 52 total cards, so P = 26/52 = 1/2"
            },
            {
                question_text: "Find the length of the hypotenuse of a right triangle with legs 9cm and 12cm.",
                option_a: "15cm",
                option_b: "21cm",
                option_c: "18cm",
                option_d: "3cm",
                correct_answer: "A",
                explanation: "Using Pythagorean theorem: c² = 9² + 12² = 81 + 144 = 225, so c = 15cm"
            },
            {
                question_text: "Solve for w: 6w + 4 = 34",
                option_a: "5",
                option_b: "6",
                option_c: "4",
                option_d: "7",
                correct_answer: "A",
                explanation: "6w + 4 = 34, so 6w = 30, therefore w = 5"
            }
        ];
        
        const allQuestions = [...mathQuestions, ...additionalQuestions];
        console.log(`Total questions prepared: ${allQuestions.length}`);

        // Delete existing Mathematics question set and questions for today
        const existingSetResponse = await fetch(`${supabaseUrl}/rest/v1/question_sets?subject=eq.Mathematics&delivery_date=eq.${deliveryDate}`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        if (existingSetResponse.ok) {
            const existingSets = await existingSetResponse.json();
            for (const existingSet of existingSets) {
                // Delete associated questions
                await fetch(`${supabaseUrl}/rest/v1/questions?question_set_id=eq.${existingSet.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });
                
                // Delete question set links
                await fetch(`${supabaseUrl}/rest/v1/question_set_questions?question_set_id=eq.${existingSet.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });
                
                // Delete question set
                await fetch(`${supabaseUrl}/rest/v1/question_sets?id=eq.${existingSet.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });
            }
            console.log(`Cleaned up ${existingSets.length} existing Mathematics question sets`);
        }

        // Create new question set
        const questionSetData = {
            subject: subject,
            title: `${subject} - 50 Questions`,
            description: `Complete set of 50 high-quality JAMB ${subject} questions covering diverse topics including algebra, geometry, trigonometry, statistics, and more`,
            delivery_date: deliveryDate,
            is_free: true,
            total_questions: 50,
            generation_source: 'High-Quality-Manual',
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

        console.log(`Created new Mathematics question set with ID: ${questionSetId}`);

        // Save all 50 questions
        const savedQuestions = [];
        for (let i = 0; i < allQuestions.length; i++) {
            const q = allQuestions[i];
            
            const questionData = {
                subject: subject,
                topic: 'General Mathematics',
                difficulty_level: 2,
                question_text: q.question_text,
                option_a: q.option_a,
                option_b: q.option_b,
                option_c: q.option_c,
                option_d: q.option_d,
                correct_answer: q.correct_answer.toUpperCase(),
                explanation: q.explanation,
                source: 'High-Quality-Manual',
                question_set_id: questionSetId,
                is_active: true,
                times_answered: 0,
                correct_rate: 0
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
                    console.log(`Saved ${i + 1} questions...`);
                }
            } else {
                const errorText = await insertResponse.text();
                console.error(`Failed to save question ${i + 1}:`, errorText);
            }
        }

        console.log(`Successfully created Mathematics question set with ${savedQuestions.length} questions`);

        return new Response(JSON.stringify({
            data: {
                success: true,
                subject: subject,
                questionSetId,
                questionsSaved: savedQuestions.length,
                message: `Successfully created ${savedQuestions.length} high-quality Mathematics questions`
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Mathematics questions creation error:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'MATH_QUESTIONS_CREATION_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});