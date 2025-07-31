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
        const newAssignment = data[0] as Assignment;
        // Optimización: usar función callback para evitar stale closures
        setAssignments(prev => [newAssignment, ...prev]);
        setError(null);

        // Crear notificaciones para los empleados asignados
        if (assignment.employeeId && assignment.employeeId.length > 0) {
          for (const employeeId of assignment.employeeId) {
            // Obtener información del empleado
            const { data: employeeData } = await supabase
              .from('employees')
              .select('name, lastName, email')
              .eq('id', employeeId)
              .single();

            if (employeeData && employeeData.email) {
              // Obtener información de la tarea
              const { data: taskData } = await supabase
                .from('tasks')
                .select('title')
                .eq('id', assignment.taskId)
                .single();

              // Obtener el userId del empleado
              const { data: profileData } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', employeeData.email)
                .single();

              if (profileData && taskData && typeof taskData.title === 'string') {
                console.log('Creating notification for employee:', {
                  employeeId,
                  employeeEmail: employeeData.email,
                  profileId: profileData.id,
                  taskTitle: taskData.title,
                  assignmentId: newAssignment.id
                });
                
                const notificationResult = await createNotification({
                  userid: profileData.id as string, // Changed from userId to userid
                  title: 'Nueva tarea asignada',
                  message: `Se te ha asignado la tarea "${taskData.title}" para el ${new Date(assignment.startTime).toLocaleDateString('es-ES')}`,
                  type: 'task_assigned',
                  isread: false, // Changed from isRead to isread
                  data: {
                    assignmentId: newAssignment.id,
                    taskId: assignment.taskId,
                    employeeId: employeeId
                  }
                });
                
                if (notificationResult.error) {
                  console.error('Failed to create notification for employee:', employeeId, notificationResult.error);
                } else {
                  console.log('Notification created successfully for employee:', employeeId);
                }
              } else {
                console.error('Missing data for notification:', {
                  profileData: !!profileData,
                  taskData: !!taskData,
                  taskTitle: taskData?.title,
                  employeeEmail: employeeData?.email
                });
              }
            }
          }
        }

        return { data: newAssignment, error: null };
      }
    } catch (err) {
      console.error('Unexpected error creating assignment:', err);
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
        console.error('Error updating assignment:', error);
        setError(error.message);
        return { data: null, error };
      } else if (data && data.length > 0) {
        const updatedAssignment = data[0] as Assignment;
        // Usar función callback para actualización eficiente
        setAssignments(prev => prev.map(a => a.id === assignment.id ? updatedAssignment : a));
        setError(null);

        // Crear notificaciones si los empleados cambiaron
        if (oldAssignmentData && assignment.employeeId && assignment.employeeId.length > 0) {
          const oldEmployeeIds = oldAssignmentData.employeeId || [];
          const newEmployeeIds = assignment.employeeId;
          
          // Encontrar empleados que fueron agregados
          const addedEmployees = newEmployeeIds.filter(id => !(oldEmployeeIds as string[]).includes(id));
          
          for (const employeeId of addedEmployees) {
            // Obtener información del empleado
            const { data: employeeData } = await supabase
              .from('employees')
              .select('name, lastName, email')
              .eq('id', employeeId)
              .single();

            if (employeeData && employeeData.email) {
              // Obtener información de la tarea
              const { data: taskData } = await supabase
                .from('tasks')
                .select('title')
                .eq('id', assignment.taskId)
                .single();

              // Obtener el userId del empleado
              const { data: profileData } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', employeeData.email)
                .single();

              if (profileData && taskData && typeof taskData.title === 'string') {
                console.log('Creating notification for modified assignment:', {
                  employeeId,
                  employeeEmail: employeeData.email,
                  profileId: profileData.id,
                  taskTitle: taskData.title,
                  assignmentId: updatedAssignment.id
                });
                
                const notificationResult = await createNotification({
                  userid: profileData.id as string, // Changed from userId to userid
                  title: 'Tarea modificada',
                  message: `Se te ha asignado la tarea "${taskData.title}" para el ${new Date(assignment.startTime).toLocaleDateString('es-ES')}`,
                  type: 'task_modified',
                  isread: false, // Changed from isRead to isread
                  data: {
                    assignmentId: updatedAssignment.id,
                    taskId: assignment.taskId,
                    employeeId: employeeId
                  }
                });
                
                if (notificationResult.error) {
                  console.error('Failed to create notification for employee:', employeeId, notificationResult.error);
                } else {
                  console.log('Notification created successfully for employee:', employeeId);
                }
              } else {
                console.error('Missing data for notification in update:', {
                  profileData: !!profileData,
                  taskData: !!taskData,
                  taskTitle: taskData?.title,
                  employeeEmail: employeeData?.email
                });
              }
            }
          }
        }

        return { data: updatedAssignment, error: null };
      }
    } catch (err) {
      console.error('Unexpected error updating assignment:', err);
      setError('Error inesperado al actualizar la asignación');
      return { data: null, error: new Error('Error inesperado') };
    }
    
    return { data: null, error: new Error('No se pudo actualizar la asignación') };
  }, [createNotification]);

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