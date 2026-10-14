import type { Assignment, Task } from '@/lib/data';

// Semáforo: 1 = verde, 2 = amarillo, 3 = rojo
export type Level = 1 | 2 | 3;
export type LevelKind = 'difficulty' | 'dirt';

export const LEVEL_LABELS: Record<LevelKind, Record<Level, string>> = {
  difficulty: { 1: 'Fácil', 2: 'Media', 3: 'Difícil' },
  dirt: { 1: 'Poca suciedad', 2: 'Suciedad media', 3: 'Muy sucia' },
};

export const KIND_TITLES: Record<LevelKind, string> = {
  difficulty: 'Dificultad',
  dirt: 'Suciedad de la lancha',
};

export const normalizeLevel = (value: unknown): Level | null => {
  const n = typeof value === 'string' ? Number(value) : value;
  return n === 1 || n === 2 || n === 3 ? n : null;
};

// La dificultad de la asignación pisa a la del tipo de tarea; si no hay, usa la del tipo.
export const effectiveDifficulty = (
  assignment: Pick<Assignment, 'difficulty'>,
  task: Pick<Task, 'difficulty'> | undefined | null
): Level | null => normalizeLevel(assignment.difficulty) ?? normalizeLevel(task?.difficulty);
