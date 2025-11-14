import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getRandomQuestions, getQuestionById, questions } from '@/lib/questions';

// Mock the AI generators
vi.mock('@/lib/gemini-question-generator', () => ({
  generateQuestionsWithGemini: vi.fn(),
}));

vi.mock('@/lib/openai-question-generator', () => ({
  generateQuestionsWithOpenAI: vi.fn(),
}));

import { generateQuestionsWithGemini } from '@/lib/gemini-question-generator';
import { generateQuestionsWithOpenAI } from '@/lib/openai-question-generator';

describe('Questions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.GOOGLE_API_KEY;
    delete process.env.OPENAI_API_KEY;
  });

  afterEach(() => {
    delete process.env.GOOGLE_API_KEY;
    delete process.env.OPENAI_API_KEY;
  });

  describe('getRandomQuestions', () => {
    it('should return the requested number of questions', async () => {
      const count = 5;
      const result = await getRandomQuestions(count);
      expect(result).toHaveLength(count);
    });

    it('should return all questions if count exceeds available', async () => {
      const count = questions.length + 100;
      const result = await getRandomQuestions(count);
      expect(result).toHaveLength(questions.length);
    });

    it('should return valid question objects', async () => {
      const result = await getRandomQuestions(3);
      result.forEach(question => {
        expect(question).toHaveProperty('id');
        expect(question).toHaveProperty('type');
        expect(question).toHaveProperty('text');
        expect(question).toHaveProperty('category');
        expect(question).toHaveProperty('difficulty');
        expect(question).toHaveProperty('correctAnswer');
        expect(question).toHaveProperty('explanation');
        
        // Validate based on question type
        if (question.type === 'multiple-choice') {
          expect(question).toHaveProperty('options');
          expect((question as any).options).toHaveLength(4);
          expect(question.correctAnswer).toBeGreaterThanOrEqual(0);
          expect(question.correctAnswer).toBeLessThan(4);
        } else if (question.type === 'true-false') {
          expect(typeof question.correctAnswer).toBe('boolean');
        } else if (question.type === 'more-or-less') {
          expect(question).toHaveProperty('option1');
          expect(question).toHaveProperty('option2');
          expect([0, 1]).toContain(question.correctAnswer);
        } else if (question.type === 'numerical') {
          expect(typeof question.correctAnswer).toBe('number');
        }
      });
    });

    it('should return empty array for count 0', async () => {
      const result = await getRandomQuestions(0);
      expect(result).toHaveLength(0);
    });

    it('should return unique questions', async () => {
      const result = await getRandomQuestions(10);
      const ids = result.map(q => q.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should use Gemini API when GOOGLE_API_KEY is set', async () => {
      process.env.GOOGLE_API_KEY = 'test-key';
      
      const mockQuestions = [
        {
          id: 'gemini_q1',
          type: 'multiple-choice',
          text: 'Test question',
          category: 'Test',
          difficulty: 'easy',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 0,
          explanation: 'Test explanation'
        }
      ];

      (generateQuestionsWithGemini as any).mockResolvedValue(mockQuestions);

      const result = await getRandomQuestions(1);
      
      expect(generateQuestionsWithGemini).toHaveBeenCalledWith({ count: 1 });
      expect(result).toEqual(mockQuestions);
    });

    it('should fallback to OpenAI when Gemini fails', async () => {
      process.env.GOOGLE_API_KEY = 'test-key';
      process.env.OPENAI_API_KEY = 'test-openai-key';
      
      const mockQuestions = [
        {
          id: 'openai_q1',
          type: 'true-false',
          text: 'Test question',
          category: 'Test',
          difficulty: 'easy',
          correctAnswer: true,
          explanation: 'Test explanation'
        }
      ];

      (generateQuestionsWithGemini as any).mockRejectedValue(new Error('Gemini failed'));
      (generateQuestionsWithOpenAI as any).mockResolvedValue(mockQuestions);

      const result = await getRandomQuestions(1);
      
      expect(generateQuestionsWithGemini).toHaveBeenCalledWith({ count: 1 });
      expect(generateQuestionsWithOpenAI).toHaveBeenCalledWith({ count: 1 });
      expect(result).toEqual(mockQuestions);
    });

    it('should use OpenAI when only OPENAI_API_KEY is set', async () => {
      process.env.OPENAI_API_KEY = 'test-openai-key';
      
      const mockQuestions = [
        {
          id: 'openai_q1',
          type: 'numerical',
          text: 'Test question',
          category: 'Test',
          difficulty: 'easy',
          correctAnswer: 42,
          unit: 'test',
          acceptableRange: 5,
          explanation: 'Test explanation'
        }
      ];

      (generateQuestionsWithOpenAI as any).mockResolvedValue(mockQuestions);

      const result = await getRandomQuestions(1);
      
      expect(generateQuestionsWithGemini).not.toHaveBeenCalled();
      expect(generateQuestionsWithOpenAI).toHaveBeenCalledWith({ count: 1 });
      expect(result).toEqual(mockQuestions);
    });

    it('should fallback to local questions when OpenAI fails', async () => {
      process.env.OPENAI_API_KEY = 'test-openai-key';
      
      (generateQuestionsWithOpenAI as any).mockRejectedValue(new Error('OpenAI failed'));

      const result = await getRandomQuestions(5);
      
      expect(generateQuestionsWithOpenAI).toHaveBeenCalledWith({ count: 5 });
      expect(result).toHaveLength(5);
      // Should return local questions
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('type');
    });

    it('should fallback to local questions when both AI services fail', async () => {
      process.env.GOOGLE_API_KEY = 'test-key';
      process.env.OPENAI_API_KEY = 'test-openai-key';
      
      (generateQuestionsWithGemini as any).mockRejectedValue(new Error('Gemini failed'));
      (generateQuestionsWithOpenAI as any).mockRejectedValue(new Error('OpenAI failed'));

      const result = await getRandomQuestions(5);
      
      expect(generateQuestionsWithGemini).toHaveBeenCalled();
      expect(generateQuestionsWithOpenAI).toHaveBeenCalled();
      expect(result).toHaveLength(5);
      // Should return local questions
      expect(result[0]).toHaveProperty('id');
    });

    it('should use local questions when no API keys are set', async () => {
      const result = await getRandomQuestions(5);
      
      expect(generateQuestionsWithGemini).not.toHaveBeenCalled();
      expect(generateQuestionsWithOpenAI).not.toHaveBeenCalled();
      expect(result).toHaveLength(5);
    });
  });

  describe('getQuestionById', () => {
    it('should return question with matching id', () => {
      const firstQuestion = questions[0];
      const result = getQuestionById(firstQuestion.id);
      expect(result).toEqual(firstQuestion);
    });

    it('should return undefined for non-existent id', () => {
      const result = getQuestionById('non-existent-id');
      expect(result).toBeUndefined();
    });

    it('should handle empty string id', () => {
      const result = getQuestionById('');
      expect(result).toBeUndefined();
    });
  });

  describe('questions database', () => {
    it('should have multiple questions', () => {
      expect(questions.length).toBeGreaterThan(10);
    });

    it('should have questions with various categories', () => {
      const categories = new Set(questions.map(q => q.category));
      expect(categories.size).toBeGreaterThan(3);
    });

    it('should have questions with various difficulties', () => {
      const difficulties = new Set(questions.map(q => q.difficulty));
      expect(difficulties.size).toBeGreaterThanOrEqual(2);
    });

    it('should have multiple-choice questions with 4 options', () => {
      const mcQuestions = questions.filter(q => q.type === 'multiple-choice');
      expect(mcQuestions.length).toBeGreaterThan(0);
      mcQuestions.forEach(question => {
        expect((question as any).options).toHaveLength(4);
        expect(question.correctAnswer).toBeGreaterThanOrEqual(0);
        expect(question.correctAnswer).toBeLessThan(4);
      });
    });

    it('should have true-false questions', () => {
      const tfQuestions = questions.filter(q => q.type === 'true-false');
      expect(tfQuestions.length).toBeGreaterThan(0);
      tfQuestions.forEach(question => {
        expect(typeof question.correctAnswer).toBe('boolean');
      });
    });

    it('should have more-or-less questions', () => {
      const molQuestions = questions.filter(q => q.type === 'more-or-less');
      expect(molQuestions.length).toBeGreaterThan(0);
      molQuestions.forEach(question => {
        expect((question as any).option1).toBeDefined();
        expect((question as any).option2).toBeDefined();
        expect([0, 1]).toContain(question.correctAnswer);
      });
    });

    it('should have numerical questions', () => {
      const numQuestions = questions.filter(q => q.type === 'numerical');
      expect(numQuestions.length).toBeGreaterThan(0);
      numQuestions.forEach(question => {
        expect(typeof question.correctAnswer).toBe('number');
      });
    });

    it('should have balanced distribution of question types', () => {
      const mcCount = questions.filter(q => q.type === 'multiple-choice').length;
      const tfCount = questions.filter(q => q.type === 'true-false').length;
      const molCount = questions.filter(q => q.type === 'more-or-less').length;
      const numCount = questions.filter(q => q.type === 'numerical').length;
      
      // Verify we have a good mix
      expect(mcCount).toBeGreaterThan(tfCount); // More multiple-choice
      expect(tfCount).toBeGreaterThan(0); // Some true-false
      expect(molCount).toBeGreaterThan(0); // Some more-or-less
      expect(numCount).toBeGreaterThan(0); // Some numerical
    });
  });
});
