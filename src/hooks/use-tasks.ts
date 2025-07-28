import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Task } from '@/lib/data';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    console.log('=== FETCHING TASKS START ===');
    setIsLoading(true);
    setError(null);
    
    try {
      // Verificar si el usuario está autenticado
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('Current user:', user?.id, user?.email);
      console.log('User error:', userError);
      
      if (userError) {
        console.error('Error getting user:', userError);
        setError('Error de autenticación');
        setTasks([]);
        setIsLoading(false);
        return;
      }
      
      if (!user) {
        console.log('No authenticated user, skipping task fetch');
        setTasks([]);
        setIsLoading(false);
        return;
      }

      console.log('Attempting to fetch tasks from database...');
      
      // Primero verificar si la tabla existe
      const { data: tableCheck, error: tableError } = await supabase
        .from('tasks')
        .select('count')
        .limit(1);
      
      console.log('Table check result:', { tableCheck, tableError });
      
      if (tableError) {
        console.error('Error checking tasks table:', tableError);
        console.error('Table error details:', {
          message: tableError.message,
          details: tableError.details,
          hint: tableError.hint,
          code: tableError.code
        });
        setError(`Error accediendo a la tabla tasks: ${tableError.message}`);
        setTasks([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('id', { ascending: false });
        
      console.log('Supabase response:', { data, error });
      console.log('Data type:', typeof data);
      console.log('Data length:', data?.length);
      console.log('Error type:', typeof error);
        
      if (error) {
        console.error('Error fetching tasks:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        setError(`Error cargando tareas: ${error.message}`);
        setTasks([]);
      } else {
        console.log('Tasks loaded from database:', data?.length || 0, 'tasks');
        console.log('Tasks data:', data);
        setTasks(data || []);
        setError(null);
      }
    } catch (err) {
      console.error('Unexpected error fetching tasks:', err);
      console.error('Error stack:', err instanceof Error ? err.stack : 'No stack available');
      setError(`Error inesperado al cargar las tareas: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      setTasks([]);
    } finally {
      setIsLoading(false);
      console.log('=== FETCHING TASKS END ===');
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
        console.error('Error adding task:', error);
        setError(error.message);
        return { data: null, error };
      } else if (data && data.length > 0) {
        console.log('Task added successfully:', data[0]);
        setTasks(prev => [data[0], ...prev]);
        setError(null);
        return { data: data[0], error: null };
      }
    } catch (err) {
      console.error('Unexpected error adding task:', err);
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
        console.error('Error updating task:', error);
        setError(error.message);
        return { data: null, error };
      } else if (data && data.length > 0) {
        console.log('Task updated successfully:', data[0]);
        setTasks(prev => prev.map(t => t.id === task.id ? data[0] : t));
        setError(null);
        return { data: data[0], error: null };
      }
    } catch (err) {
      console.error('Unexpected error updating task:', err);
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
        console.error('Error deleting task:', error);
        setError(error.message);
        return { error };
      } else {
        console.log('Task deleted successfully:', id);
        setTasks(prev => prev.filter(t => t.id !== id));
        setError(null);
        return { error: null };
      }
    } catch (err) {
      console.error('Unexpected error deleting task:', err);
      setError('Error inesperado al eliminar la tarea');
      return { error: new Error('Error inesperado') };
    } finally {
      setIsLoading(false);
    }
  };

  // Función para recargar datos manualmente
  const refreshTasks = useCallback(() => {
    console.log('Manually refreshing tasks...');
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