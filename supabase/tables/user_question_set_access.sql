CREATE TABLE user_question_set_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    question_set_id UUID NOT NULL,
    can_access BOOLEAN DEFAULT false,
    accessed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text,
    NOW()),
    UNIQUE(user_id,
    question_set_id)
);