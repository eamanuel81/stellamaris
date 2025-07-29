import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Assignment } from '@/lib/data';

export function useAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Usar ref para evitar llamadas duplicadas
  const fetchingRef = useRef(false);
  const mountedRef = useRef(true);

  // Cleanup al desmontar
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchAssignments = useCallback(async () => {
    // Prevenir llamadas concurrentes
    if (fetchingRef.current) return;
    
    fetchingRef.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      // Verificar si el usuario está autenticado - optimizado
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
        if (mountedRef.current) {
          setError('Error de autenticación');
          setAssignments([]);
          setIsLoading(false);
        }
        return;
      }
      
      if (!user) {
        if (mountedRef.current) {
          setAssignments([]);
          setIsLoading(false);
        }
        return;
      }

      // Optimizar la query - solo seleccionar campos necesarios si es posible
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .order('id', { ascending: false });
        
      // Solo actualizar estado si el componente está montado
      if (!mountedRef.current) return;
        
      if (error) {
        console.error('Error fetching assignments:', error);
        setError(`Error cargando asignaciones: ${error.message}`);
        setAssignments([]);
      } else {
        setAssignments((data as Assignment[]) || []);
        setError(null);
      }
    } catch (err) {
      console.error('Unexpected error fetching assignments:', err);
      if (mountedRef.current) {
        setError(`Error inesperado al cargar las asignaciones: ${err instanceof Error ? err.message : 'Error desconocido'}`);
        setAssignments([]);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
      fetchingRef.current = false;
    }
  }, []);

  // Solo ejecutar fetchAssignments una vez al montar
  useEffect(() => {
    fetchAssignments();
  }, []); // Dependencias vacías - solo ejecutar una vez

  // Memoizar las funciones CRUD para evitar re-renders
  const addAssignment = useCallback(async (assignment: Omit<Assignment, 'id'>) => {
    try {
      // Asegurar que employeeId sea un array válido
      if (assignment.employeeId && !Array.isArray(assignment.employeeId)) {
        setError('employeeId debe ser un array');
        return { data: null, error: new Error('employeeId debe ser un array') };
      }
      
      const { data, error } = await supabase.from('assignments').insert([assignment]).select();
      
      if (error) {
        console.error('Error creating assignment:', error);
        setError(error.message);
        return { data: null, error };
      } else if (data && data.length > 0) {
        // Optimización: usar función callback para evitar stale closures
        setAssignments(prev => [data[0] as Assignment, ...prev]);
        setError(null);
        return { data: data[0] as Assignment, error: null };
      }
    } catch (err) {
      console.error('Unexpected error creating assignment:', err);
      setError('Error inesperado al crear la asignación');
      return { data: null, error: new Error('Error inesperado') };
    }
    
    return { data: null, error: new Error('No se pudo crear la asignación') };
  }, []);

  const updateAssignment = useCallback(async (assignment: Assignment) => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .update(assignment)
        .eq('id', assignment.id)
        .select();
        
      if (error) {
        console.error('Error updating assignment:', error);
        setError(error.message);
        return { data: null, error };
      } else if (data && data.length > 0) {
        // Usar función callback para actualización eficiente
        setAssignments(prev => prev.map(a => a.id === assignment.id ? data[0] as Assignment : a));
        setError(null);
        return { data: data[0] as Assignment, error: null };
      }
    } catch (err) {
      console.error('Unexpected error updating assignment:', err);
      setError('Error inesperado al actualizar la asignación');
      return { data: null, error: new Error('Error inesperado') };
    }
    
    return { data: null, error: new Error('No se pudo actualizar la asignación') };
  }, []);

  const deleteAssignment = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('assignments').delete().eq('id', id);
      if (error) {
        console.error('Error deleting assignment:', error);
        setError(error.message);
        return { error };
      } else {
        // Usar función callback para eliminación eficiente
        setAssignments(prev => prev.filter(a => a.id !== id));
        setError(null);
        return { error: null };
      }
    } catch (err) {
      console.error('Unexpected error deleting assignment:', err);
      setError('Error inesperado al eliminar la asignación');
      return { error: new Error('Error inesperado') };
    }
  }, []);

  // Memoizar el objeto de retorno para evitar re-renders innecesarios
  const returnValue = useMemo(() => ({
    assignments,
    isLoading,
    error,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    refetch: fetchAssignments
  }), [assignments, isLoading, error, addAssignment, updateAssignment, deleteAssignment, fetchAssignments]);

  return returnValue;
}