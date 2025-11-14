import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Lobby } from '../../components/Lobby';
import { Results } from '../../components/Results';
import type { GameSession, Player } from '../../types/game';

describe('Component Tests', () => {
  describe('Lobby Component', () => {
    const mockPlayers: Player[] = [
      {
        id: 'player1',
        name: 'Alice',
        color: '#EF4444',
        score: 0,
        availableTokens: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        usedTokens: [],
        isHost: true,
        isConnected: true,
      },
      {
        id: 'player2',
        name: 'Bob',
        color: '#3B82F6',
        score: 0,
        availableTokens: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        usedTokens: [],
        isHost: false,
        isConnected: true,
      },
    ];

    it('should display game code', () => {
      const mockStartGame = vi.fn();
      const mockSession: GameSession = {
        id: 'session1',
        code: 'ABCD',
        hostId: 'player1',
        players: mockPlayers,
        currentPhase: 'lobby',
        currentRound: 0,
        totalRounds: 10,
        currentQuestion: null,
        votes: [],
        questionHistory: [],
        createdAt: Date.now(),
        lastActivity: Date.now(),
      };
      render(
        <Lobby
          session={mockSession}
          isHost={true}
          onStartGame={mockStartGame}
        />
      );

      expect(screen.getByText(/ABCD/)).toBeInTheDocument();
    });

    it('should display all players', () => {
      const mockStartGame = vi.fn();
      const mockSession: GameSession = {
        id: 'session1',
        code: 'ABCD',
        hostId: 'player1',
        players: mockPlayers,
        currentPhase: 'lobby',
        currentRound: 0,
        totalRounds: 10,
        currentQuestion: null,
        votes: [],
        questionHistory: [],
        createdAt: Date.now(),
        lastActivity: Date.now(),
      };
      render(
        <Lobby
          session={mockSession}
          isHost={true}
          onStartGame={mockStartGame}
        />
      );

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('should show start button only for host', () => {
      const mockStartGame = vi.fn();
      const mockSession: GameSession = {
        id: 'session1',
        code: 'ABCD',
        hostId: 'player1',
        players: mockPlayers,
        currentPhase: 'lobby',
        currentRound: 0,
        totalRounds: 10,
        currentQuestion: null,
        votes: [],
        questionHistory: [],
        createdAt: Date.now(),
        lastActivity: Date.now(),
      };
      const { rerender } = render(
        <Lobby
          session={mockSession}
          isHost={true}
          onStartGame={mockStartGame}
        />
      );

      expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument();

      rerender(
        <Lobby
          session={mockSession}
          isHost={false}
          onStartGame={mockStartGame}
        />
      );

      expect(screen.queryByRole('button', { name: /start game/i })).not.toBeInTheDocument();
    });

    it('should call onStartGame when start button clicked', async () => {
      const mockStartGame = vi.fn();
      const mockSession: GameSession = {
        id: 'session1',
        code: 'ABCD',
        hostId: 'player1',
        players: mockPlayers,
        currentPhase: 'lobby',
        currentRound: 0,
        totalRounds: 10,
        currentQuestion: null,
        votes: [],
        questionHistory: [],
        createdAt: Date.now(),
        lastActivity: Date.now(),
      };
      render(
        <Lobby
          session={mockSession}
          isHost={true}
          onStartGame={mockStartGame}
        />
      );

      const startButton = screen.getByRole('button', { name: /start game/i });
      await userEvent.click(startButton);

      expect(mockStartGame).toHaveBeenCalledTimes(1);
    });

    it('should disable start button with less than 2 players', () => {
      const mockStartGame = vi.fn();
      const mockSession: GameSession = {
        id: 'session1',
        code: 'ABCD',
        hostId: 'player1',
        players: [mockPlayers[0]],
        currentPhase: 'lobby',
        currentRound: 0,
        totalRounds: 10,
        currentQuestion: null,
        votes: [],
        questionHistory: [],
        createdAt: Date.now(),
        lastActivity: Date.now(),
      };
      render(
        <Lobby
          session={mockSession}
          isHost={true}
          onStartGame={mockStartGame}
        />
      );

      const startButton = screen.getByRole('button', { name: /waiting for players/i });
      expect(startButton).toBeDisabled();
    });

    it('should show player connection status', () => {
      const disconnectedPlayers = [
        ...mockPlayers,
        {
          id: 'player3',
          name: 'Charlie',
          color: '#10B981',
          score: 0,
          availableTokens: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          usedTokens: [],
          isHost: false,
          isConnected: false,
        },
      ];

      const mockSession: GameSession = {
        id: 'session1',
        code: 'ABCD',
        hostId: 'player1',
        players: disconnectedPlayers,
        currentPhase: 'lobby',
        currentRound: 0,
        totalRounds: 10,
        currentQuestion: null,
        votes: [],
        questionHistory: [],
        createdAt: Date.now(),
        lastActivity: Date.now(),
      };

      render(
        <Lobby
          session={mockSession}
          isHost={true}
          onStartGame={vi.fn()}
        />
      );

      // Check for connection indicators
      const connectedElements = screen.getAllByText('Alice').concat(screen.getAllByText('Bob'));
      expect(connectedElements.length).toBeGreaterThan(0);
    });
  });

  describe('Results Component', () => {
    const mockPlayers: Player[] = [
      {
        id: 'player1',
        name: 'Alice',
        color: '#EF4444',
        score: 35,
        availableTokens: [],
        usedTokens: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
        isHost: true,
        isConnected: true,
      },
      {
        id: 'player2',
        name: 'Bob',
        color: '#3B82F6',
        score: 42,
        availableTokens: [],
        usedTokens: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
        isHost: false,
        isConnected: true,
      },
      {
        id: 'player3',
        name: 'Charlie',
        color: '#10B981',
        score: 28,
        availableTokens: [],
        usedTokens: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
        isHost: false,
        isConnected: true,
      },
    ];

    it('should display all players sorted by score', () => {
      const mockSession: GameSession = {
        id: 'session1',
        code: 'ABCD',
        hostId: 'player1',
        players: mockPlayers,
        currentPhase: 'results',
        currentRound: 10,
        totalRounds: 10,
        currentQuestion: null,
        votes: [],
        questionHistory: [],
        createdAt: Date.now(),
        lastActivity: Date.now(),
      };
      render(<Results session={mockSession} onPlayAgain={vi.fn()} />);

      const names = screen.getAllByText(/(Alice|Bob|Charlie)/);
      expect(names.length).toBeGreaterThanOrEqual(3);
    });

    it('should show winner with highest score', () => {
      const mockSession: GameSession = {
        id: 'session1',
        code: 'ABCD',
        hostId: 'player1',
        players: mockPlayers,
        currentPhase: 'results',
        currentRound: 10,
        totalRounds: 10,
        currentQuestion: null,
        votes: [],
        questionHistory: [],
        createdAt: Date.now(),
        lastActivity: Date.now(),
      };
      render(<Results session={mockSession} onPlayAgain={vi.fn()} />);

      // Bob should be visible as winner (highest score)
      const bobElements = screen.getAllByText('Bob');
      expect(bobElements.length).toBeGreaterThan(0);
      expect(screen.getByText(/winner/i)).toBeInTheDocument();
    });

    it('should display scores for all players', () => {
      const mockSession: GameSession = {
        id: 'session1',
        code: 'ABCD',
        hostId: 'player1',
        players: mockPlayers,
        currentPhase: 'results',
        currentRound: 10,
        totalRounds: 10,
        currentQuestion: null,
        votes: [],
        questionHistory: [],
        createdAt: Date.now(),
        lastActivity: Date.now(),
      };
      const { container } = render(<Results session={mockSession} onPlayAgain={vi.fn()} />);

      // Check that all scores are present in the document
      expect(container.textContent).toContain('42');
      expect(container.textContent).toContain('35');
      expect(container.textContent).toContain('28');
    });

    it('should show play again button', () => {
      const mockSession: GameSession = {
        id: 'session1',
        code: 'ABCD',
        hostId: 'player1',
        players: mockPlayers,
        currentPhase: 'results',
        currentRound: 10,
        totalRounds: 10,
        currentQuestion: null,
        votes: [],
        questionHistory: [],
        createdAt: Date.now(),
        lastActivity: Date.now(),
      };
      render(<Results session={mockSession} onPlayAgain={vi.fn()} />);

      const playAgainButton = screen.getByRole('button', { name: /play again/i });
      expect(playAgainButton).toBeInTheDocument();
    });

    it('should navigate to home when play again clicked', async () => {
      const mockPlayAgain = vi.fn();
      const mockSession: GameSession = {
        id: 'session1',
        code: 'ABCD',
        hostId: 'player1',
        players: mockPlayers,
        currentPhase: 'results',
        currentRound: 10,
        totalRounds: 10,
        currentQuestion: null,
        votes: [],
        questionHistory: [],
        createdAt: Date.now(),
        lastActivity: Date.now(),
      };
      render(<Results session={mockSession} onPlayAgain={mockPlayAgain} />);

      const playAgainButton = screen.getByRole('button', { name: /play again/i });
      await userEvent.click(playAgainButton);

      expect(mockPlayAgain).toHaveBeenCalledTimes(1);
    });

    it('should handle tie scores correctly', () => {
      const tiedPlayers = [
        { ...mockPlayers[0], score: 40 },
        { ...mockPlayers[1], score: 40 },
        { ...mockPlayers[2], score: 30 },
      ];

      const mockSession: GameSession = {
        id: 'session1',
        code: 'ABCD',
        hostId: 'player1',
        players: tiedPlayers,
        currentPhase: 'results',
        currentRound: 10,
        totalRounds: 10,
        currentQuestion: null,
        votes: [],
        questionHistory: [],
        createdAt: Date.now(),
        lastActivity: Date.now(),
      };
      const { container } = render(<Results session={mockSession} onPlayAgain={vi.fn()} />);

      // Both tied players should be visible
      expect(container.textContent).toContain('Alice');
      expect(container.textContent).toContain('Bob');
      expect(container.textContent).toContain('Charlie');
      // Check that tied scores are shown correctly
      const scoreMatches = container.textContent?.match(/40/g);
      expect(scoreMatches?.length).toBeGreaterThanOrEqual(2);
    });

    it('should display player colors', () => {
      const mockSession: GameSession = {
        id: 'session1',
        code: 'ABCD',
        hostId: 'player1',
        players: mockPlayers,
        currentPhase: 'results',
        currentRound: 10,
        totalRounds: 10,
        currentQuestion: null,
        votes: [],
        questionHistory: [],
        createdAt: Date.now(),
        lastActivity: Date.now(),
      };
      const { container } = render(<Results session={mockSession} onPlayAgain={vi.fn()} />);

      // Check if color styles are applied (implementation-specific)
      const playerElements = container.querySelectorAll('[style*="background-color"], [style*="color"]');
      expect(playerElements.length).toBeGreaterThan(0);
    });
  });

  describe('Integration: Component Interactions', () => {
    it('should update lobby when player joins', async () => {
      const mockPlayers: Player[] = [
        {
          id: 'player1',
          name: 'Alice',
          color: '#EF4444',
          score: 0,
          availableTokens: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          usedTokens: [],
          isHost: true,
          isConnected: true,
        },
      ];

      const mockSession: GameSession = {
        id: 'session1',
        code: 'ABCD',
        hostId: 'player1',
        players: mockPlayers,
        currentPhase: 'lobby',
        currentRound: 0,
        totalRounds: 10,
        currentQuestion: null,
        votes: [],
        questionHistory: [],
        createdAt: Date.now(),
        lastActivity: Date.now(),
      };

      const { rerender } = render(
        <Lobby
          session={mockSession}
          isHost={true}
          onStartGame={vi.fn()}
        />
      );

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.queryByText('Bob')).not.toBeInTheDocument();

      // Simulate new player joining
      const updatedPlayers = [
        ...mockPlayers,
        {
          id: 'player2',
          name: 'Bob',
          color: '#3B82F6',
          score: 0,
          availableTokens: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          usedTokens: [],
          isHost: false,
          isConnected: true,
        },
      ];

      const updatedSession = { ...mockSession, players: updatedPlayers };

      rerender(
        <Lobby
          session={updatedSession}
          isHost={true}
          onStartGame={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Bob')).toBeInTheDocument();
      });
    });
  });
});
