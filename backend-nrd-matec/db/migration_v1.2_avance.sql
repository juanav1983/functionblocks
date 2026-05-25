-- ============================================================
--  MIGRACIÓN v1.2 — Sistema de avance de subfases
--  Ejecutar sobre matec_nrd después de v1.1
-- ============================================================
USE matec_nrd;
GO

-- 1. Hacer usuario_id nullable en historial_fases
--    (permite registrar cambios de sistema sin usuario asignado)
IF EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.historial_fases')
      AND name = 'usuario_id'
      AND is_nullable = 0
)
BEGIN
    -- Primero quitamos el FK si existe
    DECLARE @fk NVARCHAR(200);
    SELECT @fk = fk.name
    FROM sys.foreign_keys fk
    JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
    JOIN sys.columns c ON c.object_id = fkc.parent_object_id AND c.column_id = fkc.parent_column_id
    WHERE fkc.parent_object_id = OBJECT_ID('dbo.historial_fases')
      AND c.name = 'usuario_id';

    IF @fk IS NOT NULL
        EXEC('ALTER TABLE dbo.historial_fases DROP CONSTRAINT ' + @fk);

    ALTER TABLE dbo.historial_fases
        ALTER COLUMN usuario_id INT NULL;

    ALTER TABLE dbo.historial_fases
        ADD CONSTRAINT FK_historial_usuario
        FOREIGN KEY (usuario_id) REFERENCES dbo.usuarios(id);

    PRINT '✅ historial_fases.usuario_id ahora acepta NULL';
END
ELSE
    PRINT '  historial_fases.usuario_id ya es nullable — omitido';
GO

-- 2. Agregar columna 'completado_en' a proyectos
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.proyectos') AND name = 'completado_en'
)
BEGIN
    ALTER TABLE dbo.proyectos ADD completado_en DATETIME2 NULL;
    PRINT '✅ proyectos.completado_en agregado';
END
GO

PRINT '✅ Migración v1.2 aplicada correctamente.';
GO
