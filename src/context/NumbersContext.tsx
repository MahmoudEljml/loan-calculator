// src/context/NumbersContext.tsx
import { createContext, useContext } from 'react';

interface NumbersContextType {
  iScoreCodes: number;
  customers: number;
  installments: number;
  setIScoreCodes: (value: number) => void;
  setCustomers: (value: number) => void;
  setInstallments: (value: number) => void;
}

export const NumbersContext = createContext<NumbersContextType | undefined>(undefined);

export const useNumbers = () => useContext(NumbersContext);
