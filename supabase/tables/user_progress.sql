CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    subject VARCHAR(100) NOT NULL,
    total_questions_attempted INTEGER DEFAULT 0,
    total_questions_correct INTEGER DEFAULT 0,
    average_score FLOAT DEFAULT 0.0,
    weak_topics TEXT[],
    strong_topics TEXT[],
    last_practice_date DATE,
    study_streak INTEGER DEFAULT 0,
    predicted_jamb_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text,
    NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text,
    NOW())
);