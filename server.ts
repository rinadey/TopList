import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import { GameManager } from './server/gameManager.ts';
import { CURATED_TOPICS } from './server/curatedTopics.ts';
import { ClientMessage, Role, TeamId } from './src/types/game.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const gameManager = new GameManager();

app.use(express.json());

interface ClientSocketMeta {
  code?: string;
  role?: Role;
  teamId?: TeamId;
  clientToken: string;
}

const socketMetaMap = new WeakMap<WebSocket, ClientSocketMeta>();
const tokenSocketMap = new Map<string, WebSocket>();

// Helper to broadcast sanitized state to all clients in a room
function broadcastRoomState(code: string) {
  const room = gameManager.getRoom(code);
  if (!room) return;

  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      const meta = socketMetaMap.get(client);
      if (meta && meta.code === code) {
        const sanitizedState = gameManager.getSanitizedState(code, meta.role || 'spectator');
        if (sanitizedState) {
          client.send(
            JSON.stringify({
              type: 'GAME_STATE',
              state: sanitizedState,
              role: meta.role,
              yourTeam: meta.teamId,
              clientToken: meta.clientToken,
            })
          );
        }
      }
    }
  }
}

// REST endpoints for topic presets
app.get('/api/topics', (req, res) => {
  res.json({
    presets: CURATED_TOPICS.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      category: t.category,
      itemCount: t.items.length,
    })),
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/api/game/rooms', (req, res) => {
  try {
    const activeRooms = gameManager.getActiveRooms();
    res.json({ success: true, rooms: activeRooms });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// REST API for Game Management (100% reliable across all devices and proxies)
app.post('/api/game/create', (req, res) => {
  try {
    const { teamAName, teamBName, clientToken } = req.body;
    if (!clientToken) {
      res.status(400).json({ success: false, error: 'clientToken is required' });
      return;
    }

    const { code, session } = gameManager.createRoom(
      clientToken,
      teamAName || 'Team A',
      teamBName || 'Team B'
    );

    const state = gameManager.getSanitizedState(code, 'host');
    res.json({
      success: true,
      code,
      state,
      role: 'host',
      clientToken,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

app.post('/api/game/join', (req, res) => {
  try {
    const { code, role, clientToken, customName } = req.body;
    if (!code || !clientToken) {
      res.status(400).json({ success: false, error: 'code and clientToken are required' });
      return;
    }

    const normalizedCode = code.trim().toUpperCase();
    const joinResult = gameManager.joinRoom(
      normalizedCode,
      role || 'spectator',
      clientToken,
      customName
    );

    if (!joinResult.success) {
      res.status(400).json({
        success: false,
        error: joinResult.error || 'Failed to join game room',
      });
      return;
    }

    const assignedRole = joinResult.assignedRole || role;
    const teamId: TeamId | undefined =
      assignedRole === 'teamA' ? 'teamA' : assignedRole === 'teamB' ? 'teamB' : undefined;

    const state = gameManager.getSanitizedState(normalizedCode, assignedRole);
    broadcastRoomState(normalizedCode);

    res.json({
      success: true,
      code: normalizedCode,
      state,
      role: assignedRole,
      yourTeam: teamId,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

app.get('/api/game/state', (req, res) => {
  try {
    const code = (req.query.code as string)?.trim().toUpperCase();
    const role = (req.query.role as Role) || 'spectator';
    const clientToken = req.query.clientToken as string;

    if (!code) {
      res.status(400).json({ success: false, error: 'code parameter required' });
      return;
    }

    const room = gameManager.getRoom(code);
    if (!room) {
      res.status(404).json({ success: false, error: 'Game room not found' });
      return;
    }

    // Touch activity
    room.lastActivity = Date.now();

    // Determine actual role if clientToken provided
    let effectiveRole = role;
    let yourTeam: TeamId | undefined = undefined;
    if (clientToken) {
      if (room.hostToken === clientToken) effectiveRole = 'host';
      else if (room.teamAToken === clientToken) {
        effectiveRole = 'teamA';
        yourTeam = 'teamA';
      } else if (room.teamBToken === clientToken) {
        effectiveRole = 'teamB';
        yourTeam = 'teamB';
      }
    }

    const state = gameManager.getSanitizedState(code, effectiveRole);
    res.json({
      success: true,
      state,
      role: effectiveRole,
      yourTeam,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

app.post('/api/game/start', (req, res) => {
  try {
    const { code } = req.body;
    const normalizedCode = code?.trim().toUpperCase();
    const room = gameManager.getRoom(normalizedCode);
    if (!room) {
      res.status(404).json({ success: false, error: 'Game room not found' });
      return;
    }

    room.state.status = 'selecting_topic';
    broadcastRoomState(normalizedCode);
    res.json({ success: true, state: gameManager.getSanitizedState(normalizedCode, 'host') });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/game/start-round', async (req, res) => {
  try {
    const { code, listSize, topic } = req.body;
    const normalizedCode = code?.trim().toUpperCase();
    const success = await gameManager.startRound(normalizedCode, listSize, topic);
    if (success) {
      broadcastRoomState(normalizedCode);
      res.json({ success: true, state: gameManager.getSanitizedState(normalizedCode, 'host') });
    } else {
      res.status(400).json({ success: false, error: 'Failed to start round' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/game/guess', (req, res) => {
  try {
    const { code, teamId, guess } = req.body;
    const normalizedCode = code?.trim().toUpperCase();
    const result = gameManager.submitGuess(normalizedCode, teamId, guess);
    broadcastRoomState(normalizedCode);
    res.json({
      success: true,
      attempt: result.attempt,
      state: gameManager.getSanitizedState(normalizedCode, teamId),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/game/reveal', (req, res) => {
  try {
    const { code } = req.body;
    const normalizedCode = code?.trim().toUpperCase();
    gameManager.revealRound(normalizedCode);
    broadcastRoomState(normalizedCode);
    res.json({ success: true, state: gameManager.getSanitizedState(normalizedCode, 'host') });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/game/next-round', (req, res) => {
  try {
    const { code } = req.body;
    const normalizedCode = code?.trim().toUpperCase();
    const room = gameManager.getRoom(normalizedCode);
    if (room) {
      room.state.status = 'selecting_topic';
      broadcastRoomState(normalizedCode);
      res.json({ success: true, state: gameManager.getSanitizedState(normalizedCode, 'host') });
    } else {
      res.status(404).json({ success: false, error: 'Room not found' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/game/end', (req, res) => {
  try {
    const { code } = req.body;
    const normalizedCode = code?.trim().toUpperCase();
    gameManager.endGame(normalizedCode);
    broadcastRoomState(normalizedCode);
    res.json({ success: true, state: gameManager.getSanitizedState(normalizedCode, 'host') });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/game/restart', (req, res) => {
  try {
    const { code } = req.body;
    const normalizedCode = code?.trim().toUpperCase();
    gameManager.restartGame(normalizedCode);
    broadcastRoomState(normalizedCode);
    res.json({ success: true, state: gameManager.getSanitizedState(normalizedCode, 'host') });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// WebSocket Connection Handling
wss.on('connection', (ws: WebSocket) => {
  let clientToken = '';

  ws.on('message', async (data: string) => {
    try {
      const msg: ClientMessage = JSON.parse(data.toString());

      if (msg.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG' }));
        return;
      }

      if (msg.type === 'CREATE_GAME') {
        clientToken = msg.clientToken;
        tokenSocketMap.set(clientToken, ws);

        const { code, session } = gameManager.createRoom(
          clientToken,
          msg.teamAName,
          msg.teamBName
        );

        socketMetaMap.set(ws, {
          code,
          role: 'host',
          clientToken,
        });

        const state = gameManager.getSanitizedState(code, 'host');
        ws.send(
          JSON.stringify({
            type: 'GAME_STATE',
            state,
            role: 'host',
            clientToken,
          })
        );
        return;
      }

      if (msg.type === 'JOIN_GAME') {
        const normalizedCode = msg.code.trim().toUpperCase();
        clientToken = msg.clientToken;
        tokenSocketMap.set(clientToken, ws);

        const joinResult = gameManager.joinRoom(
          normalizedCode,
          msg.role,
          clientToken,
          msg.customName
        );

        if (!joinResult.success) {
          ws.send(
            JSON.stringify({
              type: 'ERROR',
              message: joinResult.error || 'Failed to join game room',
            })
          );
          return;
        }

        const teamId: TeamId | undefined =
          joinResult.assignedRole === 'teamA'
            ? 'teamA'
            : joinResult.assignedRole === 'teamB'
            ? 'teamB'
            : undefined;

        socketMetaMap.set(ws, {
          code: normalizedCode,
          role: joinResult.assignedRole,
          teamId,
          clientToken,
        });

        broadcastRoomState(normalizedCode);
        return;
      }

      if (msg.type === 'START_GAME') {
        const room = gameManager.getRoom(msg.code);
        if (room) {
          room.state.status = 'selecting_topic';
          broadcastRoomState(msg.code);
        }
        return;
      }

      if (msg.type === 'START_ROUND') {
        const success = await gameManager.startRound(msg.code, msg.listSize, msg.topic);
        if (success) {
          broadcastRoomState(msg.code);
        } else {
          ws.send(
            JSON.stringify({
              type: 'ERROR',
              message: 'Failed to start round.',
            })
          );
        }
        return;
      }

      if (msg.type === 'SUBMIT_GUESS') {
        const result = gameManager.submitGuess(msg.code, msg.teamId, msg.guess);

        // Send direct feedback back to submitter
        ws.send(
          JSON.stringify({
            type: 'GUESS_FEEDBACK',
            result: result.attempt,
          })
        );

        // Broadcast updated state to all connected devices in room
        broadcastRoomState(msg.code);
        return;
      }

      if (msg.type === 'REVEAL_ROUND') {
        gameManager.revealRound(msg.code);
        broadcastRoomState(msg.code);
        return;
      }

      if (msg.type === 'NEXT_ROUND_SETUP') {
        const room = gameManager.getRoom(msg.code);
        if (room) {
          room.state.status = 'selecting_topic';
          broadcastRoomState(msg.code);
        }
        return;
      }

      if (msg.type === 'END_GAME') {
        gameManager.endGame(msg.code);
        broadcastRoomState(msg.code);
        return;
      }

      if (msg.type === 'RESTART_GAME') {
        gameManager.restartGame(msg.code);
        broadcastRoomState(msg.code);
        return;
      }
    } catch (err) {
      console.error('Error handling WS message:', err);
      ws.send(JSON.stringify({ type: 'ERROR', message: 'Internal server error' }));
    }
  });

  ws.on('close', () => {
    const meta = socketMetaMap.get(ws);
    if (meta && meta.clientToken) {
      gameManager.handleDisconnect(meta.clientToken);
      if (meta.code) {
        broadcastRoomState(meta.code);
      }
      tokenSocketMap.delete(meta.clientToken);
    }
  });
});

// Setup Vite or static serving
async function startServer() {
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Top List server running on http://0.0.0.0:${PORT} (${isDev ? 'dev' : 'prod'})`);
  });
}

startServer();
