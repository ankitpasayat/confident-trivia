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
