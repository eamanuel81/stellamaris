import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Task } from '@/lib/data';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('tasks').select('*');
    if (error) {
      setError(error.message);
      setTasks([]);
    } else {
      setTasks(data || []);
      setError(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Crear tarea
  const addTask = async (task: Omit<Task, 'id'>) => {
    setIsLoading(true);
    const { data, error } = await supabase.from('tasks').insert([task]).select();
    if (error) {
      setError(error.message);
    } else if (data && data.length > 0) {
      setTasks(prev => [...prev, data[0]]);
    }
    setIsLoading(false);
    return { data, error };
  };

  // Editar tarea
  const updateTask = async (task: Task) => {
    setIsLoading(true);
    const { data, error } = await supabase.from('tasks').update(task).eq('id', task.id).select();
    if (error) {
      setError(error.message);
    } else if (data && data.length > 0) {
      setTasks(prev => prev.map(t => t.id === task.id ? data[0] : t));
    }
    setIsLoading(false);
    return { data, error };
  };

  // Eliminar tarea
  const deleteTask = async (id: string) => {
    setIsLoading(true);
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      setError(error.message);
    } else {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
    setIsLoading(false);
    return { error };
  };

  return { tasks, isLoading, error, addTask, updateTask, deleteTask };
} 