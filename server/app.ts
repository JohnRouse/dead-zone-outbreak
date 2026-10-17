import { createServer } from 'node:http';
import { Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { createSelectionRoom } from './rooms/SelectionRoom.js';
import { LOBBY_TIMING, type LobbyTiming } from '../shared/lobby.js';

export function createLobbyServer(timing: LobbyTiming = LOBBY_TIMING) {
  const http = createServer();
  const server = new Server({
    transport: new WebSocketTransport({ server: http, maxPayload: 2048 }),
    greet: false, gracefullyShutdown: false,
    express: app => { app.get('/health', (_request, response) => response.json({ ok: true })); },
  });
  server.define('selection', createSelectionRoom(timing));
  return { server, http };
}
