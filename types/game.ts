// Game types for Confident Trivia

export type GamePhase = 'lobby' | 'question' | 'voting' | 'reveal' | 'results';

export interface Player {
  id: string;
  name: string;
  color: string;
  score: number;
  availableTokens: number[]; // tokens 1-10 that haven't been used
  usedTokens: number[]; // tokens that have been played and scored
  isHost: boolean;
  isConnected: boolean;
}

export interface Question {
  id: string;
  text: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  options: string[];
  correctAnswer: number; // index of correct option (0-3)
  explanation: string;
}

export interface PlayerVote {
  playerId: string;
  answer: number;
  token: number;
  submittedAt: number;
}

export interface GameSession {
  id: string;
  code: string;
  hostId: string;
  players: Player[];
  currentPhase: GamePhase;
  currentRound: number;
  totalRounds: number;
  currentQuestion: Question | null;
  votes: PlayerVote[];
  questionHistory: Question[];
  createdAt: number;
  lastActivity: number;
}

export interface GameState {
  session: GameSession | null;
  currentPlayer: Player | null;
  error: string | null;
  loading: boolean;
}

// API Response types
export interface CreateGameResponse {
  success: boolean;
  sessionId: string;
  code: string;
  hostId: string;
}

export interface JoinGameResponse {
  success: boolean;
  sessionId: string;
  playerId: string;
  error?: string;
}

export interface GameUpdateEvent {
  type: 'player-joined' | 'player-left' | 'game-started' | 'phase-change' | 'votes-updated' | 'round-complete';
  session: GameSession;
  timestamp: number;
}
