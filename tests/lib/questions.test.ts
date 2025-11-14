import { describe, it, expect } from 'vitest';
import { getRandomQuestions, getQuestionById, questions } from '@/lib/questions';

describe('Questions', () => {
  describe('getRandomQuestions', () => {
    it('should return the requested number of questions', () => {
      const count = 5;
      const result = getRandomQuestions(count);
      expect(result).toHaveLength(count);
    });

    it('should return all questions if count exceeds available', () => {
      const count = questions.length + 100;
      const result = getRandomQuestions(count);
      expect(result).toHaveLength(questions.length);
    });

    it('should return valid question objects', () => {
      const result = getRandomQuestions(3);
      result.forEach(question => {
        expect(question).toHaveProperty('id');
        expect(question).toHaveProperty('text');
        expect(question).toHaveProperty('category');
        expect(question).toHaveProperty('difficulty');
        expect(question).toHaveProperty('options');
        expect(question).toHaveProperty('correctAnswer');
        expect(question).toHaveProperty('explanation');
        expect(question.options).toHaveLength(4);
        expect(question.correctAnswer).toBeGreaterThanOrEqual(0);
        expect(question.correctAnswer).toBeLessThan(4);
      });
    });

    it('should return empty array for count 0', () => {
      const result = getRandomQuestions(0);
      expect(result).toHaveLength(0);
    });

    it('should return unique questions', () => {
      const result = getRandomQuestions(10);
      const ids = result.map(q => q.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
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

    it('should have all questions with 4 options', () => {
      questions.forEach(question => {
        expect(question.options).toHaveLength(4);
      });
    });

    it('should have all questions with valid correct answers', () => {
      questions.forEach(question => {
        expect(question.correctAnswer).toBeGreaterThanOrEqual(0);
        expect(question.correctAnswer).toBeLessThan(4);
      });
    });
  });
});
