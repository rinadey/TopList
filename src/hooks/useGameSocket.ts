import { useEffect, useRef, useState, useCallback } from 'react';
import {
  GameState,
  Role,
  TeamId,
  ListSize,
  GuessAttempt,
  GameEvent,
} from '../types/game.ts';
import { sounds } from '../utils/audio.ts';

const TOKEN_STORAGE_KEY = 'toplist_client_token';
const ROOM_STORAGE_KEY = 'toplist_room_code';
const ROLE_STORAGE_KEY = 'toplist_role';

function getOrCreateToken(): string {
  let token = sessionStorage.getItem(TOKEN_STORAGE_KEY);
  if (!token) {
    token = 'cli_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
  }
  return token;
}

export function useGameSocket() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [role, setRole] = useState<Role | null>(() => {
    return (sessionStorage.getItem(ROLE_STORAGE_KEY) as Role) || null;
  });
  const [yourTeam, setYourTeam] = useState<TeamId | null>(() => {
    const saved = sessionStorage.getItem(ROLE_STORAGE_KEY);
    return saved === 'teamA' ? 'teamA' : saved === 'teamB' ? 'teamB' : null;
  });
  const [connected, setConnected] = useState<boolean>(true);
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFeedback, setLastFeedback] = useState<GuessAttempt | null>(null);
  const [lastEvent, setLastEvent] = useState<GameEvent | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const clientTokenRef = useRef<string>(getOrCreateToken());
  const roomCodeRef = useRef<string | null>(sessionStorage.getItem(ROOM_STORAGE_KEY));
  const roleRef = useRef<Role | null>(role);

  // Sync ref
  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  // REST State Fetcher
  const fetchLatestState = useCallback(async (codeToFetch?: string) => {
    const code = codeToFetch || roomCodeRef.current;
    if (!code) return;

    try {
      const res = await fetch(
        `/api/game/state?code=${encodeURIComponent(code)}&role=${roleRef.current || 'spectator'}&clientToken=${clientTokenRef.current}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.state) {
          setGameState(data.state);
          if (data.role) {
            setRole(data.role);
            roleRef.current = data.role;
            sessionStorage.setItem(ROLE_STORAGE_KEY, data.role);
          }
          if (data.yourTeam) {
            setYourTeam(data.yourTeam);
          }
          setConnected(true);
        }
      }
    } catch {
      // Network hiccup
    }
  }, []);

  // Poll state every 800ms when inside a room
  useEffect(() => {
    const interval = setInterval(() => {
      if (roomCodeRef.current) {
        fetchLatestState();
      }
    }, 800);

    return () => clearInterval(interval);
  }, [fetchLatestState]);

  // Attempt WebSocket connection as supplementary real-time channel
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        if (roomCodeRef.current && roleRef.current) {
          ws.send(
            JSON.stringify({
              type: 'JOIN_GAME',
              code: roomCodeRef.current,
              role: roleRef.current,
              clientToken: clientTokenRef.current,
            })
          );
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'GAME_STATE') {
            setGameState(msg.state);
            if (msg.role) setRole(msg.role);
            if (msg.yourTeam) setYourTeam(msg.yourTeam);
          } else if (msg.type === 'GUESS_FEEDBACK') {
            setLastFeedback(msg.result);
            if (msg.result.isCorrect) {
              sounds.playCorrect(msg.result.points || 10);
            } else if (!msg.result.isDuplicate) {
              sounds.playWrong();
            }
          } else if (msg.type === 'NOTIFICATION') {
            setLastEvent(msg.event);
            if (msg.event.type === 'round_end') {
              sounds.playRoundEnd();
            }
          }
        } catch {
          // ignore
        }
      };
    } catch {
      // WebSocket fallback to HTTP polling
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  // Check URL parameters for auto-joining (?code=XXXXX&team=teamA)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    const teamParam = params.get('team') as Role | null;

    if (codeParam && !gameState && !roomCodeRef.current) {
      const targetRole = teamParam === 'teamA' || teamParam === 'teamB' ? teamParam : 'spectator';
      joinGame(codeParam, targetRole);
    } else if (roomCodeRef.current && !gameState) {
      // Re-hydrate session
      fetchLatestState(roomCodeRef.current);
    }
  }, []);

  // Actions with reliable REST API calls
  const createGame = useCallback(
    async (teamAName?: string, teamBName?: string) => {
      setError(null);
      setIsJoining(true);
      try {
        const res = await fetch('/api/game/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teamAName,
            teamBName,
            clientToken: clientTokenRef.current,
          }),
        });

        const data = await res.json();
        if (data.success) {
          roomCodeRef.current = data.code;
          sessionStorage.setItem(ROOM_STORAGE_KEY, data.code);
          sessionStorage.setItem(ROLE_STORAGE_KEY, 'host');
          setRole('host');
          roleRef.current = 'host';
          setGameState(data.state);
        } else {
          setError(data.error || 'Failed to create game room.');
        }
      } catch (err: any) {
        setError(err.message || 'Network error while creating game.');
      } finally {
        setIsJoining(false);
      }
    },
    []
  );

  const joinGame = useCallback(
    async (code: string, targetRole: Role, customName?: string): Promise<boolean> => {
      setError(null);
      setIsJoining(true);
      const cleanCode = code.trim().toUpperCase();

      try {
        const res = await fetch('/api/game/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: cleanCode,
            role: targetRole,
            clientToken: clientTokenRef.current,
            customName,
          }),
        });

        const data = await res.json();
        if (data.success && data.state) {
          roomCodeRef.current = cleanCode;
          sessionStorage.setItem(ROOM_STORAGE_KEY, cleanCode);
          sessionStorage.setItem(ROLE_STORAGE_KEY, data.role);
          setRole(data.role);
          roleRef.current = data.role;
          setYourTeam(data.yourTeam || (targetRole === 'teamA' ? 'teamA' : targetRole === 'teamB' ? 'teamB' : null));
          setGameState(data.state);
          setIsJoining(false);
          return true;
        } else {
          setError(data.error || `Could not join room ${cleanCode}`);
          setIsJoining(false);
          return false;
        }
      } catch (err: any) {
        setError(err.message || 'Network error while connecting to room.');
        setIsJoining(false);
        return false;
      }
    },
    []
  );

  const startGame = useCallback(async () => {
    if (!gameState) return;
    try {
      await fetch('/api/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: gameState.code }),
      });
      await fetchLatestState();
    } catch {
      // ignore
    }
  }, [gameState, fetchLatestState]);

  const startRound = useCallback(
    async (listSize: ListSize, topic: string) => {
      if (!gameState) return;
      try {
        const res = await fetch('/api/game/start-round', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: gameState.code,
            listSize,
            topic,
          }),
        });
        const data = await res.json();
        if (data.success && data.state) {
          setGameState(data.state);
        } else {
          setError(data.error || 'Failed to start round');
        }
      } catch (err: any) {
        setError(err.message || 'Error starting round');
      }
    },
    [gameState]
  );

  const submitGuess = useCallback(
    async (guess: string) => {
      if (!gameState || !yourTeam) return;
      try {
        const res = await fetch('/api/game/guess', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: gameState.code,
            teamId: yourTeam,
            guess,
            clientToken: clientTokenRef.current,
          }),
        });

        const data = await res.json();
        if (data.success && data.attempt) {
          setLastFeedback(data.attempt);
          if (data.attempt.isCorrect) {
            sounds.playCorrect(data.attempt.points || 10);
          } else if (!data.attempt.isDuplicate) {
            sounds.playWrong();
          }
          if (data.state) {
            setGameState(data.state);
          }
        }
      } catch {
        // ignore
      }
    },
    [gameState, yourTeam]
  );

  const revealRound = useCallback(async () => {
    if (!gameState) return;
    try {
      const res = await fetch('/api/game/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: gameState.code }),
      });
      const data = await res.json();
      if (data.success && data.state) {
        setGameState(data.state);
      }
    } catch {
      // ignore
    }
  }, [gameState]);

  const nextRoundSetup = useCallback(async () => {
    if (!gameState) return;
    try {
      const res = await fetch('/api/game/next-round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: gameState.code }),
      });
      const data = await res.json();
      if (data.success && data.state) {
        setGameState(data.state);
      }
    } catch {
      // ignore
    }
  }, [gameState]);

  const endGame = useCallback(async () => {
    if (!gameState) return;
    try {
      const res = await fetch('/api/game/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: gameState.code }),
      });
      const data = await res.json();
      if (data.success && data.state) {
        setGameState(data.state);
      }
    } catch {
      // ignore
    }
  }, [gameState]);

  const restartGame = useCallback(async () => {
    if (!gameState) return;
    try {
      const res = await fetch('/api/game/restart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: gameState.code }),
      });
      const data = await res.json();
      if (data.success && data.state) {
        setGameState(data.state);
      }
    } catch {
      // ignore
    }
  }, [gameState]);

  const leaveRoom = useCallback(() => {
    sessionStorage.removeItem(ROOM_STORAGE_KEY);
    sessionStorage.removeItem(ROLE_STORAGE_KEY);
    roomCodeRef.current = null;
    setGameState(null);
    setRole(null);
    setYourTeam(null);
    setError(null);
    setLastFeedback(null);
  }, []);

  const clearFeedback = useCallback(() => {
    setLastFeedback(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    gameState,
    role,
    yourTeam,
    connected,
    isJoining,
    error,
    lastFeedback,
    lastEvent,
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
  };
}
