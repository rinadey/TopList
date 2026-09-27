import React, { useState, useRef, useEffect } from 'react';
import {
  GameState,
  Role,
  TeamId,
  GuessAttempt,
  RankedItem,
  PublicRankedItem,
} from '../types/game.ts';
import {
  Send,
  Heart,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Trophy,
  Zap,
  TrendingUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PlayingViewProps {
  gameState: GameState;
  role: Role | null;
  yourTeam: TeamId | null;
  onSubmitGuess: (guess: string) => void;
  onRevealRound: () => void;
  lastFeedback: GuessAttempt | null;
  onClearFeedback: () => void;
}

export const PlayingView: React.FC<PlayingViewProps> = ({
  gameState,
  role,
  yourTeam,
  onSubmitGuess,
  onRevealRound,
  lastFeedback,
  onClearFeedback,
}) => {
  const [guessInput, setGuessInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isHost = role === 'host';
  const isPlayingTeam = yourTeam === 'teamA' || yourTeam === 'teamB';
  const myTeamState = yourTeam === 'teamA' ? gameState.teamA : yourTeam === 'teamB' ? gameState.teamB : null;

  // Auto focus input on mount & after submission for playing team
  useEffect(() => {
    if (isPlayingTeam && myTeamState && myTeamState.chancesLeft > 0) {
      inputRef.current?.focus();
    }
  }, [isPlayingTeam, myTeamState?.chancesLeft]);

  // Trigger confetti when this team makes a correct guess
  useEffect(() => {
    if (lastFeedback?.isCorrect) {
      confetti({
        particleCount: 50 + (lastFeedback.points || 1) * 2,
        spread: 60,
        origin: { y: 0.7 },
      });
    }
  }, [lastFeedback]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = guessInput.trim();
    if (!clean || !isPlayingTeam || !myTeamState || myTeamState.chancesLeft <= 0 || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    onSubmitGuess(clean);
    setGuessInput('');
    setTimeout(() => {
      setIsSubmitting(false);
      inputRef.current?.focus();
    }, 400);
  };

  const teamAChances = Array.from({ length: 3 }).map((_, i) => i < gameState.teamA.chancesLeft);
  const teamBChances = Array.from({ length: 3 }).map((_, i) => i < gameState.teamB.chancesLeft);

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6 space-y-6 animate-in fade-in duration-300">
      {/* Top Banner: Round, Topic, Size */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                Round {gameState.currentRound}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider">
                Top {gameState.listSize}
              </span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black font-['Fredoka'] text-white">
              {gameState.topic}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Guess items near the bottom for max points! (Rank #1 = 1 pt, Rank #{gameState.listSize} = {gameState.listSize} pts)
            </p>
          </div>

          {/* Host Controls */}
          {isHost && (
            <div className="flex items-center space-x-3 shrink-0">
              <button
                onClick={onRevealRound}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 font-bold font-['Fredoka'] text-white text-sm shadow-lg flex items-center space-x-2 transition cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Reveal Answers Now</span>
              </button>
            </div>
          )}
        </div>

        {/* Dual Team Score & Chances Bar */}
        <div className="grid grid-cols-2 gap-3 sm:gap-6 mt-5 pt-4 border-t border-slate-800">
          {/* Team A */}
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
              yourTeam === 'teamA'
                ? 'bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/30'
                : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-indigo-400" />
                <span className="font-['Fredoka'] font-bold text-sm sm:text-base text-white truncate max-w-[120px] sm:max-w-none">
                  {gameState.teamA.name}
                </span>
                {yourTeam === 'teamA' && (
                  <span className="text-[10px] font-bold uppercase bg-indigo-500/30 text-indigo-300 px-1.5 py-0.5 rounded">
                    You
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="font-['Fredoka'] font-black text-xl sm:text-2xl text-indigo-400">
                  {gameState.teamA.score}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold block sm:inline sm:ml-1">
                  pts
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Chances:</span>
              <div className="flex items-center space-x-1">
                {teamAChances.map((active, i) => (
                  <Heart
                    key={i}
                    className={`w-4 h-4 ${
                      active ? 'fill-indigo-400 text-indigo-400' : 'text-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Team B */}
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
              yourTeam === 'teamB'
                ? 'bg-rose-950/60 border-rose-500 ring-2 ring-rose-500/30'
                : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-rose-400" />
                <span className="font-['Fredoka'] font-bold text-sm sm:text-base text-white truncate max-w-[120px] sm:max-w-none">
                  {gameState.teamB.name}
                </span>
                {yourTeam === 'teamB' && (
                  <span className="text-[10px] font-bold uppercase bg-rose-500/30 text-rose-300 px-1.5 py-0.5 rounded">
                    You
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="font-['Fredoka'] font-black text-xl sm:text-2xl text-rose-400">
                  {gameState.teamB.score}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold block sm:inline sm:ml-1">
                  pts
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Chances:</span>
              <div className="flex items-center space-x-1">
                {teamBChances.map((active, i) => (
                  <Heart
                    key={i}
                    className={`w-4 h-4 ${
                      active ? 'fill-rose-400 text-rose-400' : 'text-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TEAM INPUT PANEL (Shown when device is Team A or Team B) */}
      {isPlayingTeam && myTeamState && (
        <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Your Team: <strong className="text-white font-['Fredoka']">{myTeamState.name}</strong>
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs font-bold">
              <span className="text-slate-400">Chances remaining:</span>
              <span
                className={`font-black font-mono text-base ${
                  myTeamState.chancesLeft > 0 ? 'text-amber-400' : 'text-rose-400'
                }`}
              >
                {myTeamState.chancesLeft} of 3
              </span>
            </div>
          </div>

          {/* Feedback banner if available */}
          {lastFeedback && (
            <div
              className={`p-3.5 rounded-2xl border text-sm font-bold flex items-center justify-between transition-all animate-in fade-in slide-in-from-top-2 ${
                lastFeedback.isCorrect
                  ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-200'
                  : lastFeedback.isDuplicate
                  ? 'bg-amber-950/80 border-amber-500/80 text-amber-200'
                  : 'bg-rose-950/80 border-rose-500/80 text-rose-200'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                {lastFeedback.isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : lastFeedback.isDuplicate ? (
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <span>{lastFeedback.message}</span>
              </div>
              <button
                onClick={onClearFeedback}
                className="text-xs uppercase text-slate-400 hover:text-white px-2 py-0.5"
              >
                ✕
              </button>
            </div>
          )}

          {/* Input Form */}
          {myTeamState.chancesLeft > 0 ? (
            <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3">
              <input
                ref={inputRef}
                type="text"
                value={guessInput}
                onChange={(e) => setGuessInput(e.target.value)}
                placeholder="Enter your guess (e.g. Titanic, Avatar...)"
                disabled={isSubmitting}
                className="flex-1 px-4 sm:px-5 py-3.5 rounded-2xl bg-slate-800 border-2 border-slate-700 text-white placeholder-slate-500 text-base sm:text-lg font-semibold focus:outline-none focus:border-indigo-400"
              />
              <button
                type="submit"
                disabled={!guessInput.trim() || isSubmitting}
                className="px-6 sm:px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 disabled:opacity-50 text-white font-black font-['Fredoka'] text-base sm:text-lg shadow-lg flex items-center space-x-2 transition cursor-pointer"
              >
                <span>Submit</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-center space-y-1">
              <p className="font-['Fredoka'] font-bold text-amber-400 text-base">
                You have used all 3 chances for this round!
              </p>
              <p className="text-xs text-slate-400">
                Waiting for the other team to finish, or for the host to reveal the full rankings.
              </p>
            </div>
          )}

          {/* Guesses Made Chips */}
          {myTeamState.guesses.length > 0 && (
            <div className="pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Your Guesses This Round:
              </span>
              <div className="flex flex-wrap gap-2">
                {myTeamState.guesses.map((g, idx) => (
                  <span
                    key={idx}
                    className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${
                      g.isCorrect
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                        : g.isDuplicate
                        ? 'bg-amber-950/60 border-amber-500 text-amber-300'
                        : 'bg-rose-950/60 border-rose-500 text-rose-300'
                    }`}
                  >
                    <span>{g.rawGuess}</span>
                    {g.isCorrect && <span className="text-emerald-400 font-mono">(#{g.matchedRank} +{g.points}pts)</span>}
                    {!g.isCorrect && !g.isDuplicate && <span>❌</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Host Specific Live Status Bar */}
      {isHost && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Host Live Activity Feed
            </span>
            <span className="text-xs text-slate-500">
              Auto-reveals when both teams use all 3 chances
            </span>
          </div>

          {gameState.lastEvent ? (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-300 flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{gameState.lastEvent.message}</span>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">
              Waiting for teams to submit their first guesses...
            </p>
          )}
        </div>
      )}

      {/* HIDDEN / REVEALED RANKINGS BOARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="font-['Fredoka'] text-xl font-bold text-white">
              The Secret Top {gameState.listSize} Board
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg">
            Found: {gameState.foundItemsCount} / {gameState.totalItemsCount}
          </span>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1 max-h-[500px] overflow-y-auto pr-1">
          {gameState.items.map((item) => {
            const isFound = Boolean(item.foundBy);
            const foundByTeamA = item.foundBy === 'teamA';
            const foundByTeamB = item.foundBy === 'teamB';
            const teamName = foundByTeamA ? gameState.teamA.name : gameState.teamB.name;

            return (
              <div
                key={item.rank}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                  foundByTeamA
                    ? 'bg-indigo-950/70 border-indigo-500 shadow-md'
                    : foundByTeamB
                    ? 'bg-rose-950/70 border-rose-500 shadow-md'
                    : 'bg-slate-950/40 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
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
                    {isFound ? (
                      <div>
                        <p className="font-bold text-sm text-white truncate line-through opacity-90">
                          {item.title}
                        </p>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            foundByTeamA ? 'text-indigo-300' : 'text-rose-300'
                          }`}
                        >
                          Found by {teamName}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1.5 text-slate-500 text-xs font-semibold">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Hidden #{item.rank}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0 ml-2">
                  <span
                    className={`font-mono text-xs font-black px-2 py-0.5 rounded-md ${
                      isFound
                        ? foundByTeamA
                          ? 'bg-indigo-500/20 text-indigo-300'
                          : 'bg-rose-500/20 text-rose-300'
                        : 'bg-slate-800/80 text-slate-400'
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
    </div>
  );
};
