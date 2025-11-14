/**
 * Test Utilities
 * 
 * Reusable test helpers and mock data factories
 */

import type { Player, GameSession, Question } from '../../types/game';
import { expect } from 'vitest';

/**
 * Mock Data Factories
 */

export const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
  id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  name: 'Test Player',
  color: '#EF4444',
  score: 0,
  availableTokens: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  usedTokens: [],
  isHost: false,
  isConnected: true,
  ...overrides,
});

export const createMockQuestion = (overrides: Partial<Question> = {}): Question => ({
  id: `question_${Date.now()}`,
  type: 'multiple-choice',
  text: 'What is the capital of France?',
  options: ['London', 'Berlin', 'Paris', 'Madrid'],
  correctAnswer: 2,
  category: 'Geography',
  difficulty: 'easy',
  explanation: 'Paris is the capital and most populous city of France.',
  ...overrides,
} as Question);

export const createMockSession = (overrides: Partial<GameSession> = {}): GameSession => {
  const hostId = 'player_host';
  return {
    id: `session_${Date.now()}`,
    code: 'ABCD',
    hostId,
    players: [createMockPlayer({ id: hostId, name: 'Host', isHost: true })],
    currentPhase: 'lobby',
    currentRound: 0,
    totalRounds: 10,
    currentQuestion: null,
    votes: [],
    questionHistory: [],
    createdAt: Date.now(),
    lastActivity: Date.now(),
    ...overrides,
  };
};

/**
 * Test Helpers
 */

export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const createMockPlayers = (count: number): Player[] => {
  const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
  return Array.from({ length: count }, (_, i) => 
    createMockPlayer({
      id: `player_${i}`,
      name: `Player ${i + 1}`,
      color: colors[i % colors.length],
      isHost: i === 0,
    })
  );
};

export const createMockQuestions = (count: number): Question[] => {
  const categories = ['Science', 'History', 'Geography', 'Arts', 'Sports'];
  const difficulties: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard'];
  
  return Array.from({ length: count }, (_, i) => 
    createMockQuestion({
      id: `question_${i}`,
      text: `Question ${i + 1}?`,
      category: categories[i % categories.length],
      difficulty: difficulties[i % difficulties.length],
    })
  );
};

/**
 * Assertion Helpers
 */

export const expectValidGameCode = (code: string) => {
  expect(code).toHaveLength(4);
  expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/);
};

export const expectValidPlayerId = (id: string) => {
  expect(id).toMatch(/^player_\d+_[a-z0-9]+$/);
};

export const expectValidSessionId = (id: string) => {
  expect(id).toMatch(/^session_\d+_[a-z0-9]+$/);
};

/**
 * Mock API Response Helpers
 */

export const createMockResponse = (data: any, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const createMockRequest = (method: string, body?: any, url = 'http://localhost') => {
  return new Request(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
  });
};

/**
 * React Testing Library Helpers
 */

export const renderWithProviders = (ui: React.ReactElement) => {
  // Add context providers as needed
  return ui;
};

/**
 * Game Flow Helpers
 */

export const simulateGameRound = (session: GameSession, playerIds: string[]) => {
  // Helper to simulate a complete game round
  const votes = playerIds.map((playerId, index) => ({
    playerId,
    answer: 0, // Everyone votes for first answer
    token: index + 1,
    submittedAt: Date.now(),
  }));

  return {
    ...session,
    votes,
    currentPhase: 'reveal' as const,
  };
};

export const simulateCompleteGame = (playerCount: number = 2) => {
  const players = createMockPlayers(playerCount);
  const questions = createMockQuestions(10);
  
  const updatedPlayers = players.map((player, index) => ({
      ...player,
      score: (10 - index) * 5, // Descending scores
      availableTokens: [],
      usedTokens: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    }));
  
  return createMockSession({
    players: updatedPlayers,
    questionHistory: questions,
    currentRound: 10,
    currentPhase: 'results',
  });
};

/**
 * Cleanup Helpers
 */

export const cleanupGameSessions = () => {
  // Clear any in-memory game sessions if needed
  // This would need to export a cleanup function from game-manager.ts
};

/**
 * Performance Helpers
 */

export const measureExecutionTime = async (fn: () => any) => {
  const start = performance.now();
  await fn();
  const end = performance.now();
  return end - start;
};

/**
 * Random Data Generators
 */

export const randomGameCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 4 }, () => 
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('');
};

export const randomPlayerName = () => {
  const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank'];
  return names[Math.floor(Math.random() * names.length)];
};

/**
 * Snapshot Helpers
 */

export const serializeGameSession = (session: GameSession) => {
  // Remove timestamps for snapshot testing
  const { createdAt, lastActivity, ...rest } = session;
  return {
    ...rest,
    votes: rest.votes.map(({ submittedAt, ...vote }: any) => vote),
  };
};

/**
 * Browser Storage Mocks
 */

export const mockLocalStorage = () => {
  const store: Record<string, string> = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(key => delete store[key]); },
  };
};

/**
 * Network Mocks
 */

export const mockEventSource = () => {
  const listeners: Record<string, Function[]> = {};
  
  return {
    addEventListener: (event: string, handler: Function) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
    },
    removeEventListener: (event: string, handler: Function) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter(h => h !== handler);
      }
    },
    trigger: (event: string, data: any) => {
      listeners[event]?.forEach(handler => handler(data));
    },
    close: () => {},
  };
};

/**
 * Async Helpers
 */

export const flushPromises = () => new Promise(resolve => setImmediate(resolve));

export const retryUntil = async (
  condition: () => boolean,
  maxAttempts = 10,
  delayMs = 100
): Promise<boolean> => {
  for (let i = 0; i < maxAttempts; i++) {
    if (condition()) return true;
    await waitFor(delayMs);
  }
  return false;
};
