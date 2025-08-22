-- Migration: add_sample_questions
-- Created at: 1755689199

INSERT INTO questions (subject, topic, difficulty_level, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, year, source, is_active, times_answered, correct_rate) VALUES 
('Mathematics', 'Trigonometry', 2, 'What is the value of sin(30°)?', '0.5', '0.707', '0.866', '1.0', 'A', 'sin(30°) = 1/2 = 0.5', 2024, 'JAMB', true, 0, 0.0),
('Mathematics', 'Algebra', 2, 'If 2x + 3 = 11, what is the value of x?', '2', '4', '6', '8', 'B', '2x = 11 - 3 = 8, so x = 4', 2024, 'JAMB', true, 0, 0.0),
('Mathematics', 'Geometry', 2, 'What is the area of a circle with radius 7cm?', '154 cm²', '44 cm²', '22 cm²', '308 cm²', 'A', 'Area = πr² = (22/7) × 7² = 154 cm²', 2024, 'JAMB', true, 0, 0.0),
('Mathematics', 'Algebra', 2, 'Simplify: (x² - 4)/(x - 2)', 'x + 2', 'x - 2', '2x', 'x²', 'A', '(x² - 4) = (x + 2)(x - 2)', 2024, 'JAMB', true, 0, 0.0),
('Mathematics', 'Sequences', 2, 'What is the next term in sequence: 2, 6, 18, 54?', '108', '162', '216', '324', 'B', 'Each term is multiplied by 3', 2024, 'JAMB', true, 0, 0.0),
('Physics', 'Electricity', 2, 'What is the unit of electric current?', 'Volt', 'Ampere', 'Ohm', 'Watt', 'B', 'The unit of electric current is Ampere', 2024, 'JAMB', true, 0, 0.0),
('Physics', 'Energy', 2, 'Which law states energy cannot be created or destroyed?', 'Newton first law', 'Law of conservation of energy', 'Ohms law', 'Hookes law', 'B', 'The law of conservation of energy', 2024, 'JAMB', true, 0, 0.0),
('Physics', 'Mechanics', 2, 'What is acceleration due to gravity on Earth?', '9.8 m/s²', '8.9 m/s²', '10.8 m/s²', '11.2 m/s²', 'A', 'Gravity is approximately 9.8 m/s²', 2024, 'JAMB', true, 0, 0.0),
('Physics', 'Mechanics', 2, 'Which of the following is a vector quantity?', 'Speed', 'Mass', 'Velocity', 'Energy', 'C', 'Velocity has magnitude and direction', 2024, 'JAMB', true, 0, 0.0),
('Physics', 'Optics', 2, 'What lens corrects short-sightedness?', 'Convex lens', 'Concave lens', 'Cylindrical lens', 'Bifocal lens', 'B', 'Concave lens corrects myopia', 2024, 'JAMB', true, 0, 0.0),
('Chemistry', 'Atomic Structure', 2, 'What is the atomic number of carbon?', '4', '6', '8', '12', 'B', 'Carbon has 6 protons', 2024, 'JAMB', true, 0, 0.0),
('Chemistry', 'Acids and Bases', 2, 'Which gas is produced when acid reacts with metal?', 'Oxygen', 'Carbon dioxide', 'Hydrogen', 'Nitrogen', 'C', 'Acid + metal produces hydrogen gas', 2024, 'JAMB', true, 0, 0.0),
('Chemistry', 'Chemical Formulas', 2, 'What is the chemical formula of water?', 'H2O', 'CO2', 'NaCl', 'CH4', 'A', 'Water is H2O', 2024, 'JAMB', true, 0, 0.0),
('Chemistry', 'Periodic Table', 2, 'Which is an alkali metal?', 'Iron', 'Sodium', 'Chlorine', 'Carbon', 'B', 'Sodium is in Group 1', 2024, 'JAMB', true, 0, 0.0),
('Chemistry', 'pH', 2, 'What is the pH of pure water at 25°C?', '5', '6', '7', '8', 'C', 'Pure water is neutral with pH 7', 2024, 'JAMB', true, 0, 0.0),
('Biology', 'Cell Biology', 2, 'Which organelle is the powerhouse of the cell?', 'Nucleus', 'Mitochondria', 'Ribosome', 'Vacuole', 'B', 'Mitochondria produce ATP', 2024, 'JAMB', true, 0, 0.0),
('Biology', 'Plant Biology', 2, 'What process do plants use to make food?', 'Respiration', 'Photosynthesis', 'Digestion', 'Excretion', 'B', 'Photosynthesis uses sunlight', 2024, 'JAMB', true, 0, 0.0),
('Biology', 'Circulatory System', 2, 'Which vessel carries blood from the heart?', 'Vein', 'Artery', 'Capillary', 'Venule', 'B', 'Arteries carry blood away from heart', 2024, 'JAMB', true, 0, 0.0),
('Biology', 'Genetics', 2, 'What is the basic unit of heredity?', 'Cell', 'Gene', 'Chromosome', 'DNA', 'B', 'Gene determines traits', 2024, 'JAMB', true, 0, 0.0),
('Biology', 'Body Systems', 2, 'Which system handles gas exchange?', 'Circulatory', 'Digestive', 'Respiratory', 'Nervous', 'C', 'Respiratory system exchanges gases', 2024, 'JAMB', true, 0, 0.0),
('English', 'Spelling', 2, 'Choose the correct spelling:', 'Occassion', 'Occasion', 'Ocasion', 'Ocassion', 'B', 'Correct spelling is Occasion', 2024, 'JAMB', true, 0, 0.0),
('English', 'Grammar', 2, 'What is the plural of child?', 'Childs', 'Childes', 'Children', 'Childrens', 'C', 'Irregular plural is children', 2024, 'JAMB', true, 0, 0.0),
('English', 'Literary Devices', 2, 'The classroom was a zoo is what figure of speech?', 'Simile', 'Metaphor', 'Personification', 'Alliteration', 'B', 'Direct comparison is metaphor', 2024, 'JAMB', true, 0, 0.0),
('English', 'Grammar', 2, 'What is the past tense of go?', 'Goed', 'Went', 'Gone', 'Going', 'B', 'Irregular verb: go-went-gone', 2024, 'JAMB', true, 0, 0.0),
('English', 'Parts of Speech', 2, 'What type of noun is happiness?', 'Concrete', 'Abstract', 'Collective', 'Proper', 'B', 'Happiness is an abstract concept', 2024, 'JAMB', true, 0, 0.0);;