-- ============================================================
--  01_schema.sql — Esquema PostgreSQL para Supabase
--  MATEC NRD · Dashboard de Estandarización
--  Ejecutar en: Supabase → SQL Editor → New Query
-- ============================================================

-- ── 1. TIPOS DE HARDWARE ────────────────────────────────────
CREATE TABLE IF NOT EXISTS hardware_tipos (
  id        SERIAL PRIMARY KEY,
  nombre    VARCHAR(100) NOT NULL,
  fabricante VARCHAR(100)
);

-- ── 2. FASES DEL FLUJO ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS fases (
  id          SERIAL PRIMARY KEY,
  numero      SMALLINT     NOT NULL UNIQUE,
  nombre      VARCHAR(100) NOT NULL,
  descripcion VARCHAR(255),
  color_hex   CHAR(7)      NOT NULL DEFAULT '#CCCCCC',
  emoji       VARCHAR(10)
);

-- ── 3. SUBFASES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subfases (
  id           SERIAL PRIMARY KEY,
  fase_id      INTEGER      NOT NULL REFERENCES fases(id) ON DELETE CASCADE,
  codigo       VARCHAR(10)  NOT NULL UNIQUE,
  nombre       VARCHAR(200) NOT NULL,
  es_decision  BOOLEAN      NOT NULL DEFAULT FALSE,
  es_correctivo BOOLEAN     NOT NULL DEFAULT FALSE,
  orden        SMALLINT     NOT NULL DEFAULT 99
);

-- ── 4. TRANSICIONES ENTRE SUBFASES ──────────────────────────
CREATE TABLE IF NOT EXISTS subfase_transiciones (
  id              SERIAL PRIMARY KEY,
  codigo_origen   VARCHAR(10)  NOT NULL,
  codigo_destino  VARCHAR(10)  NOT NULL,
  etiqueta        VARCHAR(100),
  tipo            VARCHAR(15)  NOT NULL DEFAULT 'normal',
  activo          BOOLEAN      NOT NULL DEFAULT TRUE
);

-- ── 5. USUARIOS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id        SERIAL PRIMARY KEY,
  nombre    VARCHAR(80)  NOT NULL,
  apellido  VARCHAR(80)  NOT NULL,
  email     VARCHAR(150) UNIQUE,
  rol       VARCHAR(20),
  area      VARCHAR(30),
  activo    BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── 6. PROYECTOS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS proyectos (
  id                SERIAL PRIMARY KEY,
  nombre            VARCHAR(200) NOT NULL,
  descripcion       TEXT,
  hardware_tipo_id  INTEGER      NOT NULL REFERENCES hardware_tipos(id),
  subfase_actual_id INTEGER               REFERENCES subfases(id),
  estado            VARCHAR(20)  NOT NULL DEFAULT 'activo'
                    CHECK (estado IN ('pendiente','activo','pausado','completado','archivado')),
  fecha_inicio      DATE         NOT NULL DEFAULT CURRENT_DATE,
  fecha_objetivo    DATE,
  completado_en     TIMESTAMPTZ,
  creado_en         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  actualizado_en    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── 7. HISTORIAL DE FASES ────────────────────────────────────
CREATE TABLE IF NOT EXISTS historial_fases (
  id                SERIAL PRIMARY KEY,
  proyecto_id       INTEGER      NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  subfase_desde_id  INTEGER               REFERENCES subfases(id),
  subfase_hasta_id  INTEGER               REFERENCES subfases(id),
  usuario_id        INTEGER               REFERENCES usuarios(id),
  accion            VARCHAR(20)  NOT NULL DEFAULT 'avanzó',
  comentario        VARCHAR(500),
  fecha             TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── ÍNDICES DE RENDIMIENTO ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_proyectos_estado       ON proyectos(estado);
CREATE INDEX IF NOT EXISTS idx_proyectos_hw           ON proyectos(hardware_tipo_id);
CREATE INDEX IF NOT EXISTS idx_historial_proyecto     ON historial_fases(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_transiciones_origen    ON subfase_transiciones(codigo_origen);
CREATE INDEX IF NOT EXISTS idx_subfases_fase          ON subfases(fase_id);
