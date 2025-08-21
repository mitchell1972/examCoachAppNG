CREATE TABLE question_set_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_set_id UUID NOT NULL,
    question_id UUID NOT NULL,
    position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text,
    NOW())
);