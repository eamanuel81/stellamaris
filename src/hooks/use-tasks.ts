import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Task } from '@/lib/data';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Verificar si el usuario está autenticado
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error getting user:', userError);
        }
        setError('Error de autenticación');
        setTasks([]);
        setIsLoading(false);
        return;
      }
      
      if (!user) {
        setTasks([]);
        setIsLoading(false);
        return;
      }

      // Primero verificar si la tabla existe
      const { data: tableCheck, error: tableError } = await supabase
        .from('tasks')
        .select('count')
        .limit(1);
      
      if (tableError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error checking tasks table:', tableError);
        }
        setError(`Error accediendo a la tabla tasks: ${tableError.message}`);
        setTasks([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('id', { ascending: false });
        
      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching tasks:', error);
        }
        setError(`Error cargando tareas: ${error.message}`);
        setTasks([]);
      } else {
        setTasks((data as Task[]) || []);
        setError(null);
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Unexpected error fetching tasks:', err);
      }
      setError(`Error inesperado al cargar las tareas: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Recargar datos cuando el componente se monta
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Crear tarea
  const addTask = async (task: Omit<Task, 'id'>) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('tasks').insert([task]).select();
      if (error) {
        if (process.env.NODE_ENV === 'development') {

          console.error('Error adding task:', error);

        }
        setError(error.message);
        return { data: null, error };
      } else if (data && data.length > 0) {
        setTasks(prev => [data[0] as Task, ...prev]);
        setError(null);
        return { data: data[0] as Task, error: null };
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {

        console.error('Unexpected error adding task:', err);

      }
      setError('Error inesperado al crear la tarea');
      return { data: null, error: new Error('Error inesperado') };
    } finally {
      setIsLoading(false);
    }
    return { data: null, error: new Error('No se pudo crear la tarea') };
  };

  // Editar tarea
  const updateTask = async (task: Task) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(task)
        .eq('id', task.id)
        .select();
        
      if (error) {
        if (process.env.NODE_ENV === 'development') {

          console.error('Error updating task:', error);

        }
        setError(error.message);
        return { data: null, error };
      } else if (data && data.length > 0) {
        setTasks(prev => prev.map(t => t.id === task.id ? data[0] as Task : t));
        setError(null);
        return { data: data[0] as Task, error: null };
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {

        console.error('Unexpected error updating task:', err);

      }
      setError('Error inesperado al actualizar la tarea');
      return { data: null, error: new Error('Error inesperado') };
    } finally {
      setIsLoading(false);
    }
    return { data: null, error: new Error('No se pudo actualizar la tarea') };
  };

  // Eliminar tarea
  const deleteTask = async (id: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) {
        if (process.env.NODE_ENV === 'development') {

          console.error('Error deleting task:', error);

        }
        setError(error.message);
        return { error };
      } else {
        setTasks(prev => prev.filter(t => t.id !== id));
        setError(null);
        return { error: null };
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {

        console.error('Unexpected error deleting task:', err);

      }
      setError('Error inesperado al eliminar la tarea');
      return { error: new Error('Error inesperado') };
    } finally {
      setIsLoading(false);
    }
  };

  // Función para recargar datos manualmente
  const refreshTasks = useCallback(() => {
    fetchTasks();
  }, [fetchTasks]);

  return { 
    tasks, 
    isLoading, 
    error, 
    addTask, 
    updateTask, 
    deleteTask, 
    refreshTasks 
  };
} 