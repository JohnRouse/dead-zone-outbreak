-- DISEÑO PARA REVISIÓN: no se aplica ni se conecta automáticamente en esta fase.
-- PostgreSQL 14+. El validador autoritativo y los roles de acceso quedan pendientes.
BEGIN;
CREATE SCHEMA dead_zone;
SET LOCAL search_path TO dead_zone, public;

CREATE TABLE players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_provider text NOT NULL,
  auth_subject text NOT NULL,
  display_name varchar(24) NOT NULL CHECK (length(trim(display_name)) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (auth_provider, auth_subject)
);

CREATE TABLE teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(48) NOT NULL CHECK (length(trim(name)) > 0),
  created_by uuid NOT NULL REFERENCES players(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE team_members (
  team_id uuid NOT NULL REFERENCES teams(id),
  player_id uuid NOT NULL REFERENCES players(id),
  slot smallint NOT NULL CHECK (slot BETWEEN 1 AND 4),
  role text NOT NULL CHECK (role IN ('captain', 'member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, player_id),
  UNIQUE (team_id, slot),
  UNIQUE (player_id) -- política inicial: un equipo activo por persona
);
CREATE UNIQUE INDEX one_captain_per_team ON team_members(team_id) WHERE role = 'captain';
-- Una transacción con bloqueo del equipo garantiza al menos un capitán y evita
-- perderlo durante un cambio. El índice anterior garantiza como máximo uno.

CREATE TABLE chapters (
  id text PRIMARY KEY,
  name text NOT NULL,
  content_version text NOT NULL
);
CREATE TABLE runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id text NOT NULL REFERENCES chapters(id),
  content_version text NOT NULL,
  ruleset_version text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('normal', 'hard', 'nightmare')),
  group_size smallint NOT NULL CHECK (group_size BETWEEN 1 AND 4),
  mode text NOT NULL CHECK (mode IN ('cooperative', 'time_attack')),
  team_id uuid REFERENCES teams(id),
  server_instance text NOT NULL,
  status text NOT NULL CHECK (status IN ('playing', 'validating', 'validated', 'rejected', 'aborted')),
  started_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE run_participants (
  run_id uuid NOT NULL REFERENCES runs(id),
  player_id uuid NOT NULL REFERENCES players(id),
  slot smallint NOT NULL CHECK (slot BETWEEN 1 AND 4),
  character_id text NOT NULL CHECK (character_id IN ('soldier', 'medic', 'mechanic', 'scout')),
  participation_status text NOT NULL CHECK (participation_status IN ('active', 'completed', 'abandoned', 'disconnected')),
  PRIMARY KEY (run_id, player_id),
  UNIQUE (run_id, slot),
  UNIQUE (run_id, character_id)
);
CREATE INDEX participant_history ON run_participants(player_id, run_id);

CREATE TABLE verified_results (
  run_id uuid PRIMARY KEY REFERENCES runs(id), -- idempotencia: un resultado por partida
  duration_ms bigint NOT NULL CHECK (duration_ms > 0),
  finished_at timestamptz NOT NULL,
  verified_at timestamptz NOT NULL DEFAULT now(),
  validator_version text NOT NULL,
  evidence_digest text NOT NULL CHECK (evidence_digest ~ '^[0-9a-f]{64}$'),
  summary jsonb NOT NULL CHECK (jsonb_typeof(summary) = 'object')
);
CREATE INDEX ranking_category ON runs(chapter_id, content_version, ruleset_version, difficulty, group_size, mode)
  WHERE status = 'validated';
CREATE INDEX team_history ON runs(team_id) WHERE team_id IS NOT NULL;
CREATE INDEX result_time ON verified_results(duration_ms, verified_at, run_id);

-- El servicio debe congelar roster, tamaño, versión y afiliación al empezar.
-- Debe validar objetivos, abandono, cantidad de participantes y duración con su
-- reloj monotónico antes de escribir resultados. No se confía en JSON del cliente.
CREATE VIEW individual_best_times AS
SELECT * FROM (
  SELECT p.player_id, r.chapter_id, r.content_version, r.ruleset_version,
         r.difficulty, r.group_size, r.mode, v.run_id, v.duration_ms, v.verified_at,
         row_number() OVER (
           PARTITION BY p.player_id, r.chapter_id, r.content_version, r.ruleset_version,
                        r.difficulty, r.group_size, r.mode
           ORDER BY v.duration_ms, v.verified_at, v.run_id
         ) AS best_order
  FROM runs r JOIN verified_results v ON v.run_id = r.id
  JOIN run_participants p ON p.run_id = r.id
  WHERE r.status = 'validated' AND p.participation_status = 'completed'
) candidates WHERE best_order = 1;

CREATE VIEW team_best_times AS
SELECT * FROM (
  SELECT r.team_id, r.chapter_id, r.content_version, r.ruleset_version,
         r.difficulty, r.group_size, r.mode, v.run_id, v.duration_ms, v.verified_at,
         row_number() OVER (
           PARTITION BY r.team_id, r.chapter_id, r.content_version, r.ruleset_version,
                        r.difficulty, r.group_size, r.mode
           ORDER BY v.duration_ms, v.verified_at, v.run_id
         ) AS best_order
  FROM runs r JOIN verified_results v ON v.run_id = r.id
  WHERE r.status = 'validated' AND r.team_id IS NOT NULL
) candidates WHERE best_order = 1;

-- La API ordenará por duration_ms, verified_at y run_id tras filtrar categoría.
-- Asignar permisos SELECT sobre vistas y escritura solo al servicio verificador
-- en una migración de despliegue con roles concretos (no existentes aún).
REVOKE ALL ON ALL TABLES IN SCHEMA dead_zone FROM PUBLIC;
COMMIT;
