import { schema, t, type SchemaType } from '@colyseus/schema';
import { MAX_PLAYERS, type CharacterId, type LobbyPhase } from './lobby.js';

// schema() conserva el seguimiento de cambios con TypeScript, tsx y Vite sin
// depender de decoradores ni de useDefineForClassFields.
export const PlayerState = schema({
  sessionId: t.string().default(''),
  name: t.string().default(''),
  characterId: t.string<CharacterId | ''>().default(''),
  connected: t.boolean().default(true),
  departed: t.boolean().default(false),
}, 'PlayerState');
export type PlayerState = SchemaType<typeof PlayerState>;

export const LobbyState = schema({
  phase: t.string<LobbyPhase>().default('waiting'),
  maxPlayers: t.uint8().default(MAX_PLAYERS),
  selectionRemainingMs: t.uint32().default(0),
  countdownRemainingMs: t.uint32().default(0),
  players: t.map(PlayerState),
}, 'LobbyState');
export type LobbyState = SchemaType<typeof LobbyState>;
