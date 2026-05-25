-- ════════════════════════════════════════════════════════════════
-- CARGA MASIVA DE PROYECTOS — EstandarizacionAYC.xlsx
-- Generado: 2026-05-04  |  67 proyectos  |  DB: matec_nrd
-- ════════════════════════════════════════════════════════════════
USE [matec_nrd];
GO

-- ── 1. Resolver IDs de hardware por columna FABRICANTE ──────────────────────
-- Siemens  → 'TIA Portal S7-1500'   (fabricante = 'Siemens')
-- Rockwell → 'PowerFlex 525 / 755'  (fabricante = 'Rockwell')
DECLARE @HwSiemens  INT = (SELECT TOP 1 id FROM dbo.hardware_tipos WHERE fabricante LIKE '%Siemens%'  ORDER BY id);
DECLARE @HwRockwell INT = (SELECT TOP 1 id FROM dbo.hardware_tipos WHERE fabricante LIKE '%Rockwell%' ORDER BY id);
DECLARE @HwGenerico INT = (SELECT TOP 1 id FROM dbo.hardware_tipos ORDER BY id);

-- ── 2. Primera subfase del flujo (inicio del proceso) ──────────────────────
DECLARE @SubfaseInicio INT = (SELECT TOP 1 s.id FROM dbo.subfases s
                              JOIN dbo.fases f ON f.id = s.fase_id
                              ORDER BY f.numero ASC, s.orden ASC);

-- ── 3. Verificar que se resolvieron los hardware ────────────────────────────
IF @HwSiemens IS NULL OR @HwRockwell IS NULL
BEGIN
    RAISERROR('⚠ No se encontraron tipos de hardware Siemens/Rockwell. Verifica dbo.hardware_tipos.', 16, 1);
    RETURN;
END

-- ── 4. INSERT de los 67 proyectos ──────────────────────────────────────────
-- Estado: completado=1, activo=21, pendiente=45 (según fechas vs 2026-05-04)
INSERT INTO dbo.proyectos
    (nombre, hardware_tipo_id, subfase_actual_id, estado, fecha_inicio, fecha_objetivo, creado_en, actualizado_en)
VALUES
    (N'CREACIÓN DE LIBRERÍA DE BLOQUES (ESTÁNDAR Y DE REUSO)', @HwGenerico, @SubfaseInicio, 'completado', ISNULL(NULL, GETDATE()), NULL, GETDATE(), GETDATE()),
    (N'PILOTO METODOLOGÍA MAQUETA IA - AEROPUERTOS', @HwGenerico, @SubfaseInicio, 'activo', ISNULL('2026-01-26', GETDATE()), '2026-02-13', GETDATE(), GETDATE()),
    (N'PILOTO METODOLOGÍA MAQUETA IA - LOGÍSTICA', @HwGenerico, @SubfaseInicio, 'activo', ISNULL('2026-01-26', GETDATE()), '2026-02-13', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE BANDA BASCULA (SIEMENS)', @HwSiemens, @SubfaseInicio, 'activo', ISNULL('2026-02-16', GETDATE()), '2026-02-20', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE BANDA BASCULA (ROCKWELL)', @HwRockwell, @SubfaseInicio, 'activo', ISNULL('2026-02-23', GETDATE()), '2026-02-27', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE ESTANDAR MERGE (SIEMENS)', @HwSiemens, @SubfaseInicio, 'activo', ISNULL('2026-02-16', GETDATE()), '2026-02-20', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE ESTANDAR MERGE (ROCKWELL)', @HwRockwell, @SubfaseInicio, 'activo', ISNULL('2026-02-23', GETDATE()), '2026-02-27', GETDATE(), GETDATE()),
    (N'DESARROLLO DE BLOQUE INTEGRACIÓN CON EDS SEGÚN TUBERÍA (SIEMENS)', @HwSiemens, @SubfaseInicio, 'activo', ISNULL('2026-03-02', GETDATE()), '2026-03-13', GETDATE(), GETDATE()),
    (N'DESARROLLO DE BLOQUE INTEGRACIÓN CON EDS SEGÚN TUBERÍA (ROCKWELL)', @HwRockwell, @SubfaseInicio, 'activo', ISNULL('2026-03-16', GETDATE()), '2026-03-20', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE DE CONTROL MDR (SIEMENS)', @HwSiemens, @SubfaseInicio, 'activo', ISNULL('2026-03-23', GETDATE()), '2026-03-27', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE DE CONTROL MDR (ROCKWELL)', @HwRockwell, @SubfaseInicio, 'activo', ISNULL('2026-03-30', GETDATE()), '2026-04-03', GETDATE(), GETDATE()),
    (N'DESARROLLOD DE BLOQUE DE CONTROL PARA CONVEYOR CADENCIADOR (SIEMENS)', @HwSiemens, @SubfaseInicio, 'activo', ISNULL('2026-03-23', GETDATE()), '2026-03-27', GETDATE(), GETDATE()),
    (N'DESARROLLOD DE BLOQUE DE CONTROL PARA CONVEYOR CADENCIADOR (ROCKWELL)', @HwRockwell, @SubfaseInicio, 'activo', ISNULL('2026-03-30', GETDATE()), '2026-04-03', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE SORTER PARA QUIMAROX (OBJETIVO) TRANSVERSAL A OTROS SORTERS (SIEMENS)', @HwSiemens, @SubfaseInicio, 'activo', ISNULL('2026-04-06', GETDATE()), '2026-04-17', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE SORTER PARA QUIMAROX (OBJETIVO) TRANSVERSAL A OTROS SORTERS (ROCKWELL)', @HwRockwell, @SubfaseInicio, 'activo', ISNULL('2026-04-20', GETDATE()), '2026-04-24', GETDATE(), GETDATE()),
    (N'DESARROLLO DE BLOQUE DE CONTROL DESVIADOR HORIZONTAL (SIEMENS)', @HwSiemens, @SubfaseInicio, 'activo', ISNULL('2026-04-06', GETDATE()), '2026-04-10', GETDATE(), GETDATE()),
    (N'DESARROLLO DE BLOQUE DE CONTROL DESVIADOR HORIZONTAL (ROCKWELL)', @HwRockwell, @SubfaseInicio, 'activo', ISNULL('2026-04-13', GETDATE()), '2026-04-17', GETDATE(), GETDATE()),
    (N'DESARROLLO DE BLOQUE DE CONTROL DESVIADOR VERTICAL (SIEMENS)', @HwSiemens, @SubfaseInicio, 'activo', ISNULL('2026-04-27', GETDATE()), '2026-05-01', GETDATE(), GETDATE()),
    (N'DESARROLLO DE BLOQUE DE CONTROL DESVIADOR VERTICAL (ROCKWELL)', @HwRockwell, @SubfaseInicio, 'activo', ISNULL('2026-05-04', GETDATE()), '2026-05-08', GETDATE(), GETDATE()),
    (N'DESARROLLO DE BLOQUE DE CONTROL CARRUSEL CARGA INDIVIDUAL (SIEMENS)', @HwSiemens, @SubfaseInicio, 'activo', ISNULL('2026-04-20', GETDATE()), '2026-04-24', GETDATE(), GETDATE()),
    (N'DESARROLLO DE BLOQUE DE CONTROL CARRUSEL CARGA INDIVIDUAL (ROCKWELL)', @HwRockwell, @SubfaseInicio, 'activo', ISNULL('2026-04-27', GETDATE()), '2026-05-01', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE DE CONTROL CARRUSEL LOAD SHARING (SIEMENS)', @HwSiemens, @SubfaseInicio, 'pendiente', ISNULL('2026-05-11', GETDATE()), '2026-05-15', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE DE CONTROL CARRUSEL LOAD SHARING (ROCKWELL)', @HwRockwell, @SubfaseInicio, 'pendiente', ISNULL('2026-05-18', GETDATE()), '2026-05-22', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE COMUNICACIONES FIM (A HLC) (SIEMENS)', @HwSiemens, @SubfaseInicio, 'activo', ISNULL('2026-05-04', GETDATE()), '2026-05-08', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE COMUNICACIONES FIM (A HLC) (ROCKWELL)', @HwRockwell, @SubfaseInicio, 'pendiente', ISNULL('2026-05-11', GETDATE()), '2026-05-15', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE COMUNICACIONES BSM (A HLC) (SIEMENS)', @HwSiemens, @SubfaseInicio, 'pendiente', ISNULL('2026-05-25', GETDATE()), '2026-05-29', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE COMUNICACIONES BSM (A HLC) (ROCKWELL)', @HwRockwell, @SubfaseInicio, 'pendiente', ISNULL('2026-06-01', GETDATE()), '2026-06-05', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE COMUNICACIONES ATR (A HLC) (SIEMENS)', @HwSiemens, @SubfaseInicio, 'pendiente', ISNULL('2026-05-18', GETDATE()), '2026-05-22', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE COMUNICACIONES ATR (A HLC) (ROCKWELL)', @HwRockwell, @SubfaseInicio, 'pendiente', ISNULL('2026-05-25', GETDATE()), '2026-05-29', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE COMUNICACIONES EDS (A HLC) (SIEMENS)', @HwSiemens, @SubfaseInicio, 'pendiente', ISNULL('2026-06-08', GETDATE()), '2026-06-12', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE COMUNICACIONES EDS (A HLC) (ROCKWELL)', @HwRockwell, @SubfaseInicio, 'pendiente', ISNULL('2026-06-15', GETDATE()), '2026-06-19', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE COMUNICACIONES TRACKING (A HLC) (SIEMENS)', @HwSiemens, @SubfaseInicio, 'pendiente', ISNULL('2026-06-01', GETDATE()), '2026-06-05', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE COMUNICACIONES TRACKING (A HLC) (ROCKWELL)', @HwRockwell, @SubfaseInicio, 'pendiente', ISNULL('2026-06-08', GETDATE()), '2026-06-12', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE COMUNICACIONES CHUTES (A HLC) (SIEMENS)', @HwSiemens, @SubfaseInicio, 'pendiente', ISNULL('2026-06-22', GETDATE()), '2026-06-26', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE COMUNICACIONES CHUTES (A HLC) (ROCKWELL)', @HwRockwell, @SubfaseInicio, 'pendiente', ISNULL('2026-06-29', GETDATE()), '2026-07-03', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE COMUNICACIONES BSD (DESDE HLC) (SIEMENS)', @HwSiemens, @SubfaseInicio, 'pendiente', ISNULL('2026-06-15', GETDATE()), '2026-06-19', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE COMUNICACIONES BSD (DESDE HLC) (ROCKWELL)', @HwRockwell, @SubfaseInicio, 'pendiente', ISNULL('2026-06-22', GETDATE()), '2026-06-26', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE COMUNICACIONES MES (DESDE HLC) (SIEMENS)', @HwSiemens, @SubfaseInicio, 'pendiente', ISNULL('2026-07-06', GETDATE()), '2026-07-10', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE COMUNICACIONES MES (DESDE HLC) (ROCKWELL)', @HwRockwell, @SubfaseInicio, 'pendiente', ISNULL('2026-07-13', GETDATE()), '2026-07-17', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE COMUNICACIONES KEEP ALIVE (A HLC) (SIEMENS)', @HwSiemens, @SubfaseInicio, 'pendiente', ISNULL('2026-06-29', GETDATE()), '2026-07-03', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE COMUNICACIONES KEEP ALIVE (A HLC) (ROCKWELL)', @HwRockwell, @SubfaseInicio, 'pendiente', ISNULL('2026-07-06', GETDATE()), '2026-07-10', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE COMUNICACIONES ALARMAS (A HLC) (SIEMENS)', @HwSiemens, @SubfaseInicio, 'pendiente', ISNULL('2026-07-20', GETDATE()), '2026-07-24', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE COMUNICACIONES ALARMAS (A HLC) (ROCKWELL)', @HwRockwell, @SubfaseInicio, 'pendiente', ISNULL('2026-07-27', GETDATE()), '2026-07-31', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE PARC CERO PRESION (SIEMENS)', @HwSiemens, @SubfaseInicio, 'pendiente', ISNULL('2026-07-13', GETDATE()), '2026-07-17', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE PARC CERO PRESION (ROCKWELL)', @HwRockwell, @SubfaseInicio, 'pendiente', ISNULL('2026-07-20', GETDATE()), '2026-07-24', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE PARC SEPARACION GARANTIZADA (SIEMENS)', @HwSiemens, @SubfaseInicio, 'pendiente', ISNULL('2026-08-03', GETDATE()), '2026-08-07', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE PARC SEPARACION GARANTIZADA (ROCKWELL)', @HwRockwell, @SubfaseInicio, 'pendiente', ISNULL('2026-08-10', GETDATE()), '2026-08-14', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE TORNAMESA (SIEMENS)', @HwSiemens, @SubfaseInicio, 'pendiente', ISNULL('2026-07-27', GETDATE()), '2026-08-07', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE TORNAMESA (ROCKWELL)', @HwRockwell, @SubfaseInicio, 'pendiente', ISNULL('2026-08-03', GETDATE()), '2026-08-14', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE CENTRADOR (SIEMENS)', @HwSiemens, @SubfaseInicio, 'pendiente', ISNULL('2026-08-17', GETDATE()), '2026-08-21', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE CENTRADOR (ROCKWELL)', @HwRockwell, @SubfaseInicio, 'pendiente', ISNULL('2026-08-24', GETDATE()), '2026-08-28', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE ALINEADOR (SIEMENS)', @HwSiemens, @SubfaseInicio, 'pendiente', ISNULL('2026-08-17', GETDATE()), '2026-08-21', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE ALINEADOR (ROCKWELL)', @HwRockwell, @SubfaseInicio, 'pendiente', ISNULL('2026-08-24', GETDATE()), '2026-08-28', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE FLEJADORA (SIEMENS)', @HwSiemens, @SubfaseInicio, 'pendiente', ISNULL('2026-08-31', GETDATE()), '2026-09-11', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE FLEJADORA (ROCKWELL)', @HwRockwell, @SubfaseInicio, 'pendiente', ISNULL('2026-09-14', GETDATE()), '2026-09-18', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE INDEXADO 3 BANDAS (SIEMENS)', @HwSiemens, @SubfaseInicio, 'pendiente', ISNULL('2026-08-31', GETDATE()), '2026-09-04', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE INDEXADO 3 BANDAS (ROCKWELL)', @HwRockwell, @SubfaseInicio, 'pendiente', ISNULL('2026-09-07', GETDATE()), '2026-09-11', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE INDEXADO 4 BANDAS (SIEMENS)', @HwSiemens, @SubfaseInicio, 'pendiente', ISNULL('2026-09-21', GETDATE()), '2026-09-25', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE INDEXADO 4 BANDAS (ROCKWELL)', @HwRockwell, @SubfaseInicio, 'pendiente', ISNULL('2026-09-28', GETDATE()), '2026-10-02', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE TRANSFER (SIEMENS)', @HwSiemens, @SubfaseInicio, 'pendiente', ISNULL('2026-09-14', GETDATE()), '2026-09-18', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE TRANSFER (ROCKWELL)', @HwRockwell, @SubfaseInicio, 'pendiente', ISNULL('2026-09-21', GETDATE()), '2026-09-25', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE INFEED (SIEMENS)', @HwSiemens, @SubfaseInicio, 'pendiente', ISNULL('2026-10-05', GETDATE()), '2026-10-09', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE INFEED (ROCKWELL)', @HwRockwell, @SubfaseInicio, 'pendiente', ISNULL('2026-10-12', GETDATE()), '2026-10-16', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE OUTFEED (SIEMENS)', @HwSiemens, @SubfaseInicio, 'pendiente', ISNULL('2026-09-28', GETDATE()), '2026-10-02', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE OUTFEED (ROCKWELL)', @HwRockwell, @SubfaseInicio, 'pendiente', ISNULL('2026-10-05', GETDATE()), '2026-10-09', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE MESA DE TIJERAS (SIEMENS)', @HwSiemens, @SubfaseInicio, 'pendiente', ISNULL('2026-10-19', GETDATE()), '2026-10-23', GETDATE(), GETDATE()),
    (N'DESARROLLO BLOQUE MESA DE TIJERAS (ROCKWELL)', @HwRockwell, @SubfaseInicio, 'pendiente', ISNULL('2026-10-26', GETDATE()), '2026-10-30', GETDATE(), GETDATE());

-- ── 5. Resumen ─────────────────────────────────────────────────────────────
SELECT estado, COUNT(*) AS total FROM dbo.proyectos GROUP BY estado ORDER BY estado;
GO