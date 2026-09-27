import React from 'react';
import { useGameSocket } from './hooks/useGameSocket.ts';
import { Header } from './components/Header.tsx';
import { StartScreen } from './components/StartScreen.tsx';
import { LobbyView } from './components/LobbyView.tsx';
import { RoundSetupView } from './components/RoundSetupView.tsx';
import { PlayingView } from './components/PlayingView.tsx';
import { RoundRevealedView } from './components/RoundRevealedView.tsx';
import { EndGameView } from './components/EndGameView.tsx';

export default function App() {
  const {
    gameState,
    role,
    yourTeam,
    connected,
    isJoining,
    error,
    lastFeedback,
    createGame,
    joinGame,
    startGame,
    startRound,
    submitGuess,
    revealRound,
    nextRoundSetup,
    endGame,
    restartGame,
    leaveRoom,
    clearFeedback,
    clearError,
  } = useGameSocket();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] selection:bg-rose-500 selection:text-white">
      {/* Top Navigation */}
      <Header gameState={gameState} role={role} onLeave={leaveRoom} />

      {/* Main Content Area */}
      <main className="flex-1 pb-12">
        {!gameState ? (
          <StartScreen
            onCreateGame={createGame}
            onJoinGame={joinGame}
            errorMessage={error}
            isJoining={isJoining}
            onClearError={clearError}
          />
        ) : gameState.status === 'lobby' ? (
          <LobbyView
            gameState={gameState}
            role={role}
            onStartGame={startGame}
          />
        ) : gameState.status === 'selecting_topic' ? (
          <RoundSetupView
            gameState={gameState}
            role={role}
            onStartRound={startRound}
          />
        ) : gameState.status === 'playing' ? (
          <PlayingView
            gameState={gameState}
            role={role}
            yourTeam={yourTeam}
            onSubmitGuess={submitGuess}
            onRevealRound={revealRound}
            lastFeedback={lastFeedback}
            onClearFeedback={clearFeedback}
          />
        ) : gameState.status === 'round_revealed' ? (
          <RoundRevealedView
            gameState={gameState}
            role={role}
            onNextRound={nextRoundSetup}
            onEndGame={endGame}
          />
        ) : gameState.status === 'game_ended' ? (
          <EndGameView
            gameState={gameState}
            role={role}
            onRestart={restartGame}
          />
        ) : null}
      </main>

      {/* Subtle Footer */}
      <footer className="py-4 border-t border-slate-900 text-center text-xs text-slate-500">
        Top List Trivia • Reverse Ranked Multiplayer Game
      </footer>
    </div>
  );
}
