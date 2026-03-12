import { useEffect, useState, useCallback } from 'react';
import type { Employee } from '@/lib/data';

function mapEmployee(row: any): Employee {
  return {
    id: row.id,
    name: row.name,
    lastName: row.lastName,
    nickname: row.nickname ?? '',
    dni: row.dni ?? '',
    phone: row.phone ?? '',
    address: row.address ?? '',
    canDrive: row.canDrive ?? false,
    email: row.email,
    avatarUrl: row.avatarUrl ?? '',
    subrole: row.subrole ?? 'empleado',
    role: row.subrole === 'admin' ? 'admin' : 'employee',
  };
}

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/employees');
      if (!res.ok) throw new Error('Error cargando empleados');
      const data = await res.json();
      setEmployees((data as any[]).map(mapEmployee));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setEmployees([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const addEmployee = async (employee: Omit<Employee, 'id'>) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employee),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? 'Error creando empleado');
        return { data: null, error: new Error(err.error) };
      }
      const data = await res.json();
      const emp = mapEmployee(data);
      setEmployees(prev => [emp, ...prev]);
      setError(null);
      return { data: emp, error: null };
    } catch (err) {
      setError('Error inesperado al crear el empleado');
      return { data: null, error: new Error('Error inesperado') };
    } finally {
      setIsLoading(false);
    }
  };

  const updateEmployee = async (employee: Employee) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employee),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? 'Error actualizando empleado');
        return { data: null, error: new Error(err.error) };
      }
      const data = await res.json();
      const emp = mapEmployee(data);
      setEmployees(prev => prev.map(e => e.id === employee.id ? emp : e));
      setError(null);
      return { data: emp, error: null };
    } catch (err) {
      setError('Error inesperado al actualizar el empleado');
      return { data: null, error: new Error('Error inesperado') };
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEmployee = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? 'Error eliminando empleado');
        return { error: new Error(err.error) };
      }
      setEmployees(prev => prev.filter(e => e.id !== id));
      setError(null);
      return { error: null };
    } catch (err) {
      setError('Error inesperado al eliminar el empleado');
      return { error: new Error('Error inesperado') };
    } finally {
      setIsLoading(false);
    }
  };

  return { employees, isLoading, error, addEmployee, updateEmployee, deleteEmployee, refreshEmployees: fetchEmployees };
}
