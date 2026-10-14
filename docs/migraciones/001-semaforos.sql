-- Migración 001: semáforos de dificultad y suciedad.
-- Reemplazá "guarderia" si usás otro DATABASE_SCHEMA.
--
-- ANTES DE EJECUTAR (producción):
--   1) Respaldo:  pg_dump "$DATABASE_URL" -Fc -f respaldo-antes-001.dump
--   2) Ejecutar este archivo ANTES de desplegar la versión nueva de la app
--      (la app nueva lee estas columnas y falla si no existen).
-- Es aditiva: no borra ni modifica datos existentes.

BEGIN;

ALTER TABLE guarderia.tasks
  ADD COLUMN IF NOT EXISTS difficulty integer NOT NULL DEFAULT 1;
ALTER TABLE guarderia.tasks
  ADD CONSTRAINT tasks_difficulty_range CHECK (difficulty BETWEEN 1 AND 3);

ALTER TABLE guarderia.assignments
  ADD COLUMN IF NOT EXISTS difficulty integer,
  ADD COLUMN IF NOT EXISTS dirt_level integer;
ALTER TABLE guarderia.assignments
  ADD CONSTRAINT assignments_difficulty_range CHECK (difficulty IS NULL OR difficulty BETWEEN 1 AND 3),
  ADD CONSTRAINT assignments_dirt_level_range CHECK (dirt_level IS NULL OR dirt_level BETWEEN 1 AND 3);

COMMIT;

-- Reversión (si hiciera falta):
--   ALTER TABLE guarderia.assignments DROP COLUMN dirt_level, DROP COLUMN difficulty;
--   ALTER TABLE guarderia.tasks DROP COLUMN difficulty;
