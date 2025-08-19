CREATE TABLE user_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    question_id UUID NOT NULL,
    selected_answer CHAR(1) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INTEGER DEFAULT 0,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text,
    NOW())
);