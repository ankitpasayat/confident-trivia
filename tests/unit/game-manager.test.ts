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

    it('should not allow joining after game starts', () => {
      const { code, session } = createGameSession('Host');
      joinGameSession(code, 'Player2');
      startGame(session.id);

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
    it('should start game with 2+ players', () => {
      const { session } = createGameSession('Host');
      joinGameSession(session.code, 'Player2');

      const result = startGame(session.id);

      expect(result).not.toBeNull();
      expect(result?.currentPhase).toBe('question');
      expect(result?.currentRound).toBe(1);
      expect(result?.currentQuestion).not.toBeNull();
      expect(result?.questionHistory).toHaveLength(10);
    });

    it('should not start with only 1 player', () => {
      const { session } = createGameSession('Host');
      const result = startGame(session.id);

      expect(result).toBeNull();
    });

    it('should not start non-existent game', () => {
      const result = startGame('invalid-id');
      expect(result).toBeNull();
    });

    it('should not start already started game', () => {
      const { session, code } = createGameSession('Host');
      joinGameSession(code, 'Player2');
      
      startGame(session.id);
      const result = startGame(session.id);

      expect(result).toBeNull();
    });
  });

  describe('submitVote', () => {
    it('should accept valid vote during voting phase', () => {
      const { session, hostId, code } = createGameSession('Host');
      const player2Result = joinGameSession(code, 'Player2');
      startGame(session.id);
      changePhase(session.id, 'voting');

      const result = submitVote(session.id, hostId, 0, 5);

      expect(result).not.toBeNull();
      expect(result?.votes).toHaveLength(1);
      expect(result?.votes[0].playerId).toBe(hostId);
      expect(result?.votes[0].answer).toBe(0);
      expect(result?.votes[0].token).toBe(5);
    });

    it('should not accept vote with unavailable token', () => {
      const { session, hostId, code } = createGameSession('Host');
      joinGameSession(code, 'Player2');
      startGame(session.id);
      changePhase(session.id, 'voting');

      const result = submitVote(session.id, hostId, 0, 15); // Invalid token
      expect(result).toBeNull();
    });

    it('should allow updating vote', () => {
      const { session, hostId, code } = createGameSession('Host');
      joinGameSession(code, 'Player2');
      startGame(session.id);
      changePhase(session.id, 'voting');

      submitVote(session.id, hostId, 0, 5);
      const result = submitVote(session.id, hostId, 2, 7);

      expect(result?.votes).toHaveLength(1);
      expect(result?.votes[0].answer).toBe(2);
      expect(result?.votes[0].token).toBe(7);
    });

    it('should not accept vote in wrong phase', () => {
      const { session, hostId, code } = createGameSession('Host');
      joinGameSession(code, 'Player2');
      startGame(session.id); // Still in 'question' phase

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
    it('should complete a basic game flow', () => {
      // Create game
      const { session, hostId, code } = createGameSession('Host');
      expect(session.currentPhase).toBe('lobby');

      // Players join
      const player2 = joinGameSession(code, 'Player2');
      const player3 = joinGameSession(code, 'Player3');
      expect(player2).not.toBeNull();
      expect(player3).not.toBeNull();

      // Start game
      const started = startGame(session.id);
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
});
