import { Room, ServerError, type Client } from '@colyseus/core';
import { Selection } from '../domain/Selection.js';
import { LobbyState, PlayerState } from '../../shared/LobbyState.js';
import { LOBBY_TIMING, MAX_PLAYERS, type LobbyTiming } from '../../shared/lobby.js';

// La fábrica recibe configuración del proceso, nunca opciones de matchmaking.
export function createSelectionRoom(timing: LobbyTiming = LOBBY_TIMING) {
  const serverTiming = Object.freeze({ ...timing });
  return class SelectionRoom extends Room<{ state: LobbyState }> {
    state = new LobbyState();
    maxClients = MAX_PLAYERS;
    maxMessagesPerSecond = 20;
    private selection = new Selection(() => performance.now(), serverTiming);
    private closedToJoins = false;

    onCreate() {
      this.onMessage('select', (client, payload: unknown) => {
        const characterId = payload !== null && typeof payload === 'object' && !Array.isArray(payload)
          ? (payload as Record<string, unknown>).characterId : undefined;
        const result = this.selection.select(client.sessionId, characterId);
        this.sync();
        return result;
      });
      this.clock.setInterval(() => { this.selection.advance(); this.sync(); }, 50);
    }

    onJoin(client: Client, options: unknown) {
      const candidate = options !== null && typeof options === 'object'
        ? (options as Record<string, unknown>).name : undefined;
      const name = typeof candidate === 'string' ? candidate.trim().slice(0, 24) : '';
      try { this.selection.join(client.sessionId, name || 'Superviviente'); }
      catch (error) { throw new ServerError(4210, (error as Error).message); }
      this.sync();
    }

    async onDrop(client: Client) {
      this.selection.drop(client.sessionId);
      this.sync();
      try { await this.allowReconnection(client, serverTiming.reconnectSeconds); }
      catch { /* Colyseus llama onLeave al vencer la reserva; allí se libera. */ }
    }

    onReconnect(client: Client) {
      if (!this.selection.reconnect(client.sessionId)) client.leave();
      this.sync();
    }

    onLeave(client: Client) {
      this.selection.leave(client.sessionId);
      this.sync();
    }

    private sync() {
      this.state.phase = this.selection.phase;
      this.state.selectionRemainingMs = this.selection.selectionRemainingMs;
      this.state.countdownRemainingMs = this.selection.countdownRemainingMs;
      for (const id of this.state.players.keys()) {
        if (!this.selection.players.has(id)) this.state.players.delete(id);
      }
      for (const [id, player] of this.selection.players) {
        let entry = this.state.players.get(id);
        if (!entry) { entry = new PlayerState(); this.state.players.set(id, entry); }
        Object.assign(entry, player);
      }
      if (this.state.phase !== 'waiting' && this.state.phase !== 'selecting' && !this.closedToJoins) {
        this.closedToJoins = true;
        void this.lock();
      }
    }
  };
}
