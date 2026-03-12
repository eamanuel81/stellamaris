import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import type { Assignment } from '@/lib/data';

function mapAssignment(row: any): Assignment {
  return {
    id: row.id,
    taskId: row.taskId,
    employeeId: Array.isArray(row.employeeId) ? row.employeeId : [],
    startTime: new Date(row.startTime),
    endTime: new Date(row.endTime),
    status: row.status,
    clientId: row.clientId ?? undefined,
    boatIds: row.boatIds ?? undefined,
    selectedExtras: row.selectedExtras ?? undefined,
    observations: row.observations ?? undefined,
  };
}

export function useAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchAssignments = useCallback(async (isPolling = false) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    if (!isPolling) setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/assignments');
      if (!mountedRef.current) return;
      if (!res.ok) throw new Error('Error cargando asignaciones');
      const data = await res.json();
      if (mountedRef.current) {
        setAssignments((data as any[]).map(mapAssignment));
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setAssignments([]);
      }
    } finally {
      if (mountedRef.current && !isPolling) setIsLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchAssignments(false);
    const interval = setInterval(() => fetchAssignments(true), 30000);
    return () => clearInterval(interval);
  }, [fetchAssignments]);

  const addAssignment = useCallback(async (assignment: Omit<Assignment, 'id'>) => {
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignment),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? 'Error creando asignación');
        return { data: null, error: new Error(err.error) };
      }
      const data = await res.json();
      const mapped = mapAssignment(data);
      setAssignments(prev => [mapped, ...prev]);
      setError(null);
      return { data: mapped, error: null };
    } catch (err) {
      setError('Error inesperado al crear la asignación');
      return { data: null, error: new Error('Error inesperado') };
    }
  }, []);

  const updateAssignment = useCallback(async (assignment: Assignment) => {
    try {
      const res = await fetch(`/api/assignments/${assignment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...assignment, _notifyEmployees: true }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? 'Error actualizando asignación');
        return { data: null, error: new Error(err.error) };
      }
      const data = await res.json();
      const mapped = mapAssignment(data);
      setAssignments(prev => prev.map(a => a.id === assignment.id ? mapped : a));
      setError(null);
      return { data: mapped, error: null };
    } catch (err) {
      setError('Error inesperado al actualizar la asignación');
      return { data: null, error: new Error('Error inesperado') };
    }
  }, []);

  const deleteAssignment = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/assignments/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? 'Error eliminando asignación');
        return { error: new Error(err.error) };
      }
      setAssignments(prev => prev.filter(a => a.id !== id));
      setError(null);
      return { error: null };
    } catch (err) {
      setError('Error inesperado al eliminar la asignación');
      return { error: new Error('Error inesperado') };
    }
  }, []);

  const returnValue = useMemo(() => ({
    assignments, isLoading, error, addAssignment, updateAssignment, deleteAssignment, refetch: fetchAssignments,
  }), [assignments, isLoading, error, addAssignment, updateAssignment, deleteAssignment, fetchAssignments]);

  return returnValue;
}
