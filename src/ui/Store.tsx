import React, { createContext, useContext, useState } from 'react';

interface AppState {
  token: string | null;
  setToken: (t: string | null) => void;
}

const StateContext = createContext<AppState | undefined>(undefined);

export const StateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  return (
    <StateContext.Provider value={{ token, setToken }}>
      {children}
    </StateContext.Provider>
  );
};

export function useAppState() {
  const ctx = useContext(StateContext);
  if (!ctx) throw new Error('StateProvider missing');
  return ctx;
}
