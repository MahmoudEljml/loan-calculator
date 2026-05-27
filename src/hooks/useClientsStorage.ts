import { useState, useCallback, useEffect } from 'react';

export interface ClientData {
  id: string;
  client_information: {
    full_name: { val: string; label: string };
    phone_number: { val: string; label: string };
    permanent_address: { val: string; label: string };
    landmark: { val: string; label: string };
  };
  business_details: {
    coordinates: { val: string; label: string };
    business_type: { val: string; label: string };
    start_date: { val: string; label: string };
    address: { val: string; label: string };
    landmark: { val: string; label: string };
  };
  guarantors_details: {
    first_guarantor: {
      full_name: { val: string; label: string };
      phone_number: { val: string; label: string };
      permanent_address: { val: string; label: string };
      address_landmark: { val: string; label: string };
      job_details: {
        job_title: { val: string; label: string };
        workplace: { val: string; label: string };
        years_of_experience: { val: string; label: string };
      };
    };
    second_guarantor: {
      full_name: { val: string; label: string };
      phone_number: { val: string; label: string };
      permanent_address: { val: string; label: string };
      address_landmark: { val: string; label: string };
      job_details: {
        job_title: { val: string; label: string };
        workplace: { val: string; label: string };
        years_of_experience: { val: string; label: string };
      };
    };
  };
}

const STORAGE_KEY = 'loan-calculator-clients';

export function useClientsStorage() {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setClients(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse clients data:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  const saveClients = useCallback((updatedClients: ClientData[]) => {
    setClients(updatedClients);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedClients));
  }, []);

  const addClient = useCallback((client: Omit<ClientData, 'id'>) => {
    const id = Date.now().toString();
    const newClient: ClientData = { ...client, id };
    saveClients([...clients, newClient]);
    return id;
  }, [clients, saveClients]);

  const updateClient = useCallback((id: string, client: Omit<ClientData, 'id'>) => {
    const updated = clients.map(c => (c.id === id ? { ...client, id } : c));
    saveClients(updated);
  }, [clients, saveClients]);

  const deleteClient = useCallback((id: string) => {
    saveClients(clients.filter(c => c.id !== id));
  }, [clients, saveClients]);

  const getClient = useCallback((id: string) => {
    return clients.find(c => c.id === id);
  }, [clients]);

  return {
    clients,
    isLoaded,
    addClient,
    updateClient,
    deleteClient,
    getClient,
  };
}
