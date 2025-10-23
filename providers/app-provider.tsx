'use client';

import { createContext, ReactNode, useContext, useState, useEffect } from 'react';

interface AppInstance {
  name: string;
  description: string;
  status: number;
  id: string;
  userPermissions: Record<string, any>;
  appInstanceId: string;
  appId: string;
  teamId: string;
  teamName: string;
  version: string;
  iconUrl: string | null;
  identifier: string;
}

interface AppProviderContextType {
  selectedApp: AppInstance | null;
  setSelectedApp: (app: AppInstance | null) => void;
}

const AppProviderContext = createContext<AppProviderContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedApp, setSelectedAppState] = useState<AppInstance | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('selectedApp');
    if (saved) {
      try {
        setSelectedAppState(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse selectedApp from localStorage', e);
      }
    }
  }, []);

  const setSelectedApp = (app: AppInstance | null) => {
    setSelectedAppState(app);
    if (app) {
      localStorage.setItem('selectedApp', JSON.stringify(app));
    } else {
      localStorage.removeItem('selectedApp');
    }
  };

  return (
    <AppProviderContext.Provider value={{ selectedApp, setSelectedApp }}>
      {children}
    </AppProviderContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppProviderContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
