import { differenceInCalendarDays } from 'date-fns';
import type { Assignment, Client, Task } from '@/lib/data';

// Cada actividad se identifica por el clasificador (campo Tipo) del tipo de tarea.
export type ActivityKind = 'lavado' | 'bajada';
export const ACTIVITY_KINDS: ActivityKind[] = ['lavado', 'bajada'];

const normalize = (text: string | undefined) =>
  (text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

export const isTaskOfKind = (task: Pick<Task, 'type'> | undefined | null, kind: ActivityKind) =>
  !!task && normalize(task.type) === kind;

export type BoatActivityRow = {
  boatId: string;
  boatName: string;
  registrationNumber: string;
  clientId: string;
  clientName: string;
  last: Record<ActivityKind, Date | null>;
  daysSince: Record<ActivityKind, number | null>; // null = nunca se hizo
};

// Para cada embarcación, la fecha de la última tarea completada de cada actividad.
export function computeBoatActivityRows(
  clients: Client[],
  assignments: Assignment[],
  tasks: Task[],
  now: Date = new Date()
): BoatActivityRow[] {
  const taskIdsByKind = Object.fromEntries(
    ACTIVITY_KINDS.map(kind => [kind, new Set(tasks.filter(t => isTaskOfKind(t, kind)).map(t => t.id))])
  ) as Record<ActivityKind, Set<string>>;
  const lastByKind: Record<ActivityKind, Map<string, Date>> = { lavado: new Map(), bajada: new Map() };

  for (const a of assignments) {
    if (a.status !== 'completed') continue;
    const when = new Date(a.endTime);
    for (const kind of ACTIVITY_KINDS) {
      if (!taskIdsByKind[kind].has(a.taskId)) continue;
      for (const boatId of a.boatIds ?? []) {
        const prev = lastByKind[kind].get(boatId);
        if (!prev || when > prev) lastByKind[kind].set(boatId, when);
      }
    }
  }

  const rows: BoatActivityRow[] = [];
  for (const client of clients) {
    for (const boat of client.boats ?? []) {
      const last = {
        lavado: lastByKind.lavado.get(boat.id) ?? null,
        bajada: lastByKind.bajada.get(boat.id) ?? null,
      };
      const daysSince = {
        lavado: last.lavado ? Math.max(0, differenceInCalendarDays(now, last.lavado)) : null,
        bajada: last.bajada ? Math.max(0, differenceInCalendarDays(now, last.bajada)) : null,
      };
      rows.push({
        boatId: boat.id,
        boatName: boat.name,
        registrationNumber: boat.registrationNumber,
        clientId: client.id,
        clientName: `${client.firstName ?? ''} ${client.lastName ?? ''}`.trim(),
        last,
        daysSince,
      });
    }
  }
  return rows;
}

// "Sin hacer hace más de X días" (incluye las que nunca se hicieron)
export const isStale = (row: BoatActivityRow, kind: ActivityKind, days: number) =>
  row.daysSince[kind] === null || (row.daysSince[kind] as number) > days;

export const isRecent = (row: BoatActivityRow, kind: ActivityKind, days: number) =>
  row.daysSince[kind] !== null && (row.daysSince[kind] as number) <= days;
