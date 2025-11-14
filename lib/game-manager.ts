import { GameSession, Player, Question, PlayerVote } from '@/types/game';
import { getRandomQuestions } from './questions';

// In-memory storage for game sessions
const gameSessions = new Map<string, GameSession>();
const sessionCodes = new Map<string, string>(); // code -> sessionId mapping

// Player colors for the game
export const PLAYER_COLORS = [
  '#EF4444', // red
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#8B5CF6', // purple
  '#EC4899', // pink
];

// Generate a unique 4-character game code
export function generateGameCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing characters
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Generate unique player ID
export function generatePlayerId(): string {
  return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Generate unique session ID
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Create a new game session
export function createGameSession(hostName: string): { session: GameSession; hostId: string; code: string } {
  const sessionId = generateSessionId();
  const code = generateGameCode();
  const hostId = generatePlayerId();

  const host: Player = {
    id: hostId,
    name: hostName,
    color: PLAYER_COLORS[0],
    score: 0,
    availableTokens: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    usedTokens: [],
    isHost: true,
    isConnected: true,
  };

  const session: GameSession = {
    id: sessionId,
    code,
    hostId,
    players: [host],
    currentPhase: 'lobby',
    currentRound: 0,
    totalRounds: 10,
    currentQuestion: null,
    votes: [],
    questionHistory: [],
    createdAt: Date.now(),
    lastActivity: Date.now(),
  };

  gameSessions.set(sessionId, session);
  sessionCodes.set(code, sessionId);

  return { session, hostId, code };
}

// Join an existing game session
export function joinGameSession(code: string, playerName: string): { session: GameSession; playerId: string; error?: string } | null {
  const sessionId = sessionCodes.get(code.toUpperCase());
  if (!sessionId) return null;

  const session = gameSessions.get(sessionId);
  if (!session) return null;
  
  if (session.currentPhase !== 'lobby') return null;

  if (session.players.length >= 6) {
    return { session, playerId: '', error: 'Game is full' };
  }

  const playerId = generatePlayerId();
  const colorIndex = session.players.length % PLAYER_COLORS.length;

  const player: Player = {
    id: playerId,
    name: playerName,
    color: PLAYER_COLORS[colorIndex],
    score: 0,
    availableTokens: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    usedTokens: [],
    isHost: false,
    isConnected: true,
  };

  session.players.push(player);
  session.lastActivity = Date.now();

  return { session, playerId };
}

// Get session by ID
export function getSession(sessionId: string): GameSession | null {
  return gameSessions.get(sessionId) || null;
}

// Get session by code
export function getSessionByCode(code: string): GameSession | null {
  const sessionId = sessionCodes.get(code.toUpperCase());
  return sessionId ? gameSessions.get(sessionId) || null : null;
}

// Start the game
export function startGame(sessionId: string): GameSession | null {
  const session = gameSessions.get(sessionId);
  if (!session || session.currentPhase !== 'lobby' || session.players.length < 2) return null;

  // Get random questions for the game
  const questions = getRandomQuestions(session.totalRounds);
  session.questionHistory = questions;
  session.currentRound = 1;
  session.currentQuestion = questions[0];
  session.currentPhase = 'question';
  session.lastActivity = Date.now();

  return session;
}

// Helper function to check if answer is correct
function isAnswerCorrect(question: Question, answer: number | boolean): boolean {
  if ('type' in question) {
    switch (question.type) {
      case 'multiple-choice':
        return typeof answer === 'number' && answer === question.correctAnswer;
      case 'true-false':
        return typeof answer === 'boolean' && answer === question.correctAnswer;
      case 'more-or-less':
        return typeof answer === 'number' && answer === question.correctAnswer;
      case 'numerical':
        if (typeof answer !== 'number') return false;
        const range = question.acceptableRange || (question.correctAnswer * 0.1);
        return Math.abs(answer - question.correctAnswer) <= range;
      default:
        return false;
    }
  }
  // Legacy multiple-choice questions without type field
  return typeof answer === 'number' && answer === (question as any).correctAnswer;
}

// Submit a vote
export function submitVote(sessionId: string, playerId: string, answer: number | boolean, token: number): GameSession | null {
  const session = gameSessions.get(sessionId);
  if (!session || session.currentPhase !== 'voting') return null;

  const player = session.players.find(p => p.id === playerId);
  if (!player || !player.availableTokens.includes(token)) return null;

  // Check if player already voted
  const existingVoteIndex = session.votes.findIndex(v => v.playerId === playerId);
  if (existingVoteIndex >= 0) {
    // Update existing vote
    session.votes[existingVoteIndex] = { playerId, answer, token, submittedAt: Date.now() };
  } else {
    // Add new vote
    session.votes.push({ playerId, answer, token, submittedAt: Date.now() });
  }

  session.lastActivity = Date.now();

  // Check if all players have voted
  if (session.votes.length === session.players.length) {
    session.currentPhase = 'reveal';
    // Process results immediately when all votes are in
    session.votes.forEach(vote => {
      const player = session.players.find(p => p.id === vote.playerId);
      if (!player) return;

      // Remove token from available tokens
      player.availableTokens = player.availableTokens.filter(t => t !== vote.token);

      // If answer is correct, add to score and used tokens
      if (session.currentQuestion && isAnswerCorrect(session.currentQuestion, vote.answer)) {
        player.score += vote.token;
        player.usedTokens.push(vote.token);
      }
    });
  }

  return session;
}

// Process round results (only if not already processed)
export function processRoundResults(sessionId: string): GameSession | null {
  const session = gameSessions.get(sessionId);
  if (!session || !session.currentQuestion) return null;

  // If not in reveal phase yet, change to reveal and process results
  if (session.currentPhase === 'voting') {
    session.currentPhase = 'reveal';

    // Process each vote
    session.votes.forEach(vote => {
      const player = session.players.find(p => p.id === vote.playerId);
      if (!player) return;

      // Remove token from available tokens
      player.availableTokens = player.availableTokens.filter(t => t !== vote.token);

      // If answer is correct, add to score and used tokens
      if (isAnswerCorrect(session.currentQuestion!, vote.answer)) {
        player.score += vote.token;
        player.usedTokens.push(vote.token);
      }
    });
  }

  session.lastActivity = Date.now();
  return session;
}

// Move to next round
export function nextRound(sessionId: string): GameSession | null {
  const session = gameSessions.get(sessionId);
  if (!session) return null;

  session.votes = [];

  if (session.currentRound >= session.totalRounds) {
    session.currentPhase = 'results';
    session.currentQuestion = null;
  } else {
    session.currentRound += 1;
    session.currentQuestion = session.questionHistory[session.currentRound - 1];
    session.currentPhase = 'question';
  }

  session.lastActivity = Date.now();
  return session;
}

// Change phase
export function changePhase(sessionId: string, phase: string): GameSession | null {
  const session = gameSessions.get(sessionId);
  if (!session) return null;

  session.currentPhase = phase as any;
  session.lastActivity = Date.now();
  return session;
}

// Update player connection status
export function updatePlayerConnection(sessionId: string, playerId: string, isConnected: boolean): void {
  const session = gameSessions.get(sessionId);
  if (!session) return;

  const player = session.players.find(p => p.id === playerId);
  if (player) {
    player.isConnected = isConnected;
    session.lastActivity = Date.now();
  }
}

// Clean up inactive sessions (call this periodically)
export function cleanupInactiveSessions(maxInactiveMinutes: number = 60): void {
  const now = Date.now();
  const maxInactiveMs = maxInactiveMinutes * 60 * 1000;

  for (const [sessionId, session] of gameSessions.entries()) {
    if (now - session.lastActivity > maxInactiveMs) {
      gameSessions.delete(sessionId);
      sessionCodes.delete(session.code);
    }
  }
}

// Start periodic cleanup (runs every 10 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cleanupInactiveSessions(60); // Clean up sessions inactive for 60+ minutes
  }, 10 * 60 * 1000);
}
