-- ============================================================
--  MIGRACIÓN v1.1 — Transiciones entre subfases
--  Ejecutar sobre la BD matec_nrd ya creada con schema.sql
--  Motor: Microsoft SQL Server (T-SQL)
-- ============================================================
USE matec_nrd;
GO

-- ------------------------------------------------------------
-- 1. Agregar flag es_correctivo a subfases
--    (nodos de acción correctiva: C5 "Registrar NC", D4 "Emitir CAR/CAPA")
-- ------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.subfases') AND name = 'es_correctivo'
)
BEGIN
    ALTER TABLE dbo.subfases
    ADD es_correctivo BIT NOT NULL DEFAULT 0;
END
GO

-- Marcar los nodos correctivos existentes
UPDATE dbo.subfases SET es_correctivo = 1 WHERE codigo IN ('C5', 'D4');
GO

-- Agregar emoji de apoyo visual por fase (opcional, usado por el frontend)
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.fases') AND name = 'emoji'
)
BEGIN
    ALTER TABLE dbo.fases ADD emoji NVARCHAR(4) NULL;
END
GO

UPDATE dbo.fases SET emoji = N'📋' WHERE numero = 1;
UPDATE dbo.fases SET emoji = N'💻' WHERE numero = 2;
UPDATE dbo.fases SET emoji = N'🔬' WHERE numero = 3;
UPDATE dbo.fases SET emoji = N'✅' WHERE numero = 4;
UPDATE dbo.fases SET emoji = N'📄' WHERE numero = 5;
GO

-- ------------------------------------------------------------
-- 2. Tabla de transiciones (aristas del diagrama)
--    codigo_origen / codigo_destino usan los códigos de subfases
--    o los valores especiales 'START' y 'END'
-- ------------------------------------------------------------
IF OBJECT_ID('dbo.subfase_transiciones', 'U') IS NULL
CREATE TABLE dbo.subfase_transiciones (
    id              INT           IDENTITY(1,1) PRIMARY KEY,
    codigo_origen   VARCHAR(10)   NOT NULL,   -- código subfase o 'START'
    codigo_destino  VARCHAR(10)   NOT NULL,   -- código subfase o 'END'
    etiqueta        NVARCHAR(100) NULL,       -- texto sobre la flecha (NULL = sin etiqueta)
    tipo            VARCHAR(15)   NOT NULL DEFAULT 'normal'
                      CHECK (tipo IN ('normal','si','no','correctivo')),
    activo          BIT           NOT NULL DEFAULT 1
);
GO

-- Índice para consultas por nodo origen
CREATE NONCLUSTERED INDEX IX_transiciones_origen
    ON dbo.subfase_transiciones(codigo_origen)
    INCLUDE (codigo_destino, etiqueta, tipo);
GO

-- ------------------------------------------------------------
-- 3. Datos semilla — todas las transiciones del flujo actual
--    Agregar nuevas filas aquí para extender el diagrama
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM dbo.subfase_transiciones)
BEGIN
    INSERT INTO dbo.subfase_transiciones (codigo_origen, codigo_destino, etiqueta, tipo) VALUES
    -- ── Entrada al flujo ──────────────────────────────────────
    ('START', 'A1',   NULL,                          'normal'),

    -- ── FASE 1: Levantamiento de Requerimientos ───────────────
    ('A1',    'A2',   NULL,                          'normal'),
    ('A2',    'A3',   NULL,                          'normal'),
    ('A3',    'A4',   NULL,                          'normal'),
    ('A4',    'A5',   NULL,                          'normal'),
    ('A5',    'B1',   N'✓ Sí',                       'si'),
    ('A5',    'A4',   N'✗ No — Revisar',             'no'),

    -- ── FASE 2: Desarrollo en IDE ─────────────────────────────
    ('B1',    'B2',   NULL,                          'normal'),
    ('B2',    'B3',   NULL,                          'normal'),
    ('B3',    'B4',   NULL,                          'normal'),
    ('B4',    'B5',   NULL,                          'normal'),
    ('B5',    'C1',   N'✓ Aprobado',                 'si'),
    ('B5',    'B3',   N'✗ Rechazado — Corregir',     'no'),

    -- ── FASE 3: Pruebas y Simulación ──────────────────────────
    ('C1',    'C2',   NULL,                          'normal'),
    ('C2',    'C3',   NULL,                          'normal'),
    ('C3',    'C4',   NULL,                          'normal'),
    ('C4',    'D1',   N'✓ Pasa todas',               'si'),
    ('C4',    'C5',   N'✗ Falla',                    'no'),
    ('C5',    'B3',   N'Corregir lógica',            'correctivo'),

    -- ── FASE 4: Validación y Calidad ──────────────────────────
    ('D1',    'D2',   NULL,                          'normal'),
    ('D2',    'D3',   NULL,                          'normal'),
    ('D3',    'E1',   N'✓ Aprobado',                 'si'),
    ('D3',    'D4',   N'✗ No conformidad',           'no'),
    ('D4',    'B1',   NULL,                          'correctivo'),

    -- ── FASE 5: Documentación y Publicación ───────────────────
    ('E1',    'E2',   NULL,                          'normal'),
    ('E2',    'E3',   NULL,                          'normal'),
    ('E3',    'E4',   NULL,                          'normal'),
    ('E4',    'E5',   NULL,                          'normal'),

    -- ── Fin del flujo ─────────────────────────────────────────
    ('E5',    'END',  NULL,                          'normal');
END
GO

-- ------------------------------------------------------------
-- VERIFICACIÓN
-- ------------------------------------------------------------
SELECT
    t.codigo_origen,
    t.etiqueta,
    t.codigo_destino,
    t.tipo
FROM dbo.subfase_transiciones t
WHERE t.activo = 1
ORDER BY t.id;
GO

PRINT '✅ Migración v1.1 aplicada correctamente.';
GO
