export type TeamId = 'teamA' | 'teamB';
export type Role = 'host' | 'teamA' | 'teamB' | 'spectator';
export type ListSize = 15 | 30 | 50;
export type RoundStatus =
  | 'lobby'
  | 'selecting_topic'
  | 'playing'
  | 'round_revealed'
  | 'game_ended';

export interface RankedItem {
  rank: number;
  title: string;
  aliases?: string[];
  foundBy?: TeamId | null;
  foundAt?: number;
  foundPoints?: number;
}

export interface PublicRankedItem {
  rank: number;
  title?: string;
  foundBy?: TeamId | null;
  foundPoints?: number;
  hidden: boolean;
}

export interface GuessAttempt {
  id: string;
  teamId: TeamId;
  rawGuess: string;
  matchedRank?: number;
  matchedTitle?: string;
  points?: number;
  isCorrect: boolean;
  isDuplicate: boolean;
  message: string;
  timestamp: number;
}

export interface TeamState {
  name: string;
  connected: boolean;
  score: number;
  roundScore: number;
  chancesLeft: number;
  guesses: GuessAttempt[];
}

export interface RoundResult {
  roundNumber: number;
  topic: string;
  listSize: ListSize;
  teamAPoints: number;
  teamBPoints: number;
  teamAGuesses: GuessAttempt[];
  teamBGuesses: GuessAttempt[];
  items: RankedItem[];
}

export interface GameEvent {
  id: string;
  type: 'correct' | 'wrong' | 'duplicate' | 'round_end' | 'join' | 'leave';
  teamId?: TeamId;
  message: string;
  rank?: number;
  points?: number;
  title?: string;
  timestamp: number;
}

export interface GameState {
  code: string;
  hostConnected: boolean;
  teamA: TeamState;
  teamB: TeamState;
  currentRound: number;
  status: RoundStatus;
  listSize: ListSize;
  topic: string;
  items: (RankedItem | PublicRankedItem)[];
  totalItemsCount: number;
  foundItemsCount: number;
  roundHistory: RoundResult[];
  winner?: TeamId | 'tie' | null;
  lastEvent?: GameEvent;
}

export type ClientMessage =
  | { type: 'CREATE_GAME'; teamAName?: string; teamBName?: string; clientToken: string }
  | { type: 'JOIN_GAME'; code: string; role: Role; clientToken: string; customName?: string }
  | { type: 'START_GAME'; code: string }
  | { type: 'START_ROUND'; code: string; listSize: ListSize; topic: string }
  | { type: 'SUBMIT_GUESS'; code: string; teamId: TeamId; guess: string; clientToken: string }
  | { type: 'REVEAL_ROUND'; code: string }
  | { type: 'NEXT_ROUND_SETUP'; code: string }
  | { type: 'END_GAME'; code: string }
  | { type: 'RESTART_GAME'; code: string }
  | { type: 'PING' };

export type ServerMessage =
  | { type: 'GAME_STATE'; state: GameState; role: Role; yourTeam?: TeamId; clientToken: string }
  | { type: 'GUESS_FEEDBACK'; result: GuessAttempt }
  | { type: 'NOTIFICATION'; event: GameEvent }
  | { type: 'ERROR'; message: string; code?: string }
  | { type: 'PONG' };
