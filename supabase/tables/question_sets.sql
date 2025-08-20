CREATE TABLE question_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text,
    NOW()),
    is_free BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    generation_source VARCHAR(100) DEFAULT 'AI-generated',
    total_questions INTEGER DEFAULT 0,
    delivery_date DATE NOT NULL
);