-- ============================================================
--  MIGRACIÓN v1.3 — Agregar estado 'pendiente' a proyectos
--  Ejecutar sobre matec_nrd después de v1.2
-- ============================================================
USE matec_nrd;
GO

-- 1. Eliminar el CHECK constraint actual sobre 'estado'
DECLARE @ck NVARCHAR(200);
SELECT @ck = cc.name
FROM sys.check_constraints cc
JOIN sys.columns c
  ON c.object_id = cc.parent_object_id
 AND c.column_id = cc.parent_column_id
WHERE cc.parent_object_id = OBJECT_ID('dbo.proyectos')
  AND c.name = 'estado';

IF @ck IS NOT NULL
BEGIN
    EXEC('ALTER TABLE dbo.proyectos DROP CONSTRAINT ' + @ck);
    PRINT '✅ CHECK constraint anterior eliminado: ' + @ck;
END
ELSE
    PRINT '  No se encontró CHECK constraint sobre estado — omitido';
GO

-- 2. Recrear el constraint incluyendo 'pendiente'
ALTER TABLE dbo.proyectos
    ADD CONSTRAINT CK_proyectos_estado
    CHECK (estado IN ('pendiente','activo','pausado','completado','archivado'));
GO

PRINT '✅ Nuevo CHECK constraint creado: pendiente | activo | pausado | completado | archivado';
PRINT '✅ Migración v1.3 aplicada correctamente.';
GO
