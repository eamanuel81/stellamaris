import { useEffect, useState, useCallback } from 'react';
import type { Client } from '@/lib/data';

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/clients');
      if (!res.ok) throw new Error('Error cargando clientes');
      const data = await res.json();
      setClients(data as Client[]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const addClient = useCallback(async (client: Omit<Client, 'id'>) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(client),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? 'Error creando cliente');
        return { data: null, error: new Error(err.error) };
      }
      const data = await res.json();
      setClients(prev => [...prev, data as Client]);
      setError(null);
      return { data: data as Client, error: null };
    } catch (err) {
      setError('Error inesperado al agregar cliente');
      return { data: null, error: new Error('Error inesperado') };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateClient = useCallback(async (client: Client) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(client),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? 'Error actualizando cliente');
        return { data: null, error: new Error(err.error) };
      }
      const data = await res.json();
      setClients(prev => prev.map(c => c.id === client.id ? data as Client : c));
      setError(null);
      return { data: data as Client, error: null };
    } catch (err) {
      setError('Error inesperado al actualizar cliente');
      return { data: null, error: new Error('Error inesperado') };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteClient = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? 'Error eliminando cliente');
        return { error: new Error(err.error) };
      }
      setClients(prev => prev.filter(c => c.id !== id));
      setError(null);
      return { error: null };
    } catch (err) {
      setError('Error inesperado al eliminar cliente');
      return { error: new Error('Error inesperado') };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { clients, isLoading, error, addClient, updateClient, deleteClient, refetch: fetchClients };
}
