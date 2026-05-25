-- ============================================================
--  03_proyectos.sql — Carga de 67 proyectos (convertido de MSSQL)
--  MATEC NRD · Ejecutar DESPUÉS de 01_schema.sql y 02_seed_base.sql
--  Ejecutar en: Supabase → SQL Editor → New Query
-- ============================================================

DO $$
DECLARE
  hw_siemens  INTEGER;
  hw_rockwell INTEGER;
  hw_generico INTEGER;
  subfase_inicio INTEGER;
BEGIN
  -- Resolver IDs de hardware
  SELECT id INTO hw_siemens  FROM hardware_tipos WHERE fabricante ILIKE '%Siemens%'  ORDER BY id LIMIT 1;
  SELECT id INTO hw_rockwell FROM hardware_tipos WHERE fabricante ILIKE '%Rockwell%' ORDER BY id LIMIT 1;
  SELECT id INTO hw_generico FROM hardware_tipos ORDER BY id LIMIT 1;

  -- Primera subfase del flujo
  SELECT s.id INTO subfase_inicio
  FROM subfases s
  JOIN fases f ON f.id = s.fase_id
  ORDER BY f.numero ASC, s.orden ASC
  LIMIT 1;

  IF hw_siemens IS NULL OR hw_rockwell IS NULL THEN
    RAISE EXCEPTION 'No se encontraron hardware_tipos Siemens/Rockwell. Verifica la tabla hardware_tipos.';
  END IF;

  INSERT INTO proyectos (nombre, hardware_tipo_id, subfase_actual_id, estado, fecha_inicio, fecha_objetivo, creado_en, actualizado_en)
  VALUES
    ('CREACIÓN DE LIBRERÍA DE BLOQUES (ESTÁNDAR Y DE REUSO)', hw_generico, subfase_inicio, 'completado', NOW(), NULL, NOW(), NOW()),
    ('PILOTO METODOLOGÍA MAQUETA IA - AEROPUERTOS', hw_generico, subfase_inicio, 'activo', '2026-01-26', '2026-02-13', NOW(), NOW()),
    ('PILOTO METODOLOGÍA MAQUETA IA - LOGÍSTICA', hw_generico, subfase_inicio, 'activo', '2026-01-26', '2026-02-13', NOW(), NOW()),
    ('DESARROLLO BLOQUE BANDA BASCULA (SIEMENS)', hw_siemens, subfase_inicio, 'activo', '2026-02-16', '2026-02-20', NOW(), NOW()),
    ('DESARROLLO BLOQUE BANDA BASCULA (ROCKWELL)', hw_rockwell, subfase_inicio, 'activo', '2026-02-23', '2026-02-27', NOW(), NOW()),
    ('DESARROLLO BLOQUE ESTANDAR MERGE (SIEMENS)', hw_siemens, subfase_inicio, 'activo', '2026-02-16', '2026-02-20', NOW(), NOW()),
    ('DESARROLLO BLOQUE ESTANDAR MERGE (ROCKWELL)', hw_rockwell, subfase_inicio, 'activo', '2026-02-23', '2026-02-27', NOW(), NOW()),
    ('DESARROLLO DE BLOQUE INTEGRACIÓN CON EDS SEGÚN TUBERÍA (SIEMENS)', hw_siemens, subfase_inicio, 'activo', '2026-03-02', '2026-03-13', NOW(), NOW()),
    ('DESARROLLO DE BLOQUE INTEGRACIÓN CON EDS SEGÚN TUBERÍA (ROCKWELL)', hw_rockwell, subfase_inicio, 'activo', '2026-03-16', '2026-03-20', NOW(), NOW()),
    ('DESARROLLO BLOQUE DE CONTROL MDR (SIEMENS)', hw_siemens, subfase_inicio, 'activo', '2026-03-23', '2026-03-27', NOW(), NOW()),
    ('DESARROLLO BLOQUE DE CONTROL MDR (ROCKWELL)', hw_rockwell, subfase_inicio, 'activo', '2026-03-30', '2026-04-03', NOW(), NOW()),
    ('DESARROLLOD DE BLOQUE DE CONTROL PARA CONVEYOR CADENCIADOR (SIEMENS)', hw_siemens, subfase_inicio, 'activo', '2026-03-23', '2026-03-27', NOW(), NOW()),
    ('DESARROLLOD DE BLOQUE DE CONTROL PARA CONVEYOR CADENCIADOR (ROCKWELL)', hw_rockwell, subfase_inicio, 'activo', '2026-03-30', '2026-04-03', NOW(), NOW()),
    ('DESARROLLO BLOQUE SORTER PARA QUIMAROX (OBJETIVO) TRANSVERSAL A OTROS SORTERS (SIEMENS)', hw_siemens, subfase_inicio, 'activo', '2026-04-06', '2026-04-17', NOW(), NOW()),
    ('DESARROLLO BLOQUE SORTER PARA QUIMAROX (OBJETIVO) TRANSVERSAL A OTROS SORTERS (ROCKWELL)', hw_rockwell, subfase_inicio, 'activo', '2026-04-20', '2026-04-24', NOW(), NOW()),
    ('DESARROLLO DE BLOQUE DE CONTROL DESVIADOR HORIZONTAL (SIEMENS)', hw_siemens, subfase_inicio, 'activo', '2026-04-06', '2026-04-10', NOW(), NOW()),
    ('DESARROLLO DE BLOQUE DE CONTROL DESVIADOR HORIZONTAL (ROCKWELL)', hw_rockwell, subfase_inicio, 'activo', '2026-04-13', '2026-04-17', NOW(), NOW()),
    ('DESARROLLO DE BLOQUE DE CONTROL DESVIADOR VERTICAL (SIEMENS)', hw_siemens, subfase_inicio, 'activo', '2026-04-27', '2026-05-01', NOW(), NOW()),
    ('DESARROLLO DE BLOQUE DE CONTROL DESVIADOR VERTICAL (ROCKWELL)', hw_rockwell, subfase_inicio, 'activo', '2026-05-04', '2026-05-08', NOW(), NOW()),
    ('DESARROLLO DE BLOQUE DE CONTROL CARRUSEL CARGA INDIVIDUAL (SIEMENS)', hw_siemens, subfase_inicio, 'activo', '2026-04-20', '2026-04-24', NOW(), NOW()),
    ('DESARROLLO DE BLOQUE DE CONTROL CARRUSEL CARGA INDIVIDUAL (ROCKWELL)', hw_rockwell, subfase_inicio, 'activo', '2026-04-27', '2026-05-01', NOW(), NOW()),
    ('DESARROLLO BLOQUE DE CONTROL CARRUSEL LOAD SHARING (SIEMENS)', hw_siemens, subfase_inicio, 'pendiente', '2026-05-11', '2026-05-15', NOW(), NOW()),
    ('DESARROLLO BLOQUE DE CONTROL CARRUSEL LOAD SHARING (ROCKWELL)', hw_rockwell, subfase_inicio, 'pendiente', '2026-05-18', '2026-05-22', NOW(), NOW()),
    ('DESARROLLO BLOQUE COMUNICACIONES FIM (A HLC) (SIEMENS)', hw_siemens, subfase_inicio, 'activo', '2026-05-04', '2026-05-08', NOW(), NOW()),
    ('DESARROLLO BLOQUE COMUNICACIONES FIM (A HLC) (ROCKWELL)', hw_rockwell, subfase_inicio, 'pendiente', '2026-05-11', '2026-05-15', NOW(), NOW()),
    ('DESARROLLO BLOQUE COMUNICACIONES BSM (A HLC) (SIEMENS)', hw_siemens, subfase_inicio, 'pendiente', '2026-05-25', '2026-05-29', NOW(), NOW()),
    ('DESARROLLO BLOQUE COMUNICACIONES BSM (A HLC) (ROCKWELL)', hw_rockwell, subfase_inicio, 'pendiente', '2026-06-01', '2026-06-05', NOW(), NOW()),
    ('DESARROLLO BLOQUE COMUNICACIONES ATR (A HLC) (SIEMENS)', hw_siemens, subfase_inicio, 'pendiente', '2026-05-18', '2026-05-22', NOW(), NOW()),
    ('DESARROLLO BLOQUE COMUNICACIONES ATR (A HLC) (ROCKWELL)', hw_rockwell, subfase_inicio, 'pendiente', '2026-05-25', '2026-05-29', NOW(), NOW()),
    ('DESARROLLO BLOQUE COMUNICACIONES EDS (A HLC) (SIEMENS)', hw_siemens, subfase_inicio, 'pendiente', '2026-06-08', '2026-06-12', NOW(), NOW()),
    ('DESARROLLO BLOQUE COMUNICACIONES EDS (A HLC) (ROCKWELL)', hw_rockwell, subfase_inicio, 'pendiente', '2026-06-15', '2026-06-19', NOW(), NOW()),
    ('DESARROLLO BLOQUE COMUNICACIONES TRACKING (A HLC) (SIEMENS)', hw_siemens, subfase_inicio, 'pendiente', '2026-06-01', '2026-06-05', NOW(), NOW()),
    ('DESARROLLO BLOQUE COMUNICACIONES TRACKING (A HLC) (ROCKWELL)', hw_rockwell, subfase_inicio, 'pendiente', '2026-06-08', '2026-06-12', NOW(), NOW()),
    ('DESARROLLO BLOQUE COMUNICACIONES CHUTES (A HLC) (SIEMENS)', hw_siemens, subfase_inicio, 'pendiente', '2026-06-22', '2026-06-26', NOW(), NOW()),
    ('DESARROLLO BLOQUE COMUNICACIONES CHUTES (A HLC) (ROCKWELL)', hw_rockwell, subfase_inicio, 'pendiente', '2026-06-29', '2026-07-03', NOW(), NOW()),
    ('DESARROLLO BLOQUE COMUNICACIONES BSD (DESDE HLC) (SIEMENS)', hw_siemens, subfase_inicio, 'pendiente', '2026-06-15', '2026-06-19', NOW(), NOW()),
    ('DESARROLLO BLOQUE COMUNICACIONES BSD (DESDE HLC) (ROCKWELL)', hw_rockwell, subfase_inicio, 'pendiente', '2026-06-22', '2026-06-26', NOW(), NOW()),
    ('DESARROLLO BLOQUE COMUNICACIONES MES (DESDE HLC) (SIEMENS)', hw_siemens, subfase_inicio, 'pendiente', '2026-07-06', '2026-07-10', NOW(), NOW()),
    ('DESARROLLO BLOQUE COMUNICACIONES MES (DESDE HLC) (ROCKWELL)', hw_rockwell, subfase_inicio, 'pendiente', '2026-07-13', '2026-07-17', NOW(), NOW()),
    ('DESARROLLO BLOQUE COMUNICACIONES KEEP ALIVE (A HLC) (SIEMENS)', hw_siemens, subfase_inicio, 'pendiente', '2026-06-29', '2026-07-03', NOW(), NOW()),
    ('DESARROLLO BLOQUE COMUNICACIONES KEEP ALIVE (A HLC) (ROCKWELL)', hw_rockwell, subfase_inicio, 'pendiente', '2026-07-06', '2026-07-10', NOW(), NOW()),
    ('DESARROLLO BLOQUE COMUNICACIONES ALARMAS (A HLC) (SIEMENS)', hw_siemens, subfase_inicio, 'pendiente', '2026-07-20', '2026-07-24', NOW(), NOW()),
    ('DESARROLLO BLOQUE COMUNICACIONES ALARMAS (A HLC) (ROCKWELL)', hw_rockwell, subfase_inicio, 'pendiente', '2026-07-27', '2026-07-31', NOW(), NOW()),
    ('DESARROLLO BLOQUE PARC CERO PRESION (SIEMENS)', hw_siemens, subfase_inicio, 'pendiente', '2026-07-13', '2026-07-17', NOW(), NOW()),
    ('DESARROLLO BLOQUE PARC CERO PRESION (ROCKWELL)', hw_rockwell, subfase_inicio, 'pendiente', '2026-07-20', '2026-07-24', NOW(), NOW()),
    ('DESARROLLO BLOQUE PARC SEPARACION GARANTIZADA (SIEMENS)', hw_siemens, subfase_inicio, 'pendiente', '2026-08-03', '2026-08-07', NOW(), NOW()),
    ('DESARROLLO BLOQUE PARC SEPARACION GARANTIZADA (ROCKWELL)', hw_rockwell, subfase_inicio, 'pendiente', '2026-08-10', '2026-08-14', NOW(), NOW()),
    ('DESARROLLO BLOQUE TORNAMESA (SIEMENS)', hw_siemens, subfase_inicio, 'pendiente', '2026-07-27', '2026-08-07', NOW(), NOW()),
    ('DESARROLLO BLOQUE TORNAMESA (ROCKWELL)', hw_rockwell, subfase_inicio, 'pendiente', '2026-08-03', '2026-08-14', NOW(), NOW()),
    ('DESARROLLO BLOQUE CENTRADOR (SIEMENS)', hw_siemens, subfase_inicio, 'pendiente', '2026-08-17', '2026-08-21', NOW(), NOW()),
    ('DESARROLLO BLOQUE CENTRADOR (ROCKWELL)', hw_rockwell, subfase_inicio, 'pendiente', '2026-08-24', '2026-08-28', NOW(), NOW()),
    ('DESARROLLO BLOQUE ALINEADOR (SIEMENS)', hw_siemens, subfase_inicio, 'pendiente', '2026-08-17', '2026-08-21', NOW(), NOW()),
    ('DESARROLLO BLOQUE ALINEADOR (ROCKWELL)', hw_rockwell, subfase_inicio, 'pendiente', '2026-08-24', '2026-08-28', NOW(), NOW()),
    ('DESARROLLO BLOQUE FLEJADORA (SIEMENS)', hw_siemens, subfase_inicio, 'pendiente', '2026-08-31', '2026-09-11', NOW(), NOW()),
    ('DESARROLLO BLOQUE FLEJADORA (ROCKWELL)', hw_rockwell, subfase_inicio, 'pendiente', '2026-09-14', '2026-09-18', NOW(), NOW()),
    ('DESARROLLO BLOQUE INDEXADO 3 BANDAS (SIEMENS)', hw_siemens, subfase_inicio, 'pendiente', '2026-08-31', '2026-09-04', NOW(), NOW()),
    ('DESARROLLO BLOQUE INDEXADO 3 BANDAS (ROCKWELL)', hw_rockwell, subfase_inicio, 'pendiente', '2026-09-07', '2026-09-11', NOW(), NOW()),
    ('DESARROLLO BLOQUE INDEXADO 4 BANDAS (SIEMENS)', hw_siemens, subfase_inicio, 'pendiente', '2026-09-21', '2026-09-25', NOW(), NOW()),
    ('DESARROLLO BLOQUE INDEXADO 4 BANDAS (ROCKWELL)', hw_rockwell, subfase_inicio, 'pendiente', '2026-09-28', '2026-10-02', NOW(), NOW()),
    ('DESARROLLO BLOQUE TRANSFER (SIEMENS)', hw_siemens, subfase_inicio, 'pendiente', '2026-09-14', '2026-09-18', NOW(), NOW()),
    ('DESARROLLO BLOQUE TRANSFER (ROCKWELL)', hw_rockwell, subfase_inicio, 'pendiente', '2026-09-21', '2026-09-25', NOW(), NOW()),
    ('DESARROLLO BLOQUE INFEED (SIEMENS)', hw_siemens, subfase_inicio, 'pendiente', '2026-10-05', '2026-10-09', NOW(), NOW()),
    ('DESARROLLO BLOQUE INFEED (ROCKWELL)', hw_rockwell, subfase_inicio, 'pendiente', '2026-10-12', '2026-10-16', NOW(), NOW()),
    ('DESARROLLO BLOQUE OUTFEED (SIEMENS)', hw_siemens, subfase_inicio, 'pendiente', '2026-09-28', '2026-10-02', NOW(), NOW()),
    ('DESARROLLO BLOQUE OUTFEED (ROCKWELL)', hw_rockwell, subfase_inicio, 'pendiente', '2026-10-05', '2026-10-09', NOW(), NOW()),
    ('DESARROLLO BLOQUE MESA DE TIJERAS (SIEMENS)', hw_siemens, subfase_inicio, 'pendiente', '2026-10-19', '2026-10-23', NOW(), NOW()),
    ('DESARROLLO BLOQUE MESA DE TIJERAS (ROCKWELL)', hw_rockwell, subfase_inicio, 'pendiente', '2026-10-26', '2026-10-30', NOW(), NOW());

END $$;

-- Verificación
SELECT estado, COUNT(*) AS total FROM proyectos GROUP BY estado ORDER BY estado;
