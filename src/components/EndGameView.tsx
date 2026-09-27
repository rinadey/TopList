import React, { useEffect } from 'react';
import { GameState, Role } from '../types/game.ts';
import { Trophy, Award, RotateCcw, Sparkles, Flame, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/audio.ts';

interface EndGameViewProps {
  gameState: GameState;
  role: Role | null;
  onRestart: () => void;
}

export const EndGameView: React.FC<EndGameViewProps> = ({
  gameState,
  role,
  onRestart,
}) => {
  const isHost = role === 'host';
  const aScore = gameState.teamA.score;
  const bScore = gameState.teamB.score;
  const isTie = aScore === bScore;
  const winner = aScore > bScore ? 'teamA' : bScore > aScore ? 'teamB' : 'tie';

  const winnerName =
    winner === 'teamA'
      ? gameState.teamA.name
      : winner === 'teamB'
      ? gameState.teamB.name
      : null;

  useEffect(() => {
    sounds.playWin();

    // Grand confetti celebration
    const duration = 3.5 * 1000;
    const animationEnd = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });

      if (Date.now() < animationEnd) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Winner Hero Banner */}
      <div className="text-center space-y-4">
        <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 p-1 shadow-2xl animate-bounce">
          <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center">
            <Trophy className="w-12 h-12 text-amber-400" />
          </div>
        </div>

        {isTie ? (
          <div className="space-y-2">
            <span className="px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-widest">
              Unbelievable Match
            </span>
            <h2 className="text-4xl sm:text-6xl font-black font-['Fredoka'] text-white">
              IT'S A TIE!
            </h2>
            <p className="text-slate-400 text-base">
              Both teams matched wits with equal scores!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <span className="px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-widest">
              🏆 WINNER
            </span>
            <h2 className="text-4xl sm:text-6xl font-black font-['Fredoka'] text-transparent bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-400 bg-clip-text">
              {winnerName}
            </h2>
            <p className="text-slate-400 text-base">
              Crowned Champions of Top List Trivia!
            </p>
          </div>
        )}
      </div>

      {/* FINAL SCOREBOARD */}
      <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
        <h3 className="text-center font-['Fredoka'] text-2xl font-black text-white uppercase tracking-wider">
          Final Score
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 max-w-2xl mx-auto">
          {/* Team A Score Card */}
          <div
            className={`p-6 rounded-2xl border-2 text-center transition-all ${
              winner === 'teamA'
                ? 'bg-indigo-950/80 border-indigo-400 ring-4 ring-indigo-500/40 shadow-xl'
                : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-center space-x-2 mb-2">
              <span className="w-3.5 h-3.5 rounded-full bg-indigo-400" />
              <h4 className="font-['Fredoka'] font-black text-2xl text-white">
                {gameState.teamA.name}
              </h4>
            </div>
            <div className="font-['Fredoka'] font-black text-5xl sm:text-6xl text-indigo-400 my-2">
              {gameState.teamA.score}
            </div>
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              {winner === 'teamA' ? '🥇 Champion' : 'Points'}
            </span>
          </div>

          {/* Team B Score Card */}
          <div
            className={`p-6 rounded-2xl border-2 text-center transition-all ${
              winner === 'teamB'
                ? 'bg-rose-950/80 border-rose-400 ring-4 ring-rose-500/40 shadow-xl'
                : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-center space-x-2 mb-2">
              <span className="w-3.5 h-3.5 rounded-full bg-rose-400" />
              <h4 className="font-['Fredoka'] font-black text-2xl text-white">
                {gameState.teamB.name}
              </h4>
            </div>
            <div className="font-['Fredoka'] font-black text-5xl sm:text-6xl text-rose-400 my-2">
              {gameState.teamB.score}
            </div>
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              {winner === 'teamB' ? '🥇 Champion' : 'Points'}
            </span>
          </div>
        </div>

        {/* Comparison Callout */}
        <div className="text-center font-['Fredoka'] text-lg text-slate-300">
          <strong>{gameState.teamA.name}</strong> — {gameState.teamA.score} &nbsp;•&nbsp;{' '}
          <strong>{gameState.teamB.name}</strong> — {gameState.teamB.score}
        </div>
      </div>

      {/* Round by Round History */}
      {gameState.roundHistory.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <h4 className="font-['Fredoka'] text-xl font-bold text-white">
            Rounds Played
          </h4>

          <div className="space-y-3">
            {gameState.roundHistory.map((rh, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <span className="text-xs font-mono font-bold text-indigo-400 uppercase">
                    Round {rh.roundNumber} • Top {rh.listSize}
                  </span>
                  <p className="font-bold text-white text-base">{rh.topic}</p>
                </div>
                <div className="flex items-center space-x-4 text-sm font-['Fredoka'] font-bold">
                  <span className="text-indigo-400">
                    {gameState.teamA.name}: +{rh.teamAPoints} pts
                  </span>
                  <span className="text-slate-600">|</span>
                  <span className="text-rose-400">
                    {gameState.teamB.name}: +{rh.teamBPoints} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Host Restart Action */}
      {isHost ? (
        <div className="text-center pt-4">
          <button
            onClick={onRestart}
            className="px-10 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 font-black font-['Fredoka'] text-white text-xl shadow-xl shadow-indigo-950/40 transition transform active:scale-95 flex items-center justify-center space-x-3 mx-auto cursor-pointer"
          >
            <RotateCcw className="w-6 h-6" />
            <span>Play Again (New Game)</span>
          </button>
        </div>
      ) : (
        <div className="text-center text-xs text-slate-500">
          The game has concluded! The game host can restart a new match anytime.
        </div>
      )}
    </div>
  );
};
