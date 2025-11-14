'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<'home' | 'host' | 'join'>('home');
  const [hostName, setHostName] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateGame = async () => {
    if (!hostName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/game/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostName: hostName.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('sessionId', data.sessionId);
        localStorage.setItem('playerId', data.hostId);
        localStorage.setItem('playerName', hostName.trim());
        
        router.push(`/game/${data.sessionId}`);
      } else {
        setError(data.error || 'Failed to create game');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async () => {
    if (!joinName.trim() || !joinCode.trim()) {
      setError('Please enter your name and game code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/game/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: joinCode.trim().toUpperCase(), 
          playerName: joinName.trim() 
        }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('sessionId', data.sessionId);
        localStorage.setItem('playerId', data.playerId);
        localStorage.setItem('playerName', joinName.trim());
        
        router.push(`/game/${data.sessionId}`);
      } else {
        setError(data.error || 'Failed to join game');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-gray-950 to-black">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Confident Trivia
          </h1>
          <p className="text-gray-400 text-sm">Test what you know. Win with confidence.</p>
        </div>

        {mode === 'home' && (
          <div className="space-y-4">
            <button
              onClick={() => setMode('host')}
              className="w-full touch-target bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-2xl shadow-lg transform active:scale-95 transition-all"
            >
              Host New Game
            </button>
            <button
              onClick={() => setMode('join')}
              className="w-full touch-target bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-2xl shadow-lg transform active:scale-95 transition-all"
            >
              Join Game
            </button>

            <div className="mt-8 p-6 bg-gray-800/50 rounded-2xl backdrop-blur-sm">
              <h3 className="font-semibold mb-3 text-lg">How to Play</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• 2-6 players answer 10 trivia questions</li>
                <li>• Bet tokens (1-10) based on your confidence</li>
                <li>• Correct answers = keep your token points</li>
                <li>• Wrong answers = lose that token forever</li>
                <li>• Highest total score after 10 rounds wins!</li>
              </ul>
            </div>
          </div>
        )}

        {mode === 'host' && (
          <div className="space-y-4">
            <button
              onClick={() => setMode('home')}
              className="text-gray-400 hover:text-white mb-4 flex items-center gap-2"
            >
              ← Back
            </button>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Your Name
              </label>
              <input
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateGame()}
                placeholder="Enter your name"
                maxLength={20}
                className="w-full touch-target bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleCreateGame}
              disabled={loading}
              className="w-full touch-target bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-4 px-6 rounded-2xl shadow-lg transform active:scale-95 transition-all disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Game'}
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-4">
            <button
              onClick={() => setMode('home')}
              className="text-gray-400 hover:text-white mb-4 flex items-center gap-2"
            >
              ← Back
            </button>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Your Name
              </label>
              <input
                type="text"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
                className="w-full touch-target bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Game Code
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleJoinGame()}
                placeholder="Enter 4-letter code"
                maxLength={4}
                className="w-full touch-target bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-center text-2xl font-bold tracking-widest placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase"
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleJoinGame}
              disabled={loading}
              className="w-full touch-target bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-4 px-6 rounded-2xl shadow-lg transform active:scale-95 transition-all disabled:cursor-not-allowed"
            >
              {loading ? 'Joining...' : 'Join Game'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
