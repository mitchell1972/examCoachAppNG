// High-quality JAMB Mathematics questions covering diverse topics
export const mathQuestions = [
  {
    question_text: "If x² - 5x + 6 = 0, find the values of x.",
    option_a: "x = 2 or x = 3",
    option_b: "x = 1 or x = 6",
    option_c: "x = -2 or x = -3",
    option_d: "x = 0 or x = 5",
    correct_answer: "A",
    explanation: "Factoring x² - 5x + 6 = 0 gives (x-2)(x-3) = 0, so x = 2 or x = 3"
  },
  {
    question_text: "Find the area of a triangle with base 8cm and height 6cm.",
    option_a: "24 cm²",
    option_b: "48 cm²",
    option_c: "14 cm²",
    option_d: "28 cm²",
    correct_answer: "A",
    explanation: "Area of triangle = ½ × base × height = ½ × 8 × 6 = 24 cm²"
  },
  {
    question_text: "What is 30% of 150?",
    option_a: "45",
    option_b: "50",
    option_c: "35",
    option_d: "40",
    correct_answer: "A",
    explanation: "30% of 150 = 0.30 × 150 = 45"
  },
  {
    question_text: "Simplify: 2x + 3x - x",
    option_a: "4x",
    option_b: "6x",
    option_c: "5x",
    option_d: "3x",
    correct_answer: "A",
    explanation: "2x + 3x - x = (2 + 3 - 1)x = 4x"
  },
  {
    question_text: "If sin θ = 3/5, find cos θ (where θ is acute).",
    option_a: "4/5",
    option_b: "3/4",
    option_c: "5/4",
    option_d: "5/3",
    correct_answer: "A",
    explanation: "Using Pythagorean identity: cos²θ = 1 - sin²θ = 1 - 9/25 = 16/25, so cos θ = 4/5"
  }
];

// Continue with 45 more questions...
export function generateMathQuestionsData() {
  const additionalQuestions = [
    {
      question_text: "Find the mean of 4, 7, 9, 12, 8.",
      option_a: "8",
      option_b: "9",
      option_c: "7",
      option_d: "10",
      correct_answer: "A",
      explanation: "Mean = (4+7+9+12+8)/5 = 40/5 = 8"
    },
    {
      question_text: "What is the probability of getting a head when tossing a fair coin?",
      option_a: "1/2",
      option_b: "1/3",
      option_c: "2/3",
      option_d: "1/4",
      correct_answer: "A",
      explanation: "A fair coin has 2 equally likely outcomes (head or tail), so P(head) = 1/2"
    },
    {
      question_text: "Find the perimeter of a rectangle with length 12cm and width 8cm.",
      option_a: "40cm",
      option_b: "20cm",
      option_c: "96cm",
      option_d: "32cm",
      correct_answer: "A",
      explanation: "Perimeter = 2(length + width) = 2(12 + 8) = 2(20) = 40cm"
    },
    {
      question_text: "Solve for y: 3y - 7 = 14",
      option_a: "7",
      option_b: "5",
      option_c: "6",
      option_d: "8",
      correct_answer: "A",
      explanation: "3y - 7 = 14, so 3y = 21, therefore y = 7"
    },
    {
      question_text: "What is the volume of a cube with side length 4cm?",
      option_a: "64 cm³",
      option_b: "16 cm³",
      option_c: "48 cm³",
      option_d: "32 cm³",
      correct_answer: "A",
      explanation: "Volume of cube = side³ = 4³ = 64 cm³"
    }
  ];
  
  return [...mathQuestions, ...additionalQuestions];
}