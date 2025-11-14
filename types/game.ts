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

export type QuestionType = 'multiple-choice' | 'true-false' | 'more-or-less' | 'numerical';

export interface BaseQuestion {
  id: string;
  text: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation: string;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple-choice';
  options: string[];
  correctAnswer: number; // index of correct option (0-3)
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: 'true-false';
  correctAnswer: boolean;
}

export interface MoreOrLessQuestion extends BaseQuestion {
  type: 'more-or-less';
  option1: string; // first thing to compare
  option2: string; // second thing to compare
  correctAnswer: 0 | 1; // 0 for option1, 1 for option2
}

export interface NumericalQuestion extends BaseQuestion {
  type: 'numerical';
  correctAnswer: number;
  unit?: string; // optional unit (e.g., "km", "years", "%")
  acceptableRange?: number; // how close answer needs to be to count as correct (default: 10%)
}

export type Question = MultipleChoiceQuestion | TrueFalseQuestion | MoreOrLessQuestion | NumericalQuestion;

export interface PlayerVote {
  playerId: string;
  answer: number | boolean; // number for multiple-choice/numerical/more-or-less (0 or 1), boolean for true-false
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
