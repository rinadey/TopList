import React, { useState } from 'react';
import { Volume2, VolumeX, LogOut, Users, Trophy } from 'lucide-react';
import { GameState, Role } from '../types/game.ts';
import { sounds } from '../utils/audio.ts';

interface HeaderProps {
  gameState: GameState | null;
  role: Role | null;
  onLeave: () => void;
}

export const Header: React.FC<HeaderProps> = ({ gameState, role, onLeave }) => {
  const [soundOn, setSoundOn] = useState(sounds.isEnabled());
  const [copied, setCopied] = useState(false);

  const toggleSound = () => {
    const next = sounds.toggleSound();
    setSoundOn(next);
  };

  const handleCopyCode = () => {
    if (!gameState?.code) return;
    navigator.clipboard.writeText(gameState.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRoleLabel = () => {
    if (role === 'host') return '👑 Host';
    if (role === 'teamA') return `🔵 ${gameState?.teamA.name || 'Team A'}`;
    if (role === 'teamB') return `🟠 ${gameState?.teamB.name || 'Team B'}`;
    return '👀 Spectator';
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white px-4 py-3 shadow-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg font-black text-xl text-white tracking-wider font-['Fredoka']">
            TL
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight font-['Fredoka'] bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-400 bg-clip-text text-transparent">
              TOP LIST
            </h1>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              Guess what's at the bottom!
            </p>
          </div>
        </div>

        {/* Room & Role Info */}
        {gameState && (
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={handleCopyCode}
              title="Click to copy Game Code"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition flex items-center space-x-1.5 text-xs font-mono font-bold"
            >
              <span className="text-slate-400">CODE:</span>
              <span className="text-amber-400 tracking-wider">{gameState.code}</span>
              {copied && <span className="text-emerald-400 text-[10px]">Copied!</span>}
            </button>

            <div className="hidden sm:flex items-center px-3 py-1.5 rounded-lg bg-indigo-950/80 border border-indigo-700/50 text-xs font-bold text-indigo-300">
              {getRoleLabel()}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleSound}
            title={soundOn ? 'Mute Sound' : 'Enable Sound'}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            aria-label="Toggle Sound"
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {gameState && (
            <button
              onClick={onLeave}
              title="Leave Room"
              className="p-2 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 hover:text-white transition flex items-center space-x-1 text-xs font-semibold"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Exit</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
