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
        const { user_id } = await req.json();

        if (!user_id) {
            throw new Error('User ID is required');
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Supabase configuration missing');
        }

        // Get user answers from the last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        
        const answersResponse = await fetch(
            `${supabaseUrl}/rest/v1/user_answers?user_id=eq.${user_id}&answered_at=gte.${thirtyDaysAgo}&select=*,questions(subject,topic,difficulty_level)`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        if (!answersResponse.ok) {
            throw new Error('Failed to fetch user answers');
        }

        const userAnswers = await answersResponse.json();
        
        // Analyze performance by subject
        const performanceBySubject = {};
        const topicPerformance = {};
        
        userAnswers.forEach(answer => {
            const subject = answer.questions?.subject || 'Unknown';
            const topic = answer.questions?.topic || 'Unknown';
            const difficulty = answer.questions?.difficulty_level || 1;
            
            // Subject performance
            if (!performanceBySubject[subject]) {
                performanceBySubject[subject] = {
                    total: 0,
                    correct: 0,
                    averageTime: 0,
                    totalTime: 0
                };
            }
            
            performanceBySubject[subject].total++;
            performanceBySubject[subject].totalTime += answer.time_spent_seconds || 0;
            if (answer.is_correct) {
                performanceBySubject[subject].correct++;
            }
            
            // Topic performance
            const topicKey = `${subject}:${topic}`;
            if (!topicPerformance[topicKey]) {
                topicPerformance[topicKey] = {
                    subject,
                    topic,
                    total: 0,
                    correct: 0,
                    difficulty: difficulty
                };
            }
            
            topicPerformance[topicKey].total++;
            if (answer.is_correct) {
                topicPerformance[topicKey].correct++;
            }
        });
        
        // Calculate averages and identify weak/strong areas
        const subjectAnalysis = [];
        const weakTopics = [];
        const strongTopics = [];
        
        Object.keys(performanceBySubject).forEach(subject => {
            const perf = performanceBySubject[subject];
            const accuracy = perf.total > 0 ? (perf.correct / perf.total) * 100 : 0;
            const avgTime = perf.total > 0 ? perf.totalTime / perf.total : 0;
            
            subjectAnalysis.push({
                subject,
                accuracy: Math.round(accuracy * 100) / 100,
                totalQuestions: perf.total,
                correctAnswers: perf.correct,
                averageTimePerQuestion: Math.round(avgTime)
            });
        });
        
        Object.keys(topicPerformance).forEach(topicKey => {
            const perf = topicPerformance[topicKey];
            const accuracy = perf.total > 0 ? (perf.correct / perf.total) * 100 : 0;
            
            if (perf.total >= 3) { // Only consider topics with at least 3 attempts
                if (accuracy < 60) {
                    weakTopics.push({
                        subject: perf.subject,
                        topic: perf.topic,
                        accuracy: Math.round(accuracy * 100) / 100,
                        attempts: perf.total
                    });
                } else if (accuracy >= 80) {
                    strongTopics.push({
                        subject: perf.subject,
                        topic: perf.topic,
                        accuracy: Math.round(accuracy * 100) / 100,
                        attempts: perf.total
                    });
                }
            }
        });
        
        // Calculate predicted JAMB score
        const overallAccuracy = userAnswers.length > 0 
            ? (userAnswers.filter(a => a.is_correct).length / userAnswers.length) * 100 
            : 0;
        
        // JAMB scoring: 400 max points, roughly 4 points per correct answer out of 100 questions
        const predictedScore = Math.round((overallAccuracy / 100) * 400);
        
        // Generate recommendations
        const recommendations = generateRecommendations(subjectAnalysis, weakTopics, strongTopics);
        
        // Update user progress records
        for (const analysis of subjectAnalysis) {
            const progressData = {
                user_id,
                subject: analysis.subject,
                total_questions_attempted: analysis.totalQuestions,
                total_questions_correct: analysis.correctAnswers,
                average_score: analysis.accuracy,
                weak_topics: weakTopics.filter(w => w.subject === analysis.subject).map(w => w.topic),
                strong_topics: strongTopics.filter(s => s.subject === analysis.subject).map(s => s.topic),
                last_practice_date: new Date().toISOString().split('T')[0],
                predicted_jamb_score: predictedScore,
                updated_at: new Date().toISOString()
            };
            
            // Upsert progress record
            await fetch(`${supabaseUrl}/rest/v1/user_progress?user_id=eq.${user_id}&subject=eq.${analysis.subject}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(progressData)
            });
        }
        
        const analysisResult = {
            user_id,
            analysis_date: new Date().toISOString(),
            overall_accuracy: Math.round(overallAccuracy * 100) / 100,
            predicted_jamb_score: predictedScore,
            total_questions_attempted: userAnswers.length,
            subject_performance: subjectAnalysis,
            weak_topics: weakTopics,
            strong_topics: strongTopics,
            recommendations
        };
        
        return new Response(JSON.stringify({
            data: analysisResult
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Performance analysis error:', error);
        
        const errorResponse = {
            error: {
                code: 'ANALYSIS_FAILED',
                message: error.message
            }
        };
        
        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

function generateRecommendations(subjectAnalysis: any[], weakTopics: any[], strongTopics: any[]) {
    const recommendations = [];
    
    // General recommendations based on overall performance
    if (subjectAnalysis.length > 0) {
        const avgAccuracy = subjectAnalysis.reduce((sum, s) => sum + s.accuracy, 0) / subjectAnalysis.length;
        
        if (avgAccuracy < 50) {
            recommendations.push({
                type: 'study_plan',
                priority: 'high',
                message: 'Focus on building fundamental knowledge across all subjects. Consider reviewing basic concepts before attempting practice questions.'
            });
        } else if (avgAccuracy < 70) {
            recommendations.push({
                type: 'practice_increase',
                priority: 'medium',
                message: 'Increase daily practice time and focus on understanding explanations for incorrect answers.'
            });
        } else {
            recommendations.push({
                type: 'exam_readiness',
                priority: 'low',
                message: 'Great progress! Focus on maintaining consistency and tackling more challenging questions.'
            });
        }
    }
    
    // Subject-specific recommendations
    subjectAnalysis.forEach(subject => {
        if (subject.accuracy < 60) {
            recommendations.push({
                type: 'subject_focus',
                priority: 'high',
                message: `${subject.subject} needs significant improvement. Dedicate extra study time to this subject.`,
                subject: subject.subject
            });
        }
    });
    
    // Topic-specific recommendations
    if (weakTopics.length > 0) {
        const topWeakTopics = weakTopics.slice(0, 3);
        topWeakTopics.forEach(topic => {
            recommendations.push({
                type: 'topic_review',
                priority: 'medium',
                message: `Review ${topic.topic} in ${topic.subject}. Current accuracy: ${topic.accuracy}%`,
                subject: topic.subject,
                topic: topic.topic
            });
        });
    }
    
    return recommendations;
}