import React, { useState } from 'react';
import { Play, Users, Trophy, Sparkles, ArrowRight, ShieldAlert, Dice5, Loader2 } from 'lucide-react';
import { Role } from '../types/game.ts';

interface StartScreenProps {
  onCreateGame: (teamAName: string, teamBName: string) => void;
  onJoinGame: (code: string, role: Role, customName?: string) => Promise<boolean> | void;
  errorMessage?: string | null;
  isJoining?: boolean;
  onClearError: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onCreateGame,
  onJoinGame,
  errorMessage,
  isJoining = false,
  onClearError,
}) => {
  const [modalMode, setModalMode] = useState<'create' | 'join' | null>(null);

  // Create Form State
  const [teamAName, setTeamAName] = useState('Team Alpha');
  const [teamBName, setTeamBName] = useState('Team Bravo');

  // Join Form State
  const [joinCode, setJoinCode] = useState('');
  const [selectedRole, setSelectedRole] = useState<'teamA' | 'teamB' | 'spectator'>('teamA');
  const [playerName, setPlayerName] = useState('');
  const [activeRooms, setActiveRooms] = useState<Array<{
    code: string;
    teamAName: string;
    teamBName: string;
    teamAConnected: boolean;
    teamBConnected: boolean;
    status: string;
  }>>([]);

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/game/rooms');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.rooms)) {
          setActiveRooms(data.rooms);
        }
      }
    } catch {
      // ignore
    }
  };

  React.useEffect(() => {
    if (modalMode === 'join') {
      fetchRooms();
    }
  }, [modalMode]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClearError();
    onCreateGame(teamAName.trim() || 'Team A', teamBName.trim() || 'Team B');
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = joinCode.trim().toUpperCase();
    if (!clean) return;
    onClearError();
    const res = await onJoinGame(clean, selectedRole, playerName.trim() || undefined);
    if (res) {
      setModalMode(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-65px)] flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100">
      {/* Hero Section */}
      <div className="max-w-3xl w-full text-center space-y-6 my-4">
        {/* Playful Tag */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs sm:text-sm font-semibold tracking-wide uppercase shadow-sm">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Real-Time 2-Device Multiplayer Trivia</span>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-3">
          <h1 className="text-5xl sm:text-7xl font-black font-['Fredoka'] tracking-tight bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-sm">
            TOP LIST
          </h1>
          <p className="text-xl sm:text-2xl font-bold text-slate-200 font-['Fredoka']">
            Can you guess what's hiding at the bottom of the list?
          </p>
        </div>

        {/* Error banner if any (shown when not in modal) */}
        {errorMessage && !modalMode && (
          <div className="max-w-md mx-auto p-4 rounded-xl bg-rose-950/80 border border-rose-500 text-rose-200 text-sm flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={onClearError}
              className="text-xs uppercase font-bold text-rose-300 hover:text-white px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={() => {
              onClearError();
              setModalMode('create');
            }}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-extrabold text-lg sm:text-xl font-['Fredoka'] shadow-xl shadow-rose-900/30 transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center space-x-3 cursor-pointer"
          >
            <Trophy className="w-6 h-6 text-amber-200" />
            <span>Create Game</span>
          </button>

          <button
            onClick={() => {
              onClearError();
              setModalMode('join');
            }}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-extrabold text-lg sm:text-xl font-['Fredoka'] shadow-xl shadow-indigo-900/30 transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center space-x-3 cursor-pointer"
          >
            <Users className="w-6 h-6 text-cyan-200" />
            <span>Join Game</span>
          </button>
        </div>

        {/* Strategy Explainer Card */}
        <div className="mt-12 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 text-left shadow-2xl backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center space-x-3 text-amber-400">
              <Dice5 className="w-6 h-6" />
              <h3 className="font-['Fredoka'] text-xl font-bold text-white tracking-wide">
                Reverse Scoring Strategy
              </h3>
            </div>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              The goal is to guess items in a secret ranked list (Top 15, Top 30, or Top 50).
              While the list is hidden, every rank awards points equal to its number:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center pt-2">
              <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3">
                <span className="text-xs text-slate-400 uppercase font-bold">Obvious Guess</span>
                <p className="text-lg font-black text-rose-400">#1 = 1 Point</p>
              </div>
              <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3">
                <span className="text-xs text-slate-400 uppercase font-bold">Medium Guess</span>
                <p className="text-lg font-black text-amber-400">#5 = 5 Points</p>
              </div>
              <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3">
                <span className="text-xs text-slate-400 uppercase font-bold">Smart Guess</span>
                <p className="text-lg font-black text-emerald-400">#15 = 15 Points</p>
              </div>
              <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3">
                <span className="text-xs text-slate-400 uppercase font-bold">Jackpot!</span>
                <p className="text-lg font-black text-cyan-400">#50 = 50 Points</p>
              </div>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs sm:text-sm text-amber-200 font-medium">
              💡 <strong>Winning Tip:</strong> Anyone can guess the #1 movie or superhero. The best teams think deep to guess the items near the bottom of the list for maximum points!
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Create Game */}
      {modalMode === 'create' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-2xl font-black font-['Fredoka'] text-white">Create New Game</h3>
                <p className="text-xs text-slate-400">You will be the Game Host</p>
              </div>
              <button
                onClick={() => setModalMode(null)}
                className="text-slate-400 hover:text-white text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1">
                  Team A Name
                </label>
                <input
                  type="text"
                  value={teamAName}
                  onChange={(e) => setTeamAName(e.target.value)}
                  placeholder="e.g. Red Dragons"
                  maxLength={25}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-rose-400 mb-1">
                  Team B Name
                </label>
                <input
                  type="text"
                  value={teamBName}
                  onChange={(e) => setTeamBName(e.target.value)}
                  placeholder="e.g. Blue Tigers"
                  maxLength={25}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-semibold"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isJoining}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 font-bold font-['Fredoka'] text-white shadow-lg text-lg flex items-center justify-center space-x-2 transition"
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Creating Room...</span>
                    </>
                  ) : (
                    <>
                      <span>Generate Game Code</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Join Game */}
      {modalMode === 'join' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-2xl font-black font-['Fredoka'] text-white">Join Game</h3>
                <p className="text-xs text-slate-400">Connect your device to the game room</p>
              </div>
              <button
                onClick={() => {
                  onClearError();
                  setModalMode(null);
                }}
                className="text-slate-400 hover:text-white text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Error Message inside modal */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/90 border border-rose-500 text-rose-200 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Enter 5-Character Game Code
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  placeholder="e.g. M7K2P"
                  maxLength={5}
                  required
                  autoFocus
                  className="w-full px-4 py-3 text-center tracking-[0.3em] font-mono font-black text-2xl rounded-xl bg-slate-800 border-2 border-indigo-500 text-amber-400 uppercase placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Active Rooms Quick Selection if any available */}
              {activeRooms.length > 0 && (
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Active Games on this Server (Tap to select):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {activeRooms.map((r) => (
                      <button
                        key={r.code}
                        type="button"
                        onClick={() => {
                          setJoinCode(r.code);
                          if (!r.teamAConnected) setSelectedRole('teamA');
                          else if (!r.teamBConnected) setSelectedRole('teamB');
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                          joinCode === r.code
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400/50'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <span className="font-mono text-sm tracking-wider font-black">{r.code}</span>
                        <span className="text-[10px] text-slate-400">
                          ({!r.teamAConnected && !r.teamBConnected ? 'Both teams open' : !r.teamAConnected ? 'Team A open' : !r.teamBConnected ? 'Team B open' : 'Full'})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Choose Your Team
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('teamA')}
                    className={`p-3.5 rounded-xl border-2 font-bold font-['Fredoka'] text-base transition flex flex-col items-center space-y-1 ${
                      selectedRole === 'teamA'
                        ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300 ring-2 ring-indigo-500/50'
                        : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <span>🔵 Team A</span>
                    <span className="text-[11px] font-normal opacity-80">Device 1</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole('teamB')}
                    className={`p-3.5 rounded-xl border-2 font-bold font-['Fredoka'] text-base transition flex flex-col items-center space-y-1 ${
                      selectedRole === 'teamB'
                        ? 'border-rose-500 bg-rose-500/20 text-rose-300 ring-2 ring-rose-500/50'
                        : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <span>🟠 Team B</span>
                    <span className="text-[11px] font-normal opacity-80">Device 2</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Custom Team Name (Optional)
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Rename your team if you wish"
                  maxLength={20}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={joinCode.length < 3 || isJoining}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-50 font-bold font-['Fredoka'] text-white shadow-lg text-lg flex items-center justify-center space-x-2 transition"
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <span>Connect to Game</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
