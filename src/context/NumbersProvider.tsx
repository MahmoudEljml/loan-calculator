// src/context/NumbersProvider.tsx

import { useState, type ReactNode } from 'react';
import { NumbersContext } from './NumbersContext';


export const NumbersProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [iScoreCodes, setIScoreCodes] = useState<number>(0);
  const [customers, setCustomers] = useState<number>(0);
  const [installments, setInstallments] = useState<number>(0);

  return (
    <NumbersContext.Provider value={{
      iScoreCodes,
      customers,
      installments,
      setIScoreCodes,
      setCustomers,
      setInstallments
    }}>
      {children}
    </NumbersContext.Provider>
  );
};
