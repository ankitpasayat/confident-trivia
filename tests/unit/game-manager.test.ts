import { describe, it, expect } from 'vitest';
import {
  generateGameCode,
  createGameSession,
  joinGameSession,
  getSession,
  getSessionByCode,
  startGame,
  submitVote,
  changePhase,
} from '../../lib/game-manager';

describe('Game Manager Tests', () => {
  describe('generateGameCode', () => {
    it('should generate a 4-character code', () => {
      const code = generateGameCode();
      expect(code).toHaveLength(4);
    });

    it('should only contain valid characters', () => {
      const code = generateGameCode();
      const validChars = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/;
      expect(code).toMatch(validChars);
    });
  });

  describe('createGameSession', () => {
    it('should create a new game session with host', () => {
      const result = createGameSession('Alice');

      expect(result).toBeDefined();
      expect(result.session).toBeDefined();
      expect(result.hostId).toBeDefined();
      expect(result.code).toHaveLength(4);
      expect(result.session.players).toHaveLength(1);
      expect(result.session.players[0].name).toBe('Alice');
      expect(result.session.players[0].isHost).toBe(true);
      expect(result.session.currentPhase).toBe('lobby');
      expect(result.session.currentRound).toBe(0);
    });

    it('should assign all tokens (1-10) to host', () => {
      const result = createGameSession('Host');
      expect(result.session.players[0].availableTokens).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect(result.session.players[0].usedTokens).toEqual([]);
      expect(result.session.players[0].score).toBe(0);
    });
  });

  describe('joinGameSession', () => {
    it('should allow player to join lobby', () => {
      const { code } = createGameSession('Host');
      const result = joinGameSession(code, 'Player2');

      expect(result).not.toBeNull();
      expect(result?.session.players).toHaveLength(2);
      expect(result?.session.players[1].name).toBe('Player2');
      expect(result?.session.players[1].isHost).toBe(false);
      expect(result?.playerId).toBeDefined();
    });

    it('should return null for invalid code', () => {
      const result = joinGameSession('XXXX', 'Player');
      expect(result).toBeNull();
    });

    it('should not allow joining when full (6 players max)', () => {
      const { code } = createGameSession('Host');
      
      // Add 5 players
      for (let i = 1; i <= 5; i++) {
        joinGameSession(code, `Player${i}`);
      }

      // 7th player should fail
      const result = joinGameSession(code, 'Player7');
      expect(result).toBeDefined();
      expect(result?.error).toBe('Game is full');
    });

    it('should not allow joining after game starts', async () => {
      const { code, session } = createGameSession('Host');
      joinGameSession(code, 'Player2');
      await startGame(session.id);

      const result = joinGameSession(code, 'Player3');
      expect(result).toBeNull();
    });

    it('should assign different colors to players', () => {
      const { code, session } = createGameSession('Host');
      joinGameSession(code, 'Player2');
      joinGameSession(code, 'Player3');

      const updatedSession = getSession(session.id);
      expect(updatedSession?.players[0].color).not.toBe(updatedSession?.players[1].color);
      expect(updatedSession?.players[1].color).not.toBe(updatedSession?.players[2].color);
    });
  });

  describe('startGame', () => {
    it('should start game with 2+ players', async () => {
      const { session } = createGameSession('Host');
      joinGameSession(session.code, 'Player2');

      const result = await startGame(session.id);

      expect(result).not.toBeNull();
      expect(result?.currentPhase).toBe('question');
      expect(result?.currentRound).toBe(1);
      expect(result?.currentQuestion).not.toBeNull();
      expect(result?.questionHistory).toHaveLength(10);
    });

    it('should not start with only 1 player', async () => {
      const { session } = createGameSession('Host');
      const result = await startGame(session.id);

      expect(result).toBeNull();
    });

    it('should not start non-existent game', async () => {
      const result = await startGame('invalid-id');
      expect(result).toBeNull();
    });

    it('should not start already started game', async () => {
      const { session, code } = createGameSession('Host');
      joinGameSession(code, 'Player2');
      
      await startGame(session.id);
      const result = await startGame(session.id);

      expect(result).toBeNull();
    });
  });

  describe('submitVote', () => {
    it('should accept valid vote during voting phase', async () => {
      const { session, hostId, code } = createGameSession('Host');
      const player2Result = joinGameSession(code, 'Player2');
      await startGame(session.id);
      changePhase(session.id, 'voting');

      const result = submitVote(session.id, hostId, 0, 5);

      expect(result).not.toBeNull();
      expect(result?.votes).toHaveLength(1);
      expect(result?.votes[0].playerId).toBe(hostId);
      expect(result?.votes[0].answer).toBe(0);
      expect(result?.votes[0].token).toBe(5);
    });

    it('should not accept vote with unavailable token', async () => {
      const { session, hostId, code } = createGameSession('Host');
      joinGameSession(code, 'Player2');
      await startGame(session.id);
      changePhase(session.id, 'voting');

      const result = submitVote(session.id, hostId, 0, 15); // Invalid token
      expect(result).toBeNull();
    });

    it('should allow updating vote', async () => {
      const { session, hostId, code } = createGameSession('Host');
      joinGameSession(code, 'Player2');
      await startGame(session.id);
      changePhase(session.id, 'voting');

      submitVote(session.id, hostId, 0, 5);
      const result = submitVote(session.id, hostId, 2, 7);

      expect(result?.votes).toHaveLength(1);
      expect(result?.votes[0].answer).toBe(2);
      expect(result?.votes[0].token).toBe(7);
    });

    it('should not accept vote in wrong phase', async () => {
      const { session, hostId, code } = createGameSession('Host');
      joinGameSession(code, 'Player2');
      await startGame(session.id); // Still in 'question' phase

      const result = submitVote(session.id, hostId, 0, 5);
      expect(result).toBeNull();
    });
  });

  describe('getSession and getSessionByCode', () => {
    it('should retrieve session by ID', () => {
      const { session } = createGameSession('Host');
      const retrieved = getSession(session.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(session.id);
      expect(retrieved?.code).toBe(session.code);
    });

    it('should retrieve session by code', () => {
      const { session, code } = createGameSession('Host');
      const retrieved = getSessionByCode(code);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(session.id);
    });

    it('should be case-insensitive for codes', () => {
      const { code } = createGameSession('Host');
      const lower = getSessionByCode(code.toLowerCase());
      const upper = getSessionByCode(code.toUpperCase());

      expect(lower).not.toBeNull();
      expect(upper).not.toBeNull();
      expect(lower?.id).toBe(upper?.id);
    });

    it('should return null for non-existent session', () => {
      expect(getSession('invalid')).toBeNull();
      expect(getSessionByCode('XXXX')).toBeNull();
    });
  });

  describe('Integration: Full Game Flow', () => {
    it('should complete a basic game flow', async () => {
      // Create game
      const { session, hostId, code } = createGameSession('Host');
      expect(session.currentPhase).toBe('lobby');

      // Players join
      const player2 = joinGameSession(code, 'Player2');
      const player3 = joinGameSession(code, 'Player3');
      expect(player2).not.toBeNull();
      expect(player3).not.toBeNull();

      // Start game
      const started = await startGame(session.id);
      expect(started?.currentPhase).toBe('question');
      expect(started?.currentRound).toBe(1);

      // Move to voting
      changePhase(session.id, 'voting');
      const afterVotingPhase = getSession(session.id);
      expect(afterVotingPhase?.currentPhase).toBe('voting');

      // Submit votes
      submitVote(session.id, hostId, 0, 5);
      submitVote(session.id, player2!.playerId, 1, 3);
      submitVote(session.id, player3!.playerId, 0, 7);

      const afterVotes = getSession(session.id);
      expect(afterVotes?.votes).toHaveLength(3);
    });
  });

  describe('Numerical Questions', () => {
    it('should handle numerical question with acceptable range', async () => {
      const { session, hostId, code } = createGameSession('Host');
      const player2 = joinGameSession(code, 'Player2');
      
      await startGame(session.id);
      
      // Manually set a numerical question for testing
      const numericalSession = getSession(session.id);
      if (numericalSession) {
        numericalSession.currentQuestion = {
          id: 'test-num',
          type: 'numerical',
          text: 'What is 100?',
          category: 'Test',
          difficulty: 'easy',
          explanation: 'Test explanation',
          correctAnswer: 100,
          acceptableRange: 10,
        };
      }
      
      changePhase(session.id, 'voting');
      
      // Player 1 votes within range
      submitVote(session.id, hostId, 105, 5);
      // Player 2 votes outside range
      submitVote(session.id, player2!.playerId, 150, 3);
      
      const result = getSession(session.id);
      expect(result?.currentPhase).toBe('reveal');
      
      // Check that only player 1 got points
      const hostPlayer = result?.players.find(p => p.id === hostId);
      const player2Data = result?.players.find(p => p.id === player2!.playerId);
      
      expect(hostPlayer?.score).toBe(5);
      expect(player2Data?.score).toBe(0);
    });

    it('should use default range for numerical questions without acceptableRange', async () => {
      const { session, hostId, code } = createGameSession('Host');
      const player2 = joinGameSession(code, 'Player2');
      
      await startGame(session.id);
      
      // Set numerical question without acceptableRange
      const numericalSession = getSession(session.id);
      if (numericalSession) {
        numericalSession.currentQuestion = {
          id: 'test-num-2',
          type: 'numerical',
          text: 'What is 1000?',
          category: 'Test',
          difficulty: 'medium',
          explanation: 'Test explanation',
          correctAnswer: 1000,
        };
      }
      
      changePhase(session.id, 'voting');
      
      // Player 1 votes within 10% (default range)
      submitVote(session.id, hostId, 1050, 5);
      // Player 2 votes outside 10%
      submitVote(session.id, player2!.playerId, 1200, 3);
      
      const result = getSession(session.id);
      const hostPlayer = result?.players.find(p => p.id === hostId);
      const player2Data = result?.players.find(p => p.id === player2!.playerId);
      
      expect(hostPlayer?.score).toBe(5);
      expect(player2Data?.score).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle player not found in vote processing', async () => {
      const { session, hostId, code } = createGameSession('Host');
      joinGameSession(code, 'Player2');
      
      await startGame(session.id);
      changePhase(session.id, 'voting');
      
      // Manually add a vote with non-existent player ID
      const currentSession = getSession(session.id);
      if (currentSession) {
        currentSession.votes.push({
          playerId: 'non-existent-player',
          answer: 0,
          token: 5,
          submittedAt: Date.now(),
        });
        
        // Trigger auto-reveal by having all real players vote
        submitVote(session.id, hostId, 0, 3);
        
        // Should not crash
        const result = getSession(session.id);
        expect(result).not.toBeNull();
      }
    });
  });
});
