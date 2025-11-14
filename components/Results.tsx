import { GameSession } from '@/types/game';

interface ResultsProps {
  session: GameSession;
  onPlayAgain: () => void;
}

export function Results({ session, onPlayAgain }: ResultsProps) {
  const sortedPlayers = [...session.players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Game Over!</h1>
          <div className="inline-block bg-yellow-500/20 border-2 border-yellow-500 rounded-2xl px-8 py-6 mt-4">
            <p className="text-sm text-yellow-300 mb-2">Winner</p>
            <div className="flex items-center justify-center gap-3">
              <div
                className="w-12 h-12 rounded-full"
                style={{ backgroundColor: winner.color }}
              ></div>
              <div className="text-left">
                <p className="text-3xl font-bold">{winner.name}</p>
                <p className="text-xl text-yellow-300">{winner.score} points</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Final Scores</h2>
          <div className="space-y-3">
            {sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center gap-3 p-4 bg-gray-700/50 rounded-xl"
              >
                <div className="text-2xl font-bold text-gray-400 w-8">
                  #{index + 1}
                </div>
                <div
                  className="w-10 h-10 rounded-full"
                  style={{ backgroundColor: player.color }}
                ></div>
                <div className="flex-1">
                  <p className="font-medium">{player.name}</p>
                  <p className="text-sm text-gray-400">
                    {player.usedTokens.length} correct answers
                  </p>
                </div>
                <div className="text-3xl font-bold">{player.score}</div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onPlayAgain}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-2xl shadow-lg transform active:scale-95 transition-all"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
