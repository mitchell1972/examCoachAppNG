CREATE TABLE ai_content_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(100) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    topic VARCHAR(255),
    prompt_used TEXT NOT NULL,
    generated_content JSONB,
    quality_score FLOAT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text,
    NOW())
);