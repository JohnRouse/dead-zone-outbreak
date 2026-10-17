import { CHARACTERS, LOBBY_TIMING, MAX_PLAYERS, isCharacterId,
  type LobbyPhase, type LobbyPlayer, type LobbyTiming, type SelectionResult } from '../../shared/lobby.js';

/** Solo reglas: reloj monotónico inyectable y ninguna dependencia de red/DOM. */
export class Selection {
  phase: LobbyPhase = 'waiting';
  private roster = new Map<string, LobbyPlayer>();
  private selectionDeadline = 0;
  private countdownDeadline = 0;

  constructor(private readonly now: () => number = () => performance.now(),
    private readonly timing: LobbyTiming = LOBBY_TIMING) {}

  get players(): ReadonlyMap<string, LobbyPlayer> { return this.roster; }
  get selectionRemainingMs() {
    return this.phase === 'selecting' ? Math.max(0, Math.ceil(this.selectionDeadline - this.now())) : 0;
  }
  get countdownRemainingMs() {
    return this.phase === 'countdown' ? Math.max(0, Math.ceil(this.countdownDeadline - this.now())) : 0;
  }

  join(sessionId: string, name: string) {
    this.advance();
    if (!['waiting', 'selecting'].includes(this.phase)) throw new Error('La selección ya está cerrada.');
    if (this.roster.has(sessionId)) throw new Error('La sesión ya ocupa una plaza.');
    if (this.roster.size >= MAX_PLAYERS) throw new Error('La sala está completa.');
    if (this.phase === 'waiting') {
      this.phase = 'selecting';
      this.selectionDeadline = this.now() + this.timing.selectionMs;
      this.countdownDeadline = this.selectionDeadline + this.timing.countdownMs;
    }
    this.roster.set(sessionId, { sessionId, name, characterId: '', connected: true, departed: false });
  }

  select(sessionId: string, characterId: unknown): SelectionResult {
    // La frontera se valida también al recibir mensajes, no solo en el intervalo.
    this.advance();
    if (this.phase !== 'selecting') return { ok: false, code: 'closed' };
    const player = this.roster.get(sessionId);
    if (!player?.connected || player.departed) return { ok: false, code: 'not_connected' };
    if (!isCharacterId(characterId)) return { ok: false, code: 'invalid' };
    if ([...this.roster.values()].some(other => other.sessionId !== sessionId && other.characterId === characterId)) {
      return { ok: false, code: 'taken' };
    }
    player.characterId = characterId;
    return { ok: true, code: 'selected' };
  }

  drop(sessionId: string) {
    const player = this.roster.get(sessionId);
    if (player) player.connected = false;
    this.advance();
  }

  reconnect(sessionId: string) {
    // No resucitar una sala cancelada aunque conserve una reserva válida.
    this.advance();
    const player = this.roster.get(sessionId);
    if (!player || player.departed || this.phase === 'cancelled') return false;
    player.connected = true;
    return true;
  }

  leave(sessionId: string) {
    this.drop(sessionId);
    if (this.phase === 'waiting' || this.phase === 'selecting') this.roster.delete(sessionId);
    else {
      const player = this.roster.get(sessionId);
      if (player) player.departed = true;
    }
  }

  advance() {
    const now = this.now();
    if (this.phase === 'selecting' && now >= this.selectionDeadline) {
      const occupied = new Set([...this.roster.values()].map(player => player.characterId));
      const available = CHARACTERS.filter(character => !occupied.has(character.id));
      for (const player of this.roster.values()) {
        if (!player.characterId) player.characterId = available.shift()!.id;
      }
      this.phase = 'countdown';
    }
    if (this.phase === 'countdown' && now >= this.countdownDeadline) {
      this.phase = [...this.roster.values()].some(player => player.connected) ? 'ready' : 'cancelled';
    }
  }
}
