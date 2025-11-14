import { GameSession } from '@/types/game';

interface LobbyProps {
  session: GameSession;
  isHost: boolean;
  onStartGame: () => void;
  isStarting?: boolean;
}

export function Lobby({ session, isHost, onStartGame, isStarting = false }: LobbyProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Game Lobby</h1>
          <div className="inline-block bg-blue-500/20 border-2 border-blue-500 rounded-2xl px-8 py-4">
            <p className="text-sm text-gray-400 mb-1">Game Code</p>
            <p className="text-5xl font-bold tracking-widest" data-testid="game-code">{session.code}</p>
          </div>
          <p className="text-gray-400 text-sm mt-4">Share this code with your friends!</p>
        </div>

        <div className="bg-gray-800/50 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Players ({session.players.length}/6)</h2>
          <div className="space-y-3">
            {session.players.map((player) => (
              <div
                key={player.id}
                className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-xl"
              >
                <div
                  className="w-10 h-10 rounded-full flex-shrink-0"
                  style={{ backgroundColor: player.color }}
                ></div>
                <div className="flex-1">
                  <p className="font-medium">{player.name}</p>
                  {player.isHost && (
                    <p className="text-xs text-blue-400">Host</p>
                  )}
                </div>
                <div className={`w-2 h-2 rounded-full ${player.isConnected ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              </div>
            ))}
          </div>
        </div>

        {isHost ? (
          <button
            onClick={onStartGame}
            disabled={session.players.length < 2 || isStarting}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-4 px-6 rounded-2xl shadow-lg transform active:scale-95 transition-all disabled:cursor-not-allowed relative"
          >
            {isStarting ? (
              <span className="flex items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Generating questions with AI...
              </span>
            ) : session.players.length < 2 ? 'Waiting for players...' : 'Start Game'}
          </button>
        ) : (
          <div className="text-center p-4 bg-gray-800/50 rounded-2xl">
            <p className="text-gray-400">Waiting for host to start the game...</p>
          </div>
        )}
      </div>
    </div>
  );
}
