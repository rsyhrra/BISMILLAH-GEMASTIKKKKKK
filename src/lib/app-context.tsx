'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import * as db from './db';
import type { DemoUser, Role } from './db';

interface AppState {
  user: DemoUser | null;
  loading: boolean;
  notifCount: number;
  login: (identifier: string, password: string) => boolean;
  logout: () => void;
  refreshNotif: () => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifCount, setNotifCount] = useState(0);

  const refreshNotif = () => {
    if (user) setNotifCount(db.unreadCount(user.id));
  };

  useEffect(() => {
    const current = db.getSessionUser();
    setUser(current);
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshNotif();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const login = (identifier: string, password: string): boolean => {
    const found = db.login(identifier, password);
    if (found) {
      setUser(found);
      setNotifCount(db.unreadCount(found.id));
      return true;
    }
    return false;
  };

  const logout = () => {
    db.logout();
    setUser(null);
    setNotifCount(0);
  };

  return (
    <AppContext.Provider
      value={{ user, loading, notifCount, login, logout, refreshNotif }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export { homePath } from './db';
