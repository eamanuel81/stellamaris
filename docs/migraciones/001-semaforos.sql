-- Migración 001: semáforos de dificultad y suciedad.
--
-- QUÉ HACE: agrega 3 columnas (tasks.difficulty, assignments.difficulty, assignments.dirt_level)
--           y restricciones para que solo admitan valores de 1 a 3.
-- ES SEGURA: solo agrega; no borra ni modifica datos existentes. Se puede ejecutar más de una vez.
--
-- ANTES DE EJECUTAR (producción):
--   1) Hacer un respaldo:  pg_dump "$DATABASE_URL" -Fc -f respaldo-antes-001.dump
--      (o usar Backups del servicio PostgreSQL en Railway).
--   2) Si tu esquema no se llama "guarderia", reemplazá ese nombre en TODO el archivo.
--   3) Ejecutarlo ANTES de desplegar la versión que lee estas columnas.
--
-- CÓMO EJECUTAR: abrirlo en tu administrador de base de datos conectado a la base "railway"
--                y ejecutar TODO el archivo (no línea por línea).

BEGIN;

-- 1) Columnas
ALTER TABLE guarderia.tasks
  ADD COLUMN IF NOT EXISTS difficulty integer NOT NULL DEFAULT 1;

ALTER TABLE guarderia.assignments
  ADD COLUMN IF NOT EXISTS difficulty integer,
  ADD COLUMN IF NOT EXISTS dirt_level integer;

-- 2) Restricciones de rango (solo se crean si todavía no existen)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_difficulty_range'
                 AND conrelid = 'guarderia.tasks'::regclass) THEN
    ALTER TABLE guarderia.tasks
      ADD CONSTRAINT tasks_difficulty_range CHECK (difficulty BETWEEN 1 AND 3);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assignments_difficulty_range'
                 AND conrelid = 'guarderia.assignments'::regclass) THEN
    ALTER TABLE guarderia.assignments
      ADD CONSTRAINT assignments_difficulty_range CHECK (difficulty IS NULL OR difficulty BETWEEN 1 AND 3);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assignments_dirt_level_range'
                 AND conrelid = 'guarderia.assignments'::regclass) THEN
    ALTER TABLE guarderia.assignments
      ADD CONSTRAINT assignments_dirt_level_range CHECK (dirt_level IS NULL OR dirt_level BETWEEN 1 AND 3);
  END IF;
END $$;

COMMIT;

-- 3) COMPROBACIÓN: tiene que devolver exactamente 3 filas
--    (assignments.dirt_level, assignments.difficulty, tasks.difficulty)
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'guarderia'
  AND column_name IN ('difficulty', 'dirt_level')
ORDER BY table_name, column_name;

-- REVERSIÓN (solo si hiciera falta volver atrás; borra esas columnas y sus datos):
--   ALTER TABLE guarderia.assignments DROP COLUMN IF EXISTS dirt_level, DROP COLUMN IF EXISTS difficulty;
--   ALTER TABLE guarderia.tasks DROP COLUMN IF EXISTS difficulty;
