-- ============================================================
--  02_seed_base.sql — Datos base: hardware_tipos, fases, subfases
--  MATEC NRD · Ejecutar DESPUÉS de 01_schema.sql
--  Ejecutar en: Supabase → SQL Editor → New Query
-- ============================================================

-- ── HARDWARE TIPOS ───────────────────────────────────────────
-- Ajusta los nombres según los que tengas en tu SQL Server.
-- Puedes agregar más filas si tu BD tiene más tipos.
INSERT INTO hardware_tipos (nombre, fabricante) VALUES
  ('TIA Portal S7-1500',   'Siemens'),
  ('TIA Portal S7-300',    'Siemens'),
  ('PowerFlex 525 / 755',  'Rockwell'),
  ('Studio 5000',          'Rockwell'),
  ('Genérico / Otro',      NULL)
ON CONFLICT DO NOTHING;

-- ── FASES ────────────────────────────────────────────────────
-- IMPORTANTE: Si ya tienes fases configuradas en SQL Server,
-- expórtalas con el script de exportación en SETUP.md y
-- reemplaza estos valores por los tuyos exactos.
INSERT INTO fases (numero, nombre, descripcion, color_hex, emoji) VALUES
  (1, 'Análisis y Diseño',     'Revisión de requerimientos y diseño funcional',     '#1565C0', '📐'),
  (2, 'Desarrollo en IDE',     'Programación y configuración en el entorno de desarrollo', '#2E7D32', '💻'),
  (3, 'Pruebas internas',      'Simulación y pruebas en maqueta o banco de pruebas','#E65100', '🧪'),
  (4, 'Validación en sitio',   'Pruebas en campo con el cliente',                   '#B71C1C', '🏭'),
  (5, 'Cierre y entrega',      'Documentación final, entrega y aprobación',          '#6A1B9A', '📦')
ON CONFLICT (numero) DO NOTHING;

-- ── SUBFASES ─────────────────────────────────────────────────
-- IMPORTANTE: Exporta tus subfases reales desde SQL Server
-- usando el script en SETUP.md. Estos son valores de ejemplo.
-- Reemplaza con los datos exactos de tu BD.
INSERT INTO subfases (fase_id, codigo, nombre, es_decision, es_correctivo, orden)
SELECT f.id, s.codigo, s.nombre, s.es_decision, s.es_correctivo, s.orden
FROM fases f
JOIN (VALUES
  (1, 'A1', 'Recepción de requerimientos',      FALSE, FALSE, 1),
  (1, 'A2', 'Análisis funcional',                FALSE, FALSE, 2),
  (1, 'A3', 'Diseño de arquitectura',            FALSE, FALSE, 3),
  (1, 'A4', 'Revisión diseño',                   TRUE,  FALSE, 4),
  (2, 'B1', 'Configuración del entorno',         FALSE, FALSE, 1),
  (2, 'B2', 'Desarrollo del bloque',             FALSE, FALSE, 2),
  (2, 'B3', 'Prueba unitaria',                   FALSE, FALSE, 3),
  (2, 'B4', '¿Bloque aprobado?',                 TRUE,  FALSE, 4),
  (2, 'BC', 'Corrección de errores (dev)',       FALSE, TRUE,  5),
  (3, 'C1', 'Prueba en maqueta',                 FALSE, FALSE, 1),
  (3, 'C2', 'Prueba de integración',             FALSE, FALSE, 2),
  (3, 'C3', '¿Pruebas internas OK?',             TRUE,  FALSE, 3),
  (3, 'CC', 'Corrección post-prueba',            FALSE, TRUE,  4),
  (4, 'D1', 'Instalación en sitio',              FALSE, FALSE, 1),
  (4, 'D2', 'Prueba con cliente',                FALSE, FALSE, 2),
  (4, 'D3', '¿Validación aprobada?',             TRUE,  FALSE, 3),
  (4, 'DC', 'Corrección en sitio',               FALSE, TRUE,  4),
  (5, 'E1', 'Documentación técnica',             FALSE, FALSE, 1),
  (5, 'E2', 'Entrega formal',                    FALSE, FALSE, 2),
  (5, 'E3', 'Aprobación final',                  TRUE,  FALSE, 3)
) AS s(fase_num, codigo, nombre, es_decision, es_correctivo, orden)
ON f.numero = s.fase_num
ON CONFLICT (codigo) DO NOTHING;

-- ── TRANSICIONES BÁSICAS ─────────────────────────────────────
-- Ajusta o completa según tus transiciones reales en SQL Server.
INSERT INTO subfase_transiciones (codigo_origen, codigo_destino, etiqueta, tipo, activo) VALUES
  ('A1', 'A2', NULL, 'normal', TRUE),
  ('A2', 'A3', NULL, 'normal', TRUE),
  ('A3', 'A4', NULL, 'normal', TRUE),
  ('A4', 'B1', 'Aprobado', 'normal', TRUE),
  ('A4', 'A2', 'Revisar',  'retroceso', TRUE),
  ('B1', 'B2', NULL, 'normal', TRUE),
  ('B2', 'B3', NULL, 'normal', TRUE),
  ('B3', 'B4', NULL, 'normal', TRUE),
  ('B4', 'C1', 'Aprobado', 'normal', TRUE),
  ('B4', 'BC', 'Corregir',  'correctivo', TRUE),
  ('BC', 'B3', NULL, 'normal', TRUE),
  ('C1', 'C2', NULL, 'normal', TRUE),
  ('C2', 'C3', NULL, 'normal', TRUE),
  ('C3', 'D1', 'Aprobado', 'normal', TRUE),
  ('C3', 'CC', 'Corregir',  'correctivo', TRUE),
  ('CC', 'C1', NULL, 'normal', TRUE),
  ('D1', 'D2', NULL, 'normal', TRUE),
  ('D2', 'D3', NULL, 'normal', TRUE),
  ('D3', 'E1', 'Aprobado', 'normal', TRUE),
  ('D3', 'DC', 'Corregir',  'correctivo', TRUE),
  ('DC', 'D2', NULL, 'normal', TRUE),
  ('E1', 'E2', NULL, 'normal', TRUE),
  ('E2', 'E3', NULL, 'normal', TRUE),
  ('E3', 'END', 'Completar', 'normal', TRUE)
ON CONFLICT DO NOTHING;
