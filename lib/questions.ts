import { Question } from '@/types/game';

// Question database - can be expanded significantly
export const questions: Question[] = [
  {
    id: 'q1',
    text: 'What percentage of the human body is made up of water?',
    category: 'Biology',
    difficulty: 'easy',
    options: ['30-40%', '50-60%', '60-70%', '80-90%'],
    correctAnswer: 2,
    explanation: 'The human body is approximately 60-70% water, varying by age, sex, and body composition.'
  },
  {
    id: 'q2',
    text: 'How long does it take for light from the Sun to reach Earth?',
    category: 'Physics',
    difficulty: 'medium',
    options: ['8 seconds', '8 minutes', '8 hours', '8 days'],
    correctAnswer: 1,
    explanation: 'Light from the Sun takes approximately 8 minutes and 20 seconds to reach Earth, traveling at 299,792 km/s.'
  },
  {
    id: 'q3',
    text: 'What is the most abundant gas in Earth\'s atmosphere?',
    category: 'Earth Science',
    difficulty: 'easy',
    options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Argon'],
    correctAnswer: 2,
    explanation: 'Nitrogen makes up about 78% of Earth\'s atmosphere, while oxygen is around 21%.'
  },
  {
    id: 'q4',
    text: 'At what temperature are Celsius and Fahrenheit equal?',
    category: 'Physics',
    difficulty: 'hard',
    options: ['-40°', '-20°', '0°', '-273°'],
    correctAnswer: 0,
    explanation: 'At -40 degrees, both Celsius and Fahrenheit scales show the same value.'
  },
  {
    id: 'q5',
    text: 'How many bones does an adult human have?',
    category: 'Biology',
    difficulty: 'medium',
    options: ['186', '206', '226', '246'],
    correctAnswer: 1,
    explanation: 'Adults have 206 bones, while babies are born with about 270 that fuse together as they grow.'
  },
  {
    id: 'q6',
    text: 'What is the speed of sound at sea level?',
    category: 'Physics',
    difficulty: 'medium',
    options: ['343 m/s', '500 m/s', '1000 m/s', '1500 m/s'],
    correctAnswer: 0,
    explanation: 'Sound travels at approximately 343 meters per second (1,235 km/h) at sea level and 20°C.'
  },
  {
    id: 'q7',
    text: 'What is the pH of pure water?',
    category: 'Chemistry',
    difficulty: 'easy',
    options: ['5', '7', '9', '11'],
    correctAnswer: 1,
    explanation: 'Pure water has a pH of 7, which is neutral - neither acidic nor basic.'
  },
  {
    id: 'q8',
    text: 'How many planets in our solar system have rings?',
    category: 'Astronomy',
    difficulty: 'hard',
    options: ['1', '2', '4', '6'],
    correctAnswer: 2,
    explanation: 'Four planets have rings: Jupiter, Saturn, Uranus, and Neptune. Saturn\'s are the most visible.'
  },
  {
    id: 'q9',
    text: 'What is the smallest unit of life?',
    category: 'Biology',
    difficulty: 'easy',
    options: ['Atom', 'Molecule', 'Cell', 'Organism'],
    correctAnswer: 2,
    explanation: 'The cell is the smallest unit of life that can function independently.'
  },
  {
    id: 'q10',
    text: 'How many hearts does an octopus have?',
    category: 'Biology',
    difficulty: 'medium',
    options: ['1', '2', '3', '4'],
    correctAnswer: 2,
    explanation: 'Octopuses have three hearts: two pump blood to the gills, and one pumps it to the rest of the body.'
  },
  {
    id: 'q11',
    text: 'What is the chemical symbol for gold?',
    category: 'Chemistry',
    difficulty: 'easy',
    options: ['Go', 'Gd', 'Au', 'Ag'],
    correctAnswer: 2,
    explanation: 'Au comes from the Latin word "aurum" meaning gold.'
  },
  {
    id: 'q12',
    text: 'How long is one day on Mars?',
    category: 'Astronomy',
    difficulty: 'hard',
    options: ['20 hours', '24 hours', '24.6 hours', '30 hours'],
    correctAnswer: 2,
    explanation: 'A day on Mars (called a "sol") is 24 hours, 39 minutes, and 35 seconds.'
  },
  {
    id: 'q13',
    text: 'What is the hardest natural substance on Earth?',
    category: 'Geology',
    difficulty: 'easy',
    options: ['Steel', 'Diamond', 'Titanium', 'Granite'],
    correctAnswer: 1,
    explanation: 'Diamond is the hardest naturally occurring substance, rating 10 on the Mohs scale.'
  },
  {
    id: 'q14',
    text: 'How many teeth does an adult human typically have?',
    category: 'Biology',
    difficulty: 'easy',
    options: ['28', '30', '32', '34'],
    correctAnswer: 2,
    explanation: 'Adults typically have 32 teeth, including 4 wisdom teeth.'
  },
  {
    id: 'q15',
    text: 'What percentage of DNA do humans share with chimpanzees?',
    category: 'Biology',
    difficulty: 'medium',
    options: ['85%', '90%', '98%', '99.5%'],
    correctAnswer: 2,
    explanation: 'Humans and chimpanzees share approximately 98-99% of their DNA.'
  },
  {
    id: 'q16',
    text: 'What is the smallest bone in the human body?',
    category: 'Biology',
    difficulty: 'medium',
    options: ['Stapes (in ear)', 'Finger bone', 'Toe bone', 'Nose bone'],
    correctAnswer: 0,
    explanation: 'The stapes in the middle ear is the smallest bone, measuring about 2.8mm.'
  },
  {
    id: 'q17',
    text: 'How many Earths could fit inside the Sun?',
    category: 'Astronomy',
    difficulty: 'hard',
    options: ['1,000', '10,000', '100,000', '1,300,000'],
    correctAnswer: 3,
    explanation: 'The Sun is so large that approximately 1.3 million Earths could fit inside it.'
  },
  {
    id: 'q18',
    text: 'What is the boiling point of water at sea level in Fahrenheit?',
    category: 'Physics',
    difficulty: 'easy',
    options: ['180°F', '212°F', '232°F', '100°F'],
    correctAnswer: 1,
    explanation: 'Water boils at 212°F (100°C) at sea level under normal atmospheric pressure.'
  },
  {
    id: 'q19',
    text: 'Which element has the atomic number 1?',
    category: 'Chemistry',
    difficulty: 'easy',
    options: ['Helium', 'Oxygen', 'Hydrogen', 'Carbon'],
    correctAnswer: 2,
    explanation: 'Hydrogen is the first element on the periodic table with atomic number 1.'
  },
  {
    id: 'q20',
    text: 'How long does it take for the Moon to orbit Earth?',
    category: 'Astronomy',
    difficulty: 'medium',
    options: ['7 days', '14 days', '27.3 days', '30 days'],
    correctAnswer: 2,
    explanation: 'The Moon takes 27.3 days to complete one orbit around Earth (sidereal month).'
  },
  {
    id: 'q21',
    text: 'What percentage of air is oxygen?',
    category: 'Chemistry',
    difficulty: 'medium',
    options: ['10%', '21%', '35%', '50%'],
    correctAnswer: 1,
    explanation: 'Oxygen makes up approximately 21% of Earth\'s atmosphere.'
  },
  {
    id: 'q22',
    text: 'What is the largest organ in the human body?',
    category: 'Biology',
    difficulty: 'easy',
    options: ['Heart', 'Brain', 'Liver', 'Skin'],
    correctAnswer: 3,
    explanation: 'The skin is the largest organ, covering about 20 square feet in adults.'
  },
  {
    id: 'q23',
    text: 'At what age does the human brain stop developing?',
    category: 'Biology',
    difficulty: 'hard',
    options: ['18 years', '21 years', '25 years', '30 years'],
    correctAnswer: 2,
    explanation: 'The prefrontal cortex continues developing until around age 25.'
  },
  {
    id: 'q24',
    text: 'What is the speed of light in a vacuum?',
    category: 'Physics',
    difficulty: 'hard',
    options: ['299,792 km/s', '300,000 km/s', '250,000 km/s', '350,000 km/s'],
    correctAnswer: 0,
    explanation: 'Light travels at exactly 299,792,458 meters per second in a vacuum.'
  },
  {
    id: 'q25',
    text: 'How many chromosomes do humans have?',
    category: 'Biology',
    difficulty: 'medium',
    options: ['23', '46', '92', '100'],
    correctAnswer: 1,
    explanation: 'Humans have 46 chromosomes (23 pairs) in each cell, except sex cells which have 23.'
  },
  {
    id: 'q26',
    text: 'What is the closest star to Earth (besides the Sun)?',
    category: 'Astronomy',
    difficulty: 'medium',
    options: ['Alpha Centauri', 'Proxima Centauri', 'Sirius', 'Betelgeuse'],
    correctAnswer: 1,
    explanation: 'Proxima Centauri is 4.24 light-years away, the closest star to our solar system.'
  },
  {
    id: 'q27',
    text: 'What is absolute zero in Celsius?',
    category: 'Physics',
    difficulty: 'hard',
    options: ['-273.15°C', '-300°C', '-200°C', '-173.15°C'],
    correctAnswer: 0,
    explanation: 'Absolute zero is -273.15°C (-459.67°F or 0 Kelvin), the lowest possible temperature.'
  },
  {
    id: 'q28',
    text: 'How many elements are on the periodic table?',
    category: 'Chemistry',
    difficulty: 'medium',
    options: ['92', '104', '118', '128'],
    correctAnswer: 2,
    explanation: 'As of 2024, there are 118 confirmed elements on the periodic table.'
  },
  {
    id: 'q29',
    text: 'What force keeps planets in orbit around the Sun?',
    category: 'Physics',
    difficulty: 'easy',
    options: ['Magnetism', 'Gravity', 'Momentum', 'Friction'],
    correctAnswer: 1,
    explanation: 'Gravity is the force that keeps planets in their orbits around the Sun.'
  },
  {
    id: 'q30',
    text: 'How many legs does a spider have?',
    category: 'Biology',
    difficulty: 'easy',
    options: ['6', '8', '10', '12'],
    correctAnswer: 1,
    explanation: 'Spiders are arachnids and have 8 legs, unlike insects which have 6.'
  },
  {
    id: 'q31',
    text: 'What is the largest planet in our solar system?',
    category: 'Astronomy',
    difficulty: 'easy',
    options: ['Saturn', 'Jupiter', 'Neptune', 'Earth'],
    correctAnswer: 1,
    explanation: 'Jupiter is the largest planet, with a mass greater than all other planets combined.'
  },
  {
    id: 'q32',
    text: 'How many chambers does the human heart have?',
    category: 'Biology',
    difficulty: 'easy',
    options: ['2', '3', '4', '5'],
    correctAnswer: 2,
    explanation: 'The heart has 4 chambers: 2 atria (upper) and 2 ventricles (lower).'
  },
  {
    id: 'q33',
    text: 'What gas do plants absorb from the atmosphere?',
    category: 'Biology',
    difficulty: 'easy',
    options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Helium'],
    correctAnswer: 2,
    explanation: 'Plants absorb carbon dioxide (CO₂) and release oxygen during photosynthesis.'
  },
  {
    id: 'q34',
    text: 'What is the chemical formula for table salt?',
    category: 'Chemistry',
    difficulty: 'medium',
    options: ['NaCl', 'KCl', 'CaCl₂', 'NaOH'],
    correctAnswer: 0,
    explanation: 'Table salt is sodium chloride with the chemical formula NaCl.'
  },
  {
    id: 'q35',
    text: 'How many years does it take for Pluto to orbit the Sun?',
    category: 'Astronomy',
    difficulty: 'hard',
    options: ['84 years', '165 years', '248 years', '365 years'],
    correctAnswer: 2,
    explanation: 'Pluto takes about 248 Earth years to complete one orbit around the Sun.'
  },
];

export function getRandomQuestions(count: number): Question[] {
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, questions.length));
}

export function getQuestionById(id: string): Question | undefined {
  return questions.find(q => q.id === id);
}
