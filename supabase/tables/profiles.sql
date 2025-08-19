CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'student',
    school_name VARCHAR(255),
    state VARCHAR(100),
    target_score INTEGER DEFAULT 0,
    preferred_subjects TEXT[],
    study_streak INTEGER DEFAULT 0,
    total_practice_time INTEGER DEFAULT 0,
    last_activity_date DATE,
    jamb_year INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text,
    NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text,
    NOW())
);