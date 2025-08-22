CREATE TABLE practice_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    subject VARCHAR(100) NOT NULL,
    questions_attempted INTEGER DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    total_time_seconds INTEGER DEFAULT 0,
    score_percentage FLOAT DEFAULT 0.0,
    session_type VARCHAR(50) DEFAULT 'practice',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text,
    NOW()),
    completed_at TIMESTAMP WITH TIME ZONE
);