import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Assignment } from '@/lib/data';

export function useAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('assignments').select('*');
    if (error) {
      setError(error.message);
      setAssignments([]);
    } else {
      setAssignments(data || []);
      setError(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  // Crear asignación
  const addAssignment = async (assignment: Omit<Assignment, 'id'>) => {
    setIsLoading(true);
    const { data, error } = await supabase.from('assignments').insert([assignment]).select();
    console.log('Respuesta Supabase:', data, error);
    if (error) {
      setError(error.message);
    } else if (data && data.length > 0) {
      setAssignments(prev => [...prev, data[0]]);
      // Refresca todas las asignaciones para asegurar sincronización
      await fetchAssignments();
    }
    setIsLoading(false);
    return { data, error };
  };

  // Editar asignación
  const updateAssignment = async (assignment: Assignment) => {
    setIsLoading(true);
    const { data, error } = await supabase.from('assignments').update(assignment).eq('id', assignment.id).select();
    if (error) {
      setError(error.message);
    } else if (data && data.length > 0) {
      setAssignments(prev => prev.map(a => a.id === assignment.id ? data[0] : a));
      // Refresca todas las asignaciones para asegurar sincronización
      await fetchAssignments();
    }
    setIsLoading(false);
    return { data, error };
  };

  // Eliminar asignación
  const deleteAssignment = async (id: string) => {
    setIsLoading(true);
    const { error } = await supabase.from('assignments').delete().eq('id', id);
    if (error) {
      setError(error.message);
    } else {
      setAssignments(prev => prev.filter(a => a.id !== id));
      // Refresca todas las asignaciones para asegurar sincronización
      await fetchAssignments();
    }
    setIsLoading(false);
    return { error };
  };

  return { assignments, isLoading, error, addAssignment, updateAssignment, deleteAssignment, refetch: fetchAssignments };
} 