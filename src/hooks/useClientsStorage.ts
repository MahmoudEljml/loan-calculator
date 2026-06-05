import { useState, useCallback, useEffect } from 'react';
import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

export interface ClientData {
  id: string;
  client_information: {
    full_name: { val: string; label: string };
    phone_number: { val: string; label: string };
  };
  business_details: {
    coordinates: { val: string; label: string };
    business_type: { val: string; label: string };
    start_date: { val: string; label: string };
    address: { val: string; label: string };
    landmark: { val: string; label: string };
  };
  clientImages: string[];
  createdAt: string;
  updatedAt: string;
}

interface ClientsDB extends DBSchema {
  clients: {
    key: string;
    value: ClientData;
    indexes: { 'by-date': string };
  };
}

const DB_NAME = 'loan-calculator';
const DB_VERSION = 2;
const STORE_NAME = 'clients';
const OLD_STORAGE_KEY = 'loan-calculator-clients';

let db: IDBPDatabase<ClientsDB> | null = null;

async function getDB() {
  if (db) return db;

  db = await openDB<ClientsDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('by-date', 'createdAt');
      }
    },
  });

  return db;
}

// Migration helper: Move old localStorage data to IndexedDB
async function migrateOldData() {
  try {
    const oldData = localStorage.getItem(OLD_STORAGE_KEY);
    if (!oldData) return;

    const parsedData = JSON.parse(oldData) as any[];
    const database = await getDB();

    for (const oldClient of parsedData) {
      // Transform old structure to new structure
      const newClient: ClientData = {
        id: oldClient.id,
        client_information: {
          full_name: oldClient.client_information.full_name,
          phone_number: oldClient.client_information.phone_number,
        },
        business_details: {
          coordinates: oldClient.business_details.coordinates,
          business_type: oldClient.business_details.business_type,
          start_date: oldClient.business_details.start_date,
          address: oldClient.business_details.address,
          landmark: oldClient.business_details.landmark,
        },
        clientImages: [],
        createdAt: oldClient.createdAt || new Date().toISOString(),
        updatedAt: oldClient.updatedAt || new Date().toISOString(),
      };

      await database.put(STORE_NAME, newClient);
    }

    // Clear old localStorage after migration
    localStorage.removeItem(OLD_STORAGE_KEY);
    console.log('✅ Migration completed: Old client data moved to IndexedDB');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

export function useClientsStorage() {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadClients = async () => {
      try {
        // First, try to migrate old data if it exists
        await migrateOldData();

        const database = await getDB();
        const allClients = await database.getAll(STORE_NAME);
        setClients(allClients);
      } catch (error) {
        console.error('Failed to load clients from IndexedDB:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadClients();
  }, []);

  const addClient = useCallback(
    async (client: Omit<ClientData, 'id' | 'createdAt' | 'updatedAt'>) => {
      const id = Date.now().toString();
      const now = new Date().toISOString();
      const newClient: ClientData = {
        ...client,
        id,
        createdAt: now,
        updatedAt: now,
      };

      try {
        const database = await getDB();
        await database.add(STORE_NAME, newClient);
        setClients([...clients, newClient]);
        return id;
      } catch (error) {
        console.error('Failed to add client:', error);
        throw error;
      }
    },
    [clients]
  );

  const updateClient = useCallback(
    async (id: string, client: Omit<ClientData, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const updated = clients.map(c =>
        c.id === id
          ? {
              ...client,
              id,
              createdAt: c.createdAt,
              updatedAt: now,
            }
          : c
      );

      try {
        const database = await getDB();
        const existingClient = await database.get(STORE_NAME, id);
        if (existingClient) {
          await database.put(STORE_NAME, updated.find(c => c.id === id)!);
          setClients(updated);
        }
      } catch (error) {
        console.error('Failed to update client:', error);
        throw error;
      }
    },
    [clients]
  );

  const deleteClient = useCallback(
    async (id: string) => {
      const updated = clients.filter(c => c.id !== id);

      try {
        const database = await getDB();
        await database.delete(STORE_NAME, id);
        setClients(updated);
      } catch (error) {
        console.error('Failed to delete client:', error);
        throw error;
      }
    },
    [clients]
  );

  const getClient = useCallback(
    (id: string) => {
      return clients.find(c => c.id === id);
    },
    [clients]
  );

  return {
    clients,
    isLoaded,
    addClient,
    updateClient,
    deleteClient,
    getClient,
  };
}
