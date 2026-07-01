import { createContext, useContext, useEffect, useState } from 'react';
import { subscribe } from '../lib/db';

// Bumps a version number whenever the underlying mock DB changes, so any
// component reading db.js getters re-renders with fresh data.
const DataContext = createContext(0);

export function DataProvider({ children }) {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const unsub = subscribe(() => setVersion((v) => v + 1));
    return unsub;
  }, []);

  return <DataContext.Provider value={version}>{children}</DataContext.Provider>;
}

export function useDataVersion() {
  return useContext(DataContext);
}
