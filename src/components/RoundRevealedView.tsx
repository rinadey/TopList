import React, { useEffect } from 'react';
import { GameState, Role, RankedItem } from '../types/game.ts';
import { Trophy, ArrowRight, RotateCcw, Award, CheckCircle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RoundRevealedViewProps {
  gameState: GameState;
  role: Role | null;
  onNextRound: () => void;
  onEndGame: () => void;
}

export const RoundRevealedView: React.FC<RoundRevealedViewProps> = ({
  gameState,
  role,
  onNextRound,
  onEndGame,
}) => {
  const isHost = role === 'host';

  useEffect(() => {
    // Round end confetti burst
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Round {gameState.currentRound} Complete!</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black font-['Fredoka'] text-white">
          The Full Ranked List Revealed
        </h2>
        <p className="text-slate-400 text-sm sm:text-base">
          Topic: <strong className="text-white">{gameState.topic}</strong> (Top {gameState.listSize})
        </p>
      </div>

      {/* Round Results & Overall Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Team A Card */}
        <div className="p-6 rounded-3xl bg-indigo-950/40 border-2 border-indigo-500/60 shadow-xl shadow-indigo-950/40 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-['Fredoka'] font-black text-lg">
                A
              </div>
              <div>
                <h4 className="font-['Fredoka'] text-xl font-bold text-white">
                  {gameState.teamA.name}
                </h4>
                <span className="text-xs text-indigo-300">Team A</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs uppercase font-bold text-slate-400 block">Total Score</span>
              <span className="font-['Fredoka'] font-black text-3xl text-indigo-400">
                {gameState.teamA.score} pts
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-indigo-900/30 border border-indigo-500/30 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
              Round {gameState.currentRound} Points:
            </span>
            <span className="font-['Fredoka'] font-black text-xl text-emerald-400">
              +{gameState.teamA.roundScore} pts
            </span>
          </div>

          {/* Guesses recap */}
          <div className="space-y-1.5 text-xs">
            <span className="text-slate-400 font-bold block">Guesses Made:</span>
            {gameState.teamA.guesses.length === 0 ? (
              <span className="text-slate-500 italic">No guesses made</span>
            ) : (
              <div className="flex flex-wrap gap-2">
                {gameState.teamA.guesses.map((g, idx) => (
                  <span
                    key={idx}
                    className={`px-2.5 py-1 rounded-lg border font-semibold ${
                      g.isCorrect
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                        : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                    }`}
                  >
                    {g.rawGuess} {g.isCorrect ? `(+#${g.matchedRank})` : '❌'}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Team B Card */}
        <div className="p-6 rounded-3xl bg-rose-950/40 border-2 border-rose-500/60 shadow-xl shadow-rose-950/40 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-['Fredoka'] font-black text-lg">
                B
              </div>
              <div>
                <h4 className="font-['Fredoka'] text-xl font-bold text-white">
                  {gameState.teamB.name}
                </h4>
                <span className="text-xs text-rose-300">Team B</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs uppercase font-bold text-slate-400 block">Total Score</span>
              <span className="font-['Fredoka'] font-black text-3xl text-rose-400">
                {gameState.teamB.score} pts
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-rose-900/30 border border-rose-500/30 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-200">
              Round {gameState.currentRound} Points:
            </span>
            <span className="font-['Fredoka'] font-black text-xl text-emerald-400">
              +{gameState.teamB.roundScore} pts
            </span>
          </div>

          {/* Guesses recap */}
          <div className="space-y-1.5 text-xs">
            <span className="text-slate-400 font-bold block">Guesses Made:</span>
            {gameState.teamB.guesses.length === 0 ? (
              <span className="text-slate-500 italic">No guesses made</span>
            ) : (
              <div className="flex flex-wrap gap-2">
                {gameState.teamB.guesses.map((g, idx) => (
                  <span
                    key={idx}
                    className={`px-2.5 py-1 rounded-lg border font-semibold ${
                      g.isCorrect
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                        : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                    }`}
                  >
                    {g.rawGuess} {g.isCorrect ? `(+#${g.matchedRank})` : '❌'}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Complete Ranked List Display */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="font-['Fredoka'] text-xl font-bold text-white">
              Complete Ranked List (1 to {gameState.listSize})
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Items guessed have strikethroughs & team labels
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {gameState.items.map((item) => {
            const foundByTeamA = item.foundBy === 'teamA';
            const foundByTeamB = item.foundBy === 'teamB';
            const isFound = foundByTeamA || foundByTeamB;

            return (
              <div
                key={item.rank}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                  foundByTeamA
                    ? 'bg-indigo-950/80 border-indigo-500 shadow-lg ring-1 ring-indigo-500/50'
                    : foundByTeamB
                    ? 'bg-rose-950/80 border-rose-500 shadow-lg ring-1 ring-rose-500/50'
                    : 'bg-slate-950/40 border-slate-800/80 text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <span
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                      foundByTeamA
                        ? 'bg-indigo-600 text-white'
                        : foundByTeamB
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    #{item.rank}
                  </span>

                  <div className="min-w-0">
                    <p
                      className={`text-sm font-bold truncate ${
                        isFound ? 'line-through text-slate-300 opacity-90' : 'text-white'
                      }`}
                    >
                      {item.title}
                    </p>

                    {foundByTeamA && (
                      <span className="inline-flex items-center space-x-1 text-[11px] font-extrabold text-indigo-300">
                        <span>~~{item.title}~~</span>
                        <span className="px-1.5 py-0.2 rounded bg-indigo-600/40 border border-indigo-400/30 text-[10px]">
                          {gameState.teamA.name}
                        </span>
                      </span>
                    )}

                    {foundByTeamB && (
                      <span className="inline-flex items-center space-x-1 text-[11px] font-extrabold text-rose-300">
                        <span>~~{item.title}~~</span>
                        <span className="px-1.5 py-0.2 rounded bg-rose-600/40 border border-rose-400/30 text-[10px]">
                          {gameState.teamB.name}
                        </span>
                      </span>
                    )}

                    {!isFound && (
                      <span className="text-[10px] text-slate-500 font-medium">
                        Unclaimed
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0 ml-2">
                  <span
                    className={`font-mono text-xs font-black px-2 py-1 rounded-md ${
                      foundByTeamA
                        ? 'bg-indigo-500/20 text-indigo-300'
                        : foundByTeamB
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    +{item.rank} pts
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Host Next Round or End Game Action */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-4">
        {isHost ? (
          <div className="space-y-4">
            <h3 className="font-['Fredoka'] text-2xl font-black text-white">
              Play Another Round?
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              Cumulative scores will NOT reset. You will be able to select Top 15/30/50 and a new topic!
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <button
                onClick={onNextRound}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold font-['Fredoka'] text-lg shadow-xl shadow-emerald-950/40 transition transform active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Choose Another Topic</span>
              </button>

              <button
                onClick={onEndGame}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-extrabold font-['Fredoka'] text-lg shadow-xl shadow-rose-950/40 transition transform active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Trophy className="w-5 h-5 text-amber-200" />
                <span>End Game</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <h4 className="font-['Fredoka'] text-xl font-bold text-amber-400">
              Round Complete!
            </h4>
            <p className="text-xs sm:text-sm text-slate-400">
              Waiting for the game host to start the next round or end the game...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
