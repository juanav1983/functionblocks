-- ============================================================
--  MATEC NRD — Esquema de Base de Datos
--  Motor: Microsoft SQL Server (T-SQL)
--  Versión: 1.0.0  |  Fecha: 2026-05-01
-- ============================================================
--  ORDEN DE CREACIÓN (respeta dependencias de FK):
--   1. hardware_tipos
--   2. fases
--   3. subfases
--   4. usuarios
--   5. proyectos
--   6. historial_fases
--   7. proyecto_responsables
--   8. no_conformidades
--   9. documentos
-- ============================================================

USE master;
GO

-- Crear la base de datos si no existe
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'matec_nrd')
BEGIN
    CREATE DATABASE matec_nrd
        COLLATE Modern_Spanish_CI_AS;
END
GO

USE matec_nrd;
GO

-- ============================================================
-- 1. HARDWARE_TIPOS  (catálogo de plataformas PLC)
-- ============================================================
IF OBJECT_ID('dbo.hardware_tipos', 'U') IS NULL
CREATE TABLE dbo.hardware_tipos (
    id          INT           IDENTITY(1,1) PRIMARY KEY,
    nombre      NVARCHAR(100) NOT NULL,
    fabricante  NVARCHAR(50)  NOT NULL,
    descripcion NVARCHAR(255) NULL,
    activo      BIT           NOT NULL DEFAULT 1
);
GO

-- ============================================================
-- 2. FASES  (las 5 etapas del proceso de estandarización)
-- ============================================================
IF OBJECT_ID('dbo.fases', 'U') IS NULL
CREATE TABLE dbo.fases (
    id          INT           IDENTITY(1,1) PRIMARY KEY,
    numero      TINYINT       NOT NULL UNIQUE CHECK (numero BETWEEN 1 AND 5),
    nombre      NVARCHAR(100) NOT NULL,
    descripcion NVARCHAR(255) NULL,
    color_hex   CHAR(7)       NOT NULL DEFAULT '#CCCCCC'  -- ej. '#1565C0'
);
GO

-- ============================================================
-- 3. SUBFASES  (nodos del diagrama de flujo dentro de cada fase)
-- ============================================================
IF OBJECT_ID('dbo.subfases', 'U') IS NULL
CREATE TABLE dbo.subfases (
    id          INT           IDENTITY(1,1) PRIMARY KEY,
    fase_id     INT           NOT NULL REFERENCES dbo.fases(id),
    codigo      VARCHAR(3)    NOT NULL UNIQUE,  -- A1, B3, C4, D3, E2 …
    nombre      NVARCHAR(200) NOT NULL,
    es_decision BIT           NOT NULL DEFAULT 0,  -- 1 = gate ◇
    orden       TINYINT       NOT NULL              -- posición dentro de la fase
);
GO

-- ============================================================
-- 4. USUARIOS
-- ============================================================
IF OBJECT_ID('dbo.usuarios', 'U') IS NULL
CREATE TABLE dbo.usuarios (
    id        INT           IDENTITY(1,1) PRIMARY KEY,
    nombre    NVARCHAR(80)  NOT NULL,
    apellido  NVARCHAR(80)  NOT NULL,
    email     NVARCHAR(150) NOT NULL UNIQUE,
    rol       NVARCHAR(20)  NOT NULL
                CHECK (rol IN ('ingeniero','supervisor','calidad','admin')),
    area      NVARCHAR(30)  NOT NULL
                CHECK (area IN ('AYC','Mecanica','Estandarizacion','Calidad')),
    activo    BIT           NOT NULL DEFAULT 1,
    creado_en DATETIME2     NOT NULL DEFAULT GETDATE()
);
GO

-- ============================================================
-- 5. PROYECTOS
-- ============================================================
IF OBJECT_ID('dbo.proyectos', 'U') IS NULL
CREATE TABLE dbo.proyectos (
    id                INT           IDENTITY(1,1) PRIMARY KEY,
    nombre            NVARCHAR(200) NOT NULL,
    descripcion       NVARCHAR(MAX) NULL,
    hardware_tipo_id  INT           NOT NULL REFERENCES dbo.hardware_tipos(id),
    subfase_actual_id INT           NULL     REFERENCES dbo.subfases(id),
    estado            NVARCHAR(20)  NOT NULL DEFAULT 'activo'
                        CHECK (estado IN ('activo','pausado','completado','archivado')),
    fecha_inicio      DATE          NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    fecha_objetivo    DATE          NULL,
    lider_id          INT           NULL     REFERENCES dbo.usuarios(id),
    creado_en         DATETIME2     NOT NULL DEFAULT GETDATE(),
    actualizado_en    DATETIME2     NOT NULL DEFAULT GETDATE()
);
GO

-- Trigger para actualizar 'actualizado_en' automáticamente
IF OBJECT_ID('dbo.trg_proyectos_update', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_proyectos_update;
GO
CREATE TRIGGER dbo.trg_proyectos_update
ON dbo.proyectos
AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.proyectos
    SET    actualizado_en = GETDATE()
    FROM   dbo.proyectos p
    INNER JOIN inserted i ON p.id = i.id;
END;
GO

-- ============================================================
-- 6. HISTORIAL_FASES  (auditoría de movimientos entre subfases)
-- ============================================================
IF OBJECT_ID('dbo.historial_fases', 'U') IS NULL
CREATE TABLE dbo.historial_fases (
    id               INT            IDENTITY(1,1) PRIMARY KEY,
    proyecto_id      INT            NOT NULL REFERENCES dbo.proyectos(id),
    subfase_desde_id INT            NULL     REFERENCES dbo.subfases(id),  -- NULL = inicio
    subfase_hasta_id INT            NOT NULL REFERENCES dbo.subfases(id),
    usuario_id       INT            NOT NULL REFERENCES dbo.usuarios(id),
    accion           NVARCHAR(20)   NOT NULL
                       CHECK (accion IN ('avanzó','retrocedió','bloqueó','inició','completó')),
    comentario       NVARCHAR(500)  NULL,
    fecha            DATETIME2      NOT NULL DEFAULT GETDATE()
);
GO

-- ============================================================
-- 7. PROYECTO_RESPONSABLES  (N:M proyectos ↔ usuarios)
-- ============================================================
IF OBJECT_ID('dbo.proyecto_responsables', 'U') IS NULL
CREATE TABLE dbo.proyecto_responsables (
    id                INT          IDENTITY(1,1) PRIMARY KEY,
    proyecto_id       INT          NOT NULL REFERENCES dbo.proyectos(id),
    usuario_id        INT          NOT NULL REFERENCES dbo.usuarios(id),
    rol_en_proyecto   NVARCHAR(20) NOT NULL
                        CHECK (rol_en_proyecto IN ('lider','revisor','ejecutor')),
    fecha_asignacion  DATE         NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    CONSTRAINT uq_proyecto_usuario UNIQUE (proyecto_id, usuario_id)
);
GO

-- ============================================================
-- 8. NO_CONFORMIDADES  (CAR / CAPA)
-- ============================================================
IF OBJECT_ID('dbo.no_conformidades', 'U') IS NULL
CREATE TABLE dbo.no_conformidades (
    id               INT           IDENTITY(1,1) PRIMARY KEY,
    proyecto_id      INT           NOT NULL REFERENCES dbo.proyectos(id),
    subfase_id       INT           NOT NULL REFERENCES dbo.subfases(id),   -- gate donde falló
    codigo           VARCHAR(20)   NOT NULL UNIQUE,  -- CAR-001, CAPA-002 …
    tipo             CHAR(4)       NOT NULL CHECK (tipo IN ('CAR','CAPA')),
    descripcion      NVARCHAR(MAX) NOT NULL,
    causa_raiz       NVARCHAR(500) NULL,
    accion_correctiva NVARCHAR(MAX) NULL,
    responsable_id   INT           NULL REFERENCES dbo.usuarios(id),
    estado           NVARCHAR(20)  NOT NULL DEFAULT 'abierta'
                       CHECK (estado IN ('abierta','en_proceso','cerrada','verificada')),
    severidad        NVARCHAR(10)  NOT NULL DEFAULT 'media'
                       CHECK (severidad IN ('baja','media','alta','critica')),
    fecha_deteccion  DATE          NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    fecha_limite     DATE          NULL,
    fecha_cierre     DATE          NULL,
    creado_en        DATETIME2     NOT NULL DEFAULT GETDATE()
);
GO

-- ============================================================
-- 9. DOCUMENTOS  (adjuntos a proyectos, subfases o NCs)
-- ============================================================
IF OBJECT_ID('dbo.documentos', 'U') IS NULL
CREATE TABLE dbo.documentos (
    id                  INT           IDENTITY(1,1) PRIMARY KEY,
    proyecto_id         INT           NOT NULL REFERENCES dbo.proyectos(id),
    subfase_id          INT           NULL     REFERENCES dbo.subfases(id),
    no_conformidad_id   INT           NULL     REFERENCES dbo.no_conformidades(id),
    nombre              NVARCHAR(200) NOT NULL,
    tipo                NVARCHAR(20)  NOT NULL
                          CHECK (tipo IN ('especificacion','manual','evidencia','plano','video','otro')),
    ruta_archivo        NVARCHAR(500) NOT NULL,  -- ruta de red o URL
    version             VARCHAR(10)   NOT NULL DEFAULT 'v1.0',
    subido_por          INT           NULL REFERENCES dbo.usuarios(id),
    fecha_subida        DATETIME2     NOT NULL DEFAULT GETDATE()
);
GO

-- ============================================================
-- ÍNDICES RECOMENDADOS
-- ============================================================
CREATE NONCLUSTERED INDEX IX_proyectos_estado
    ON dbo.proyectos(estado) INCLUDE (nombre, subfase_actual_id);

CREATE NONCLUSTERED INDEX IX_historial_proyecto
    ON dbo.historial_fases(proyecto_id, fecha DESC);

CREATE NONCLUSTERED INDEX IX_nc_proyecto
    ON dbo.no_conformidades(proyecto_id, estado);

CREATE NONCLUSTERED INDEX IX_docs_proyecto
    ON dbo.documentos(proyecto_id);
GO

-- ============================================================
-- DATOS SEMILLA — CATÁLOGOS
-- ============================================================

-- Hardware
INSERT INTO dbo.hardware_tipos (nombre, fabricante, descripcion) VALUES
    ('TIA Portal S7-1500',        'Siemens', 'PLC serie S7-1500 programado con TIA Portal V18+'),
    ('CM CAN 6ES7 137-6EA00',     'Siemens', 'Módulo de comunicación CAN para ET200SP'),
    ('PowerFlex 525 / 755',       'Rockwell', 'Variadores de frecuencia Allen-Bradley serie PowerFlex'),
    ('FC/VLT AQUA Drive',         'Danfoss',  'Variadores de frecuencia serie FC/VLT para bombas'),
    ('NORD NORDAC FLEX SK 200E',  'NORD',     'Variador NORD con comunicación PROFINET/Modbus');
GO

-- Fases
INSERT INTO dbo.fases (numero, nombre, descripcion, color_hex) VALUES
    (1, 'Levantamiento de Requerimientos', 'Identificación, análisis y aprobación del caso de uso del FB', '#1565C0'),
    (2, 'Desarrollo en IDE',               'Creación, programación y peer-review del FB en TIA Portal',    '#2E7D32'),
    (3, 'Pruebas y Simulación',            'Pruebas unitarias, de integración y hardware-in-loop',         '#E65100'),
    (4, 'Validación y Calidad',            'FAT y revisión ISO 9001:2015',                                 '#B71C1C'),
    (5, 'Documentación y Publicación',     'Manual, control de versiones y publicación en biblioteca',     '#6A1B9A');
GO

-- Subfases (todos los nodos del diagrama de flujo)
INSERT INTO dbo.subfases (fase_id, codigo, nombre, es_decision, orden) VALUES
-- Fase 1
(1, 'A1', 'Identificar necesidad y caso de uso del FB',              0, 1),
(1, 'A2', 'Revisar estándares MATEC e IEC 61131-3',                  0, 2),
(1, 'A3', 'Reunión multidisciplinaria AYC · Mecánica · Estandarización', 0, 3),
(1, 'A4', 'Redactar Especificación Funcional (IN/OUT/Parámetros)',   0, 4),
(1, 'A5', '¿Especificación aprobada?',                               1, 5),  -- gate ◇
-- Fase 2
(2, 'B1', 'Crear estructura FB en TIA Portal S7-1500',               0, 1),
(2, 'B2', 'Definir variables IN · OUT · InOut · Static · Temp',      0, 2),
(2, 'B3', 'Programar lógica SCL / LAD / FBD',                        0, 3),
(2, 'B4', 'Documentar código inline y agregar comentarios',          0, 4),
(2, 'B5', '¿Pasa peer review y revisión de código?',                 1, 5),  -- gate ◇
-- Fase 3
(3, 'C1', 'Prueba unitaria en PLCSIM Advanced',                      0, 1),
(3, 'C2', 'Prueba de integración con FBs relacionados',              0, 2),
(3, 'C3', 'Hardware-in-loop con señales reales',                     0, 3),
(3, 'C4', '¿Supera todas las pruebas?',                              1, 4),  -- gate ◇
(3, 'C5', 'Registrar No Conformidad y plan de corrección',           0, 5),
-- Fase 4
(4, 'D1', 'FAT — Factory Acceptance Test',                           0, 1),
(4, 'D2', 'Revisión por Gestión de Calidad ISO 9001:2015',           0, 2),
(4, 'D3', '¿Aprobado por Calidad?',                                  1, 3),  -- gate ◇
(4, 'D4', 'Emitir Acción Correctiva CAR/CAPA',                       0, 4),
-- Fase 5
(5, 'E1', 'Generar Manual del FB (versión y changelog)',             0, 1),
(5, 'E2', 'Actualizar Biblioteca de Bloques Estándar MATEC',         0, 2),
(5, 'E3', 'Control de versiones Git / TIA Portal',                   0, 3),
(5, 'E4', 'Publicar en repositorio y notificar al equipo',           0, 4),
(5, 'E5', 'Capacitación técnica al equipo de ingeniería',            0, 5);
GO

-- Datos de prueba — Proyectos (equivalentes a los actuales hardcodeados)
INSERT INTO dbo.proyectos (nombre, hardware_tipo_id, subfase_actual_id, estado, lider_id) VALUES
    ('Bloque Cadenciador SIEMENS', 1,
        (SELECT id FROM dbo.subfases WHERE codigo = 'B3'), 'activo', NULL),
    ('Bloque QIMAROX ROCKWELL',    3,
        (SELECT id FROM dbo.subfases WHERE codigo = 'C2'), 'activo', NULL),
    ('COMUNICACIONES DANFOSS',     4,
        (SELECT id FROM dbo.subfases WHERE codigo = 'B3'), 'activo', NULL),
    ('Integración Variador NORD',  5,
        (SELECT id FROM dbo.subfases WHERE codigo = 'C2'), 'activo', NULL);
GO

-- ============================================================
-- VERIFICACIÓN RÁPIDA
-- ============================================================
SELECT
    p.id,
    p.nombre                          AS proyecto,
    ht.nombre                         AS hardware,
    f.numero                          AS num_fase,
    f.nombre                          AS fase,
    s.codigo                          AS subfase_codigo,
    s.nombre                          AS subfase_nombre
FROM dbo.proyectos p
JOIN dbo.hardware_tipos ht ON ht.id = p.hardware_tipo_id
JOIN dbo.subfases        s  ON  s.id = p.subfase_actual_id
JOIN dbo.fases           f  ON  f.id = s.fase_id
ORDER BY p.id;
GO
