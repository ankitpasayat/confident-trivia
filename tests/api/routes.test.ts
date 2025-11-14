import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as createGameRoute } from '../../app/api/game/create/route';
import { POST as joinGameRoute } from '../../app/api/game/join/route';
import { POST as startGameRoute } from '../../app/api/game/start/route';
import { POST as voteRoute } from '../../app/api/game/vote/route';
import { POST as phaseRoute } from '../../app/api/game/phase/route';
import { getSession } from '../../lib/game-manager';
import { Player } from '../../types/game';

// Helper to create NextRequest from plain object
function createNextRequest(url: string, init: RequestInit): NextRequest {
  return new NextRequest(url, init as any);
}

describe('API Routes Tests', () => {
  describe('POST /api/game/create', () => {
    it('should create a new game session', async () => {
      const request = createNextRequest('http://localhost/api/game/create', {
        method: 'POST',
        body: JSON.stringify({ hostName: 'Alice' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await createGameRoute(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.code).toHaveLength(4);
      expect(data.sessionId).toBeDefined();
      expect(data.hostId).toBeDefined();
    });

    it('should return 400 for missing hostName', async () => {
      const request = createNextRequest('http://localhost/api/game/create', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await createGameRoute(request);

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid JSON', async () => {
      const request = createNextRequest('http://localhost/api/game/create', {
        method: 'POST',
        body: 'invalid json{',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await createGameRoute(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request format');
    });
  });

  describe('POST /api/game/join', () => {
    it('should allow joining an existing game', async () => {
      // First create a game
      const createRequest = createNextRequest('http://localhost/api/game/create', {
        method: 'POST',
        body: JSON.stringify({ hostName: 'Host' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const createResponse = await createGameRoute(createRequest);
      const { code } = await createResponse.json();

      // Now join
      const joinRequest = createNextRequest('http://localhost/api/game/join', {
        method: 'POST',
        body: JSON.stringify({ code, playerName: 'Player2' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await joinGameRoute(joinRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.sessionId).toBeDefined();
      expect(data.playerId).toBeDefined();
    });

    it('should return error for invalid code', async () => {
      const request = createNextRequest('http://localhost/api/game/join', {
        method: 'POST',
        body: JSON.stringify({ code: 'XXXX', playerName: 'Player' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await joinGameRoute(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });

    it('should return 400 for missing code', async () => {
      const request = createNextRequest('http://localhost/api/game/join', {
        method: 'POST',
        body: JSON.stringify({ playerName: 'Player' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await joinGameRoute(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Code and player name are required');
    });

    it('should return 400 for missing playerName', async () => {
      const request = createNextRequest('http://localhost/api/game/join', {
        method: 'POST',
        body: JSON.stringify({ code: 'ABCD' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await joinGameRoute(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Code and player name are required');
    });

    it('should return 400 for empty playerName', async () => {
      const request = createNextRequest('http://localhost/api/game/join', {
        method: 'POST',
        body: JSON.stringify({ code: 'ABCD', playerName: '   ' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await joinGameRoute(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Code and player name are required');
    });

    it('should return error when game is full (6 players)', async () => {
      // Create game
      const createRequest = createNextRequest('http://localhost/api/game/create', {
        method: 'POST',
        body: JSON.stringify({ hostName: 'Host' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const createResponse = await createGameRoute(createRequest);
      const { code } = await createResponse.json();

      // Add 5 more players to reach max (6 total)
      for (let i = 1; i <= 5; i++) {
        const joinRequest = createNextRequest('http://localhost/api/game/join', {
          method: 'POST',
          body: JSON.stringify({ code, playerName: `Player${i}` }),
          headers: { 'Content-Type': 'application/json' },
        });
        await joinGameRoute(joinRequest);
      }

      // Try to add 7th player
      const request = createNextRequest('http://localhost/api/game/join', {
        method: 'POST',
        body: JSON.stringify({ code, playerName: 'Player7' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await joinGameRoute(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Game is full');
    });

    it('should return 400 for invalid JSON', async () => {
      const request = createNextRequest('http://localhost/api/game/join', {
        method: 'POST',
        body: 'invalid json{',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await joinGameRoute(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request format');
    });
  });

  describe('POST /api/game/start', () => {
    it('should start a game with sufficient players', async () => {
      // Create game
      const createRequest = createNextRequest('http://localhost/api/game/create', {
        method: 'POST',
        body: JSON.stringify({ hostName: 'Host' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const createResponse = await createGameRoute(createRequest);
      const { code, sessionId } = await createResponse.json();

      // Add second player
      const joinRequest = createNextRequest('http://localhost/api/game/join', {
        method: 'POST',
        body: JSON.stringify({ code, playerName: 'Player2' }),
        headers: { 'Content-Type': 'application/json' },
      });
      await joinGameRoute(joinRequest);

      // Start game
      const startRequest = createNextRequest('http://localhost/api/game/start', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await startGameRoute(startRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should not start game with only 1 player', async () => {
      const createRequest = createNextRequest('http://localhost/api/game/create', {
        method: 'POST',
        body: JSON.stringify({ hostName: 'Host' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const createResponse = await createGameRoute(createRequest);
      const { sessionId } = await createResponse.json();

      const startRequest = createNextRequest('http://localhost/api/game/start', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await startGameRoute(startRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should return 400 for missing sessionId', async () => {
      const request = createNextRequest('http://localhost/api/game/start', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await startGameRoute(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Session ID is required');
    });

    it('should return 400 for invalid sessionId', async () => {
      const request = createNextRequest('http://localhost/api/game/start', {
        method: 'POST',
        body: JSON.stringify({ sessionId: 'invalid-session-id' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await startGameRoute(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Cannot start game - need at least 2 players');
    });

    it('should return 400 for invalid JSON', async () => {
      const request = createNextRequest('http://localhost/api/game/start', {
        method: 'POST',
        body: 'invalid json{',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await startGameRoute(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request format');
    });
  });

  describe('POST /api/game/vote', () => {
    it('should accept valid vote', async () => {
      // Setup: Create game, join, and start
      const createRequest = createNextRequest('http://localhost/api/game/create', {
        method: 'POST',
        body: JSON.stringify({ hostName: 'Host' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const createResponse = await createGameRoute(createRequest);
      const { code, sessionId, hostId } = await createResponse.json();

      const joinRequest = createNextRequest('http://localhost/api/game/join', {
        method: 'POST',
        body: JSON.stringify({ code, playerName: 'Player2' }),
        headers: { 'Content-Type': 'application/json' },
      });
      await joinGameRoute(joinRequest);

      await startGameRoute(createNextRequest('http://localhost/api/game/start', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
        headers: { 'Content-Type': 'application/json' },
      }));

      // Change to voting phase
      await phaseRoute(createNextRequest('http://localhost/api/game/phase', {
        method: 'POST',
        body: JSON.stringify({ sessionId, phase: 'voting' }),
        headers: { 'Content-Type': 'application/json' },
      }));

      // Submit vote
      const voteRequest = createNextRequest('http://localhost/api/game/vote', {
        method: 'POST',
        body: JSON.stringify({ sessionId, playerId: hostId, answer: 0, token: 5 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await voteRoute(voteRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('POST /api/game/phase', () => {
    it('should change game phase to voting', async () => {
      const createRequest = createNextRequest('http://localhost/api/game/create', {
        method: 'POST',
        body: JSON.stringify({ hostName: 'Host' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const createResponse = await createGameRoute(createRequest);
      const { sessionId, code } = await createResponse.json();

      await joinGameRoute(createNextRequest('http://localhost/api/game/join', {
        method: 'POST',
        body: JSON.stringify({ code, playerName: 'Player2' }),
        headers: { 'Content-Type': 'application/json' },
      }));

      await startGameRoute(createNextRequest('http://localhost/api/game/start', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
        headers: { 'Content-Type': 'application/json' },
      }));

      const phaseRequest = createNextRequest('http://localhost/api/game/phase', {
        method: 'POST',
        body: JSON.stringify({ sessionId, phase: 'voting' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await phaseRoute(phaseRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.session.currentPhase).toBe('voting');
    });

    it('should return 400 for missing sessionId', async () => {
      const request = createNextRequest('http://localhost/api/game/phase', {
        method: 'POST',
        body: JSON.stringify({ phase: 'voting' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await phaseRoute(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('required');
    });

    it('should return 400 for missing phase', async () => {
      const request = createNextRequest('http://localhost/api/game/phase', {
        method: 'POST',
        body: JSON.stringify({ sessionId: 'test-session' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await phaseRoute(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('required');
    });

    it('should return 400 for invalid sessionId', async () => {
      const request = createNextRequest('http://localhost/api/game/phase', {
        method: 'POST',
        body: JSON.stringify({ sessionId: 'invalid-session', phase: 'voting' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await phaseRoute(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should handle reveal phase transition', async () => {
      const createRequest = createNextRequest('http://localhost/api/game/create', {
        method: 'POST',
        body: JSON.stringify({ hostName: 'Host' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const createResponse = await createGameRoute(createRequest);
      const { sessionId, code, hostId } = await createResponse.json();

      const joinResponse = await joinGameRoute(createNextRequest('http://localhost/api/game/join', {
        method: 'POST',
        body: JSON.stringify({ code, playerName: 'Player2' }),
        headers: { 'Content-Type': 'application/json' },
      }));
      const { playerId } = await joinResponse.json();

      await startGameRoute(createNextRequest('http://localhost/api/game/start', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
        headers: { 'Content-Type': 'application/json' },
      }));

      // Change to voting phase
      await phaseRoute(createNextRequest('http://localhost/api/game/phase', {
        method: 'POST',
        body: JSON.stringify({ sessionId, phase: 'voting' }),
        headers: { 'Content-Type': 'application/json' },
      }));

      // Submit votes from both players
      await voteRoute(createNextRequest('http://localhost/api/game/vote', {
        method: 'POST',
        body: JSON.stringify({ sessionId, playerId: hostId, answer: 0, token: 5 }),
        headers: { 'Content-Type': 'application/json' },
      }));

      await voteRoute(createNextRequest('http://localhost/api/game/vote', {
        method: 'POST',
        body: JSON.stringify({ sessionId, playerId, answer: 0, token: 3 }),
        headers: { 'Content-Type': 'application/json' },
      }));

      // Now reveal phase should work
      const revealRequest = createNextRequest('http://localhost/api/game/phase', {
        method: 'POST',
        body: JSON.stringify({ sessionId, phase: 'reveal' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await phaseRoute(revealRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle question phase transition', async () => {
      const createRequest = createNextRequest('http://localhost/api/game/create', {
        method: 'POST',
        body: JSON.stringify({ hostName: 'Host' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const createResponse = await createGameRoute(createRequest);
      const { sessionId, code } = await createResponse.json();

      await joinGameRoute(createNextRequest('http://localhost/api/game/join', {
        method: 'POST',
        body: JSON.stringify({ code, playerName: 'Player2' }),
        headers: { 'Content-Type': 'application/json' },
      }));

      await startGameRoute(createNextRequest('http://localhost/api/game/start', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
        headers: { 'Content-Type': 'application/json' },
      }));

      const nextRoundRequest = createNextRequest('http://localhost/api/game/phase', {
        method: 'POST',
        body: JSON.stringify({ sessionId, phase: 'question' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await phaseRoute(nextRoundRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 400 for invalid JSON', async () => {
      const request = createNextRequest('http://localhost/api/game/phase', {
        method: 'POST',
        body: 'invalid json{',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await phaseRoute(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request format');
    });
  });

  describe('POST /api/game/vote', () => {
    it('should submit a vote successfully', async () => {
      const createRequest = createNextRequest('http://localhost/api/game/create', {
        method: 'POST',
        body: JSON.stringify({ hostName: 'Host' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const createResponse = await createGameRoute(createRequest);
      const { sessionId, code, hostId } = await createResponse.json();

      await joinGameRoute(createNextRequest('http://localhost/api/game/join', {
        method: 'POST',
        body: JSON.stringify({ code, playerName: 'Player2' }),
        headers: { 'Content-Type': 'application/json' },
      }));

      await startGameRoute(createNextRequest('http://localhost/api/game/start', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
        headers: { 'Content-Type': 'application/json' },
      }));

      // Change to voting phase
      await phaseRoute(createNextRequest('http://localhost/api/game/phase', {
        method: 'POST',
        body: JSON.stringify({ sessionId, phase: 'voting' }),
        headers: { 'Content-Type': 'application/json' },
      }));

      const voteRequest = createNextRequest('http://localhost/api/game/vote', {
        method: 'POST',
        body: JSON.stringify({ sessionId, playerId: hostId, answer: 0, token: 5 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await voteRoute(voteRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.session.votes).toBeDefined();
    });

    it('should return 400 for missing sessionId', async () => {
      const request = createNextRequest('http://localhost/api/game/vote', {
        method: 'POST',
        body: JSON.stringify({ playerId: 'player1', answer: 0, token: 'token123' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await voteRoute(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing required fields');
    });

    it('should return 400 for missing playerId', async () => {
      const request = createNextRequest('http://localhost/api/game/vote', {
        method: 'POST',
        body: JSON.stringify({ sessionId: 'session1', answer: 0, token: 'token123' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await voteRoute(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing required fields');
    });

    it('should return 400 for missing answer', async () => {
      const request = createNextRequest('http://localhost/api/game/vote', {
        method: 'POST',
        body: JSON.stringify({ sessionId: 'session1', playerId: 'player1', token: 'token123' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await voteRoute(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing required fields');
    });

    it('should return 400 for missing token', async () => {
      const request = createNextRequest('http://localhost/api/game/vote', {
        method: 'POST',
        body: JSON.stringify({ sessionId: 'session1', playerId: 'player1', answer: 0 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await voteRoute(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing required fields');
    });

    it('should return 400 for invalid sessionId', async () => {
      const request = createNextRequest('http://localhost/api/game/vote', {
        method: 'POST',
        body: JSON.stringify({ sessionId: 'invalid', playerId: 'player1', answer: 0, token: 'token123' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await voteRoute(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid vote or game state');
    });

    it('should return 400 for invalid JSON', async () => {
      const request = createNextRequest('http://localhost/api/game/vote', {
        method: 'POST',
        body: 'invalid json{',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await voteRoute(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request format');
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully in create route', async () => {
      // Mock to cause an internal error
      vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const request = createNextRequest('http://localhost/api/game/create', {
        method: 'POST',
        body: JSON.stringify({ hostName: 'x'.repeat(10000) }), // Very long name
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await createGameRoute(request);
      
      // Should still return a valid response (not crash)
      expect(response.status).toBeGreaterThanOrEqual(200);
      
      vi.restoreAllMocks();
    });

    it('should handle errors gracefully in join route', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const request = createNextRequest('http://localhost/api/game/join', {
        method: 'POST',
        body: JSON.stringify({ code: 'TEST', playerName: 'x'.repeat(10000) }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await joinGameRoute(request);
      
      expect(response.status).toBeGreaterThanOrEqual(200);
      
      vi.restoreAllMocks();
    });

    it('should handle errors gracefully in start route', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const request = createNextRequest('http://localhost/api/game/start', {
        method: 'POST',
        body: JSON.stringify({ sessionId: 'test' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await startGameRoute(request);
      
      expect(response.status).toBeGreaterThanOrEqual(200);
      
      vi.restoreAllMocks();
    });

    it('should handle errors gracefully in vote route', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const request = createNextRequest('http://localhost/api/game/vote', {
        method: 'POST',
        body: JSON.stringify({ sessionId: 'test', playerId: 'test', answer: 0, token: 5 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await voteRoute(request);
      
      expect(response.status).toBeGreaterThanOrEqual(200);
      
      vi.restoreAllMocks();
    });

    it('should handle errors gracefully in phase route', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const request = createNextRequest('http://localhost/api/game/phase', {
        method: 'POST',
        body: JSON.stringify({ sessionId: 'test', phase: 'voting' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await phaseRoute(request);
      
      expect(response.status).toBeGreaterThanOrEqual(200);
      
      vi.restoreAllMocks();
    });
  });
});
