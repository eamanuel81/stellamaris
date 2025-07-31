import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Assignment } from '@/lib/data';
import { useNotifications } from './use-notifications';

export function useAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { createNotification } = useNotifications();
  
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
        setError(`Error cargando asignaciones: ${error.message}`);
        setAssignments([]);
      } else {
        setAssignments((data as Assignment[]) || []);
        setError(null);
      }
    } catch (err) {
      setError(`Error inesperado al cargar las asignaciones: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      setAssignments([]);
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
        setError(error.message);
        return { data: null, error };
      } else if (data && data.length > 0) {
        const newAssignment = data[0] as Assignment;
        // Optimización: usar función callback para evitar stale closures
        setAssignments(prev => [newAssignment, ...prev]);
        setError(null);

        // Crear notificaciones para los empleados asignados
        if (assignment.employeeId && assignment.employeeId.length > 0) {
          for (const employeeId of assignment.employeeId) {
            const { data: employeeData } = await supabase
              .from('employees')
              .select('*')
              .eq('id', employeeId)
              .single();

            const { data: taskData } = await supabase
              .from('tasks')
              .select('*')
              .eq('id', assignment.taskId)
              .single();

            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('email', (employeeData as any)?.email)
              .single();

            if (profileData && taskData && typeof taskData.title === 'string') {
              const notificationResult = await createNotification({
                userid: profileData.id as string,
                title: 'Nueva tarea asignada',
                message: `Se te ha asignado la tarea "${taskData.title}" para el ${new Date(assignment.startTime).toLocaleDateString('es-ES')}`,
                type: 'task_assigned',
                isread: false,
                data: { assignmentId: newAssignment.id, taskId: assignment.taskId, employeeId: employeeId } as { assignmentId: string; taskId: string; employeeId: string }
              });
              if (notificationResult.error) {
                // Silently handle notification creation errors
              }
            }
          }
        }

        return { data: newAssignment, error: null };
      }
    } catch (err) {
      setError('Error inesperado al crear la asignación');
      return { data: null, error: new Error('Error inesperado') };
    }
    
    return { data: null, error: new Error('No se pudo crear la asignación') };
  }, [createNotification]);

  const updateAssignment = useCallback(async (assignment: Assignment) => {
    try {
      // Obtener la asignación anterior para comparar
      const { data: oldAssignmentData } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', assignment.id)
        .single();

      const { data, error } = await supabase
        .from('assignments')
        .update(assignment)
        .eq('id', assignment.id)
        .select();
        
      if (error) {
        setError(error.message);
        return { data: null, error };
      } else if (data && data.length > 0) {
        const updatedAssignment = data[0] as Assignment;
        // Usar función callback para actualización eficiente
        setAssignments(prev => prev.map(a => a.id === assignment.id ? updatedAssignment : a));
        setError(null);

        // Crear notificaciones para empleados recién agregados
        if (assignment.employeeId && assignment.employeeId.length > 0 && oldAssignmentData) {
          const oldEmployeeIds = oldAssignmentData.employeeId as string[] || [];
          const newEmployees = assignment.employeeId.filter(id => !oldEmployeeIds.includes(id));

          for (const employeeId of newEmployees) {
            const { data: employeeData } = await supabase
              .from('employees')
              .select('*')
              .eq('id', employeeId)
              .single();

            const { data: taskData } = await supabase
              .from('tasks')
              .select('*')
              .eq('id', assignment.taskId)
              .single();

            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('email', (employeeData as any)?.email)
              .single();

            if (profileData && taskData && typeof taskData.title === 'string') {
              const notificationResult = await createNotification({
                userid: profileData.id as string,
                title: 'Tarea modificada',
                message: `Has sido agregado a la tarea "${taskData.title}" para el ${new Date(assignment.startTime).toLocaleDateString('es-ES')}`,
                type: 'task_modified',
                isread: false,
                data: { assignmentId: updatedAssignment.id, taskId: assignment.taskId, employeeId: employeeId } as { assignmentId: string; taskId: string; employeeId: string }
              });
              if (notificationResult.error) {
                // Silently handle notification creation errors
              }
            }
          }
        }

        return { data: updatedAssignment, error: null };
      }
    } catch (err) {
      setError('Error inesperado al actualizar la asignación');
      return { data: null, error: new Error('Error inesperado') };
    }
    
    return { data: null, error: new Error('No se pudo actualizar la asignación') };
  }, [createNotification]);

  const deleteAssignment = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('assignments').delete().eq('id', id);
      if (error) {
        setError(error.message);
        return { error };
      } else {
        // Usar función callback para eliminación eficiente
        setAssignments(prev => prev.filter(a => a.id !== id));
        setError(null);
        return { error: null };
      }
    } catch (err) {
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