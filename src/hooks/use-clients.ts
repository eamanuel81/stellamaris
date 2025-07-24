import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Client } from '@/lib/data';

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('clients').select('*');
    if (error) {
      setError(error.message);
      setClients([]);
    } else {
      setClients(data || []);
      setError(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Crear cliente
  const addClient = async (client: Omit<Client, 'id'>) => {
    setIsLoading(true);
    const { data, error } = await supabase.from('clients').insert([client]).select();
    if (error) {
      setError(error.message);
    } else if (data && data.length > 0) {
      setClients(prev => [...prev, data[0]]);
    }
    setIsLoading(false);
    return { data, error };
  };

  // Editar cliente
  const updateClient = async (client: Client) => {
    setIsLoading(true);
    const { data, error } = await supabase.from('clients').update(client).eq('id', client.id).select();
    if (error) {
      setError(error.message);
    } else if (data && data.length > 0) {
      setClients(prev => prev.map(c => c.id === client.id ? data[0] : c));
    }
    setIsLoading(false);
    return { data, error };
  };

  // Eliminar cliente
  const deleteClient = async (id: string) => {
    setIsLoading(true);
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) {
      setError(error.message);
    } else {
      setClients(prev => prev.filter(c => c.id !== id));
    }
    setIsLoading(false);
    return { error };
  };

  return { clients, isLoading, error, addClient, updateClient, deleteClient };
} 