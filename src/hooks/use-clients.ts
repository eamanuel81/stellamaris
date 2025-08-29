import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Client } from '@/lib/data';

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isInitialized = useRef(false);

  const fetchClients = useCallback(async () => {
    console.log('🔄 Fetching clients...');
    console.log('📊 Current loading state:', isLoading);
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.from('clients').select('*');
      if (error) {
        console.error('❌ Error fetching clients:', error);
        setError(error.message);
        setClients([]);
      } else {
        console.log(`✅ Fetched ${data?.length || 0} clients from DB`);
        
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
        
        console.log(`📊 Setting ${filteredClients.length} unique clients to state`);
        setClients(filteredClients);
        setError(null);
      }
    } catch (err) {
      console.error('❌ Unexpected error in fetchClients:', err);
      setError('Error inesperado al cargar clientes');
    } finally {
      console.log('🏁 Setting loading to false');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('🔧 useClients useEffect triggered');
    console.log('🔍 fetchClients function reference:', fetchClients);
    fetchClients();
  }, [fetchClients]);

  // Crear cliente
  const addClient = useCallback(async (client: Omit<Client, 'id'>) => {
    console.log('➕ Adding client:', client);
    
    // Verificar si ya existe un cliente con el mismo email
    const existingClient = clients.find(c => c.email === client.email);
    if (existingClient) {
      console.log('⚠️ Client with this email already exists:', existingClient);
      setError('Ya existe un cliente con este email');
      return { data: null, error: new Error('Cliente duplicado') };
    }
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('clients').insert([client]).select();
      if (error) {
        console.error('❌ Error adding client:', error);
        setError(error.message);
        return { data: null, error };
      } else if (data && data.length > 0) {
        console.log('✅ Client added successfully to DB:', data[0]);
        
        setClients(prev => {
          // Verificar si el cliente ya existe para evitar duplicados
          const clientExists = prev.some(c => c.id === data[0].id);
          if (clientExists) {
            console.log('⚠️ Client already exists in state, skipping duplicate');
            return prev;
          }
          
          console.log('📝 Adding client to local state');
          const newState = [...prev, data[0]];
          console.log('📊 New state will have', newState.length, 'clients');
          return newState;
        });
        
        console.log('🔄 Returning client data:', data[0]);
        return { data: data[0], error: null };
      } else {
        console.log('⚠️ No data returned from insert operation');
        return { data: null, error: new Error('No se recibieron datos del cliente insertado') };
      }
    } catch (err) {
      console.error('❌ Unexpected error adding client:', err);
      setError('Error inesperado al agregar cliente');
      return { data: null, error: new Error('Error inesperado') };
    } finally {
      setIsLoading(false);
    }
  }, [clients]);

  // Editar cliente
  const updateClient = useCallback(async (client: Client) => {
    console.log('✏️ Updating client:', client.id);
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('clients').update(client).eq('id', client.id).select();
      if (error) {
        console.error('❌ Error updating client:', error);
        setError(error.message);
        return { data: null, error };
      } else if (data && data.length > 0) {
        console.log('✅ Client updated successfully:', data[0]);
        setClients(prev => prev.map(c => c.id === client.id ? data[0] : c));
        return { data: data[0], error: null };
      }
    } catch (err) {
      console.error('❌ Unexpected error updating client:', err);
      setError('Error inesperado al actualizar cliente');
      return { data: null, error: new Error('Error inesperado') };
    } finally {
      setIsLoading(false);
    }
    return { data: null, error: new Error('No se pudo actualizar el cliente') };
  }, []);

  // Eliminar cliente
  const deleteClient = useCallback(async (id: string) => {
    console.log('🗑️ Deleting client:', id);
    setIsLoading(true);
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) {
        console.error('❌ Error deleting client:', error);
        setError(error.message);
        return { error };
      } else {
        console.log('✅ Client deleted successfully');
        setClients(prev => prev.filter(c => c.id !== id));
        return { error: null };
      }
    } catch (err) {
      console.error('❌ Unexpected error deleting client:', err);
      setError('Error inesperado al eliminar cliente');
      return { error: new Error('Error inesperado') };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { clients, isLoading, error, addClient, updateClient, deleteClient, refetch: fetchClients };
} 