import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
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

  // Crear empleado
  const addEmployee = async (employee: Omit<Employee, 'id'>) => {
    setIsLoading(true);
    const { data, error } = await supabase.from('employees').insert([employee]).select();
    if (error) {
      setError(error.message);
    } else if (data && data.length > 0) {
      setEmployees(prev => [...prev, data[0]]);
    }
    setIsLoading(false);
    return { data, error };
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