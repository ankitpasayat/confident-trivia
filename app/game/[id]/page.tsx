'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGameEvents } from '@/hooks/useGameEvents';
import { Lobby } from '@/components/Lobby';
import { Results } from '@/components/Results';

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  
  const [playerId, setPlayerId] = useState<string>('');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [selectedToken, setSelectedToken] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('playerId');
    const storedSession = localStorage.getItem('sessionId');
    if (!stored || storedSession !== sessionId) {
      router.push('/');
    } else {
      setPlayerId(stored);
    }
  }, [sessionId, router]);

  const handleGameUpdate = useCallback((s: any) => {
    if (s.currentPhase === 'question') {
      setSelectedAnswer(null);
      setSelectedToken(null);
    }
  }, []);

  const { session, isConnected, error } = useGameEvents({ 
    sessionId, 
    playerId,
    onUpdate: handleGameUpdate
  });

  const currentPlayer = session?.players.find(p => p.id === playerId);
  const isHost = currentPlayer?.isHost || false;

  const apiCall = async (endpoint: string, body: any) => {
    try {
      const response = await fetch(`/api/game/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error(`API call to ${endpoint} failed (${response.status}):`, errorData);
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
    } catch (error) {
      console.error(`API call to ${endpoint} failed:`, error);
      throw error;
    }
  };

  if (!session || !currentPlayer) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-950 to-black">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading...</p>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>
    </div>;
  }

  // Connection status indicator
  const connectionIndicator = !isConnected && error && (
    <div className="fixed top-4 right-4 bg-yellow-500/20 border border-yellow-500 text-yellow-200 px-4 py-2 rounded-xl text-sm z-50">
      {error}
    </div>
  );

  // Lobby
  if (session.currentPhase === 'lobby') {
    return <>
      {connectionIndicator}
      <Lobby 
        session={session} 
        isHost={isHost} 
        onStartGame={() => apiCall('start', { sessionId })}
      />
    </>;
  }

  // Question Phase
  if (session.currentPhase === 'question' && session.currentQuestion) {
    return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black p-4">
      {connectionIndicator}
      <div className="max-w-2xl mx-auto pt-8">
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-gray-400">Round {session.currentRound}/{session.totalRounds}</div>
          <div className="text-sm font-medium px-3 py-1 bg-purple-500/20 border border-purple-500 rounded-full">
            {session.currentQuestion.category}
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6 leading-relaxed">{session.currentQuestion.text}</h2>
        </div>
        {isHost ? (
          <button onClick={() => apiCall('phase', { sessionId, phase: 'voting' })}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-2xl shadow-lg">
            Start Voting!
          </button>
        ) : (
          <div className="text-center p-4 bg-gray-800/50 rounded-2xl">
            <p className="text-gray-400">Waiting for host...</p>
          </div>
        )}
      </div>
    </div>;
  }

  // Voting Phase
  if (session.currentPhase === 'voting' && session.currentQuestion) {
    const hasVoted = session.votes.some(v => v.playerId === playerId);
    
    return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black p-4 pb-32">
      {connectionIndicator}
      <div className="max-w-2xl mx-auto pt-8">
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-gray-400">Round {session.currentRound}/{session.totalRounds}</div>
          <div className="text-sm font-medium px-3 py-1 bg-blue-500/20 border border-blue-500 rounded-full">
            {session.votes.length}/{session.players.length} voted
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">{session.currentQuestion.text}</h2>
          <div className="space-y-3">
            {session.currentQuestion.options.map((option, index) => (
              <button key={index} onClick={() => setSelectedAnswer(index)} disabled={hasVoted}
                className={`w-full p-4 rounded-xl text-left font-medium transition-all ${
                  selectedAnswer === index ? 'bg-blue-500 text-white' : 'bg-gray-700/50 hover:bg-gray-700'
                } ${hasVoted ? 'opacity-50' : ''}`}>
                {String.fromCharCode(65 + index)}. {option}
              </button>
            ))}
          </div>
        </div>

        {!hasVoted && (
          <>
            <div className="bg-gray-800/50 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Select Token (Confidence)</h3>
              <div className="grid grid-cols-5 gap-2">
                {currentPlayer.availableTokens.sort((a, b) => a - b).map(token => (
                  <button key={token} onClick={() => setSelectedToken(token)}
                    className={`aspect-square rounded-xl font-bold text-xl ${
                      selectedToken === token ? 'bg-green-500 scale-110' : 'bg-gray-700 hover:bg-gray-600'
                    }`}>
                    {token}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => apiCall('vote', { sessionId, playerId, answer: selectedAnswer, token: selectedToken })}
              disabled={selectedAnswer === null || selectedToken === null}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-4 px-6 rounded-2xl shadow-lg disabled:cursor-not-allowed">
              {selectedAnswer !== null && selectedToken !== null ? 'Submit Vote' : 'Select answer and token'}
            </button>
          </>
        )}
        
        {hasVoted && (
          <div className="bg-green-500/20 border border-green-500 rounded-2xl p-4 text-center">
            <p className="text-green-200 font-medium">Vote submitted! ✓</p>
            <p className="text-sm text-green-300/70 mt-1">Waiting... ({session.votes.length}/{session.players.length})</p>
          </div>
        )}
      </div>
    </div>;
  }

  // Reveal Phase
  if (session.currentPhase === 'reveal' && session.currentQuestion) {
    const correctAnswer = session.currentQuestion.correctAnswer;
    
    return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black p-4">
      {connectionIndicator}
      <div className="max-w-2xl mx-auto pt-8 pb-24">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Round {session.currentRound} Results</h2>
        </div>
        <div className="bg-green-500/20 border-2 border-green-500 rounded-2xl p-6 mb-6">
          <p className="text-sm text-green-300 mb-2">Correct Answer:</p>
          <p className="text-xl font-semibold">
            {String.fromCharCode(65 + correctAnswer)}. {session.currentQuestion.options[correctAnswer]}
          </p>
          <p className="text-sm text-gray-300 mt-4">{session.currentQuestion.explanation}</p>
        </div>
        <div className="space-y-3 mb-6">
          {session.players.map(player => {
            const vote = session.votes.find(v => v.playerId === player.id);
            const wasCorrect = vote && vote.answer === correctAnswer;
            return (
              <div key={player.id} className={`p-4 rounded-xl ${wasCorrect ? 'bg-green-500/20 border-2 border-green-500' : 'bg-gray-800/50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full" style={{ backgroundColor: player.color }}></div>
                    <div>
                      <p className="font-medium">{player.name}</p>
                      {vote && <p className="text-sm text-gray-400">Token {vote.token} on {String.fromCharCode(65 + vote.answer)}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{player.score}</p>
                    <p className="text-xs text-gray-400">total</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {isHost && (
          <button onClick={() => apiCall('phase', { sessionId, phase: 'question' })}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-2xl shadow-lg">
            {session.currentRound >= session.totalRounds ? 'See Final Results' : 'Next Question'}
          </button>
        )}
      </div>
    </div>;
  }

  // Results
  if (session.currentPhase === 'results') {
    return <Results session={session} onPlayAgain={() => router.push('/')} />;
  }

  return null;
}
