import { useEffect, useState, useCallback } from 'react';
import type { Task } from '@/lib/data';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/tasks');
      if (!res.ok) throw new Error('Error cargando tareas');
      const data = await res.json();
      setTasks(data as Task[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const addTask = async (task: Omit<Task, 'id'>) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? 'Error creando tarea');
        return { data: null, error: new Error(err.error) };
      }
      const data = await res.json();
      setTasks(prev => [data as Task, ...prev]);
      setError(null);
      return { data: data as Task, error: null };
    } catch (err) {
      setError('Error inesperado al crear la tarea');
      return { data: null, error: new Error('Error inesperado') };
    } finally {
      setIsLoading(false);
    }
  };

  const updateTask = async (task: Task) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? 'Error actualizando tarea');
        return { data: null, error: new Error(err.error) };
      }
      const data = await res.json();
      setTasks(prev => prev.map(t => t.id === task.id ? data as Task : t));
      setError(null);
      return { data: data as Task, error: null };
    } catch (err) {
      setError('Error inesperado al actualizar la tarea');
      return { data: null, error: new Error('Error inesperado') };
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTask = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? 'Error eliminando tarea');
        return { error: new Error(err.error) };
      }
      setTasks(prev => prev.filter(t => t.id !== id));
      setError(null);
      return { error: null };
    } catch (err) {
      setError('Error inesperado al eliminar la tarea');
      return { error: new Error('Error inesperado') };
    } finally {
      setIsLoading(false);
    }
  };

  return { tasks, isLoading, error, addTask, updateTask, deleteTask, refreshTasks: fetchTasks };
}
