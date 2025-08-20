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
    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!deepseekApiKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    // Subject-specific JAMB syllabus prompts
    const subjects = {
      'Mathematics': 'Nigerian JAMB Mathematics syllabus topics: Algebra, Trigonometry, Calculus, Statistics, Geometry, Number Theory, Logarithms, Indices, Sequences and Series, Linear Programming, Probability',
      'Physics': 'Nigerian JAMB Physics syllabus topics: Mechanics, Heat and Thermodynamics, Waves and Sound, Light, Electricity and Magnetism, Modern Physics, Atomic Structure, Motion in a Plane, Work Energy and Power',
      'Chemistry': 'Nigerian JAMB Chemistry syllabus topics: Separation of Mixtures, Atomic Structure, Chemical Bonding, Acids Bases and Salts, Hydrocarbons, Nigerian Petrochemicals, Periodic Table, Chemical Equilibrium, Electrochemistry',
      'Biology': 'Nigerian JAMB Biology syllabus topics: Cell Biology, Genetics, Evolution, Ecology, Plant and Animal Physiology, Reproduction, Classification of Living Things, Nutrition, Transport Systems, Coordination and Control',
      'English': 'Nigerian JAMB English syllabus topics: Comprehension, Lexis and Structure, Summary Writing, Oral English, Register, Figures of Speech, Sentence Types, Parts of Speech, Punctuation, Essay Writing'
    };

    const questionsPerSubject = 20;
    let totalGenerated = 0;

    // Clear existing daily questions
    const clearResponse = await fetch(`${supabaseUrl}/rest/v1/daily_questions`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Content-Type': 'application/json'
      }
    });

    console.log('Cleared existing questions');

    // Generate questions for each subject
    for (const [subject, syllabusTopics] of Object.entries(subjects)) {
      const prompt = `Generate exactly ${questionsPerSubject} multiple choice questions for Nigerian JAMB ${subject} examination.
      
Topics to focus on: ${syllabusTopics}
      
Requirements:
      - Each question must be relevant to Nigerian JAMB syllabus
      - Include 4 options (A, B, C, D)
      - Mark the correct answer
      - Questions should be at JAMB difficulty level
      - Cover different topics from the syllabus
      
RETURN ONLY VALID JSON with this exact structure:
{
  "questions": [
    {
      "question": "question text",
      "option_a": "first option",
      "option_b": "second option", 
      "option_c": "third option",
      "option_d": "fourth option",
      "correct_answer": "A",
      "explanation": "brief explanation"
    }
  ]
}

Generate exactly ${questionsPerSubject} questions in the array.`;

      try {
        const deepseekResponse = await fetch(
          'https://api.deepseek.com/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${deepseekApiKey}`
            },
            body: JSON.stringify({
              model: 'deepseek-chat',
              messages: [{
                role: 'user',
                content: prompt
              }],
              response_format: { type: 'json_object' }
            })
          }
        );

        if (!deepseekResponse.ok) {
          throw new Error(`DeepSeek API error: ${deepseekResponse.status}`);
        }

        const deepseekData = await deepseekResponse.json();
        const generatedText = deepseekData.choices[0].message.content;
        
        // Parse and clean JSON response
        let questions = [];
        try {
          const parsed = JSON.parse(generatedText);
          if (parsed.questions && Array.isArray(parsed.questions)) {
            questions = parsed.questions;
          } else if (Array.isArray(parsed)) {
            questions = parsed;
          } else {
            console.log('Unexpected response format from AI for', subject);
          }
        } catch (parseError) {
          // Fallback: clean and parse JSON
          const cleanedText = generatedText.replace(/```json|```/g, '').trim();
          try {
            const parsed = JSON.parse(cleanedText);
            questions = parsed.questions || parsed;
          } catch (e) {
            console.log('Could not parse AI response as JSON for', subject);
          }
        }

        // Only process if we have questions
        if (questions.length === 0) {
          console.log(`No questions generated for ${subject}, skipping...`);
          continue;
        }

        // Insert questions into database
        const questionsToInsert = questions.map((q: any) => ({
          subject: subject,
          question: q.question,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          difficulty: 'medium',
          generated_at: new Date().toISOString()
        }));

        const insertResponse = await fetch(`${supabaseUrl}/rest/v1/daily_questions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(questionsToInsert)
        });

        if (!insertResponse.ok) {
          throw new Error(`Database insert error for ${subject}: ${insertResponse.status}`);
        }

        totalGenerated += questions.length;
        console.log(`Generated ${questions.length} questions for ${subject}`);

      } catch (subjectError) {
        console.error(`Error generating questions for ${subject}:`, subjectError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully generated ${totalGenerated} questions across all subjects`,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'GENERATION_ERROR',
          message: error.message
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});