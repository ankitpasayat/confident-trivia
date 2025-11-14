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
  const [selectedAnswer, setSelectedAnswer] = useState<number | boolean | null>(null);
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
    const question = session.currentQuestion;
    const questionType = 'type' in question ? question.type : 'multiple-choice';
    
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
          <h2 className="text-xl font-semibold mb-4">{question.text}</h2>
          
          {/* Multiple Choice */}
          {questionType === 'multiple-choice' && 'options' in question && (
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <button key={index} onClick={() => setSelectedAnswer(index)} disabled={hasVoted}
                  className={`w-full p-4 rounded-xl text-left font-medium transition-all ${
                    selectedAnswer === index ? 'bg-blue-500 text-white' : 'bg-gray-700/50 hover:bg-gray-700'
                  } ${hasVoted ? 'opacity-50' : ''}`}>
                  {String.fromCharCode(65 + index)}. {option}
                </button>
              ))}
            </div>
          )}

          {/* True/False */}
          {questionType === 'true-false' && (
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setSelectedAnswer(true)} disabled={hasVoted}
                className={`p-6 rounded-xl font-bold text-xl transition-all ${
                  selectedAnswer === true ? 'bg-green-500 text-white' : 'bg-gray-700/50 hover:bg-gray-700'
                } ${hasVoted ? 'opacity-50' : ''}`}>
                TRUE
              </button>
              <button onClick={() => setSelectedAnswer(false)} disabled={hasVoted}
                className={`p-6 rounded-xl font-bold text-xl transition-all ${
                  selectedAnswer === false ? 'bg-red-500 text-white' : 'bg-gray-700/50 hover:bg-gray-700'
                } ${hasVoted ? 'opacity-50' : ''}`}>
                FALSE
              </button>
            </div>
          )}

          {/* More or Less */}
          {questionType === 'more-or-less' && 'option1' in question && 'option2' in question && (
            <div className="space-y-4">
              <p className="text-center text-sm text-gray-400 mb-4">Which one is more/larger?</p>
              <button onClick={() => setSelectedAnswer(0)} disabled={hasVoted}
                className={`w-full p-6 rounded-xl font-medium text-lg transition-all ${
                  selectedAnswer === 0 ? 'bg-purple-500 text-white' : 'bg-gray-700/50 hover:bg-gray-700'
                } ${hasVoted ? 'opacity-50' : ''}`}>
                {question.option1}
              </button>
              <div className="text-center text-gray-500 text-sm font-bold">OR</div>
              <button onClick={() => setSelectedAnswer(1)} disabled={hasVoted}
                className={`w-full p-6 rounded-xl font-medium text-lg transition-all ${
                  selectedAnswer === 1 ? 'bg-purple-500 text-white' : 'bg-gray-700/50 hover:bg-gray-700'
                } ${hasVoted ? 'opacity-50' : ''}`}>
                {question.option2}
              </button>
            </div>
          )}

          {/* Numerical */}
          {questionType === 'numerical' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">Enter your answer {'unit' in question && question.unit ? `(in ${question.unit})` : ''}:</p>
              <input
                type="number"
                value={selectedAnswer === null || typeof selectedAnswer === 'boolean' ? '' : selectedAnswer}
                onChange={(e) => setSelectedAnswer(e.target.value ? Number(e.target.value) : null)}
                disabled={hasVoted}
                placeholder="Your answer..."
                className={`w-full p-4 rounded-xl bg-gray-700/50 border-2 border-gray-600 focus:border-blue-500 focus:outline-none text-lg ${hasVoted ? 'opacity-50' : ''}`}
              />
            </div>
          )}
        </div>

        {!hasVoted && (
          <>
            <div className="bg-gray-800/50 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Select Token (Confidence)</h3>
              <div className="grid grid-cols-5 gap-2">
                {currentPlayer.availableTokens.sort((a, b) => a - b).map(token => {
                  const getTokenColors = (val: number): [string, string] => {
                    switch(val) {
                      case 1: return ['#dc2626', '#991b1b'];
                      case 2: return ['#ea580c', '#9a3412'];
                      case 3: return ['#f59e0b', '#b45309'];
                      case 4: return ['#eab308', '#a16207'];
                      case 5: return ['#84cc16', '#4d7c0f'];
                      case 6: return ['#10b981', '#047857'];
                      case 7: return ['#06b6d4', '#0e7490'];
                      case 8: return ['#3b82f6', '#1d4ed8'];
                      case 9: return ['#a855f7', '#7e22ce'];
                      case 10: return ['#ec4899', '#be185d'];
                      default: return ['#6b7280', '#374151'];
                    }
                  };
                  
                  const [color1, color2] = getTokenColors(token);
                  
                  return (
                    <button key={token} onClick={() => setSelectedToken(token)}
                      className={`aspect-square rounded-full font-bold text-xl relative border-[6px] shadow-lg transition-all ${
                        selectedToken === token 
                          ? 'scale-110 border-white' 
                          : 'border-white/90 hover:scale-105 hover:border-white'
                      }`}
                      style={{
                        boxShadow: selectedToken === token 
                          ? '0 0 25px rgba(255, 255, 255, 0.6), inset 0 3px 8px rgba(255, 255, 255, 0.4), inset 0 -3px 8px rgba(0, 0, 0, 0.3)' 
                          : 'inset 0 3px 6px rgba(255, 255, 255, 0.3), inset 0 -3px 6px rgba(0, 0, 0, 0.4), 0 6px 12px rgba(0, 0, 0, 0.6)',
                        background: selectedToken === token 
                          ? `radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3), transparent 50%), linear-gradient(135deg, ${color1}, ${color2})`
                          : `radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.2), transparent 50%), linear-gradient(135deg, ${color1}, ${color2})`
                      }}>
                      <span className="relative z-10 drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]">{token}</span>
                      {/* Edge notches to simulate poker chip texture */}
                      <div className="absolute inset-0 rounded-full" style={{
                        background: `repeating-conic-gradient(from 0deg, transparent 0deg 8deg, rgba(255, 255, 255, 0.15) 8deg 10deg)`
                      }}></div>
                      {/* Center ring detail */}
                      <div className="absolute inset-[30%] rounded-full border-2 border-white/20"></div>
                    </button>
                  );
                })}
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
    const question = session.currentQuestion;
    const questionType = 'type' in question ? question.type : 'multiple-choice';
    const correctAnswer = question.correctAnswer;
    
    // Helper to format the correct answer display
    const getCorrectAnswerDisplay = () => {
      if (questionType === 'multiple-choice' && 'options' in question && typeof correctAnswer === 'number') {
        return `${String.fromCharCode(65 + correctAnswer)}. ${question.options[correctAnswer]}`;
      } else if (questionType === 'true-false') {
        return correctAnswer ? 'TRUE' : 'FALSE';
      } else if (questionType === 'more-or-less' && 'option1' in question && 'option2' in question) {
        return correctAnswer === 0 ? question.option1 : question.option2;
      } else if (questionType === 'numerical' && 'unit' in question) {
        return `${correctAnswer}${question.unit ? ' ' + question.unit : ''}`;
      }
      return String(correctAnswer);
    };

    // Helper to format player's answer
    const getPlayerAnswerDisplay = (vote: any) => {
      if (questionType === 'multiple-choice') {
        return `${String.fromCharCode(65 + (vote.answer as number))}`;
      } else if (questionType === 'true-false') {
        // Handle both boolean and number formats (for backwards compatibility)
        return (typeof vote.answer === 'boolean' ? vote.answer : vote.answer === 1) ? 'TRUE' : 'FALSE';
      } else if (questionType === 'more-or-less' && 'option1' in question && 'option2' in question) {
        return vote.answer === 0 ? question.option1.substring(0, 30) : question.option2.substring(0, 30);
      } else if (questionType === 'numerical' && 'unit' in question) {
        return `${vote.answer}${question.unit ? ' ' + question.unit : ''}`;
      }
      return String(vote.answer);
    };

    // Helper to check if answer is correct
    const isCorrect = (vote: any) => {
      if (questionType === 'numerical' && typeof vote.answer === 'number' && typeof correctAnswer === 'number') {
        const range = ('acceptableRange' in question ? question.acceptableRange : correctAnswer * 0.1) || 0;
        return Math.abs(vote.answer - correctAnswer) <= range;
      }
      // Handle true/false with both boolean and number formats (backwards compatibility)
      if (questionType === 'true-false' && typeof correctAnswer === 'boolean') {
        if (typeof vote.answer === 'boolean') {
          return vote.answer === correctAnswer;
        }
        // Legacy: handle number format (1 = true, 0 = false)
        return vote.answer === (correctAnswer ? 1 : 0);
      }
      return vote.answer === correctAnswer;
    };
    
    return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black p-4">
      {connectionIndicator}
      <div className="max-w-2xl mx-auto pt-8 pb-24">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Round {session.currentRound} Results</h2>
        </div>
        <div className="bg-green-500/20 border-2 border-green-500 rounded-2xl p-6 mb-6">
          <p className="text-sm text-green-300 mb-2">Correct Answer:</p>
          <p className="text-xl font-semibold">
            {getCorrectAnswerDisplay()}
          </p>
          <p className="text-sm text-gray-300 mt-4">{question.explanation}</p>
        </div>
        <div className="space-y-3 mb-6">
          {session.players.map(player => {
            const vote = session.votes.find(v => v.playerId === player.id);
            const wasCorrect = vote && isCorrect(vote);
            return (
              <div key={player.id} className={`p-4 rounded-xl ${wasCorrect ? 'bg-green-500/20 border-2 border-green-500' : 'bg-gray-800/50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full" style={{ backgroundColor: player.color }}></div>
                    <div>
                      <p className="font-medium">{player.name}</p>
                      {vote && <p className="text-sm text-gray-400">Token {vote.token} on {getPlayerAnswerDisplay(vote)}</p>}
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
