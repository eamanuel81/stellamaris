import { useEffect, useState } from 'react';
import { supabase, supabaseAdmin } from '@/lib/supabaseClient';
import { Employee } from '@/lib/data';

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('employees').select('*');
    if (error) {
      setError(error.message);
      setEmployees([]);
    } else {
      setEmployees(data || []);
      setError(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

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
        console.error('Datos del perfil que fallaron:', profileData);
        // Si falla la creación del perfil, eliminar el usuario de Auth
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        setError(`Error creando perfil: ${profileError.message} - ${JSON.stringify(profileError)}`);
        setIsLoading(false);
        return { data: null, error: profileError };
      }

      console.log('Perfil creado exitosamente:', profileResult);

      // 3. Crear empleado en la tabla employees
      const employeeWithAuthId = {
        ...employee,
        auth_id: authData.user.id // Agregar el ID de Auth al empleado
      };

      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .insert([employeeWithAuthId])
        .select();

      if (employeeError) {
        console.error('Error creando empleado:', employeeError);
        // Si falla la creación del empleado, eliminar usuario y perfil
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        await supabase.from('profiles').delete().eq('id', authData.user.id);
        setError(`Error creando empleado: ${employeeError.message}`);
        setIsLoading(false);
        return { data: null, error: employeeError };
      }

      if (employeeData && employeeData.length > 0) {
        setEmployees(prev => [...prev, employeeData[0]]);
        setError(null);
        setIsLoading(false);
        return { data: employeeData[0], error: null };
      }

    } catch (error) {
      console.error('Error inesperado:', error);
      setError(`Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      setIsLoading(false);
      return { data: null, error: error instanceof Error ? error : new Error('Error desconocido') };
    }

    setIsLoading(false);
    return { data: null, error: new Error('Error desconocido') };
  };

  // Editar empleado
  const updateEmployee = async (employee: Employee) => {
    setIsLoading(true);
    const { data, error } = await supabase.from('employees').update(employee).eq('id', employee.id).select();
    if (error) {
      setError(error.message);
    } else if (data && data.length > 0) {
      setEmployees(prev => prev.map(e => e.id === employee.id ? data[0] : e));
    }
    setIsLoading(false);
    return { data, error };
  };

  // Eliminar empleado
  const deleteEmployee = async (id: string) => {
    setIsLoading(true);
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) {
      setError(error.message);
    } else {
      setEmployees(prev => prev.filter(e => e.id !== id));
    }
    setIsLoading(false);
    return { error };
  };

  return { employees, isLoading, error, addEmployee, updateEmployee, deleteEmployee };
} 