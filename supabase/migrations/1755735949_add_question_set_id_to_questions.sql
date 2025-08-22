-- Migration: add_question_set_id_to_questions
-- Created at: 1755735949

-- Add question_set_id foreign key to questions table
ALTER TABLE questions ADD COLUMN question_set_id UUID REFERENCES question_sets(id);

-- Create index for better performance
CREATE INDEX idx_questions_question_set_id ON questions(question_set_id);

-- Update existing questions to link to the test question set if needed
-- (This is optional since we'll regenerate proper content);