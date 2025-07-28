import { useEffect, useState, useCallback } from 'react';
import { supabase, supabaseAdmin } from '@/lib/supabaseClient';
import { Employee } from '@/lib/data';

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    console.log('=== FETCHING EMPLOYEES START ===');
    setIsLoading(true);
    setError(null);
    
    try {
      // Verificar si el usuario está autenticado
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('Current user for employees:', user?.id, user?.email);
      console.log('User error:', userError);
      
      if (userError) {
        console.error('Error getting user:', userError);
        setError('Error de autenticación');
        setEmployees([]);
        setIsLoading(false);
        return;
      }
      
      if (!user) {
        console.log('No authenticated user, skipping employees fetch');
        setEmployees([]);
        setIsLoading(false);
        return;
      }

      console.log('Attempting to fetch employees from database...');
      
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name', { ascending: true });
        
      console.log('Employees response:', { data, error });
      console.log('Data type:', typeof data);
      console.log('Data length:', data?.length);
      console.log('Error type:', typeof error);
        
      if (error) {
        console.error('Error fetching employees:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        setError(`Error cargando empleados: ${error.message}`);
        setEmployees([]);
      } else {
        console.log('Employees loaded from database:', data?.length || 0, 'employees');
        console.log('Employees data:', data);
        
        // Verificar subroles
        const employeesBySubrole = data?.reduce((acc, emp) => {
          const subrole = emp.subrole || 'sin_subrole';
          acc[subrole] = (acc[subrole] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        console.log('Employees by subrole:', employeesBySubrole);
        
        setEmployees(data || []);
        setError(null);
      }
    } catch (err) {
      console.error('Unexpected error fetching employees:', err);
      console.error('Error stack:', err instanceof Error ? err.stack : 'No stack available');
      setError(`Error inesperado al cargar los empleados: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      setEmployees([]);
    } finally {
      setIsLoading(false);
      console.log('=== FETCHING EMPLOYEES END ===');
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
        console.error('Error verificando tabla profiles:', error);
        return false;
      }
      
      console.log('Estructura de profiles verificada:', data);
      return true;
    } catch (err) {
      console.error('Error inesperado verificando profiles:', err);
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
      
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: employee.email,
        password: password,
        email_confirm: true,
        user_metadata: {
          name: `${employee.name} ${employee.lastName}`,
          role: 'Empleado'
        }
      });

      if (authError) {
        console.error('Error creando usuario en Auth:', authError);
        setError(`Error creando usuario: ${authError.message}`);
        setIsLoading(false);
        return { data: null, error: authError };
      }

      if (!authData.user) {
        setError('No se pudo crear el usuario en Auth');
        setIsLoading(false);
        return { data: null, error: new Error('No se pudo crear el usuario en Auth') };
      }

      // 2. Crear perfil en la tabla profiles con los campos correctos
      const profileData = {
        id: authData.user.id,
        name: employee.name,
        last_name: employee.lastName,
        full_name: employee.nickname || `${employee.name} ${employee.lastName}`, // Usar nickname o nombre completo
        email: employee.email,
        role: 'Empleado'
      };

      console.log('Intentando crear perfil con datos:', profileData);

      const { data: profileResult, error: profileError } = await supabase
        .from('profiles')
        .insert([profileData])
        .select();

      if (profileError) {
        console.error('Error creando perfil:', profileError);
        // Intentar eliminar el usuario de Auth si falla la creación del perfil
        try {
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        } catch (deleteError) {
          console.error('Error eliminando usuario de Auth después de fallo:', deleteError);
        }
        setError(`Error creando perfil: ${profileError.message}`);
        setIsLoading(false);
        return { data: null, error: profileError };
      }

      // 3. Crear empleado en la tabla employees con el auth_id
      const employeeWithAuthId = { ...employee, auth_id: authData.user.id };
      
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .insert([employeeWithAuthId])
        .select();

      if (employeeError) {
        console.error('Error creando empleado:', employeeError);
        // Intentar limpiar: eliminar perfil y usuario de Auth
        try {
          await supabase.from('profiles').delete().eq('id', authData.user.id);
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        } catch (cleanupError) {
          console.error('Error en limpieza después de fallo:', cleanupError);
        }
        setError(`Error creando empleado: ${employeeError.message}`);
        setIsLoading(false);
        return { data: null, error: employeeError };
      }

      if (employeeData && employeeData.length > 0) {
        console.log('Employee created successfully:', employeeData[0]);
        setEmployees(prev => [employeeData[0], ...prev]);
        setError(null);
        setIsLoading(false);
        return { data: employeeData[0], error: null };
      }

    } catch (error) {
      console.error('Error inesperado creando empleado:', error);
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
      const { data, error } = await supabase
        .from('employees')
        .update(employee)
        .eq('id', employee.id)
        .select();
        
      if (error) {
        console.error('Error updating employee:', error);
        setError(error.message);
        return { data: null, error };
      } else if (data && data.length > 0) {
        console.log('Employee updated successfully:', data[0]);
        setEmployees(prev => prev.map(e => e.id === employee.id ? data[0] : e));
        setError(null);
        return { data: data[0], error: null };
      }
    } catch (err) {
      console.error('Unexpected error updating employee:', err);
      setError('Error inesperado al actualizar el empleado');
      return { data: null, error: new Error('Error inesperado') };
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
        console.error('Error deleting employee:', error);
        setError(error.message);
        return { error };
      } else {
        console.log('Employee deleted successfully:', id);
        setEmployees(prev => prev.filter(e => e.id !== id));
        setError(null);
        return { error: null };
      }
    } catch (err) {
      console.error('Unexpected error deleting employee:', err);
      setError('Error inesperado al eliminar el empleado');
      return { error: new Error('Error inesperado') };
    } finally {
      setIsLoading(false);
    }
  };

  // Función para recargar datos manualmente
  const refreshEmployees = useCallback(() => {
    console.log('Manually refreshing employees...');
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