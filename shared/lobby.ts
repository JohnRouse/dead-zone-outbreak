export const CHARACTERS = [
  { id: 'soldier', name: 'Soldado', description: 'Combate y control de hordas.' },
  { id: 'medic', name: 'Médica', description: 'Cuida y recupera al grupo.' },
  { id: 'mechanic', name: 'Mecánico', description: 'Torreta y apoyo técnico.' },
  { id: 'scout', name: 'Explorador', description: 'Movilidad y reconocimiento.' },
] as const;

export type CharacterId = typeof CHARACTERS[number]['id'];
export type LobbyPhase = 'waiting' | 'selecting' | 'countdown' | 'ready' | 'cancelled';
export interface LobbyPlayer {
  sessionId: string;
  name: string;
  characterId: CharacterId | '';
  connected: boolean;
  departed: boolean;
}
export interface SelectionResult {
  ok: boolean;
  code: 'selected' | 'taken' | 'invalid' | 'closed' | 'not_connected';
}
export const MAX_PLAYERS = 4;
export interface LobbyTiming { selectionMs: number; countdownMs: number; reconnectSeconds: number }
export const LOBBY_TIMING: Readonly<LobbyTiming> = Object.freeze({ selectionMs: 30_000, countdownMs: 5_000, reconnectSeconds: 20 });

export function isCharacterId(value: unknown): value is CharacterId {
  return CHARACTERS.some(character => character.id === value);
}
