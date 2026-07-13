// src/hooks/useInstallmentsStorage.ts
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
  clientCode: string;       // كود العميل
  clientName: string;
  nationalId: string;       // 🆕 تم إضافة الرقم القومي للنوع (Interface) هنا
  clientPhone: string;
  address: string;          // عنوان محل الإقامة
  latitude: number | null;  // خط العرض GPS
  longitude: number | null; // text خط الطول GPS
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

const DB_NAME = 'loan-calculator-installments';
const DB_VERSION = 2;
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

  const addInstallment = useCallback(async (installment: Omit<Installment, 'id' | 'createdAt' | 'updatedAt'>) => {
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
      setInstallments(prev => [...prev, newInstallment]);
      return id;
    } catch (error) {
      console.error('Failed to add installment:', error);
      throw error;
    }
  }, []);

  const updateInstallment = useCallback(async (id: string, installment: Omit<Installment, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    
    try {
      const database = await getDB();
      const existingInstallment = await database.get(STORE_NAME, id);
      if (existingInstallment) {
        const updatedItem: Installment = {
          ...installment,
          id,
          createdAt: existingInstallment.createdAt,
          updatedAt: now,
        };
        await database.put(STORE_NAME, updatedItem);
        setInstallments(prev => prev.map(i => i.id === id ? updatedItem : i));
      }
    } catch (error) {
      console.error('Failed to update installment:', error);
    }
  }, []);

  const deleteInstallment = useCallback(async (id: string) => {
    try {
      const database = await getDB();
      await database.delete(STORE_NAME, id);
      setInstallments(prev => prev.filter(i => i.id !== id));
    } catch (error) {
      console.error('Failed to delete installment:', error);
    }
  }, []);

  const getInstallment = useCallback((id: string) => {
    return installments.find(i => i.id === id);
  }, [installments]);

  const addNote = useCallback(async (installmentId: string, noteText: string) => {
    const now = new Date().toISOString();
    const noteId = Date.now().toString();
    
    try {
      const database = await getDB();
      const installment = await database.get(STORE_NAME, installmentId);
      if (installment) {
        const updatedItem: Installment = {
          ...installment,
          notes: [...installment.notes, { id: noteId, note: noteText, createdAt: now, updatedAt: now }],
          updatedAt: now,
        };
        await database.put(STORE_NAME, updatedItem);
        setInstallments(prev => prev.map(i => i.id === installmentId ? updatedItem : i));
      }
      return noteId;
    } catch (error) {
      console.error('Failed to add note:', error);
      return '';
    }
  }, []);

  const updateNote = useCallback(async (installmentId: string, noteId: string, noteText: string) => {
    const now = new Date().toISOString();
    
    try {
      const database = await getDB();
      const installment = await database.get(STORE_NAME, installmentId);
      if (installment) {
        const updatedItem: Installment = {
          ...installment,
          notes: installment.notes.map(n => n.id === noteId ? { ...n, note: noteText, updatedAt: now } : n),
          updatedAt: now,
        };
        await database.put(STORE_NAME, updatedItem);
        setInstallments(prev => prev.map(i => i.id === installmentId ? updatedItem : i));
      }
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  }, []);

  const deleteNote = useCallback(async (installmentId: string, noteId: string) => {
    const now = new Date().toISOString();
    
    try {
      const database = await getDB();
      const installment = await database.get(STORE_NAME, installmentId);
      if (installment) {
        const updatedItem: Installment = {
          ...installment,
          notes: installment.notes.filter(n => n.id !== noteId),
          updatedAt: now,
        };
        await database.put(STORE_NAME, updatedItem);
        setInstallments(prev => prev.map(i => i.id === installmentId ? updatedItem : i));
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  }, []);

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