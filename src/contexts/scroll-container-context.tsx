// src/contexts/scroll-container-context.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface ScrollContextType {
  scrollContainerRef: React.RefObject<HTMLDivElement>;
}

const ScrollContext = createContext<ScrollContextType>({
  scrollContainerRef: { current: null }
});

export function ScrollContainerProvider({ children }: { children: ReactNode }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  return (
    <ScrollContext.Provider value={{ scrollContainerRef }}>
      {children}
    </ScrollContext.Provider>
  );
}

export function useScrollContainer() {
  return useContext(ScrollContext);
}
