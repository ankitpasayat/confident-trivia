import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the fetch function
global.fetch = vi.fn();

describe('OpenAI Question Generator', () => {
  const mockApiKey = 'test-api-key';
  const originalEnv = process.env.OPENAI_API_KEY;
  
  // Need to dynamically import after setting env var
  let generateQuestionsWithOpenAI: any;
  
  beforeEach(async () => {
    process.env.OPENAI_API_KEY = mockApiKey;
    vi.clearAllMocks();
    // Reload the module with the new env var
    vi.resetModules();
    const module = await import('@/lib/openai-question-generator');
    generateQuestionsWithOpenAI = module.generateQuestionsWithOpenAI;
  });

  afterEach(() => {
    if (originalEnv) {
      process.env.OPENAI_API_KEY = originalEnv;
    } else {
      delete process.env.OPENAI_API_KEY;
    }
    vi.resetModules();
  });

  describe('generateQuestionsWithOpenAI', () => {
    it('should throw error when API key is not set', async () => {
      delete process.env.OPENAI_API_KEY;
      vi.resetModules();
      const module = await import('@/lib/openai-question-generator');
      const testFn = module.generateQuestionsWithOpenAI;
      
      await expect(
        testFn({ count: 10 })
      ).rejects.toThrow('AI question generation not configured');
    });

    it('should successfully generate questions', async () => {
      const mockQuestions = [
        {
          id: 'ai_q1',
          type: 'multiple-choice',
          text: 'What is the capital of France?',
          category: 'Geography',
          difficulty: 'easy',
          options: ['London', 'Berlin', 'Paris', 'Madrid'],
          correctAnswer: 2,
          explanation: 'Paris is the capital of France'
        },
        {
          id: 'ai_q2',
          type: 'true-false',
          text: 'The Earth is flat',
          category: 'Science',
          difficulty: 'easy',
          correctAnswer: false,
          explanation: 'The Earth is spherical'
        }
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({ questions: mockQuestions })
              }
            }
          ]
        })
      });

      const result = await generateQuestionsWithOpenAI({ count: 2 });
      
      expect(result).toEqual(mockQuestions);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockApiKey}`
          })
        })
      );
    });

    it('should handle API errors', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => 'Rate limit exceeded'
      });

      await expect(
        generateQuestionsWithOpenAI({ count: 10 })
      ).rejects.toThrow('OpenAI API error: 429');
    });

    it('should handle missing content in response', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {}
            }
          ]
        })
      });

      await expect(
        generateQuestionsWithOpenAI({ count: 10 })
      ).rejects.toThrow('No content in OpenAI response');
    });

    it('should handle invalid JSON format', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({ invalid: 'format' })
              }
            }
          ]
        })
      });

      await expect(
        generateQuestionsWithOpenAI({ count: 10 })
      ).rejects.toThrow('Invalid questions format from AI');
    });

    it('should handle empty questions array', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({ questions: [] })
              }
            }
          ]
        })
      });

      await expect(
        generateQuestionsWithOpenAI({ count: 10 })
      ).rejects.toThrow('Invalid questions format from AI');
    });

    it('should generate questions with specific categories', async () => {
      const mockQuestions = [
        {
          id: 'ai_q1',
          type: 'multiple-choice',
          text: 'What is photosynthesis?',
          category: 'Biology',
          difficulty: 'medium',
          options: ['Process A', 'Process B', 'Process C', 'Process D'],
          correctAnswer: 1,
          explanation: 'Explanation'
        }
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({ questions: mockQuestions })
              }
            }
          ]
        })
      });

      const result = await generateQuestionsWithOpenAI({
        count: 1,
        categories: ['Biology', 'Chemistry']
      });
      
      expect(result).toEqual(mockQuestions);
      const callArgs = (global.fetch as any).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.messages[1].content).toContain('Biology');
      expect(body.messages[1].content).toContain('Chemistry');
    });

    it('should generate questions with specific difficulties', async () => {
      const mockQuestions = [
        {
          id: 'ai_q1',
          type: 'numerical',
          text: 'What is the speed of light?',
          category: 'Physics',
          difficulty: 'hard',
          correctAnswer: 299792458,
          unit: 'm/s',
          acceptableRange: 1000000,
          explanation: 'The speed of light is approximately 299,792,458 m/s'
        }
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({ questions: mockQuestions })
              }
            }
          ]
        })
      });

      const result = await generateQuestionsWithOpenAI({
        count: 1,
        difficulties: ['hard']
      });
      
      expect(result).toEqual(mockQuestions);
      const callArgs = (global.fetch as any).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.messages[1].content).toContain('hard');
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      await expect(
        generateQuestionsWithOpenAI({ count: 10 })
      ).rejects.toThrow('Network error');
    });

    it('should generate balanced question types', async () => {
      const mockQuestions = [
        {
          id: 'ai_q1',
          type: 'multiple-choice',
          text: 'Question 1',
          category: 'Science',
          difficulty: 'easy',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 0,
          explanation: 'Explanation'
        },
        {
          id: 'ai_q2',
          type: 'true-false',
          text: 'Question 2',
          category: 'Science',
          difficulty: 'easy',
          correctAnswer: true,
          explanation: 'Explanation'
        },
        {
          id: 'ai_q3',
          type: 'more-or-less',
          text: 'Question 3',
          category: 'Science',
          difficulty: 'easy',
          option1: 'Option 1',
          option2: 'Option 2',
          correctAnswer: 0,
          explanation: 'Explanation'
        },
        {
          id: 'ai_q4',
          type: 'numerical',
          text: 'Question 4',
          category: 'Science',
          difficulty: 'easy',
          correctAnswer: 100,
          unit: 'units',
          acceptableRange: 10,
          explanation: 'Explanation'
        }
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({ questions: mockQuestions })
              }
            }
          ]
        })
      });

      const result = await generateQuestionsWithOpenAI({ count: 10 });
      
      expect(result).toEqual(mockQuestions);
      
      // Verify the request contains distribution information
      const callArgs = (global.fetch as any).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.messages[1].content).toContain('multiple-choice');
      expect(body.messages[1].content).toContain('true-false');
      expect(body.messages[1].content).toContain('more-or-less');
      expect(body.messages[1].content).toContain('numerical');
    });
  });
});
