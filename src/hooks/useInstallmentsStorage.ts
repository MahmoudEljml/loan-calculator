import { useState, useCallback, useEffect } from 'react';
import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

export interface InstallmentNote {
  id: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface Installment {
  id: string;
  clientName: string;
  clientPhone: string;
  clientImages: string[];
  installmentAmount: number;
  dueDate: string;
  status: 'pending' | 'paid';
  firstGuarantorName: string;
  firstGuarantorPhone: string;
  secondGuarantorName: string;
  secondGuarantorPhone: string;
  notes: InstallmentNote[];
  createdAt: string;
  updatedAt: string;
}

interface LoanCalculatorDB extends DBSchema {
  installments: {
    key: string;
    value: Installment;
    indexes: { 'by-date': string };
  };
}

const DB_NAME = 'loan-calculator';
const DB_VERSION = 1;
const STORE_NAME = 'installments';

let db: IDBPDatabase<LoanCalculatorDB> | null = null;

async function getDB() {
  if (db) return db;

  db = await openDB<LoanCalculatorDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('by-date', 'createdAt');
      }
    },
  });

  return db;
}

export function useInstallmentsStorage() {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadInstallments = async () => {
      try {
        const database = await getDB();
        const allInstallments = await database.getAll(STORE_NAME);
        setInstallments(allInstallments);
      } catch (error) {
        console.error('Failed to load installments from IndexedDB:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadInstallments();
  }, []);

  const addInstallment = useCallback(
    async (installment: Omit<Installment, 'id' | 'createdAt' | 'updatedAt'>) => {
      const id = Date.now().toString();
      const now = new Date().toISOString();
      const newInstallment: Installment = {
        ...installment,
        id,
        createdAt: now,
        updatedAt: now,
      };

      try {
        const database = await getDB();
        await database.add(STORE_NAME, newInstallment);
        setInstallments([...installments, newInstallment]);
        return id;
      } catch (error) {
        console.error('Failed to add installment:', error);
        throw error;
      }
    },
    [installments]
  );

  const updateInstallment = useCallback(
    async (id: string, installment: Omit<Installment, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const updated = installments.map(i =>
        i.id === id
          ? {
              ...installment,
              id,
              createdAt: i.createdAt,
              updatedAt: now,
            }
          : i
      );

      try {
        const database = await getDB();
        const existingInstallment = await database.get(STORE_NAME, id);
        if (existingInstallment) {
          await database.put(STORE_NAME, updated.find(i => i.id === id)!);
          setInstallments(updated);
        }
      } catch (error) {
        console.error('Failed to update installment:', error);
      }
    },
    [installments]
  );

  const deleteInstallment = useCallback(
    async (id: string) => {
      const updated = installments.filter(i => i.id !== id);

      try {
        const database = await getDB();
        await database.delete(STORE_NAME, id);
        setInstallments(updated);
      } catch (error) {
        console.error('Failed to delete installment:', error);
      }
    },
    [installments]
  );

  const getInstallment = useCallback(
    (id: string) => {
      return installments.find(i => i.id === id);
    },
    [installments]
  );

  const addNote = useCallback(
    async (installmentId: string, noteText: string) => {
      const now = new Date().toISOString();
      const noteId = Date.now().toString();
      const updated = installments.map(i =>
        i.id === installmentId
          ? {
              ...i,
              notes: [
                ...i.notes,
                {
                  id: noteId,
                  note: noteText,
                  createdAt: now,
                  updatedAt: now,
                },
              ],
              updatedAt: now,
            }
          : i
      );

      try {
        const database = await getDB();
        const installment = updated.find(i => i.id === installmentId);
        if (installment) {
          await database.put(STORE_NAME, installment);
          setInstallments(updated);
        }
      } catch (error) {
        console.error('Failed to add note:', error);
      }

      return noteId;
    },
    [installments]
  );

  const updateNote = useCallback(
    async (installmentId: string, noteId: string, noteText: string) => {
      const now = new Date().toISOString();
      const updated = installments.map(i =>
        i.id === installmentId
          ? {
              ...i,
              notes: i.notes.map(n =>
                n.id === noteId
                  ? {
                      ...n,
                      note: noteText,
                      updatedAt: now,
                    }
                  : n
              ),
              updatedAt: now,
            }
          : i
      );

      try {
        const database = await getDB();
        const installment = updated.find(i => i.id === installmentId);
        if (installment) {
          await database.put(STORE_NAME, installment);
          setInstallments(updated);
        }
      } catch (error) {
        console.error('Failed to update note:', error);
      }
    },
    [installments]
  );

  const deleteNote = useCallback(
    async (installmentId: string, noteId: string) => {
      const now = new Date().toISOString();
      const updated = installments.map(i =>
        i.id === installmentId
          ? {
              ...i,
              notes: i.notes.filter(n => n.id !== noteId),
              updatedAt: now,
            }
          : i
      );

      try {
        const database = await getDB();
        const installment = updated.find(i => i.id === installmentId);
        if (installment) {
          await database.put(STORE_NAME, installment);
          setInstallments(updated);
        }
      } catch (error) {
        console.error('Failed to delete note:', error);
      }
    },
    [installments]
  );

  return {
    installments,
    isLoaded,
    addInstallment,
    updateInstallment,
    deleteInstallment,
    getInstallment,
    addNote,
    updateNote,
    deleteNote,
  };
}
