import React, { useState, useEffect } from 'react';
import { GameState, Role, ListSize } from '../types/game.ts';
import {
  Film,
  Tv,
  BookOpen,
  UserCheck,
  Smile,
  Music,
  Gamepad2,
  Utensils,
  MapPin,
  Sparkles,
  Zap,
  Flame,
  Wand2,
  Play,
  Clock,
  Loader2,
} from 'lucide-react';

interface RoundSetupViewProps {
  gameState: GameState;
  role: Role | null;
  onStartRound: (listSize: ListSize, topic: string) => void;
}

interface PresetOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

const PRESET_TOPICS: PresetOption[] = [
  { id: 'Famous Movies', name: 'Famous Movies', icon: <Film className="w-5 h-5" />, color: 'from-rose-500 to-red-600' },
  { id: 'Famous Superheroes', name: 'Famous Superheroes', icon: <Zap className="w-5 h-5" />, color: 'from-blue-500 to-indigo-600' },
  { id: 'Famous Video Games', name: 'Famous Video Games', icon: <Gamepad2 className="w-5 h-5" />, color: 'from-emerald-500 to-teal-600' },
  { id: 'Famous Disney Movies', name: 'Famous Disney Movies', icon: <Sparkles className="w-5 h-5" />, color: 'from-purple-500 to-pink-600' },
  { id: 'Famous Foods', name: 'Famous Foods', icon: <Utensils className="w-5 h-5" />, color: 'from-amber-500 to-orange-600' },
  { id: 'Famous Places', name: 'Famous Places', icon: <MapPin className="w-5 h-5" />, color: 'from-cyan-500 to-blue-600' },
  { id: 'Famous Actors', name: 'Famous Actors', icon: <UserCheck className="w-5 h-5" />, color: 'from-violet-500 to-indigo-600' },
  { id: 'Famous Cartoons', name: 'Famous Cartoons', icon: <Smile className="w-5 h-5" />, color: 'from-yellow-500 to-amber-600' },
  { id: 'Famous TV Shows', name: 'Famous TV Shows', icon: <Tv className="w-5 h-5" />, color: 'from-sky-500 to-indigo-600' },
  { id: 'Popular Songs', name: 'Popular Songs', icon: <Music className="w-5 h-5" />, color: 'from-pink-500 to-rose-600' },
  { id: 'Famous Books', name: 'Famous Books', icon: <BookOpen className="w-5 h-5" />, color: 'from-emerald-600 to-teal-700' },
  { id: 'Famous Characters', name: 'Famous Characters', icon: <Flame className="w-5 h-5" />, color: 'from-orange-500 to-red-600' },
];

export const RoundSetupView: React.FC<RoundSetupViewProps> = ({
  gameState,
  role,
  onStartRound,
}) => {
  const isHost = role === 'host';
  const [selectedSize, setSelectedSize] = useState<ListSize>(15);
  const [selectedTopic, setSelectedTopic] = useState<string>('Famous Movies');
  const [isCustomTopic, setIsCustomTopic] = useState<boolean>(false);
  const [customTopicInput, setCustomTopicInput] = useState<string>('');
  const [isStarting, setIsStarting] = useState<boolean>(false);

  const roundNum = gameState.currentRound + 1;

  const handleStart = () => {
    const finalTopic = isCustomTopic ? customTopicInput.trim() : selectedTopic;
    if (!finalTopic) return;
    setIsStarting(true);
    onStartRound(selectedSize, finalTopic);
  };

  if (!isHost) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          <Clock className="w-10 h-10 animate-spin" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl sm:text-3xl font-black font-['Fredoka'] text-white">
            Round {roundNum} Setup
          </h3>
          <p className="text-slate-400 text-sm">
            The Game Host is currently selecting the topic and list size...
          </p>
        </div>

        {/* Current Cumulative Scores */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <span className="text-xs uppercase font-bold text-slate-500">Current Standings</span>
          <div className="flex justify-around items-center pt-1 font-['Fredoka']">
            <div>
              <span className="text-indigo-400 text-sm font-bold block">{gameState.teamA.name}</span>
              <span className="text-2xl font-black text-white">{gameState.teamA.score} pts</span>
            </div>
            <div className="text-slate-600 font-bold">vs</div>
            <div>
              <span className="text-rose-400 text-sm font-bold block">{gameState.teamB.name}</span>
              <span className="text-2xl font-black text-white">{gameState.teamB.score} pts</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
          Host Control Panel • Round {roundNum}
        </span>
        <h2 className="text-3xl sm:text-4xl font-black font-['Fredoka'] text-white">
          Configure This Round
        </h2>
        <p className="text-slate-400 text-sm">
          Select how deep the list goes, then pick a topic. The secret rankings will be generated and hidden until round end!
        </p>
      </div>

      {/* STEP 1: Choose List Size */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold font-['Fredoka'] text-white">
              Step 1: Choose List Size
            </h3>
            <p className="text-xs text-slate-400">
              Higher lists mean larger point rewards at the bottom!
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-lg">
            Selected: Top {selectedSize}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-2">
          {([15, 30, 50] as ListSize[]).map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setSelectedSize(size)}
              className={`p-4 sm:p-5 rounded-2xl border-2 transition-all text-center flex flex-col items-center space-y-1 cursor-pointer transform active:scale-95 ${
                selectedSize === size
                  ? 'border-amber-400 bg-amber-500/15 text-white ring-2 ring-amber-400/40 shadow-lg shadow-amber-950/40'
                  : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <span className="font-['Fredoka'] text-2xl sm:text-3xl font-black">
                Top {size}
              </span>
              <span className="text-xs font-semibold text-amber-300/90">
                #1 = 1pt ... #{size} = {size}pts
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* STEP 2: Choose Topic */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold font-['Fredoka'] text-white">
              Step 2: Choose Topic
            </h3>
            <p className="text-xs text-slate-400">
              Pick a curated popular topic or type your own custom topic
            </p>
          </div>

          {/* Toggle between preset and custom */}
          <div className="flex bg-slate-800 p-1 rounded-xl text-xs font-bold font-['Fredoka']">
            <button
              type="button"
              onClick={() => setIsCustomTopic(false)}
              className={`px-3 py-1.5 rounded-lg transition ${
                !isCustomTopic
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Popular Presets
            </button>
            <button
              type="button"
              onClick={() => setIsCustomTopic(true)}
              className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1 ${
                isCustomTopic
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5 text-amber-300" />
              <span>Custom Topic</span>
            </button>
          </div>
        </div>

        {!isCustomTopic ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
            {PRESET_TOPICS.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => setSelectedTopic(topic.name)}
                className={`p-3.5 rounded-2xl border transition-all text-left flex items-center space-x-3 cursor-pointer ${
                  selectedTopic === topic.name
                    ? 'border-indigo-400 bg-indigo-500/20 text-white ring-2 ring-indigo-400/40 shadow-md'
                    : 'border-slate-800 bg-slate-800/50 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div
                  className={`p-2 rounded-xl bg-gradient-to-tr ${topic.color} text-white shadow-sm shrink-0`}
                >
                  {topic.icon}
                </div>
                <span className="font-['Fredoka'] font-bold text-sm leading-tight">
                  {topic.name}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5">
                Type Any Custom Topic
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={customTopicInput}
                  onChange={(e) => setCustomTopicInput(e.target.value)}
                  placeholder="e.g. World Capitals, 90s Rock Bands, Dog Breeds, Video Game Characters..."
                  maxLength={50}
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-800 border-2 border-slate-700 text-white placeholder-slate-500 font-semibold focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
            <p className="text-xs text-slate-400">
              ⚡ Powered by Gemini AI: The system will generate exactly {selectedSize} ranked items for your topic, keeping answers secret until round finish!
            </p>
          </div>
        )}
      </div>

      {/* Start Round Button */}
      <div className="text-center pt-2">
        <button
          onClick={handleStart}
          disabled={isStarting || (isCustomTopic && !customTopicInput.trim())}
          className="px-10 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 disabled:opacity-50 text-white font-black font-['Fredoka'] text-xl shadow-xl shadow-emerald-950/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center space-x-3 mx-auto cursor-pointer"
        >
          {isStarting ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin text-white" />
              <span>Generating Secret List...</span>
            </>
          ) : (
            <>
              <Play className="w-6 h-6 fill-current text-white" />
              <span>
                Start Round {roundNum}: Top {selectedSize} •{' '}
                {isCustomTopic ? customTopicInput || 'Custom' : selectedTopic}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
