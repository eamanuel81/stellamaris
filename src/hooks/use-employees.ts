import { useEffect, useState, useCallback } from 'react';
import { supabase, getSupabaseAdmin } from '@/lib/supabaseClient';
import { Employee } from '@/lib/data';

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
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
        setEmployees([]);
        setIsLoading(false);
        return;
      }
      
      if (!user) {
        setEmployees([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name', { ascending: true });
        
      if (error) {
        if (process.env.NODE_ENV === 'development') {

          console.error('Error fetching employees:', error);

        }
        setError(`Error cargando empleados: ${error.message}`);
        setEmployees([]);
      } else {
        const employeesData = (data as Employee[]) || [];
        setEmployees(employeesData);
        setError(null);
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {

        console.error('Unexpected error fetching employees:', err);

      }
      setError(`Error inesperado al cargar los empleados: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      setEmployees([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Recargar datos cuando el componente se monta
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Función para verificar la estructura de la tabla profiles
  const checkProfilesTable = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
      
      if (error) {
        if (process.env.NODE_ENV === 'development') {

          console.error('Error verificando tabla profiles:', error);

        }
        return false;
      }
      
      return true;
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {

        console.error('Error inesperado verificando profiles:', err);

      }
      return false;
    }
  };

  // Crear empleado
  const addEmployee = async (employee: Omit<Employee, 'id'>) => {
    setIsLoading(true);
    
    try {
      // Verificar la tabla profiles primero
      const profilesTableExists = await checkProfilesTable();
      if (!profilesTableExists) {
        setError('No se puede acceder a la tabla profiles');
        setIsLoading(false);
        return { data: null, error: new Error('No se puede acceder a la tabla profiles') };
      }

      // 1. Crear usuario en Auth de Supabase usando el cliente de administración
      const password = `${employee.name.charAt(0).toUpperCase() + employee.name.slice(1)}${employee.dni}`;
      
      const { data: authData, error: authError } = await getSupabaseAdmin().auth.admin.createUser({
        email: employee.email,
        password: password,
        email_confirm: true,
        user_metadata: {
          name: `${employee.name} ${employee.lastName}`,
          role: 'Empleado'
        }
      });

      if (authError) {
        if (process.env.NODE_ENV === 'development') {

          console.error('Error creando usuario en Auth:', authError);

        }
        setError(`Error creando usuario: ${authError.message}`);
        setIsLoading(false);
        return { data: null, error: authError };
      }

      if (!authData.user) {
        setError('No se pudo crear el usuario en Auth');
        setIsLoading(false);
        return { data: null, error: new Error('No se pudo crear el usuario en Auth') };
      }

      // 2. Crear perfil en la tabla profiles usando el cliente admin para evitar RLS
      const profileData = {
        id: authData.user.id,
        name: employee.name,
        last_name: employee.lastName,
        full_name: employee.nickname || `${employee.name} ${employee.lastName}`, // Usar nickname o nombre completo
        email: employee.email,
        role: 'Empleado'
      };

      try {
        const { getSupabaseAdmin } = await import('@/lib/supabaseClient');
        const supabaseAdmin = getSupabaseAdmin();
        
        const { data: profileResult, error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert([profileData])
          .select();

        if (profileError) {
          if (process.env.NODE_ENV === 'development') {

            console.error('Error creando perfil:', profileError);

          }
          // Intentar eliminar el usuario de Auth si falla la creación del perfil
          try {
            await getSupabaseAdmin().auth.admin.deleteUser(authData.user.id);
          } catch (deleteError) {
            if (process.env.NODE_ENV === 'development') {

              console.error('Error eliminando usuario de Auth después de fallo:', deleteError);

            }
          }
          setError(`Error creando perfil: ${profileError.message}`);
          setIsLoading(false);
          return { data: null, error: profileError };
        }
      } catch (profileError) {
        if (process.env.NODE_ENV === 'development') {

          console.error('Error inesperado creando perfil:', profileError);

        }
        // Si falla la creación del perfil, continuar sin él
        if (process.env.NODE_ENV === 'development') {

          console.log('⚠️ Continuando sin crear perfil en la tabla profiles');

        }
      }

      // 3. Crear empleado en la tabla employees con el auth_id
      const employeeWithAuthId = { ...employee, auth_id: authData.user.id };
      
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .insert([employeeWithAuthId])
        .select();

      if (employeeError) {
        if (process.env.NODE_ENV === 'development') {

          console.error('Error creando empleado:', employeeError);

        }
        // Intentar limpiar: eliminar perfil y usuario de Auth
        try {
          const { getSupabaseAdmin } = await import('@/lib/supabaseClient');
          const supabaseAdmin = getSupabaseAdmin();
          await supabaseAdmin.from('profiles').delete().eq('id', authData.user.id);
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        } catch (cleanupError) {
          if (process.env.NODE_ENV === 'development') {

            console.error('Error en limpieza después de fallo:', cleanupError);

          }
        }
        setError(`Error creando empleado: ${employeeError.message}`);
        setIsLoading(false);
        return { data: null, error: employeeError };
      }

      if (employeeData && employeeData.length > 0) {
        setEmployees(prev => [(employeeData[0] as Employee), ...prev]);
        setError(null);
        setIsLoading(false);
        return { data: employeeData[0] as Employee, error: null };
      }

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {

        console.error('Error inesperado creando empleado:', error);

      }
      setError('Error inesperado al crear el empleado');
      setIsLoading(false);
      return { data: null, error: new Error('Error inesperado') };
    }
    
    setIsLoading(false);
    return { data: null, error: new Error('Error desconocido') };
  };

  // Editar empleado
  const updateEmployee = async (employee: Employee) => {
    setIsLoading(true);
    try {
      // Buscar el empleado actual para comparar cambios
      const currentEmployee = employees.find(e => e.id === employee.id);
      if (!currentEmployee) {
        setError('Empleado no encontrado');
        setIsLoading(false);
        return { data: null, error: new Error('Empleado no encontrado') };
      }

      // Verificar si cambió el nombre o DNI (requiere actualización de contraseña)
      const nameChanged = currentEmployee.name !== employee.name;
      const dniChanged = currentEmployee.dni !== employee.dni;
      const requiresPasswordUpdate = nameChanged || dniChanged;

      // 1. Actualizar empleado en la tabla employees
      const { data, error } = await supabase
        .from('employees')
        .update(employee)
        .eq('id', employee.id)
        .select();
        
      if (error) {
        if (process.env.NODE_ENV === 'development') {

          console.error('Error updating employee:', error);

        }
        setError(error.message);
        setIsLoading(false);
        return { data: null, error };
      }

      // 2. Si cambió el nombre o DNI, actualizar la contraseña en Auth
      if (requiresPasswordUpdate && currentEmployee.auth_id) {
        try {
          if (process.env.NODE_ENV === 'development') {

            console.log('🔑 Actualizando contraseña debido a cambios en nombre/DNI...');

          }
          
          const { getSupabaseAdmin } = await import('@/lib/supabaseClient');
          const supabaseAdmin = getSupabaseAdmin();
          
          // Generar nueva contraseña: primera letra del nombre + DNI
          const newPassword = `${employee.name.charAt(0).toUpperCase() + employee.name.slice(1)}${employee.dni}`;
          
          // Actualizar contraseña en Supabase Auth
          const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
            currentEmployee.auth_id,
            { password: newPassword }
          );
          
          if (passwordError) {
            if (process.env.NODE_ENV === 'development') {

              console.error('⚠️ Error actualizando contraseña:', passwordError);

            }
            // Continuar aunque falle la actualización de contraseña
          } else {
            if (process.env.NODE_ENV === 'development') {

              console.log('✅ Contraseña actualizada exitosamente');

            }
          }
          
          // También actualizar el perfil si existe
          try {
            await supabaseAdmin
              .from('profiles')
              .update({
                name: employee.name,
                last_name: employee.lastName,
                full_name: employee.nickname || `${employee.name} ${employee.lastName}`,
                updated_at: new Date().toISOString()
              })
              .eq('id', currentEmployee.auth_id);
          } catch (profileError) {
            console.log('⚠️ No se pudo actualizar el perfil (opcional)');
          }
          
        } catch (authError) {
          if (process.env.NODE_ENV === 'development') {

            console.error('⚠️ Error inesperado actualizando autenticación:', authError);

          }
          // Continuar aunque falle la actualización de auth
        }
      }

      // 3. Actualizar estado local
      if (data && data.length > 0) {
        setEmployees(prev => prev.map(e => e.id === employee.id ? (data[0] as Employee) : e));
        setError(null);
        setIsLoading(false);
        
        // Mostrar mensaje informativo si se actualizó la contraseña
        if (requiresPasswordUpdate) {
          const newPassword = `${employee.name.charAt(0).toUpperCase() + employee.name.slice(1)}${employee.dni}`;
          if (process.env.NODE_ENV === 'development') {

            console.log(`ℹ️ Nueva contraseña para ${employee.name}: ${newPassword}`);

          }
        }
        
        return { data: data[0] as Employee, error: null };
      }
      
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {

        console.error('Unexpected error updating employee:', err);

      }
      setError('Error inesperado al actualizar el empleado');
    } finally {
      setIsLoading(false);
    }
    return { data: null, error: new Error('No se pudo actualizar el empleado') };
  };

  // Eliminar empleado
  const deleteEmployee = async (id: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) {
        if (process.env.NODE_ENV === 'development') {

          console.error('Error deleting employee:', error);

        }
        setError(error.message);
        return { error };
      } else {
        setEmployees(prev => prev.filter(e => e.id !== id));
        setError(null);
        return { error: null };
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {

        console.error('Unexpected error deleting employee:', err);

      }
      setError('Error inesperado al eliminar el empleado');
      return { error: new Error('Error inesperado') };
    } finally {
      setIsLoading(false);
    }
  };

  // Función para recargar datos manualmente
  const refreshEmployees = useCallback(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return { 
    employees, 
    isLoading, 
    error, 
    addEmployee, 
    updateEmployee, 
    deleteEmployee, 
    refreshEmployees 
  };
} 