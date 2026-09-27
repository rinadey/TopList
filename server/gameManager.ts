import fs from 'fs';
import path from 'path';
import {
  GameState,
  TeamState,
  RankedItem,
  PublicRankedItem,
  ListSize,
  TeamId,
  Role,
  GuessAttempt,
  RoundResult,
  GameEvent,
} from '../src/types/game.ts';
import { isFuzzyMatch } from './fuzzyMatch.ts';
import { CURATED_TOPICS, getCuratedTopic } from './curatedTopics.ts';
import { generateRankedList } from './geminiService.ts';

const STORAGE_PATH = path.resolve(process.cwd(), 'data/rooms.json');

interface RoomSession {
  code: string;
  hostToken: string;
  teamAToken: string | null;
  teamBToken: string | null;
  state: {
    code: string;
    hostConnected: boolean;
    teamA: TeamState;
    teamB: TeamState;
    currentRound: number;
    status: GameState['status'];
    listSize: ListSize;
    topic: string;
    items: RankedItem[]; // Full secret list on server
    roundHistory: RoundResult[];
    winner?: TeamId | 'tie' | null;
    lastEvent?: GameEvent;
  };
  lastActivity: number;
}

export class GameManager {
  private rooms: Map<string, RoomSession> = new Map();

  constructor() {
    this.loadFromFile();

    // Periodic cleanup of idle rooms older than 12 hours
    setInterval(() => {
      const now = Date.now();
      let changed = false;
      for (const [code, room] of this.rooms.entries()) {
        if (now - room.lastActivity > 12 * 60 * 60 * 1000) {
          this.rooms.delete(code);
          changed = true;
        }
      }
      if (changed) {
        this.saveToFile();
      }
    }, 15 * 60 * 1000);
  }

  private loadFromFile() {
    try {
      if (fs.existsSync(STORAGE_PATH)) {
        const raw = fs.readFileSync(STORAGE_PATH, 'utf-8');
        if (raw.trim()) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            for (const item of parsed) {
              if (item && item.code) {
                this.rooms.set(item.code, item);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Error loading rooms from storage:', err);
    }
  }

  private saveToFile() {
    try {
      const dir = path.dirname(STORAGE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = Array.from(this.rooms.values());
      fs.writeFileSync(STORAGE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving rooms to storage:', err);
    }
  }

  public getActiveRooms() {
    this.loadFromFile();
    return Array.from(this.rooms.values()).map(r => ({
      code: r.code,
      status: r.state.status,
      currentRound: r.state.currentRound,
      teamAName: r.state.teamA.name,
      teamBName: r.state.teamB.name,
      teamAConnected: r.state.teamA.connected,
      teamBConnected: r.state.teamB.connected,
      lastActivity: r.lastActivity,
    }));
  }

  public generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No O, 0, 1, I
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  public createRoom(
    hostToken: string,
    teamAName: string = 'Team A',
    teamBName: string = 'Team B'
  ): { code: string; session: RoomSession } {
    const code = this.generateRoomCode();
    const session: RoomSession = {
      code,
      hostToken,
      teamAToken: null,
      teamBToken: null,
      lastActivity: Date.now(),
      state: {
        code,
        hostConnected: true,
        teamA: {
          name: teamAName.trim() || 'Team A',
          connected: false,
          score: 0,
          roundScore: 0,
          chancesLeft: 3,
          guesses: [],
        },
        teamB: {
          name: teamBName.trim() || 'Team B',
          connected: false,
          score: 0,
          roundScore: 0,
          chancesLeft: 3,
          guesses: [],
        },
        currentRound: 0,
        status: 'lobby',
        listSize: 15,
        topic: 'Famous Movies',
        items: [],
        roundHistory: [],
        winner: null,
      },
    };

    this.rooms.set(code, session);
    this.saveToFile();
    return { code, session };
  }

  public getRoom(code: string): RoomSession | undefined {
    if (!code) return undefined;
    const clean = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    let room = this.rooms.get(clean);
    if (!room) {
      this.loadFromFile();
      room = this.rooms.get(clean);
    }
    return room;
  }

  public joinRoom(
    code: string,
    role: Role,
    clientToken: string,
    customName?: string
  ): { success: boolean; error?: string; session?: RoomSession; assignedRole?: Role } {
    const room = this.getRoom(code);
    if (!room) {
      return { success: false, error: `Game code "${code}" does not exist. Check spelling!` };
    }

    room.lastActivity = Date.now();

    if (role === 'host') {
      if (room.hostToken === clientToken) {
        room.state.hostConnected = true;
        return { success: true, session: room, assignedRole: 'host' };
      }
      return { success: false, error: 'Host slot is already claimed for this game.' };
    }

    if (role === 'teamA') {
      if (room.teamAToken && room.teamAToken !== clientToken && room.state.teamA.connected) {
        return { success: false, error: `${room.state.teamA.name} is already occupied on another device.` };
      }
      room.teamAToken = clientToken;
      room.state.teamA.connected = true;
      if (customName && customName.trim()) {
        room.state.teamA.name = customName.trim();
      }
      this.saveToFile();
      return { success: true, session: room, assignedRole: 'teamA' };
    }

    if (role === 'teamB') {
      if (room.teamBToken && room.teamBToken !== clientToken && room.state.teamB.connected) {
        return { success: false, error: `${room.state.teamB.name} is already occupied on another device.` };
      }
      room.teamBToken = clientToken;
      room.state.teamB.connected = true;
      if (customName && customName.trim()) {
        room.state.teamB.name = customName.trim();
      }
      this.saveToFile();
      return { success: true, session: room, assignedRole: 'teamB' };
    }

    // Spectator
    return { success: true, session: room, assignedRole: 'spectator' };
  }

  public handleDisconnect(clientToken: string) {
    for (const room of this.rooms.values()) {
      if (room.hostToken === clientToken) {
        room.state.hostConnected = false;
      }
      if (room.teamAToken === clientToken) {
        room.state.teamA.connected = false;
      }
      if (room.teamBToken === clientToken) {
        room.state.teamB.connected = false;
      }
    }
    this.saveToFile();
  }

  public async startRound(code: string, listSize: ListSize, topic: string): Promise<boolean> {
    const room = this.getRoom(code);
    if (!room) return false;

    room.lastActivity = Date.now();

    // Check curated presets first
    let rankedItems = getCuratedTopic(topic, listSize);

    // If not curated, generate with Gemini AI
    if (!rankedItems || rankedItems.length === 0) {
      rankedItems = await generateRankedList(topic, listSize);
    }

    room.state.items = rankedItems.map(item => ({
      ...item,
      foundBy: null,
      foundAt: undefined,
      foundPoints: undefined,
    }));

    room.state.currentRound += 1;
    room.state.listSize = listSize;
    room.state.topic = topic;
    room.state.status = 'playing';

    // Reset chances & round scores for both teams (cumulative score preserved!)
    room.state.teamA.chancesLeft = 3;
    room.state.teamA.roundScore = 0;
    room.state.teamA.guesses = [];

    room.state.teamB.chancesLeft = 3;
    room.state.teamB.roundScore = 0;
    room.state.teamB.guesses = [];

    this.saveToFile();
    return true;
  }

  public submitGuess(
    code: string,
    teamId: TeamId,
    rawGuess: string
  ): { success: boolean; attempt: GuessAttempt; shouldAutoReveal: boolean } {
    const room = this.getRoom(code);
    if (!room || room.state.status !== 'playing') {
      return {
        success: false,
        attempt: {
          id: Math.random().toString(),
          teamId,
          rawGuess,
          isCorrect: false,
          isDuplicate: false,
          message: 'Round is not currently in play.',
          timestamp: Date.now(),
        },
        shouldAutoReveal: false,
      };
    }

    const team = teamId === 'teamA' ? room.state.teamA : room.state.teamB;
    const cleanGuess = rawGuess.trim();

    if (!cleanGuess) {
      return {
        success: false,
        attempt: {
          id: Math.random().toString(),
          teamId,
          rawGuess,
          isCorrect: false,
          isDuplicate: false,
          message: 'Please enter a valid guess.',
          timestamp: Date.now(),
        },
        shouldAutoReveal: false,
      };
    }

    if (team.chancesLeft <= 0) {
      return {
        success: false,
        attempt: {
          id: Math.random().toString(),
          teamId,
          rawGuess,
          isCorrect: false,
          isDuplicate: false,
          message: 'You have no chances remaining this round!',
          timestamp: Date.now(),
        },
        shouldAutoReveal: false,
      };
    }

    // 1. Check if this team already guessed this exact or similar item
    const alreadyGuessedByThisTeam = team.guesses.some(g =>
      isFuzzyMatch(cleanGuess, g.rawGuess, g.matchedTitle ? [g.matchedTitle] : [])
    );

    if (alreadyGuessedByThisTeam) {
      const attempt: GuessAttempt = {
        id: Math.random().toString(),
        teamId,
        rawGuess: cleanGuess,
        isCorrect: false,
        isDuplicate: true,
        message: 'You already guessed this! (Chance saved)',
        timestamp: Date.now(),
      };
      return { success: false, attempt, shouldAutoReveal: false };
    }

    // 2. Check if already found by other team
    const alreadyFoundItem = room.state.items.find(
      item => item.foundBy && isFuzzyMatch(cleanGuess, item.title, item.aliases)
    );

    if (alreadyFoundItem) {
      const otherTeamName =
        alreadyFoundItem.foundBy === 'teamA' ? room.state.teamA.name : room.state.teamB.name;
      const attempt: GuessAttempt = {
        id: Math.random().toString(),
        teamId,
        rawGuess: cleanGuess,
        isCorrect: false,
        isDuplicate: true,
        message: `Already found by ${otherTeamName}! Guess another item! (Chance saved)`,
        timestamp: Date.now(),
      };
      return { success: false, attempt, shouldAutoReveal: false };
    }

    // 3. Search secret ranked list using fuzzy matching
    let matchedItem: RankedItem | null = null;
    for (const item of room.state.items) {
      if (!item.foundBy && isFuzzyMatch(cleanGuess, item.title, item.aliases)) {
        matchedItem = item;
        break;
      }
    }

    const attemptId = Math.random().toString(36).substring(2, 9);

    if (matchedItem) {
      // Correct!
      const points = matchedItem.rank; // #1 = 1 pt, #15 = 15 pts, #50 = 50 pts
      matchedItem.foundBy = teamId;
      matchedItem.foundAt = Date.now();
      matchedItem.foundPoints = points;

      team.score += points;
      team.roundScore += points;
      team.chancesLeft -= 1; // 1 of the 3 chances used

      const attempt: GuessAttempt = {
        id: attemptId,
        teamId,
        rawGuess: cleanGuess,
        matchedRank: matchedItem.rank,
        matchedTitle: matchedItem.title,
        points,
        isCorrect: true,
        isDuplicate: false,
        message: `🎉 Correct! You found #${matchedItem.rank}! +${points} points`,
        timestamp: Date.now(),
      };

      team.guesses.push(attempt);

      room.state.lastEvent = {
        id: attemptId,
        type: 'correct',
        teamId,
        message: `${team.name} found #${matchedItem.rank}: "${matchedItem.title}" (+${points} pts)!`,
        rank: matchedItem.rank,
        points,
        title: matchedItem.title,
        timestamp: Date.now(),
      };

      const shouldAutoReveal = this.checkRoundCompletion(room);
      this.saveToFile();
      return { success: true, attempt, shouldAutoReveal };
    } else {
      // Incorrect!
      team.chancesLeft = Math.max(0, team.chancesLeft - 1);

      const attempt: GuessAttempt = {
        id: attemptId,
        teamId,
        rawGuess: cleanGuess,
        isCorrect: false,
        isDuplicate: false,
        message: '❌ Not on the list! (Lost 1 chance)',
        timestamp: Date.now(),
      };

      team.guesses.push(attempt);

      room.state.lastEvent = {
        id: attemptId,
        type: 'wrong',
        teamId,
        message: `${team.name} guessed "${cleanGuess}" - Not on the list!`,
        timestamp: Date.now(),
      };

      const shouldAutoReveal = this.checkRoundCompletion(room);
      this.saveToFile();
      return { success: false, attempt, shouldAutoReveal };
    }
  }

  private checkRoundCompletion(room: RoomSession): boolean {
    const teamAOut = room.state.teamA.chancesLeft <= 0;
    const teamBOut = room.state.teamB.chancesLeft <= 0;

    if (teamAOut && teamBOut) {
      this.revealRound(room.code);
      return true;
    }
    return false;
  }

  public revealRound(code: string): boolean {
    const room = this.getRoom(code);
    if (!room) return false;

    room.lastActivity = Date.now();
    room.state.status = 'round_revealed';

    // Record round result history
    const roundResult: RoundResult = {
      roundNumber: room.state.currentRound,
      topic: room.state.topic,
      listSize: room.state.listSize,
      teamAPoints: room.state.teamA.roundScore,
      teamBPoints: room.state.teamB.roundScore,
      teamAGuesses: [...room.state.teamA.guesses],
      teamBGuesses: [...room.state.teamB.guesses],
      items: JSON.parse(JSON.stringify(room.state.items)),
    };

    room.state.roundHistory.push(roundResult);

    room.state.lastEvent = {
      id: Math.random().toString(),
      type: 'round_end',
      message: `Round ${room.state.currentRound} ended! Check out the revealed ranking!`,
      timestamp: Date.now(),
    };

    this.saveToFile();
    return true;
  }

  public endGame(code: string): boolean {
    const room = this.getRoom(code);
    if (!room) return false;

    room.lastActivity = Date.now();
    room.state.status = 'game_ended';

    const aScore = room.state.teamA.score;
    const bScore = room.state.teamB.score;

    if (aScore > bScore) {
      room.state.winner = 'teamA';
    } else if (bScore > aScore) {
      room.state.winner = 'teamB';
    } else {
      room.state.winner = 'tie';
    }

    this.saveToFile();
    return true;
  }

  public restartGame(code: string): boolean {
    const room = this.getRoom(code);
    if (!room) return false;

    room.lastActivity = Date.now();
    room.state.status = 'lobby';
    room.state.currentRound = 0;
    room.state.winner = null;
    room.state.roundHistory = [];
    room.state.teamA.score = 0;
    room.state.teamA.roundScore = 0;
    room.state.teamA.chancesLeft = 3;
    room.state.teamA.guesses = [];
    room.state.teamB.score = 0;
    room.state.teamB.roundScore = 0;
    room.state.teamB.chancesLeft = 3;
    room.state.teamB.guesses = [];
    room.state.items = [];

    this.saveToFile();
    return true;
  }

  /**
   * Returns sanitized state according to role.
   * If round is 'playing', secret unrevealed items are masked with hidden: true
   * so neither team nor host can inspect browser console to cheat.
   */
  public getSanitizedState(code: string, role: Role): GameState | null {
    const room = this.getRoom(code);
    if (!room) return null;

    const isRevealed =
      room.state.status === 'round_revealed' || room.state.status === 'game_ended';

    let sanitizedItems: (RankedItem | PublicRankedItem)[] = [];

    if (isRevealed) {
      // Revealed to everyone
      sanitizedItems = room.state.items.map(item => ({
        rank: item.rank,
        title: item.title,
        aliases: item.aliases,
        foundBy: item.foundBy,
        foundAt: item.foundAt,
        foundPoints: item.foundPoints,
      }));
    } else if (room.state.status === 'playing') {
      // During play: mask unrevealed items
      sanitizedItems = room.state.items.map(item => {
        if (item.foundBy) {
          return {
            rank: item.rank,
            title: item.title,
            foundBy: item.foundBy,
            foundPoints: item.foundPoints,
            hidden: false,
          };
        }
        return {
          rank: item.rank,
          hidden: true,
        };
      });
    }

    const foundItemsCount = room.state.items.filter(i => i.foundBy).length;

    return {
      code: room.state.code,
      hostConnected: room.state.hostConnected,
      teamA: {
        name: room.state.teamA.name,
        connected: room.state.teamA.connected,
        score: room.state.teamA.score,
        roundScore: room.state.teamA.roundScore,
        chancesLeft: room.state.teamA.chancesLeft,
        guesses: room.state.teamA.guesses,
      },
      teamB: {
        name: room.state.teamB.name,
        connected: room.state.teamB.connected,
        score: room.state.teamB.score,
        roundScore: room.state.teamB.roundScore,
        chancesLeft: room.state.teamB.chancesLeft,
        guesses: room.state.teamB.guesses,
      },
      currentRound: room.state.currentRound,
      status: room.state.status,
      listSize: room.state.listSize,
      topic: room.state.topic,
      items: sanitizedItems,
      totalItemsCount: room.state.items.length,
      foundItemsCount,
      roundHistory: room.state.roundHistory,
      winner: room.state.winner,
      lastEvent: room.state.lastEvent,
    };
  }
}
