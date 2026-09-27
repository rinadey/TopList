import React, { useState } from 'react';
import { GameState, Role } from '../types/game.ts';
import { Copy, Check, Users, Play, Sparkles, Smartphone, ShieldCheck, Clock, Link as LinkIcon, QrCode } from 'lucide-react';

interface LobbyViewProps {
  gameState: GameState;
  role: Role | null;
  onStartGame: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({ gameState, role, onStartGame }) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const isHost = role === 'host';

  const bothTeamsConnected = gameState.teamA.connected && gameState.teamB.connected;

  const getBaseUrl = () => {
    return window.location.origin + window.location.pathname;
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const teamALink = `${getBaseUrl()}?code=${gameState.code}&team=teamA`;
  const teamBLink = `${getBaseUrl()}?code=${gameState.code}&team=teamB`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Game Room Created</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black font-['Fredoka'] text-white">
          Waiting for Teams
        </h2>
        <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto">
          Share the 5-letter game code or click below to copy instant join links for each team's device!
        </p>
      </div>

      {/* Big Game Code Card */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-900/90 border-2 border-indigo-500/40 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden">
        <div className="space-y-4 relative z-10">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-400">
            Game Code
          </p>

          <div className="inline-flex items-center space-x-4 bg-slate-950/80 border border-slate-800 rounded-2xl px-6 py-4 shadow-inner">
            <span className="font-mono text-4xl sm:text-6xl font-black tracking-[0.25em] text-amber-400">
              {gameState.code}
            </span>
            <button
              onClick={() => copyToClipboard(gameState.code, 'code')}
              className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer flex items-center space-x-1"
              title="Copy code"
            >
              {copiedType === 'code' ? <Check className="w-6 h-6 text-emerald-400" /> : <Copy className="w-6 h-6" />}
            </button>
          </div>

          <p className="text-xs text-slate-500">
            {copiedType === 'code' ? 'Game code copied to clipboard!' : 'Open this website on 2 devices and enter the code'}
          </p>

          {/* Quick Direct Join Links for Host */}
          {isHost && (
            <div className="pt-3 space-y-2">
              <div className="flex items-center justify-center space-x-2 text-xs text-slate-400">
                <span>Both devices must open:</span>
                <span className="font-mono text-amber-300 font-bold px-2 py-0.5 rounded bg-slate-800">
                  {window.location.host}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(window.location.origin, 'origin')}
                  className="text-[11px] underline text-indigo-400 hover:text-white"
                >
                  {copiedType === 'origin' ? 'Copied URL!' : 'Copy Site URL'}
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                <button
                  onClick={() => copyToClipboard(teamALink, 'linkA')}
                  className="px-3.5 py-2 rounded-xl bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-500/50 text-indigo-300 font-bold flex items-center space-x-1.5 transition cursor-pointer shadow"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>{copiedType === 'linkA' ? 'Copied Team A Link!' : 'Copy Team A Join Link'}</span>
                </button>
                <button
                  onClick={() => copyToClipboard(teamBLink, 'linkB')}
                  className="px-3.5 py-2 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-500/50 text-rose-300 font-bold flex items-center space-x-1.5 transition cursor-pointer shadow"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>{copiedType === 'linkB' ? 'Copied Team B Link!' : 'Copy Team B Join Link'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Team Connection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Team A Card */}
        <div
          className={`rounded-3xl p-6 border-2 transition-all shadow-xl relative overflow-hidden ${
            gameState.teamA.connected
              ? 'bg-indigo-950/50 border-indigo-500/80 shadow-indigo-950/50 ring-2 ring-indigo-500/30'
              : 'bg-slate-900/50 border-slate-800 border-dashed'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl font-['Fredoka']">
                A
              </div>
              <div>
                <h4 className="text-xl font-bold font-['Fredoka'] text-white">
                  {gameState.teamA.name}
                </h4>
                <p className="text-xs text-indigo-300/80 font-semibold">Device 1</p>
              </div>
            </div>

            <div>
              {gameState.teamA.connected ? (
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Ready</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-semibold">
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                  <span>Waiting...</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Team B Card */}
        <div
          className={`rounded-3xl p-6 border-2 transition-all shadow-xl relative overflow-hidden ${
            gameState.teamB.connected
              ? 'bg-rose-950/50 border-rose-500/80 shadow-rose-950/50 ring-2 ring-rose-500/30'
              : 'bg-slate-900/50 border-slate-800 border-dashed'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black text-xl font-['Fredoka']">
                B
              </div>
              <div>
                <h4 className="text-xl font-bold font-['Fredoka'] text-white">
                  {gameState.teamB.name}
                </h4>
                <p className="text-xs text-rose-300/80 font-semibold">Device 2</p>
              </div>
            </div>

            <div>
              {gameState.teamB.connected ? (
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Ready</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-semibold">
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                  <span>Waiting...</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Host Action or Player Waiting Info */}
      <div className="pt-4 text-center">
        {isHost ? (
          <div className="space-y-4">
            <button
              onClick={onStartGame}
              className={`px-10 py-4 rounded-2xl font-black font-['Fredoka'] text-xl transition-all shadow-xl transform active:scale-95 flex items-center justify-center space-x-3 mx-auto cursor-pointer ${
                bothTeamsConnected
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-emerald-900/40 animate-pulse'
                  : 'bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white shadow-amber-900/40'
              }`}
            >
              <Play className="w-6 h-6 fill-current" />
              <span>Start Game</span>
            </button>
            {!bothTeamsConnected && (
              <p className="text-xs text-slate-400">
                (Host can start anytime, even before both teams connect for preview or testing)
              </p>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 max-w-md mx-auto space-y-2">
            <div className="flex items-center justify-center space-x-2 text-indigo-400 font-bold">
              <Smartphone className="w-5 h-5" />
              <span>You are connected!</span>
            </div>
            <p className="text-xs text-slate-400">
              The game host will launch the round on their screen. Hang tight!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
