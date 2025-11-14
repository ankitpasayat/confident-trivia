import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the fetch function
global.fetch = vi.fn();

describe('Gemini Question Generator', () => {
  const mockApiKey = 'test-gemini-api-key';
  const originalEnv = process.env.GOOGLE_API_KEY;
  
  // Need to dynamically import after setting env var
  let generateQuestionsWithGemini: any;
  
  beforeEach(async () => {
    process.env.GOOGLE_API_KEY = mockApiKey;
    vi.clearAllMocks();
    // Reload the module with the new env var
    vi.resetModules();
    const module = await import('@/lib/gemini-question-generator');
    generateQuestionsWithGemini = module.generateQuestionsWithGemini;
  });

  afterEach(() => {
    if (originalEnv) {
      process.env.GOOGLE_API_KEY = originalEnv;
    } else {
      delete process.env.GOOGLE_API_KEY;
    }
    vi.resetModules();
  });

  describe('generateQuestionsWithGemini', () => {
    it('should throw error when API key is not set', async () => {
      delete process.env.GOOGLE_API_KEY;
      vi.resetModules();
      const module = await import('@/lib/gemini-question-generator');
      const testFn = module.generateQuestionsWithGemini;
      
      await expect(
        testFn({ count: 10 })
      ).rejects.toThrow('Gemini API key not configured');
    });

    it('should successfully generate questions', async () => {
      const mockQuestions = [
        {
          id: 'gemini_q1',
          type: 'multiple-choice',
          text: 'What is the capital of France?',
          category: 'Geography',
          difficulty: 'easy',
          options: ['London', 'Berlin', 'Paris', 'Madrid'],
          correctAnswer: 2,
          explanation: 'Paris is the capital of France'
        },
        {
          id: 'gemini_q2',
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
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({ questions: mockQuestions })
                  }
                ]
              }
            }
          ]
        })
      });

      const result = await generateQuestionsWithGemini({ count: 2 });
      
      expect(result).toHaveLength(2);
      expect(result).toEqual(expect.arrayContaining(mockQuestions));
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('generativelanguage.googleapis.com'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should handle API errors with error details', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => 'Rate limit exceeded'
      });

      await expect(
        generateQuestionsWithGemini({ count: 10 })
      ).rejects.toThrow('Gemini API error: 429');
    });

    it('should handle missing content in response', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: []
        })
      });

      await expect(
        generateQuestionsWithGemini({ count: 10 })
      ).rejects.toThrow('No content in Gemini response');
    });

    it('should handle invalid JSON format', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({ invalid: 'format' })
                  }
                ]
              }
            }
          ]
        })
      });

      await expect(
        generateQuestionsWithGemini({ count: 10 })
      ).rejects.toThrow('Invalid questions format from Gemini');
    });

    it('should handle empty questions array', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({ questions: [] })
                  }
                ]
              }
            }
          ]
        })
      });

      await expect(
        generateQuestionsWithGemini({ count: 10 })
      ).rejects.toThrow('Invalid questions format from Gemini');
    });

    it('should generate questions with specific categories', async () => {
      const mockQuestions = [
        {
          id: 'gemini_q1',
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
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({ questions: mockQuestions })
                  }
                ]
              }
            }
          ]
        })
      });

      const result = await generateQuestionsWithGemini({
        count: 1,
        categories: ['Biology', 'Chemistry']
      });
      
      expect(result).toHaveLength(1);
      const callArgs = (global.fetch as any).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      const prompt = body.contents[0].parts[0].text;
      expect(prompt).toContain('Biology');
      expect(prompt).toContain('Chemistry');
    });

    it('should generate questions with specific difficulties', async () => {
      const mockQuestions = [
        {
          id: 'gemini_q1',
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
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({ questions: mockQuestions })
                  }
                ]
              }
            }
          ]
        })
      });

      const result = await generateQuestionsWithGemini({
        count: 1,
        difficulties: ['hard']
      });
      
      expect(result).toHaveLength(1);
      const callArgs = (global.fetch as any).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      const prompt = body.contents[0].parts[0].text;
      expect(prompt).toContain('hard');
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      await expect(
        generateQuestionsWithGemini({ count: 10 })
      ).rejects.toThrow('Network error');
    });

    it('should shuffle questions to mix types', async () => {
      const mockQuestions = [
        { id: 'q1', type: 'multiple-choice', text: 'Q1', category: 'Science', difficulty: 'easy', options: ['A', 'B', 'C', 'D'], correctAnswer: 0, explanation: 'E1' },
        { id: 'q2', type: 'multiple-choice', text: 'Q2', category: 'Science', difficulty: 'easy', options: ['A', 'B', 'C', 'D'], correctAnswer: 1, explanation: 'E2' },
        { id: 'q3', type: 'true-false', text: 'Q3', category: 'Science', difficulty: 'easy', correctAnswer: true, explanation: 'E3' },
        { id: 'q4', type: 'more-or-less', text: 'Q4', category: 'Science', difficulty: 'easy', option1: 'O1', option2: 'O2', correctAnswer: 0, explanation: 'E4' },
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({ questions: mockQuestions })
                  }
                ]
              }
            }
          ]
        })
      });

      const result = await generateQuestionsWithGemini({ count: 4 });
      
      // Should return all questions (possibly shuffled)
      expect(result).toHaveLength(4);
      const ids = result.map((q: any) => q.id);
      expect(ids).toContain('q1');
      expect(ids).toContain('q2');
      expect(ids).toContain('q3');
      expect(ids).toContain('q4');
    });

    it('should generate balanced question types', async () => {
      const mockQuestions = [
        {
          id: 'gemini_q1',
          type: 'multiple-choice',
          text: 'Question 1',
          category: 'Science',
          difficulty: 'easy',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 0,
          explanation: 'Explanation'
        },
        {
          id: 'gemini_q2',
          type: 'true-false',
          text: 'Question 2',
          category: 'Science',
          difficulty: 'easy',
          correctAnswer: true,
          explanation: 'Explanation'
        },
        {
          id: 'gemini_q3',
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
          id: 'gemini_q4',
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
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({ questions: mockQuestions })
                  }
                ]
              }
            }
          ]
        })
      });

      const result = await generateQuestionsWithGemini({ count: 10 });
      
      expect(result).toHaveLength(4);
      
      // Verify the request contains distribution information
      const callArgs = (global.fetch as any).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      const prompt = body.contents[0].parts[0].text;
      expect(prompt).toContain('multiple-choice');
      expect(prompt).toContain('true-false');
      expect(prompt).toContain('more-or-less');
      expect(prompt).toContain('numerical');
    });

    it('should use correct API configuration', async () => {
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

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({ questions: mockQuestions })
                  }
                ]
              }
            }
          ]
        })
      });

      await generateQuestionsWithGemini({ count: 1 });
      
      const callArgs = (global.fetch as any).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      
      // Verify generation config
      expect(body.generationConfig).toBeDefined();
      expect(body.generationConfig.temperature).toBe(0.8);
      expect(body.generationConfig.responseMimeType).toBe('application/json');
      expect(body.generationConfig.maxOutputTokens).toBe(8192);
    });
  });
});
