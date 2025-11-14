import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateGameCode,
  createGameSession,
  joinGameSession,
  startGame,
  submitVote,
  processRoundResults,
  nextRound,
  getSession,
  getSessionByCode,
  updatePlayerConnection,
  cleanupInactiveSessions,
} from '../../lib/game-manager';
import type { Player } from '../../types/game';

describe('Game Manager - Core Functionality', () => {
  beforeEach(() => {
    // Clear all sessions before each test
    // Note: You may need to export a clearSessions function from game-manager
  });

  describe('generateGameCode', () => {
    it('should generate a 4-character code', () => {
      const code = generateGameCode();
      expect(code).toHaveLength(4);
    });

    it('should only contain valid characters (A-Z, 2-9, excluding confusing ones)', () => {
      const code = generateGameCode();
      const validChars = /^[A-HJ-NP-Z2-9]+$/;
      expect(code).toMatch(validChars);
    });

    it('should generate unique codes', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateGameCode());
      }
      // Should have close to 100 unique codes (allowing for small chance of collisions)
      expect(codes.size).toBeGreaterThan(95);
    });
  });

  describe('createGameSession', () => {
    it('should create a new game session with host player', () => {
      const hostName = 'Alice';
      const result = createGameSession(hostName);

      expect(result).toBeDefined();
      expect(result.code).toHaveLength(4);
      expect(result.hostId).toBeDefined();
      expect(result.session.players).toHaveLength(1);
      expect(result.session.players[0].name).toBe(hostName);
      expect(result.session.players[0].isHost).toBe(true);
      expect(result.session.currentPhase).toBe('lobby');
      expect(result.session.currentRound).toBe(0);
    });

    it('should assign all tokens (1-10) to the host', () => {
      const result = createGameSession('Host');
      expect(result.session.players[0].availableTokens).toHaveLength(10);
      expect(result.session.players[0].availableTokens).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });

    it('should initialize with empty question history in lobby', () => {
      const result = createGameSession('Host');
      expect(result.session.questionHistory).toHaveLength(0);
    });
  });

  describe('joinGameSession', () => {
    it('should allow a player to join an existing game', () => {
      const { code, session: initialSession } = createGameSession('Host');
      const result = joinGameSession(code, 'Player2');

      expect(result).not.toBeNull();
      expect(result?.playerId).toBeDefined();
      expect(result?.session.players).toHaveLength(2);
      expect(result?.session.players[1].name).toBe('Player2');
      expect(result?.session.players[1].isHost).toBe(false);
    });

    it('should not allow joining a non-existent game', () => {
      const result = joinGameSession('INVALID', 'Player');
      expect(result).toBeNull();
    });

    it('should not allow joining when game is full (6 players)', () => {
      const { code } = createGameSession('Host');
      
      // Add 5 more players (total 6)
      for (let i = 1; i <= 5; i++) {
        joinGameSession(code, `Player${i}`);
      }

      // Try to add 7th player
      const result = joinGameSession(code, 'Player7');
      expect(result).toBeDefined();
      expect(result?.error).toBe('Game is full');
    });

    it('should not allow joining after game has started', () => {
      const { code, session } = createGameSession('Host');
      joinGameSession(code, 'Player2');
      startGame(session.id);

      const result = joinGameSession(code, 'Player3');
      expect(result).toBeNull();
    });

    it('should assign unique player ID to each player', () => {
      const { code, hostId } = createGameSession('Host');
      const player1 = joinGameSession(code, 'Player1');
      const player2 = joinGameSession(code, 'Player2');

      expect(player1?.playerId).not.toBe(player2?.playerId);
      expect(player1?.playerId).not.toBe(hostId);
    });
  });

  describe('startGame', () => {
    it('should transition game from lobby to question phase', () => {
      const { session, code } = createGameSession('Host');
      joinGameSession(code, 'Player2');

      const result = startGame(session.id);

      expect(result).not.toBeNull();
      expect(result?.currentPhase).toBe('question');
      expect(result?.currentRound).toBe(1);
      expect(result?.questionHistory).toHaveLength(10);
    });

    it('should not start game with only 1 player', () => {
      const { session } = createGameSession('Host');
      const result = startGame(session.id);

      expect(result).toBeNull();
      const updatedSession = getSession(session.id);
      expect(updatedSession?.currentPhase).toBe('lobby');
    });

    it('should not start non-existent game', () => {
      const result = startGame('INVALID');
      expect(result).toBeNull();
    });
  });

  describe('submitVote', () => {
    it('should record a valid vote when in voting phase', () => {
      const { session, code } = createGameSession('Host');
      const player2Result = joinGameSession(code, 'Player2');
      const started = startGame(session.id);
      
      // Game needs to be in voting phase
      const updatedSession = getSession(session.id);
      if (updatedSession) {
        updatedSession.currentPhase = 'voting';
      }

      const result = submitVote(session.id, player2Result!.playerId, 0, 5);

      expect(result).not.toBeNull();
      const finalSession = getSession(session.id);
      expect(finalSession?.votes).toHaveLength(1);
      expect(finalSession?.votes[0].playerId).toBe(player2Result!.playerId);
      expect(finalSession?.votes[0].answer).toBe(0);
      expect(finalSession?.votes[0].token).toBe(5);
    });

    it('should not allow voting in wrong phase', () => {
      const { session, code } = createGameSession('Host');
      const player2Result = joinGameSession(code, 'Player2');
      startGame(session.id);

      // Try to vote in question phase (not voting phase)
      const result = submitVote(session.id, player2Result!.playerId, 0, 5);

      expect(result).toBeNull();
    });

    it('should allow updating existing vote', () => {
      const { session, code } = createGameSession('Host');
      const player2Result = joinGameSession(code, 'Player2');
      startGame(session.id);
      
      const updatedSession = getSession(session.id);
      if (updatedSession) {
        updatedSession.currentPhase = 'voting';
      }

      submitVote(session.id, player2Result!.playerId, 0, 5);
      const result = submitVote(session.id, player2Result!.playerId, 1, 6);

      expect(result).not.toBeNull();
      const finalSession = getSession(session.id);
      expect(finalSession?.votes).toHaveLength(1); // Still only 1 vote
      expect(finalSession?.votes[0].token).toBe(6); // Updated token
    });
  });

  describe('processRoundResults', () => {
    it('should calculate scores correctly for correct answer', () => {
      const { session, code, hostId } = createGameSession('Host');
      const player2Result = joinGameSession(code, 'Player2');
      const startedSession = startGame(session.id);

      const currentQuestion = startedSession?.currentQuestion;
      const correctAnswer = currentQuestion!.correctAnswer;

      // Set to voting phase and submit votes
      const gameSession = getSession(session.id);
      if (gameSession) {
        gameSession.currentPhase = 'voting';
        submitVote(session.id, hostId, correctAnswer, 5);
        submitVote(session.id, player2Result!.playerId, correctAnswer, 7);
        
        // Set to reveal phase
        gameSession.currentPhase = 'reveal';
        processRoundResults(session.id);
      }

      const updatedSession = getSession(session.id);
      const updatedPlayer1 = updatedSession?.players.find(p => p.id === hostId);
      const updatedPlayer2 = updatedSession?.players.find(p => p.id === player2Result!.playerId);

      expect(updatedPlayer1?.score).toBe(5);
      expect(updatedPlayer2?.score).toBe(7);
    });

    it('should not award points for incorrect answer', () => {
      const { session, code, hostId } = createGameSession('Host');
      const player2Result = joinGameSession(code, 'Player2');
      const startedSession = startGame(session.id);

      const currentQuestion = startedSession?.currentQuestion;
      const wrongAnswer = (currentQuestion!.correctAnswer + 1) % 4;

      const gameSession = getSession(session.id);
      if (gameSession) {
        gameSession.currentPhase = 'voting';
        submitVote(session.id, hostId, wrongAnswer, 5);
        submitVote(session.id, player2Result!.playerId, wrongAnswer, 7);
        
        gameSession.currentPhase = 'reveal';
        processRoundResults(session.id);
      }

      const updatedSession = getSession(session.id);
      const updatedPlayer1 = updatedSession?.players.find((p: Player) => p.id === hostId);
      const updatedPlayer2 = updatedSession?.players.find((p: Player) => p.id === player2Result!.playerId);

      expect(updatedPlayer1?.score).toBe(0);
      expect(updatedPlayer2?.score).toBe(0);
    });

    it('should remove used tokens from available tokens', () => {
      const { session, code, hostId } = createGameSession('Host');
      joinGameSession(code, 'Player2');
      const startedSession = startGame(session.id);

      const currentQuestion = startedSession?.currentQuestion;
      const gameSession = getSession(session.id);
      if (gameSession) {
        gameSession.currentPhase = 'voting';
        submitVote(session.id, hostId, currentQuestion!.correctAnswer, 5);
        
        processRoundResults(session.id);
      }

      const updatedSession = getSession(session.id);
      const updatedPlayer = updatedSession?.players.find((p: Player) => p.id === hostId);

      expect(updatedPlayer?.availableTokens).not.toContain(5);
      expect(updatedPlayer?.availableTokens).toHaveLength(9);
    });
  });

  describe('nextRound', () => {
    it('should advance to next round', () => {
      const { session, code } = createGameSession('Host');
      joinGameSession(code, 'Player2');
      startGame(session.id);

      nextRound(session.id);

      const updatedSession = getSession(session.id);
      expect(updatedSession?.currentRound).toBe(2);
      expect(updatedSession?.currentPhase).toBe('question');
      expect(updatedSession?.votes).toHaveLength(0);
    });

    it('should transition to results phase after 10 rounds', () => {
      const { session, code } = createGameSession('Host');
      joinGameSession(code, 'Player2');
      startGame(session.id);

      // Advance through 10 rounds (starts at round 1, need to call nextRound 9 times to reach round 10, then once more to transition to results)
      for (let i = 0; i < 10; i++) {
        nextRound(session.id);
      }

      const updatedSession = getSession(session.id);
      expect(updatedSession?.currentRound).toBe(10);
      expect(updatedSession?.currentPhase).toBe('results');
    });
  });

  describe('getSessionByCode', () => {
    it('should retrieve session by game code', () => {
      const { session, code } = createGameSession('Host');
      const retrievedSession = getSessionByCode(code);

      expect(retrievedSession).toBeDefined();
      expect(retrievedSession?.id).toBe(session.id);
      expect(retrievedSession?.code).toBe(code);
    });

    it('should return null for non-existent code', () => {
      const session = getSessionByCode('XXXX');
      expect(session).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid sequential joins', () => {
      const { code } = createGameSession('Host');
      const players = [];

      for (let i = 1; i <= 5; i++) {
        const result = joinGameSession(code, `Player${i}`);
        players.push(result?.playerId);
      }

      const updatedSession = getSessionByCode(code);
      expect(updatedSession?.players).toHaveLength(6);
      expect(players.every(p => p !== null && p !== undefined)).toBe(true);
    });

    it('should handle all players voting in different order', () => {
      const { session, code, hostId } = createGameSession('Host');
      const player2 = joinGameSession(code, 'Player2');
      const player3 = joinGameSession(code, 'Player3');
      const startedSession = startGame(session.id);

      const currentQuestion = startedSession?.currentQuestion;
      
      const gameSession = getSession(session.id);
      if (gameSession) {
        gameSession.currentPhase = 'voting';
        submitVote(session.id, player3!.playerId, currentQuestion!.correctAnswer, 3);
        submitVote(session.id, hostId, currentQuestion!.correctAnswer, 1);
        submitVote(session.id, player2!.playerId, currentQuestion!.correctAnswer, 2);
      }

      const updatedSession = getSession(session.id);
      expect(updatedSession?.votes).toHaveLength(3);
    });
  });

  describe('Player Connection Management', () => {
    it('should update player connection status', () => {
      const { session, hostId } = createGameSession('Host');
      
      updatePlayerConnection(session.id, hostId, false);
      
      const updatedSession = getSession(session.id);
      const host = updatedSession?.players.find((p: Player) => p.id === hostId);
      
      expect(host?.isConnected).toBe(false);
    });

    it('should not throw when updating connection for non-existent session', () => {
      expect(() => {
        updatePlayerConnection('non-existent', 'player123', true);
      }).not.toThrow();
    });

    it('should not throw when updating connection for non-existent player', () => {
      const { session } = createGameSession('Host');
      
      expect(() => {
        updatePlayerConnection(session.id, 'non-existent-player', true);
      }).not.toThrow();
    });

    it('should update lastActivity when updating connection', () => {
      const { session, hostId } = createGameSession('Host');
      
      const initialActivity = session.lastActivity;
      
      // Wait a bit to ensure timestamp difference
      setTimeout(() => {
        updatePlayerConnection(session.id, hostId, false);
        
        const updatedSession = getSession(session.id);
        expect(updatedSession?.lastActivity).toBeGreaterThan(initialActivity);
      }, 10);
    });
  });

  describe('Session Cleanup', () => {
    it('should remove inactive sessions', () => {
      const { session, code } = createGameSession('Host');
      
      // Manually set lastActivity to an old timestamp
      const oldSession = getSession(session.id);
      if (oldSession) {
        oldSession.lastActivity = Date.now() - (2 * 60 * 60 * 1000); // 2 hours ago
      }
      
      cleanupInactiveSessions(1); // 1 minute threshold
      
      const retrievedSession = getSessionByCode(code);
      expect(retrievedSession).toBeNull();
    });

    it('should keep active sessions', () => {
      const { session, code } = createGameSession('Host');
      
      cleanupInactiveSessions(60); // 60 minute threshold
      
      const retrievedSession = getSessionByCode(code);
      expect(retrievedSession).not.toBeNull();
      expect(retrievedSession?.id).toBe(session.id);
    });

    it('should handle cleanup with no sessions', () => {
      expect(() => {
        cleanupInactiveSessions(60);
      }).not.toThrow();
    });
  });
});
