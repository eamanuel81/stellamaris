import { differenceInCalendarDays } from 'date-fns';
import type { Assignment, Client, Task } from '@/lib/data';

// Una tarea cuenta como "lavado" si su clasificador (campo Tipo del tipo de tarea) es LAVADO.
const WASH_TYPE = 'lavado';

const normalize = (text: string | undefined) =>
  (text ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

export const isWashTask = (task: Pick<Task, 'type'> | undefined | null) =>
  !!task && normalize(task.type) === WASH_TYPE;

export type BoatWashRow = {
  boatId: string;
  boatName: string;
  registrationNumber: string;
  clientId: string;
  clientName: string;
  lastWashAt: Date | null;
  daysSinceWash: number | null; // null = nunca se lavó
};

// Para cada embarcación, la fecha del último lavado completado.
export function computeBoatWashRows(
  clients: Client[],
  assignments: Assignment[],
  tasks: Task[],
  now: Date = new Date()
): BoatWashRow[] {
  const washTaskIds = new Set(tasks.filter(isWashTask).map(t => t.id));
  const lastWashByBoat = new Map<string, Date>();

  for (const a of assignments) {
    if (a.status !== 'completed' || !washTaskIds.has(a.taskId)) continue;
    const when = new Date(a.endTime);
    for (const boatId of a.boatIds ?? []) {
      const prev = lastWashByBoat.get(boatId);
      if (!prev || when > prev) lastWashByBoat.set(boatId, when);
    }
  }

  const rows: BoatWashRow[] = [];
  for (const client of clients) {
    for (const boat of client.boats ?? []) {
      const lastWashAt = lastWashByBoat.get(boat.id) ?? null;
      rows.push({
        boatId: boat.id,
        boatName: boat.name,
        registrationNumber: boat.registrationNumber,
        clientId: client.id,
        clientName: `${client.firstName ?? ''} ${client.lastName ?? ''}`.trim(),
        lastWashAt,
        daysSinceWash: lastWashAt ? Math.max(0, differenceInCalendarDays(now, lastWashAt)) : null,
      });
    }
  }
  return rows;
}

export const isUnwashed = (row: BoatWashRow, days: number) =>
  row.daysSinceWash === null || row.daysSinceWash > days;

export const isRecentlyWashed = (row: BoatWashRow, days: number) =>
  row.daysSinceWash !== null && row.daysSinceWash <= days;
