import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Client } from '@/lib/data';

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    console.log('🔄 Fetching clients...');
    setIsLoading(true);
    const { data, error } = await supabase.from('clients').select('*');
    if (error) {
      console.error('❌ Error fetching clients:', error);
      setError(error.message);
      setClients([]);
    } else {
      console.log(`✅ Fetched ${data?.length || 0} clients`);
      // Verificar si hay duplicados antes de establecer el estado
      const uniqueClients = data || [];
      const clientIds = new Set();
      const filteredClients = uniqueClients.filter(client => {
        if (clientIds.has(client.id)) {
          console.log('⚠️ Duplicate client found and filtered:', client);
          return false;
        }
        clientIds.add(client.id);
        return true;
      });
      
      console.log(`📊 Setting ${filteredClients.length} unique clients`);
      setClients(filteredClients);
      setError(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    console.log('🔧 useClients useEffect triggered');
    fetchClients();
  }, []);

  // Crear cliente
  const addClient = async (client: Omit<Client, 'id'>) => {
    console.log('➕ Adding client:', client);
    setIsLoading(true);
    const { data, error } = await supabase.from('clients').insert([client]).select();
    if (error) {
      console.error('❌ Error adding client:', error);
      setError(error.message);
    } else if (data && data.length > 0) {
      console.log('✅ Client added successfully:', data[0]);
      setClients(prev => {
        // Verificar si el cliente ya existe para evitar duplicados
        const clientExists = prev.some(c => c.id === data[0].id);
        if (clientExists) {
          console.log('⚠️ Client already exists in state, skipping duplicate');
          return prev;
        }
        return [...prev, data[0]];
      });
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

  return { clients, isLoading, error, addClient, updateClient, deleteClient, refetch: fetchClients };
} 