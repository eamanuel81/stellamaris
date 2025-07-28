import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Assignment } from '@/lib/data';

export function useAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    console.log('=== FETCHING ASSIGNMENTS START ===');
    setIsLoading(true);
    setError(null);
    
    try {
      // Verificar si el usuario está autenticado
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('Current user for assignments:', user?.id, user?.email);
      console.log('User error:', userError);
      
      if (userError) {
        console.error('Error getting user:', userError);
        setError('Error de autenticación');
        setAssignments([]);
        setIsLoading(false);
        return;
      }
      
      if (!user) {
        console.log('No authenticated user, skipping assignments fetch');
        setAssignments([]);
        setIsLoading(false);
        return;
      }

      console.log('Attempting to fetch assignments from database...');
      
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .order('id', { ascending: false });
        
      console.log('Assignments response:', { data, error });
      console.log('Data type:', typeof data);
      console.log('Data length:', data?.length);
      console.log('Error type:', typeof error);
        
      if (error) {
        console.error('Error fetching assignments:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        setError(`Error cargando asignaciones: ${error.message}`);
        setAssignments([]);
      } else {
        console.log('Assignments loaded from database:', data?.length || 0, 'assignments');
        console.log('Assignments data:', data);
        setAssignments(data || []);
        setError(null);
      }
    } catch (err) {
      console.error('Unexpected error fetching assignments:', err);
      console.error('Error stack:', err instanceof Error ? err.stack : 'No stack available');
      setError(`Error inesperado al cargar las asignaciones: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      setAssignments([]);
    } finally {
      setIsLoading(false);
      console.log('=== FETCHING ASSIGNMENTS END ===');
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Crear asignación
  const addAssignment = async (assignment: Omit<Assignment, 'id'>) => {
    setIsLoading(true);
    
    try {
      // Asegurar que employeeId sea un array válido
      if (assignment.employeeId && !Array.isArray(assignment.employeeId)) {
        console.error('employeeId debe ser un array:', assignment.employeeId);
        setError('employeeId debe ser un array');
        setIsLoading(false);
        return { data: null, error: new Error('employeeId debe ser un array') };
      }
      
      console.log('Creating assignment:', assignment);
      
      const { data, error } = await supabase.from('assignments').insert([assignment]).select();
      if (error) {
        console.error('Error creating assignment:', error);
        setError(error.message);
        setIsLoading(false);
        return { data: null, error };
      } else if (data && data.length > 0) {
        console.log('Assignment created successfully:', data[0]);
        setAssignments(prev => [data[0], ...prev]);
        setError(null);
        setIsLoading(false);
        return { data: data[0], error: null };
      }
    } catch (err) {
      console.error('Unexpected error creating assignment:', err);
      setError('Error inesperado al crear la asignación');
      setIsLoading(false);
      return { data: null, error: new Error('Error inesperado') };
    }
    
    setIsLoading(false);
    return { data: null, error: new Error('No se pudo crear la asignación') };
  };

  // Editar asignación
  const updateAssignment = async (assignment: Assignment) => {
    setIsLoading(true);
    
    try {
      console.log('Updating assignment:', assignment);
      
      const { data, error } = await supabase
        .from('assignments')
        .update(assignment)
        .eq('id', assignment.id)
        .select();
        
      if (error) {
        console.error('Error updating assignment:', error);
        setError(error.message);
        setIsLoading(false);
        return { data: null, error };
      } else if (data && data.length > 0) {
        console.log('Assignment updated successfully:', data[0]);
        setAssignments(prev => prev.map(a => a.id === assignment.id ? data[0] : a));
        setError(null);
        setIsLoading(false);
        return { data: data[0], error: null };
      }
    } catch (err) {
      console.error('Unexpected error updating assignment:', err);
      setError('Error inesperado al actualizar la asignación');
      setIsLoading(false);
      return { data: null, error: new Error('Error inesperado') };
    }
    
    setIsLoading(false);
    return { data: null, error: new Error('No se pudo actualizar la asignación') };
  };

  // Eliminar asignación
  const deleteAssignment = async (id: string) => {
    setIsLoading(true);
    
    try {
      console.log('Deleting assignment:', id);
      
      const { error } = await supabase.from('assignments').delete().eq('id', id);
      if (error) {
        console.error('Error deleting assignment:', error);
        setError(error.message);
        setIsLoading(false);
        return { error };
      } else {
        console.log('Assignment deleted successfully:', id);
        setAssignments(prev => prev.filter(a => a.id !== id));
        setError(null);
        setIsLoading(false);
        return { error: null };
      }
    } catch (err) {
      console.error('Unexpected error deleting assignment:', err);
      setError('Error inesperado al eliminar la asignación');
      setIsLoading(false);
      return { error: new Error('Error inesperado') };
    }
  };

  return { 
    assignments, 
    isLoading, 
    error, 
    addAssignment, 
    updateAssignment, 
    deleteAssignment, 
    refetch: fetchAssignments 
  };
} 